'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import Layout from '@/components/Layout';
import { ExpenseReport } from '@/models/ExpenseReport';

export default function PendingExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<ExpenseReport[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseReport | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchPendingExpenses();
  }, []);

  const fetchPendingExpenses = async () => {
    const res = await fetch('/api/expenses?status=submitted');
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

  const generateSignature = async (dataObj: any) => {
    const data = sortedStringify(dataObj);
    // Gerar par de chaves ECDSA
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    // Exportar chave pública
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );
    const publicKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(publicKeyBuffer))));

    // Assinar dados
    const encoder = new TextEncoder();
    const signature = await window.crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      keyPair.privateKey,
      encoder.encode(data)
    );

    // Converter assinatura para base64
    const signatureBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(signature))));

    return { signature: signatureBase64, publicKey: publicKeyBase64 };
  };

  const handleValidate = async (expenseId: string) => {
    try {
      if (!selectedExpense) return;

      // Função para pegar só a parte da data (YYYY-MM-DD)
      const getDatePart = (date: string | Date) => {
        return new Date(date).toISOString().split('T')[0];
      };

      const signedAt = new Date();
      const dataToSign = {
        title: selectedExpense.title,
        description: selectedExpense.description,
        amount: parseFloat(selectedExpense.amount.toString()),
        date: getDatePart(selectedExpense.date),
        receipts: selectedExpense.receipts,
        employeeSignature: selectedExpense.employeeSignature,
        action: 'validate',
        signedAt: signedAt.toISOString()
      };

      const { signature, publicKey } = await generateSignature(dataToSign);

      const res = await fetch(`/api/expenses/${expenseId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerSignature: {
            data: signature,
            publicKey,
            signedAt,
            signedBy: session?.user?.email || ''
          }
        })
      });

      if (res.ok) {
        setOpen(false);
        fetchPendingExpenses();
      }
    } catch (error) {
      console.error('Error validating expense:', error);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Relatórios Pendentes
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Valor</TableCell>
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
                <TableCell>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedExpense(expense);
                      setOpen(true);
                    }}
                  >
                    Revisar
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
            <DialogTitle>Revisar Relatório</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6">{selectedExpense.title}</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {selectedExpense.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Data: {new Date(selectedExpense.date).toLocaleDateString()}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Valor:{' '}
                  <NumericFormat
                    value={selectedExpense.amount}
                    displayType="text"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="R$ "
                    decimalScale={2}
                    fixedDecimalScale
                  />
                </Typography>
                
                {selectedExpense.receipts && selectedExpense.receipts.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Recibos:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {selectedExpense.receipts.map((receipt, index) => (
                        <Box key={index} sx={{ width: 200 }}>
                          <Paper
                            elevation={3}
                            sx={{
                              p: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1
                            }}
                          >
                            <Box
                              component="img"
                              src={receipt}
                              alt={`Recibo ${index + 1}`}
                              sx={{
                                width: '100%',
                                height: 150,
                                objectFit: 'cover',
                                borderRadius: 1
                              }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              fullWidth
                              onClick={() => window.open(receipt, '_blank')}
                            >
                              Ver Recibo {index + 1}
                            </Button>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Fechar</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleValidate(selectedExpense._id!.toString())}
              >
                Validar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Layout>
  );
}
