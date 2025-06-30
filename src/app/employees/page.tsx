'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Layout from '@/components/Layout';
import { SafeUser } from '@/models/User';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<SafeUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<SafeUser | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [editEmployee, setEditEmployee] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEditClick = (employee: SafeUser) => {
    setSelectedEmployee(employee);
    setEditEmployee({
      name: employee.name,
      email: employee.email,
      password: '',
    });
    setEditOpen(true);
  };

  const handleDeleteClick = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja remover este funcionário?')) {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          setEmployees(employees.filter(emp => emp._id?.toString() !== userId));
        } else {
          const error = await res.json();
          alert(error.message || 'Erro ao remover funcionário');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Erro ao remover funcionário');
      }
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedEmployee?._id) return;

    try {
      const res = await fetch(`/api/users/${selectedEmployee._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editEmployee),
      });

      if (res.ok) {
        setEmployees(employees.map(emp =>
          emp._id === selectedEmployee._id
            ? { ...emp, name: editEmployee.name, email: editEmployee.email }
            : emp
        ));
        setEditOpen(false);
      } else {
        const error = await res.json();
        alert(error.message || 'Erro ao atualizar funcionário');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Erro ao atualizar funcionário');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      });

      if (res.ok) {
        setOpen(false);
        setNewEmployee({ name: '', email: '', password: '' });
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error creating employee:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setEmployees(employees.map(employee => 
          employee._id?.toString() === userId ? { ...employee, role: newRole as 'empregado' | 'gerente' | 'diretor' } : employee
        ));
      } else {
        const error = await res.json();
        alert(error.message || 'Falha ao atualizar cargo');
      }
    } catch (error) {
      console.error('Erro ao atualizar cargo:', error);
      alert('Falha ao atualizar cargo');
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'empregado': return 'Empregado';
      case 'gerente': return 'Gerente';
      case 'diretor': return 'Diretor';
      default: return role;
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Gerenciar Funcionários
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpen(true)}
        sx={{ mb: 3 }}
      >
        Adicionar Funcionário
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Cargo</TableCell>
              {(session?.user?.role === 'diretor' || session?.user?.role === 'gerente') && (
                <TableCell>Ações</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee._id?.toString()}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>
                  {session?.user?.role === 'diretor' ? (
                    <Select
                      value={employee.role}
                      onChange={(e) => handleRoleChange(employee._id?.toString() || '', e.target.value)}
                    >
                      <MenuItem value="empregado">Empregado</MenuItem>
                      <MenuItem value="gerente">Gerente</MenuItem>
                      <MenuItem value="diretor">Diretor</MenuItem>
                    </Select>
                  ) : (
                    employee.role
                  )}
                </TableCell>
                {(session?.user?.role === 'diretor' || session?.user?.role === 'gerente') && (
                  <TableCell>
                    <IconButton onClick={() => handleEditClick(employee)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(employee._id?.toString() || '')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nome"
              type="text"
              fullWidth
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Senha"
              type="password"
              fullWidth
              value={newEmployee.password}
              onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">Adicionar</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Editar Funcionário</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Nome"
            type="text"
            fullWidth
            value={editEmployee.name}
            onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={editEmployee.email}
            onChange={(e) => setEditEmployee({ ...editEmployee, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Nova Senha (opcional)"
            type="password"
            fullWidth
            value={editEmployee.password}
            onChange={(e) => setEditEmployee({ ...editEmployee, password: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
