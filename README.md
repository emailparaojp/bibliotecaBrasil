# 📚 Biblioteca Brasil API

Sistema completo de gerenciamento de biblioteca física, construído com **Node.js + Express + SQLite**.

## 🚀 Como rodar

```bash
npm install
npm start
# ou, com hot-reload:
npm run dev
```

O servidor sobe em `http://localhost:3000`.

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
src/
├── server.js          # Ponto de entrada
├── app.js             # Configuração Express
├── database/
│   ├── index.js       # Conexão SQLite
│   ├── migrations.js  # Schema do banco
│   └── seed.js        # Dados de exemplo
├── controllers/       # Lógica de negócio
├── routes/            # Definição de rotas
└── middleware/        # errorHandler, validate
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
2. Cadastrar livros e seus exemplares
3. Cadastrar membros
4. Realizar empréstimo: POST /api/emprestimos
5. Devolver livro: PATCH /api/emprestimos/:id/devolver
   → Multa gerada automaticamente se atrasado
6. Pagar multa: PATCH /api/multas/:id/pagar
7. Se livro indisponível: POST /api/reservas
8. Consultar dashboar: GET /api/relatorios/dashboard
```

---

## 🛠️ Tecnologias

- **Node.js** v18+
- **Express** — framework HTTP
- **better-sqlite3** — banco de dados SQLite síncrono
- **express-validator** — validação de entrada
- **helmet** — segurança HTTP headers
- **cors** — Cross-Origin Resource Sharing
- **morgan** — logging de requisições
- **dotenv** — variáveis de ambiente
