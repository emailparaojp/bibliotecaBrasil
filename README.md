# 📚 Biblioteca Brasil

> **Projeto open source · Uso livre e gratuito**

Sistema completo de gerenciamento de biblioteca física com **portal público**, **painel administrativo** e **API REST**, construído com **Node.js + Express**. Funciona com **SQLite** (sem configuração) ou **PostgreSQL** (para ambientes de produção).

Criado para ajudar pequenas bibliotecas — escolares, comunitárias, paroquiais e municipais — a organizarem seus acervos de forma moderna, sem custo algum. Qualquer biblioteca pode usar, copiar, modificar e distribuir este software livremente. Se precisar de ajuda para instalar ou adaptar o sistema, podemos ajudar.

## ✨ Funcionalidades

### Portal Público (`/`)
- **Pesquisa do acervo** — busca de livros por título, autor, categoria ou ISBN sem necessidade de login
- **Disponibilidade em tempo real** — visualização de quantos exemplares estão disponíveis para cada livro
- **Reserva online** — usuários autenticados podem reservar um exemplar diretamente pelo portal
- **Cadastro de usuários** — registro com CPF (validado algoritmicamente), nome, e-mail e senha
- **Minha Área** — histórico de reservas, status (Ativa / Atendida / Cancelada / Expirada) e opção de cancelamento
- **Login unificado** — membros `admin` e `bibliotecário` são automaticamente redirecionados para `/admin`

### Painel Administrativo (`/admin`)
- **Acervo** — cadastro de livros (com capa armazenada no banco de dados em Base64), exemplares físicos (tombos), autores, editoras e categorias
- **Membros** — cadastro de membros (Estudante / Professor / Comum), renovação de matrícula, histórico de empréstimos e **gerenciamento de perfil de acesso** (promover para Bibliotecário ou Administrador)
- **Empréstimos** — controle de empréstimos com prazos por tipo de membro, renovações e devoluções
- **Reservas** — fila de reservas com expiração automática
- **Multas** — geração automática por atraso, quitação individual ou em lote
- **Relatórios** — dashboard com cards de resumo, acervo por categoria/condição, ranking de livros, mapa financeiro e devoluções previstas
- **Controle de acesso** — área restrita a usuários com perfil `admin` ou `bibliotecario`; autenticação via CPF + senha com JWT

## 🌍 Demonstração online

Você pode ver uma versão prévia da aplicação em funcionamento no endereço:

