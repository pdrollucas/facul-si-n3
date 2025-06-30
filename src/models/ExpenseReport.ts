import { ObjectId } from 'mongodb';

interface Signature {
  data: string; // Assinatura digital em base64
  signedBy: string; // Email do signatário
  signedAt: Date;
  publicKey: string; // Chave pública em base64 para verificação
}

export interface ExpenseReport {
  _id?: ObjectId;
  employeeEmail: string;
  title: string;
  description: string;
  amount: number;
  date: Date;
  receipts: string[]; // URLs dos recibos
  status: 'draft' | 'submitted' | 'validated' | 'rejected' | 'confirmed';
  
  // Assinatura do empregado (ao submeter)
  employeeSignature?: Signature;
  
  // Assinatura do gerente (ao validar)
  managerSignature?: Signature;

  // Confirmação do diretor
  directorConfirmation?: {
    confirmedBy: string;
    confirmedAt: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
