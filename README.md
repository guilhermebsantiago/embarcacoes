# Sistema de Gerenciamento de Embarcações

Sistema web para gerenciamento de embarcações, clientes, processos e documentos desenvolvido com **Node.js**, **TypeScript**, **Express** e **PostgreSQL**.

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Yarn ou NPM

## Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd bd_projeto
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados PostgreSQL:
   - Crie um banco chamado `embarcacoes`
   - Execute os scripts SQL de criação das tabelas
   - Configure as credenciais em `src/database.ts` se necessário

4. Compile o TypeScript:
```bash
npm run build
```

5. Inicie o servidor:
```bash
npm start
```

6. Acesse: **http://localhost:3000**

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Compila TypeScript para JavaScript |
| `npm start` | Inicia o servidor (produção) |
| `npm run dev` | Inicia com ts-node (desenvolvimento) |

## Estrutura do Projeto

```
bd_projeto/
├── src/
│   ├── database.ts      # Conexão e queries do banco
│   └── index.ts         # API REST (Express)
├── public/
│   ├── index.html       # Interface do usuário
│   ├── script.js        # Lógica do frontend
│   └── style.css        # Estilos
├── dist/                # Código compilado
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/login` | Login do usuário |
| GET | `/api/test-connection` | Testa conexão com o banco |

### Clientes
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/client` | Lista todos os clientes |
| POST | `/api/client` | Cria novo cliente |
| PUT | `/api/client/:id` | Atualiza cliente |
| DELETE | `/api/client/:id` | Remove cliente |

### Usuários
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/user` | Lista todos os usuários |
| POST | `/api/user` | Cria novo usuário |
| PUT | `/api/user/:id` | Atualiza usuário |
| DELETE | `/api/user/:id` | Remove usuário |

### Embarcações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/vessel` | Lista todas as embarcações |
| POST | `/api/vessel` | Cria nova embarcação |
| PUT | `/api/vessel/:id` | Atualiza embarcação |
| DELETE | `/api/vessel/:id` | Remove embarcação |

### Órgãos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/organ` | Lista todos os órgãos |
| POST | `/api/organ` | Cria novo órgão |
| PUT | `/api/organ/:id` | Atualiza órgão |
| DELETE | `/api/organ/:id` | Remove órgão |

### Processos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/process` | Lista todos os processos |
| POST | `/api/process` | Cria novo processo |
| PUT | `/api/process/:id` | Atualiza processo |
| DELETE | `/api/process/:id` | Remove processo |

### Documentos
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/document` | Lista todos os documentos |
| POST | `/api/document` | Cria novo documento |
| PUT | `/api/document/:id` | Atualiza documento |
| DELETE | `/api/document/:id` | Remove documento |

### Inspeções
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/inspection` | Lista todas as inspeções |
| POST | `/api/inspection` | Cria nova inspeção |
| PUT | `/api/inspection/:idProcess/:code` | Atualiza inspeção |
| DELETE | `/api/inspection/:idProcess/:code` | Remove inspeção |

### Consultas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/consultas/clientes-embarcacoes` | Clientes e total de embarcações |
| GET | `/api/consultas/orgaos-processos` | Órgãos com processos ativos |
| GET | `/api/consultas/documentos-clientes` | Documentos de clientes com embarcações |
| GET | `/api/consultas/processos-inspecoes` | Processos que possuem inspeções |
| GET | `/api/consultas/embarcacao-maior` | Embarcação com maior capacidade |
| GET | `/api/consultas/painel-geral` | Visão geral do sistema |

## Banco de Dados

### Configuração
```typescript
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'embarcacoes',
  user: 'postgres',
  password: 'postgres'
});
```

### Tabelas Principais
- `Person` - Dados pessoais
- `Client` - Clientes (herda de Person)
- `User` - Usuários do sistema
- `Vessel` - Embarcações
- `Organ` - Órgãos reguladores
- `Process` - Processos
- `Document` - Documentos
- `Inspection` - Inspeções
- `Phones` - Telefones dos clientes

## Funcionalidades

- Autenticação de usuários
- CRUD completo de todas as entidades
- Consultas e relatórios
- Interface responsiva
- Validação de dados no frontend e backend
- Trigger para validação de embarcações
- Controle de permissões por perfil

## Tecnologias

- **Backend:** Node.js, Express, TypeScript
- **Banco:** PostgreSQL
- **Frontend:** HTML5, CSS3, JavaScript
- **Estilo:** CSS customizado com variáveis

## Licença

Projeto desenvolvido para fins acadêmicos - Disciplina de Banco de Dados.