**👉 [https://bibliotecabrasil.onrender.com/](https://bibliotecabrasil.onrender.com/)**

---

## 🚀 Como rodar

### 🐳 Docker (recomendado — o mais simples)

Sem precisar instalar Node.js, MariaDB ou qualquer dependência:

```bash
# 1. Clonar o repositório
git clone https://github.com/emailparaojp/bibliotecaBrasil.git
cd bibliotecaBrasil

# 2. Subir tudo com um comando
docker compose up -d
```

Pronto! A aplicação estará disponível em:

| Interface | URL |
|---|---|
| Portal público | http://localhost:3000 |
| Painel administrativo | http://localhost:3000/admin |
| API REST | http://localhost:3000/api/ |

O Docker Compose sobe automaticamente:
- **MariaDB 11** com volume persistente (os dados não se perdem ao reiniciar)
- **A aplicação** conectada ao banco, com tabelas criadas automaticamente

```bash
# Ver logs em tempo real
docker compose logs -f app

# Parar tudo
docker compose down

# Apagar tudo (inclusive os dados do banco)
docker compose down -v
```

---

### 💻 Rodar localmente (sem Docker)

```bash
npm install
npm start        # produção (SQLite, sem configuração)
npm run dev      # desenvolvimento (hot-reload)
```

### Usuário administrador padrão

| Campo | Valor |
|---|---|
| CPF | `101.010.101-01` |
| Senha | `administrador123` |

> Este usuário é criado automaticamente na primeira inicialização. Troque a senha após o primeiro acesso.

---

### 🗄️ Banco de dados

O sistema suporta dois bancos de dados:

#### SQLite (padrão — sem configuração)

Ideal para testes, uso local e bibliotecas pequenas. O arquivo é criado automaticamente:

```bash
npm install
npm start  # cria biblioteca.db automaticamente
```

#### MariaDB/MySQL (recomendado para produção)

Para usar MariaDB ou MySQL, basta definir a variável `DATABASE_URL` no `.env`:

```env
DATABASE_URL=mysql://biblioteca:senha@localhost:3306/biblioteca
```

Passos para configurar:

```bash
# 1. Criar o banco de dados no MariaDB/MySQL
mysql -u root -p -e "CREATE DATABASE biblioteca; CREATE USER 'biblioteca'@'localhost' IDENTIFIED BY 'senha'; GRANT ALL ON biblioteca.* TO 'biblioteca'@'localhost';"

# 2. Definir DATABASE_URL no .env
echo "DATABASE_URL=mysql://biblioteca:senha@localhost:3306/biblioteca" >> .env

# 3. Iniciar — as tabelas são criadas automaticamente
npm start
```

> O sistema detecta automaticamente qual banco usar. Se `DATABASE_URL` estiver definida, usa MariaDB/MySQL; caso contrário, usa SQLite. Nenhuma outra alteração é necessária.

---

### Popular o banco de dados

```bash
# Seed básico (executado automaticamente na primeira inicialização)
npm run seed

# Seed rico — apaga tudo e popula com dados de demonstração completos:
# 30 livros · 68 exemplares · 17 autores · 8 editoras · 12 categorias
# 21 membros (incluindo admin padrão) · 16 empréstimos · 6 reservas · 7 multas
npm run seed:rich
```

---

## ⚙️ Variáveis de ambiente (`.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor |
| `DATABASE_URL` | *(não definida)* | Connection string MariaDB/MySQL — se definida, usa MySQL; senão, usa SQLite |
| `DB_PATH` | `./biblioteca.db` | Caminho do arquivo SQLite (ignorado se `DATABASE_URL` definida) |
| `JWT_SECRET` | *(gerado)* | Chave para assinatura dos tokens JWT |
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
├── public/                      # Front-end estático
│   ├── index.html               # Portal público (SPA)
│   ├── admin.html               # Painel administrativo (SPA)
│   ├── css/
│   │   └── style.css            # Estilos compartilhados
│   └── js/
│       ├── api.js               # Cliente HTTP para todos os endpoints
│       ├── ui.js                # Componentes reutilizáveis (toast, modal, tabela…)
│       ├── main.js              # Roteador do painel admin (hash-based)
│       ├── portal-ui.js         # Utilitários do portal público
│       └── pages/
│           ├── dashboard.js     # Visão geral do sistema
│           ├── livros.js        # Acervo + exemplares
│           ├── membros.js       # Gestão de membros + gerenciamento de perfil
│           ├── emprestimos.js   # Empréstimos, devoluções e renovações
│           ├── reservas.js      # Fila de reservas
│           ├── multas.js        # Controle de multas
│           ├── relatorios.js    # Relatórios e estatísticas
│           ├── catalogo.js      # CRUD de autores, editoras e categorias
│           ├── portal-home.js   # Home do portal público (busca + resultado)
│           ├── portal-login.js  # Login/cadastro do portal + redirect admin
│           └── portal-minha-area.js  # Área do membro (reservas, histórico)
└── src/
    ├── server.js                # Ponto de entrada
    ├── app.js                   # Configuração Express + servir SPAs
    ├── database/
    │   ├── index.js             # Conexão SQLite (WAL + FK)
    │   ├── migrations.js        # Schema + migrações incrementais + admin padrão
    │   ├── seed.js              # Seed básico (12 livros, 8 membros)
    │   └── seedRich.js          # Seed de demonstração (30 livros, 21 membros…)
    ├── controllers/             # Lógica de negócio
    ├── routes/                  # Definição de rotas + validação
    ├── middleware/              # errorHandler, validate, auth JWT
    └── utils/
        └── cpf.js               # Validação de CPF (algoritmo dígitos verificadores)
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

**Tabela `membros`** — campos relevantes:

| Campo | Tipo | Descrição |
|---|---|---|
| `cpf` | TEXT (único) | CPF formatado `xxx.xxx.xxx-xx` |
| `tipo` | TEXT | `Estudante`, `Professor` ou `Comum` |
| `perfil` | TEXT | `admin`, `bibliotecario` ou NULL (sem acesso admin) |
| `senha_hash` | TEXT | Senha bcrypt (para login no portal e painel admin) |
| `ativo` | INT | `1` = ativo, `0` = inativo |

---

## 📡 Endpoints

### Health
| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status da API |

---

### 🔐 Autenticação do Portal — `/api/auth`
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastrar novo membro no portal |
| POST | `/api/auth/login` | Login com CPF + senha; retorna JWT + perfil |

**POST `/api/auth/register` body:**
```json
{
  "nome": "João Silva",
  "cpf": "111.444.777-35",
  "email": "joao@email.com",
  "senha": "minhasenha123",
  "tipo": "Estudante"
}
```

**POST `/api/auth/login` body:**
```json
{ "cpf": "111.444.777-35", "senha": "minhasenha123" }
```

---

### 🛡️ Autenticação do Admin — `/api/admin`
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/admin/login` | Login com CPF + senha; exige perfil `admin` ou `bibliotecario` |

> Todos os endpoints do painel admin exigem header `Authorization: Bearer <token>`

---

### 🌐 Portal Público — `/api/portal`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/portal/livros` | Buscar livros no acervo (query: `busca`, `categoria`, `disponivel`) |
| GET | `/api/portal/livros/:id` | Detalhes + exemplares disponíveis |
| GET | `/api/portal/livros/:id/capa` | Imagem da capa (JPEG/PNG servida do banco) |
| GET | `/api/portal/categorias` | Listar categorias para filtro |
| POST | `/api/portal/reservas` | Criar reserva (requer JWT de membro) |
| GET | `/api/portal/minha-area` | Reservas do membro autenticado |
| DELETE | `/api/portal/reservas/:id` | Cancelar reserva (requer JWT de membro) |

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
| PATCH | `/api/membros/:id/perfil` | Alterar perfil de acesso admin |
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

**PATCH `/api/membros/:id/perfil` body:**
```json
{ "perfil": "bibliotecario" }
```
> Valores válidos: `"admin"`, `"bibliotecario"`, `"nenhum"` (remove acesso admin)

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

### Administrador / Bibliotecário
```
1. Acessar /admin → login com CPF + senha
2. Cadastrar autores, editoras, categorias
3. Cadastrar livros (com capa) e seus exemplares físicos (tombos)
4. Cadastrar membros ou aguardar auto-cadastro pelo portal
5. Promover membros a Bibliotecário/Admin:  PATCH /api/membros/:id/perfil
6. Realizar empréstimo:    POST /api/emprestimos
7. Devolver livro:         PATCH /api/emprestimos/:id/devolver
   → Multa gerada automaticamente se atrasado (R$ 0,50/dia)
8. Pagar multa:            PATCH /api/multas/:id/pagar
9. Consultar dashboard:    GET  /api/relatorios/dashboard
```

### Membro via Portal Público
```
1. Acessar / → pesquisar livros (sem login)
2. Cadastrar-se com CPF, nome, e-mail e senha
3. Fazer login → verificar disponibilidade
4. Reservar exemplar:  POST /api/portal/reservas
5. Acompanhar reservas em "Minha Área"
6. Cancelar reserva se necessário
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
- **Knex.js** — query builder compatível com SQLite e MariaDB/MySQL
- **better-sqlite3** — banco de dados SQLite síncrono (padrão, sem configuração)
- **mysql2** — driver MariaDB/MySQL (ativado automaticamente via `DATABASE_URL`)
- **bcryptjs** — hash de senhas
- **jsonwebtoken** — autenticação JWT (portal e painel admin)
- **express-validator** — validação e sanitização de entrada
- **helmet** — cabeçalhos de segurança HTTP
- **cors** — Cross-Origin Resource Sharing
- **morgan** — logging de requisições
- **dotenv / dotenvx** — variáveis de ambiente
- **Vanilla JS** — front-end sem framework ou bundler (2 SPAs com hash routing)

---

## 🌐 Projeto Open Source

O **BibliotecaBrasil** é um software **gratuito e de código aberto**, criado para democratizar o acesso a ferramentas de gestão de acervo para pequenas bibliotecas brasileiras.

### Licença

Distribuído sob a licença **MIT** — você pode usar, copiar, modificar e distribuir este software livremente, inclusive para fins comerciais, sem qualquer custo ou obrigação.

### Por que open source?

Acreditamos que toda biblioteca — seja ela escolar, comunitária, paroquial ou municipal — merece ter acesso a um sistema de gestão profissional, independentemente do tamanho ou orçamento. Ao disponibilizar este projeto como software livre, queremos contribuir para que mais comunidades tenham acesso ao conhecimento de forma organizada.

### Precisa de ajuda?

O sistema é de livre instalação, mas sabemos que nem toda biblioteca tem um técnico disponível. Se precisar de apoio para:

- Instalar e configurar o sistema
- Hospedar em servidor ou nuvem
- Adaptar funcionalidades para a sua realidade
- Treinar a equipe para uso do painel

Entre em contato através do repositório no GitHub — podemos ajudar.

### Apoie o projeto

Se este projeto foi útil para sua biblioteca e você quiser contribuir financeiramente para manter o desenvolvimento, aceitamos doações via Pix:

**Chave Pix:** `pixdojp@gmail.com`

Qualquer valor é bem-vindo e ajuda a manter o projeto ativo! 🙏

[![GitHub](https://img.shields.io/badge/GitHub-bibliotecaBrasil-181717?logo=github)](https://github.com/emailparaojp/bibliotecaBrasil)

### Contribuindo

Contribuições são muito bem-vindas! Para colaborar:

```bash
# 1. Fork o repositório
# 2. Crie uma branch para sua feature
git checkout -b minha-feature

# 3. Faça suas alterações e commit
git commit -m "feat: minha melhoria"

# 4. Abra um Pull Request
```

Sugestões de melhorias, reportes de bugs e pedidos de funcionalidades podem ser feitos via [Issues no GitHub](https://github.com/emailparaojp/bibliotecaBrasil/issues).

## Este é um projeto de código aberto para ajudar pequenas bibliotecas a controlarem seu acervo. Isso é gratuito e auxiliamos na implementação
