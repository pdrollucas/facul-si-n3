import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { authOptions } from '../../../../../lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const expenseId = new ObjectId(params.id);

    // Atualizar o relatório com a confirmação do diretor
    const result = await db.collection('expenses').updateOne(
      { _id: expenseId },
      {
        $set: {
          status: 'confirmed',
          directorConfirmation: {
            confirmedBy: session.user.email,
            confirmedAt: new Date()
          },
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming expense:', error);
    return NextResponse.json(
      { error: 'Erro ao confirmar relatório' },
      { status: 500 }
    );
  }
}
