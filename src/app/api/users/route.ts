import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET - Lista todos os usuários
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const users = await db.collection('users').find({}).project({
      password: 0 // Não retorna as senhas
    }).toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Deleta um usuário específico
export async function DELETE(request: Request) {
  try {
    const { email } = await request.json();
    
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('users').deleteOne({ email });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
