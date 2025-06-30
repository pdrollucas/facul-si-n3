# Sistema de Gerenciamento Seguro de Relatórios de Despesas

Sistema web para gerenciamento de relatórios de despesas com assinaturas digitais, desenvolvido com Next.js, TypeScript e MongoDB.

Alunos: Pedro Lucas Luckow e André Estevão

## 🚀 Requisitos

- Node.js 18+ 
- MongoDB 6+
- NPM ou Yarn

## ⚙️ Configuração

1. **Clone o repositório**
```bash
git clone [URL_DO_REPOSITÓRIO]
cd facul-si-n3
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# MongoDB
MONGODB_URI=sua_uri_do_mongodb

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=gere_uma_chave_secreta_forte

# Upload (opcional - configure se usar serviço de storage externo)
UPLOAD_API_KEY=sua_chave_de_api
UPLOAD_API_SECRET=seu_segredo_de_api
```

4. **Configure o banco de dados**

- Crie um banco MongoDB
- Certifique-se de que o URI no `.env.local` está correto
- O sistema criará as coleções automaticamente

## 🏃‍♂️ Executando o Projeto

### Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

O servidor de desenvolvimento iniciará em `http://localhost:3000`

### Produção

```bash
npm run build
npm start
# ou
yarn build
yarn start
```

## 👥 Usuários Iniciais

Para começar, crie um usuário diretor através da rota de registro:

1. Acesse `http://localhost:3000/register`
2. Crie uma conta
3. No MongoDB, atualize manualmente o campo `role` para "diretor":
```javascript
db.users.updateOne(
  { email: "email_do_usuario" },
  { $set: { role: "diretor" } }
)
```

## 🔒 Papéis de Usuário

- **Empregado**: Cria e assina relatórios
- **Gerente**: Valida e assina relatórios
- **Diretor**: Verifica assinaturas e confirma relatórios

## 📝 Funcionalidades Principais

- Autenticação e autorização
- Upload seguro de documentos
- Assinaturas digitais usando ECDSA
- Verificação de assinaturas
- Gestão de usuários e permissões

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14+ com TypeScript
- **UI**: Material-UI + Tailwind CSS
- **Backend**: Node.js com Express
- **Database**: MongoDB
- **Auth**: JWT via NextAuth
- **Crypto**: Web Cryptography API
- **Segurança**: Helmet, HTTPS/TLS

## 🔐 Segurança

O sistema implementa:
- Assinaturas digitais ECDSA/P-256
- Hash de senhas com bcrypt
- Proteção contra CSRF
- Sanitização de inputs
- Validação de uploads
- Controle de acesso baseado em papéis

## 📁 Estrutura de Arquivos

```
src/
├── app/                    # Páginas e API routes
│   ├── api/               # Endpoints da API
│   ├── auth/              # Autenticação
│   └── ...                # Páginas da aplicação
├── components/            # Componentes React
├── lib/                   # Utilitários e configurações
├── models/               # Tipos e interfaces
└── middleware.ts         # Middleware de autenticação
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
