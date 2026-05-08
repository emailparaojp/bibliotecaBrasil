# 📚 Biblioteca Brasil

Sistema completo de gerenciamento de biblioteca física com **interface web** e **API REST**, construído com **Node.js + Express + SQLite**.

## ✨ Funcionalidades

- **Acervo** — cadastro de livros, exemplares físicos (tombos), autores, editoras e categorias
- **Membros** — cadastro de membros (Estudante / Professor / Comum), renovação de matrícula, histórico
- **Empréstimos** — controle de empréstimos com prazos por tipo de membro, renovações e devoluções
- **Reservas** — fila de reservas com expiração automática
- **Multas** — geração automática de multas por atraso, quitação individual ou em lote
- **Relatórios** — dashboard, acervo por categoria/condição, ranking de livros, mapa financeiro, devoluções previstas
- **Interface web** — SPA com navegação lateral, modais, filtros e paginação

## 🚀 Como rodar

```bash
npm install
npm start        # produção
npm run dev      # desenvolvimento (hot-reload)
```

Acesse **http://localhost:3000** no navegador para a interface web.
A API REST está disponível em `http://localhost:3000/api/`.

### Popular o banco de dados

```bash
# Seed básico (executado automaticamente na primeira inicialização)
npm run seed

# Seed rico — apaga tudo e popula com dados de demonstração completos:
# 30 livros · 68 exemplares · 17 autores · 8 editoras · 12 categorias
# 20 membros · 16 empréstimos · 6 reservas · 7 multas
npm run seed:rich
```

---

## ⚙️ Variáveis de ambiente (`.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor |
| `DB_PATH` | `./biblioteca.db` | Caminho do banco SQLite |
| `MULTA_DIARIA` | `0.50` | Valor da multa por dia de atraso (R$) |
| `DIAS_EMPRESTIMO_ESTUDANTE` | `7` | Prazo de empréstimo para estudantes |
| `DIAS_EMPRESTIMO_PROFESSOR` | `14` | Prazo de empréstimo para professores |
| `DIAS_EMPRESTIMO_COMUM` | `7` | Prazo de empréstimo para membros comuns |
| `MAX_EMPRESTIMOS_ESTUDANTE` | `3` | Máx. empréstimos simultâneos (estudante) |
| `MAX_EMPRESTIMOS_PROFESSOR` | `5` | Máx. empréstimos simultâneos (professor) |
| `MAX_EMPRESTIMOS_COMUM` | `2` | Máx. empréstimos simultâneos (comum) |
| `MAX_RENOVACOES` | `2` | Máx. renovações por empréstimo |
| `DIAS_RESERVA` | `3` | Dias de validade de uma reserva |
| `DIAS_VALIDADE_MEMBRO` | `365` | Validade da matrícula em dias |

---

## 📦 Estrutura do projeto

```
bibliotecaBrasil/
├── public/                    # Front-end (SPA estática)
│   ├── index.html             # Shell da aplicação
│   ├── css/
│   │   └── style.css          # Estilos completos
│   └── js/
│       ├── api.js             # Cliente HTTP para todos os endpoints
│       ├── ui.js              # Componentes reutilizáveis (toast, modal, tabela…)
│       ├── main.js            # Roteador hash-based e navegação
│       └── pages/
│           ├── dashboard.js   # Visão geral do sistema
│           ├── livros.js      # Acervo + exemplares
│           ├── membros.js     # Gestão de membros
│           ├── emprestimos.js # Empréstimos, devoluções e renovações
│           ├── reservas.js    # Fila de reservas
│           ├── multas.js      # Controle de multas
│           ├── relatorios.js  # Relatórios e estatísticas
│           └── catalogo.js    # CRUD de autores, editoras e categorias
└── src/
    ├── server.js              # Ponto de entrada
    ├── app.js                 # Configuração Express + servir SPA
    ├── database/
    │   ├── index.js           # Conexão SQLite (WAL + FK)
    │   ├── migrations.js      # Schema (8 tabelas, 12 índices)
    │   ├── seed.js            # Seed básico (12 livros, 8 membros)
    │   └── seedRich.js        # Seed de demonstração (30 livros, 20 membros…)
    ├── controllers/           # Lógica de negócio
    ├── routes/                # Definição de rotas + validação
    └── middleware/            # errorHandler, validate
```

