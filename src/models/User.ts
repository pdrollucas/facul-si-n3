import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'empregado' | 'gerente' | 'diretor';
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  _id?: ObjectId;
  name: string;
  email: string;
  role: 'empregado' | 'gerente' | 'diretor';
}
