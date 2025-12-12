# Sistema BioBox - Gerenciamento de Produção de Móveis

Sistema completo para gerenciamento de pedidos, produção e vendas de móveis estofados.

## 🚀 Funcionalidades

### Para Vendedores
- ✅ Login personalizado por vendedor
- ✅ Criação de pedidos completos
- ✅ Gestão de clientes
- ✅ Rastreamento de vendas pessoais
- ✅ Interface intuitiva em 3 etapas

### Para Administradores
- ✅ Visão completa de todos os pedidos
- ✅ Gestão de usuários e permissões
- ✅ Relatórios e estatísticas em tempo real
- ✅ Controle total do sistema
- ✅ Dashboard com métricas importantes

### Recursos Técnicos
- ✅ Interface responsiva (desktop e mobile)
- ✅ Integração com Supabase (banco de dados)
- ✅ Sistema de fallback offline
- ✅ Geração de códigos de barras
- ✅ Impressão térmica em bobinas
- ✅ Autenticação e permissões
- ✅ Dados em tempo real

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React + TypeScript + Vite
- **UI:** Tailwind CSS + Shadcn/ui
- **Backend:** Supabase (PostgreSQL)
- **Autenticação:** Sistema próprio com roles
- **Deploy:** Netlify/Vercel ready

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou pnpm
- Conta no Supabase (opcional)

### Passos

1. **Extrair o projeto:**
```bash
unzip biobox-sistema-completo.zip
cd BioBox
```

2. **Instalar dependências:**
```bash
npm install
```

3. **Configurar Supabase (opcional):**
   - Edite `client/lib/supabase.ts` com suas credenciais
   - Ou use o modo offline (dados em localStorage)

4. **Executar em desenvolvimento:**
```bash
npm run dev
```

5. **Gerar build de produção:**
```bash
npm run build
```

## 🔐 Credenciais de Teste

- **Administrador:** admin@bioboxsys.com / password
- **Vendedor Carlos:** carlos@bioboxsys.com / password
- **Vendedora Ana:** ana@bioboxsys.com / password

## 📁 Estrutura do Projeto

```
BioBox/
├── client/                 # Frontend React
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/             # Páginas da aplicação
│   ├── hooks/             # Hooks personalizados
│   ├── lib/               # Configurações (Supabase)
│   └── types/             # Tipos TypeScript
├── server/                # Backend (opcional)
├── dist/                  # Build de produção
└── docs/                  # Documentação
```

## 🎯 Principais Páginas

### Dashboard (`/`)
- Métricas gerais do sistema
- Gráficos de produção
- Resumo de pedidos

### Pedidos (`/orders`)
- Lista completa de pedidos
- Filtros por status e prioridade
- Criação de novos pedidos
- Rastreamento por vendedor

### Clientes (`/customers`)
- Cadastro de clientes
- Histórico de pedidos
- Informações de contato

### Produtos (`/products`)
- Catálogo de produtos
- Configurações de preços
- Opções de personalização

### Produção (`/production`)
- Controle de tarefas
- Progresso de pedidos
- Gestão de operadores

### Configurações (`/settings`)
- Gestão de usuários
- Permissões do sistema
- Configurações gerais

## 🔧 Configuração do Supabase

### Tabelas Necessárias:
- `users` - Usuários do sistema
- `customers` - Clientes
- `products` - Catálogo de produtos
- `orders` - Pedidos
- `order_products` - Produtos dos pedidos
- `production_tasks` - Tarefas de produção

### Script SQL:
Execute o arquivo `biobox_database_setup.sql` no seu projeto Supabase.

## 🚀 Deploy

### Netlify/Vercel:
1. Faça build: `npm run build`
2. Deploy a pasta `dist/spa/`

### Servidor Próprio:
1. Configure um servidor web (nginx/apache)
2. Aponte para `dist/spa/index.html`

## 📱 Recursos Mobile

- Interface totalmente responsiva
- Touch-friendly
- Navegação otimizada
- Formulários adaptados

## 🎨 Personalização

### Cores (Tailwind):
- Primary: `biobox-green` (#10B981)
- Backgrounds: Configuráveis via CSS
- Componentes: Shadcn/ui customizáveis

### Funcionalidades:
- Adicione novos módulos em `client/pages/`
- Componentes reutilizáveis em `client/components/`
- Hooks personalizados em `client/hooks/`

## 🐛 Solução de Problemas

### Erro de Conexão Supabase:
- Verifique as credenciais em `client/lib/supabase.ts`
- Sistema funciona offline com dados mock

### Erro de Build:
- Execute `npm install` novamente
- Verifique versão do Node.js (18+)

### Problemas de Permissão:
- Verifique roles dos usuários
- Confirme configuração de RLS no Supabase

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs do console
3. Teste com dados mock primeiro

## 📄 Licença

Sistema desenvolvido para uso interno. Todos os direitos reservados.

---

**Desenvolvido com ❤️ para otimizar a gestão de produção de móveis**

