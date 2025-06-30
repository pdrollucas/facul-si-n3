'use client';

import { ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Button } from '@mui/material';
import { Menu as MenuIcon, Dashboard, People, Description, CheckCircle, VerifiedUser } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['empregado', 'gerente', 'diretor'] },
    { text: 'Funcionários', icon: <People />, path: '/employees', roles: ['gerente', 'diretor'] },
    { text: 'Enviar Relatório', icon: <Description />, path: '/submit-expense', roles: ['empregado'] },
    { text: 'Validar Relatórios', icon: <CheckCircle />, path: '/pending-expenses', roles: ['gerente'] },
    { text: 'Verificar Assinaturas', icon: <VerifiedUser />, path: '/verify-signatures', roles: ['diretor'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(session?.user?.role as string)
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Sistema de Relatórios
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            color="inherit"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            marginTop: '0'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem 
                button 
                key={item.text}
                onClick={() => router.push(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
