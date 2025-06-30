'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Typography, Grid, Paper, Box } from '@mui/material';
import { NumericFormat } from 'react-number-format';
import Layout from '@/components/Layout';
import { ExpenseReport } from '@/models/ExpenseReport';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<ExpenseReport[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    };

    fetchExpenses();
  }, []);

  const stats = {
    total: expenses.length,
    pending: expenses.filter(e => e.status === 'pending').length,
    validated: expenses.filter(e => e.status === 'validated').length,
    confirmed: expenses.filter(e => e.status === 'confirmed').length,
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Total de Relatórios
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Pendentes
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Validados
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.validated}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Confirmados
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.confirmed}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Relatórios Recentes
      </Typography>
      
      <Grid container spacing={3}>
        {expenses.slice(0, 5).map((expense) => (
          <Grid item xs={12} key={expense._id?.toString()}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{expense.title}</Typography>
              <Typography color="text.secondary">
                Status: {expense.status}
              </Typography>
              <Typography>
                Valor:{' '}
                <NumericFormat
                  value={expense.amount}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                />
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
}
