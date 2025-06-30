'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Alert,
} from '@mui/material';
import { NumericFormat } from 'react-number-format';
import Layout from '@/components/Layout';

export default function SubmitExpensePage() {
  const { data: session } = useSession();
  const router = useRouter();
  interface FormData {
    title: string;
    description: string;
    amount: string;
    date: string;
  }

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    amount: '',
    date: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await res.json();
    return data.url;
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

  interface FormData {
    title: string;
    description: string;
    amount: string;
    date: string;
    formattedAmount: string;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      // Upload receipts first
      const receipts = [];
      for (const file of files) {
        const url = await uploadFile(file);
        receipts.push(url);
      }

      // Gerar assinatura digital dos dados do relatório
      const signedAt = new Date();
      const dataToSign = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        receipts,
        signedAt: signedAt.toISOString()
      };

      const { signature, publicKey } = await generateSignature(dataToSign);

      // Create expense report with receipt URLs and signature
      const expenseRes = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date),
          receipts,
          employeeSignature: {
            data: signature,
            publicKey,
            signedAt,
            signedBy: session?.user?.email || ''
          }
        }),
      });

      if (!expenseRes.ok) {
        throw new Error('Failed to create expense report');
      }

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        amount: '',
        date: ''
      });
      setFiles([]);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting expense:', error);
      setError('Failed to submit expense report. Please try again.');
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Enviar Relatório de Despesa
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Relatório enviado com sucesso!
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Título"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <TextField
              label="Descrição"
              required
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <NumericFormat
              customInput={TextField}
              label="Valor (R$)"
              required
              value={formData.amount}
              onValueChange={(values) => {
                setFormData({
                  ...formData,
                  amount: values.value
                });
              }}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
            />

            <TextField
              label="Data"
              required
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => {
                  const fileList = e.target.files;
                  if (fileList && fileList.length > 0) {
                    const newFiles = Array.from(fileList);
                    setFiles(prev => [...prev, ...newFiles]);
                  }
                }}
                style={{ display: 'none' }}
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                >
                  Anexar Recibos
                </Button>
              </label>
              {files.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recibos Selecionados ({files.length}):
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    {files.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1,
                          borderBottom: index < files.length - 1 ? '1px solid #eee' : 'none'
                        }}
                      >
                        <Typography variant="body2">
                          {file.name}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          Remover
                        </Button>
                      </Box>
                    ))}
                  </Paper>
                </Box>
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Enviar Relatório
            </Button>
          </Box>
        </form>
      </Paper>
    </Layout>
  );
}
