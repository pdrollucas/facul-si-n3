'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Alert,
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import Layout from '@/components/Layout';
import { ExpenseReport } from '@/models/ExpenseReport';

export default function VerifySignaturesPage() {
  const [expenses, setExpenses] = useState<ExpenseReport[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseReport | null>(null);
  const [open, setOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    employee: boolean;
    manager: boolean;
  } | null>(null);

  useEffect(() => {
    fetchValidatedExpenses();
  }, []);

  const fetchValidatedExpenses = async () => {
    const res = await fetch('/api/expenses?status=validated');
    if (res.ok) {
      const data = await res.json();
      setExpenses(data);
    }
  };

  // Função para ordenar as chaves do objeto antes de stringificar
  const sortedStringify = (obj: any): string => {
    const allKeys = new Set<string>();
    JSON.stringify(obj, (key, value) => {
      allKeys.add(key);
      return value;
    });
    return JSON.stringify(obj, Array.from(allKeys).sort());
  };

  const verifySignature = async (signature: any, publicKey: string, data: string) => {
    try {
      // Importar chave pública
      const publicKeyBuffer = Uint8Array.from(atob(publicKey), c => c.charCodeAt(0));
      const importedKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['verify']
      );

      // Converter assinatura de base64 para ArrayBuffer
      const signatureBuffer = Uint8Array.from(atob(signature.data), c => c.charCodeAt(0));

      // Verificar assinatura
      const encoder = new TextEncoder();
      const isValid = await window.crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: { name: 'SHA-256' },
        },
        importedKey,
        signatureBuffer,
        encoder.encode(data)
      );

      return isValid;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  };

  const handleConfirm = async (expense: ExpenseReport) => {
    try {
      const res = await fetch(`/api/expenses/${expense._id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        await fetchValidatedExpenses();
        setOpen(false);
      }
    } catch (error) {
      console.error('Error confirming expense:', error);
    }
  };

  const handleVerify = async (expense: ExpenseReport) => {
    try {
      setSelectedExpense(expense);
      setOpen(true);
      setVerificationResult(null);

      // Verificar assinatura do empregado
      // Função para pegar só a parte da data (YYYY-MM-DD)
      const getDatePart = (date: string | Date) => {
        return new Date(date).toISOString().split('T')[0];
      };

      const employeeData = sortedStringify({
        title: expense.title,
        description: expense.description,
        amount: parseFloat(expense.amount.toString()),
        date: getDatePart(expense.date),
        receipts: expense.receipts,
        signedAt: new Date(expense.employeeSignature?.signedAt || '').toISOString()
      });

      const employeeValid = await verifySignature(
        expense.employeeSignature,
        expense.employeeSignature?.publicKey || '',
        employeeData
      );

      // Verificar assinatura do gerente
      const managerData = sortedStringify({
        title: expense.title,
        description: expense.description,
        amount: parseFloat(expense.amount.toString()),
        date: getDatePart(expense.date),
        receipts: expense.receipts,
        employeeSignature: {
          ...expense.employeeSignature,
          signedAt: new Date(expense.employeeSignature?.signedAt || '').toISOString()
        },
        action: 'validate',
        signedAt: new Date(expense.managerSignature?.signedAt || '').toISOString()
      });

      const managerValid = await verifySignature(
        expense.managerSignature,
        expense.managerSignature?.publicKey || '',
        managerData
      );

      setVerificationResult({
        employee: employeeValid,
        manager: managerValid
      });

    } catch (error) {
      console.error('Error verifying signatures:', error);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Verificar Relatórios
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Empregado</TableCell>
              <TableCell>Gerente</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense._id?.toString()}>
                <TableCell>{expense.title}</TableCell>
                <TableCell>
                  {new Date(expense.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <NumericFormat
                    value={expense.amount}
                    displayType="text"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                  />
                </TableCell>
                <TableCell>{expense.employeeSignature?.signedBy}</TableCell>
                <TableCell>{expense.managerSignature?.signedBy}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    onClick={() => handleVerify(expense)}
                  >
                    Verificar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedExpense && (
          <>
            <DialogTitle>Verificação de Relatório</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">{selectedExpense?.title}</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {selectedExpense?.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Data: {new Date(selectedExpense?.date || '').toLocaleDateString()}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Valor:{' '}
                  <NumericFormat
                    value={selectedExpense?.amount}
                    displayType="text"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                  />
                </Typography>

                {selectedExpense?.receipts && selectedExpense.receipts.length > 0 && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Recibos:</Typography>
                    {selectedExpense.receipts.map((receipt, index) => (
                      <Button
                        key={index}
                        variant="text"
                        onClick={() => window.open(receipt, '_blank')}
                      >
                        Ver Recibo {index + 1}
                      </Button>
                    ))}
                  </Box>
                )}

                {verificationResult && (
                  <Box sx={{ mt: 2 }}>
                    <Alert 
                      severity={verificationResult.employee ? "success" : "error"}
                      sx={{ mb: 2 }}
                    >
                      Assinatura do Empregado: {verificationResult.employee ? "Válida" : "Inválida"}
                    </Alert>

                    <Alert 
                      severity={verificationResult.manager ? "success" : "error"}
                    >
                      Assinatura do Gerente: {verificationResult.manager ? "Válida" : "Inválida"}
                    </Alert>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Detalhes das Assinaturas:
                      </Typography>
                      <Typography variant="body1">
                        Empregado: {selectedExpense.employeeSignature?.signedBy || selectedExpense.employeeEmail}
                        <br />
                        Data: {new Date(selectedExpense.employeeSignature?.signedAt || '').toLocaleString()}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        Gerente: {selectedExpense.managerSignature?.signedBy}
                        <br />
                        Data: {new Date(selectedExpense.managerSignature?.signedAt || '').toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Fechar</Button>
              {verificationResult?.employee && verificationResult?.manager && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleConfirm(selectedExpense!)}
                >
                  Confirmar Relatório
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Layout>
  );
}