---

## 🗄️ Modelo de dados

```
autores ──< livros >── editoras
               │
           categorias
               │
           exemplares
               │
          emprestimos >── membros
               │               │
            multas          reservas
```

---

## 📡 Endpoints

### Health
| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status da API |

---

### 📖 Autores — `/api/autores`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/autores` | Listar (query: `?busca=`) |
| GET | `/api/autores/:id` | Detalhes + livros do autor |
| POST | `/api/autores` | Criar autor |
| PUT | `/api/autores/:id` | Atualizar autor |
| DELETE | `/api/autores/:id` | Remover autor |

**POST/PUT body:**
```json
{ "nome": "Machado de Assis", "nacionalidade": "Brasileira", "bio": "..." }
```

---

### 🏢 Editoras — `/api/editoras`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/editoras` | Listar |
| GET | `/api/editoras/:id` | Detalhes + livros |
| POST | `/api/editoras` | Criar |
| PUT | `/api/editoras/:id` | Atualizar |
| DELETE | `/api/editoras/:id` | Remover |

---

### 🏷️ Categorias — `/api/categorias`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/categorias` | Listar |
| GET | `/api/categorias/:id` | Detalhes + livros |
| POST | `/api/categorias` | Criar |
| PUT | `/api/categorias/:id` | Atualizar |
| DELETE | `/api/categorias/:id` | Remover |

---

### 📚 Livros — `/api/livros`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/livros` | Listar com filtros |
| GET | `/api/livros/:id` | Detalhes + exemplares |
| POST | `/api/livros` | Cadastrar livro |
| PUT | `/api/livros/:id` | Atualizar livro |
| DELETE | `/api/livros/:id` | Remover livro |
| GET | `/api/livros/:id/exemplares` | Listar exemplares |
| POST | `/api/livros/:id/exemplares` | Adicionar exemplar |
| PUT | `/api/livros/:id/exemplares/:exemplarId` | Atualizar exemplar |
| DELETE | `/api/livros/:id/exemplares/:exemplarId` | Remover exemplar |

**Query params para GET `/api/livros`:**
- `busca` — busca em título/ISBN/subtítulo
- `autor` — filtra por nome de autor
- `categoria` — filtra por nome de categoria
- `editora` — filtra por nome de editora
- `idioma` — filtra por idioma
- `ano` — filtra por ano de publicação
- `disponivel=1` — apenas livros com exemplares disponíveis
- `page`, `limit` — paginação

**POST body:**
```json
{
  "isbn": "9788535902778",
  "titulo": "Dom Casmurro",
  "id_autor": 1,
  "id_editora": 1,
  "id_categoria": 1,
  "ano_publicacao": 1899,
  "localizacao": "A-01"
}
```

---

### 👤 Membros — `/api/membros`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/membros` | Listar (filtros: `busca`, `tipo`, `ativo`) |
| GET | `/api/membros/:id` | Detalhes + empréstimos ativos + reservas |
| POST | `/api/membros` | Cadastrar membro |
| PUT | `/api/membros/:id` | Atualizar dados |
| PATCH | `/api/membros/:id/renovar-matricula` | Renovar matrícula |
| PATCH | `/api/membros/:id/status` | Ativar/inativar |
| GET | `/api/membros/:id/historico` | Histórico de empréstimos |

**POST body:**
```json
{
  "nome": "Ana Silva",
  "cpf": "111.111.111-01",
  "email": "ana@email.com",
  "telefone": "(11) 9 1111-0001",
  "endereco": "Rua das Flores, 10",
  "tipo": "Estudante"
}
```

**Tipos de membro:** `Estudante`, `Professor`, `Comum`

---

### 📋 Empréstimos — `/api/emprestimos`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/emprestimos` | Listar (filtros: `status`, `id_membro`, `id_livro`) |
| GET | `/api/emprestimos/atrasados` | Listar atrasados com multa estimada |
| GET | `/api/emprestimos/:id` | Detalhes do empréstimo |
| POST | `/api/emprestimos` | Realizar empréstimo |
| PATCH | `/api/emprestimos/:id/devolver` | Registrar devolução |
| PATCH | `/api/emprestimos/:id/renovar` | Renovar empréstimo |

