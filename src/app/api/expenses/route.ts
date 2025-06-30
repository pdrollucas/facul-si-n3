import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ExpenseReport } from '@/models/ExpenseReport';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    const client = await clientPromise;
    const db = client.db();
    
    let query: any = {};
    
    // Filtrar por status se especificado
    if (status) {
      query.status = status;
    }

    // Se for funcionário, mostrar apenas seus relatórios
    if (session.user.role === 'empregado') {
      query.employeeEmail = session.user.email;
    }

    const expenses = await db.collection('expenses')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const client = await clientPromise;
    const db = client.db();

    const expense: Partial<ExpenseReport> = {
      ...data,
      employeeEmail: session.user.email,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('expenses').insertOne(expense);

    return NextResponse.json({ 
      _id: result.insertedId,
      ...expense
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
