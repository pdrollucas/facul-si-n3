import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'diretor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { signature } = await req.json();
    
    const client = await clientPromise;
    const db = client.db();

    const expenseId = new ObjectId(params.id);
    const expense = await db.collection('expenses').findOne({ _id: expenseId });

    if (!expense) {
      return NextResponse.json({ error: 'Expense report not found' }, { status: 404 });
    }

    if (expense.status !== 'validated') {
      return NextResponse.json({ error: 'Expense report is not validated' }, { status: 400 });
    }

    const result = await db.collection('expenses').updateOne(
      { _id: expenseId },
      {
        $set: {
          status: 'signed',
          signature: {
            data: signature,
            signedBy: session.user.email,
            signedAt: new Date(),
          },
          updatedAt: new Date(),
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to sign expense report' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Expense report signed successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