**POST body:**
```json
{ "id_exemplar": 1, "id_membro": 1 }
```

**Regras de negócio:**
- Membro deve estar ativo e com matrícula válida
- Sem multas pendentes
- Respeita o limite de empréstimos simultâneos por tipo
- Não pode ter o mesmo livro emprestado duas vezes
- Devolução gera multa automática se atrasada (R$ 0,50/dia)
- Renovação não permitida se há reserva ativa para o livro
- Status atualiza automaticamente para `Atrasado`

---

### 🔖 Reservas — `/api/reservas`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/reservas` | Listar (filtros: `id_membro`, `id_livro`, `status`) |
| POST | `/api/reservas` | Criar reserva |
| PATCH | `/api/reservas/:id/cancelar` | Cancelar reserva |
| GET | `/api/reservas/livro/:id/fila` | Fila de reservas de um livro |

**POST body:**
```json
{ "id_livro": 3, "id_membro": 4 }
```

**Regras:**
- Reserva só é permitida se não há exemplares disponíveis
- Reservas expiram automaticamente após `DIAS_RESERVA` dias
- Ao realizar empréstimo do livro reservado, a reserva é marcada como `Concluida`

---

### 💰 Multas — `/api/multas`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/multas` | Listar (filtros: `pago`, `id_membro`) |
| GET | `/api/multas/:id` | Detalhes da multa |
| PATCH | `/api/multas/:id/pagar` | Registrar pagamento |
| GET | `/api/multas/membro/:id` | Resumo de multas do membro |
| PATCH | `/api/multas/membro/:id/pagar-tudo` | Quitar todas multas do membro |

---

### 📊 Relatórios — `/api/relatorios`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/relatorios/dashboard` | Visão geral do sistema |
| GET | `/api/relatorios/acervo` | Estatísticas do acervo por categoria/condição |
| GET | `/api/relatorios/inventario` | Inventário completo com disponibilidade |
| GET | `/api/relatorios/livros-mais-emprestados` | Ranking de livros (`?limit=10&periodo_dias=30`) |
| GET | `/api/relatorios/membros-mais-ativos` | Ranking de membros |
| GET | `/api/relatorios/situacao-emprestimos` | Situação por status e tipo |
| GET | `/api/relatorios/devolucoes-previstas` | Devoluções nos próximos N dias (`?dias=7`) |
| GET | `/api/relatorios/financeiro-multas` | Resumo financeiro de multas |
| GET | `/api/relatorios/membros-com-multas` | Membros com multas pendentes |

---

## 🔄 Fluxo típico de uso

```
1. Cadastrar autores, editoras, categorias
2. Cadastrar livros e seus exemplares físicos (tombos)
3. Cadastrar membros
4. Realizar empréstimo:    POST /api/emprestimos
5. Devolver livro:         PATCH /api/emprestimos/:id/devolver
   → Multa gerada automaticamente se atrasado (R$ 0,50/dia)
6. Pagar multa:            PATCH /api/multas/:id/pagar
7. Se livro indisponível:  POST /api/reservas
8. Consultar dashboard:    GET  /api/relatorios/dashboard
```

### Regras de negócio principais

| Tipo membro  | Prazo padrão | Máx. simultâneos | Renovações |
|---|---|---|---|
| Estudante    | 7 dias       | 3                | 2          |
| Professor    | 14 dias      | 5                | 2          |
| Comum        | 7 dias       | 2                | 2          |

- Membro deve estar **ativo** e com **matrícula válida** para emprestar
- Membro com **multa pendente** não pode realizar novos empréstimos
- Renovação **bloqueada** se houver reserva ativa para o livro
- Reservas expiram automaticamente após `DIAS_RESERVA` dias
- Devolução marca a reserva seguinte como disponível para retirada

---

## 🛠️ Tecnologias

- **Node.js** v18+
- **Express 5** — framework HTTP
- **better-sqlite3** — banco de dados SQLite síncrono e performático
- **express-validator** — validação e sanitização de entrada
- **helmet** — cabeçalhos de segurança HTTP
- **cors** — Cross-Origin Resource Sharing
- **morgan** — logging de requisições
- **dotenv** — variáveis de ambiente
- **Vanilla JS** — front-end sem framework ou bundler (SPA com hash routing)
