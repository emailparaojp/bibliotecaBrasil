'use strict';

const { getDb } = require('./index');

async function runSeed() {
  const knex = getDb();

  const { c } = await knex('autores').count('id as c').first();
  if (Number(c) > 0) {
    console.log('ℹ️  Banco já possui dados. Seed ignorado.');
    return;
  }

  await knex.transaction(async (trx) => {
    // Helper: extract IDs from bulk insert result (MySQL returns only firstInsertId)
    function extractIds(result, count) {
      if (Array.isArray(result) && result.length === 1 && typeof result[0] === 'number' && count > 1) {
        return Array.from({ length: count }, (_, i) => result[0] + i);
      }
      return result.map(r => (typeof r === 'object' ? r.id : r));
    }

    // Autores
    const autoresData = [
      { nome: 'Machado de Assis',       nacionalidade: 'Brasileira', bio: 'Joaquim Maria Machado de Assis, maior escritor do Realismo brasileiro.' },
      { nome: 'Clarice Lispector',      nacionalidade: 'Brasileira', bio: 'Uma das mais importantes escritoras da literatura brasileira do século XX.' },
      { nome: 'Jorge Amado',            nacionalidade: 'Brasileira', bio: 'Um dos escritores brasileiros mais lidos em todo o mundo.' },
      { nome: 'Graciliano Ramos',       nacionalidade: 'Brasileira', bio: 'Representante máximo do romance regionalista do Nordeste.' },
      { nome: 'José Saramago',          nacionalidade: 'Portuguesa', bio: 'Nobel de Literatura em 1998.' },
      { nome: 'Gabriel García Márquez', nacionalidade: 'Colombiana', bio: 'Nobel de Literatura em 1982, pai do realismo mágico.' },
      { nome: 'J.K. Rowling',           nacionalidade: 'Britânica',  bio: 'Autora da série Harry Potter.' },
      { nome: 'George Orwell',          nacionalidade: 'Britânica',  bio: 'Autor de 1984 e A Revolução dos Bichos.' },
    ];
    const autoresResult = await trx('autores').insert(autoresData).returning('id');
    const aIds = extractIds(autoresResult, autoresData.length);

    // Editoras
    const editorasData = [
      { nome: 'Companhia das Letras', cidade: 'São Paulo',       pais: 'Brasil', site: 'https://www.companhiadasletras.com.br' },
      { nome: 'Record',               cidade: 'Rio de Janeiro',  pais: 'Brasil', site: 'https://www.record.com.br' },
      { nome: 'Rocco',                cidade: 'Rio de Janeiro',  pais: 'Brasil', site: 'https://www.rocco.com.br' },
      { nome: 'Editora Globo',        cidade: 'São Paulo',       pais: 'Brasil', site: 'https://www.globolivros.com.br' },
      { nome: 'Suma',                 cidade: 'São Paulo',       pais: 'Brasil', site: null },
    ];
    const editorasResult = await trx('editoras').insert(editorasData).returning('id');
    const eIds = extractIds(editorasResult, editorasData.length);

    // Categorias
    const categoriasData = [
      { nome: 'Romance',           descricao: 'Obras ficcionais em prosa que exploram relações humanas e emoções.' },
      { nome: 'Literatura Brasileira', descricao: 'Obras de autores nacionais com temática diversa.' },
      { nome: 'Ficção Científica', descricao: 'Narrativas baseadas em cenários futuristas ou científicos.' },
      { nome: 'Fantasia',          descricao: 'Obras que incluem elementos mágicos ou sobrenaturais.' },
      { nome: 'Distopia',          descricao: 'Ficção que retrata sociedades futuras opressivas ou degeneradas.' },
      { nome: 'Realismo Mágico',   descricao: 'Corrente literária que mescla realidade e fantasia.' },
      { nome: 'Poesia',            descricao: 'Obras em verso que exploram linguagem, ritmo e imagens.' },
      { nome: 'Biografia',         descricao: 'Relatos da vida de pessoas reais.' },
      { nome: 'Ciências Humanas',  descricao: 'Obras de filosofia, sociologia, história e afins.' },
      { nome: 'Infanto-Juvenil',   descricao: 'Obras destinadas a crianças e jovens.' },
    ];
    const categoriasResult = await trx('categorias').insert(categoriasData).returning('id');
    const cIds = extractIds(categoriasResult, categoriasData.length);

    const capaUrl = isbn => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    const daysAgoStr = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };

    // Livros
    const livrosData = [
      { isbn: '9788535902778', titulo: 'Dom Casmurro',                         id_autor: aIds[0], id_editora: eIds[0], id_categoria: cIds[0], ano_publicacao: 1899, edicao: '1ª', num_paginas: 256, localizacao: 'A-01', descricao: 'Clássico do Realismo brasileiro narrado por Bentinho.',                       capa_url: capaUrl('9788535902778') },
      { isbn: '9788535914849', titulo: 'Memórias Póstumas de Brás Cubas',      id_autor: aIds[0], id_editora: eIds[0], id_categoria: cIds[0], ano_publicacao: 1881, edicao: '1ª', num_paginas: 288, localizacao: 'A-01', descricao: 'Primeiro romance póstumo-realista da literatura brasileira.',                capa_url: capaUrl('9788535914849') },
      { isbn: '9788532511010', titulo: 'A Hora da Estrela',                    id_autor: aIds[1], id_editora: eIds[2], id_categoria: cIds[1], ano_publicacao: 1977, edicao: '1ª', num_paginas: 88,  localizacao: 'B-02', descricao: 'A última obra publicada em vida por Clarice Lispector.',                    capa_url: capaUrl('9788532511010') },
      { isbn: '9788532523440', titulo: 'A Paixão Segundo G.H.',                id_autor: aIds[1], id_editora: eIds[2], id_categoria: cIds[1], ano_publicacao: 1964, edicao: '1ª', num_paginas: 152, localizacao: 'B-02', descricao: 'Mergulho na consciência de uma mulher após um ato perturbador.',            capa_url: capaUrl('9788532523440') },
      { isbn: '9788501088628', titulo: 'Gabriela, Cravo e Canela',             id_autor: aIds[2], id_editora: eIds[1], id_categoria: cIds[0], ano_publicacao: 1958, edicao: '1ª', num_paginas: 390, localizacao: 'C-03', descricao: 'Marco da literatura nordestina de Jorge Amado.',                           capa_url: capaUrl('9788501088628') },
      { isbn: '9788501083388', titulo: 'Capitães da Areia',                    id_autor: aIds[2], id_editora: eIds[1], id_categoria: cIds[1], ano_publicacao: 1937, edicao: '1ª', num_paginas: 320, localizacao: 'C-03', descricao: 'Meninos de rua em Salvador nos anos 1930.',                                 capa_url: capaUrl('9788501083388') },
      { isbn: '9788578273132', titulo: 'Vidas Secas',                          id_autor: aIds[3], id_editora: eIds[0], id_categoria: cIds[1], ano_publicacao: 1938, edicao: '1ª', num_paginas: 176, localizacao: 'D-04', descricao: 'O sofrimento de uma família de retirantes no sertão nordestino.',           capa_url: capaUrl('9788578273132') },
      { isbn: '9789722039598', titulo: 'Ensaio sobre a Cegueira',              id_autor: aIds[4], id_editora: eIds[0], id_categoria: cIds[0], ano_publicacao: 1995, edicao: '1ª', num_paginas: 310, localizacao: 'E-05', descricao: 'Uma epidemia de cegueira branca assola uma cidade.',                        capa_url: capaUrl('9789722039598') },
      { isbn: '9788501039385', titulo: 'Cem Anos de Solidão',                  id_autor: aIds[5], id_editora: eIds[1], id_categoria: cIds[5], ano_publicacao: 1967, edicao: '1ª', num_paginas: 448, localizacao: 'F-06', descricao: 'A saga da família Buendía ao longo de sete gerações.',                      capa_url: capaUrl('9788501039385') },
      { isbn: '9788532521934', titulo: 'Harry Potter e a Pedra Filosofal',     id_autor: aIds[6], id_editora: eIds[2], id_categoria: cIds[3], ano_publicacao: 1997, edicao: '1ª', num_paginas: 232, localizacao: 'G-07', descricao: 'O início da jornada de Harry Potter no mundo mágico.',                     capa_url: capaUrl('9788532521934') },
      { isbn: '9788535914177', titulo: '1984',                                 id_autor: aIds[7], id_editora: eIds[0], id_categoria: cIds[4], ano_publicacao: 1949, edicao: '1ª', num_paginas: 416, localizacao: 'H-08', descricao: 'Distopia clássica sobre totalitarismo e vigilância.',                       capa_url: capaUrl('9788535914177') },
      { isbn: '9788535906424', titulo: 'A Revolução dos Bichos',               id_autor: aIds[7], id_editora: eIds[0], id_categoria: cIds[4], ano_publicacao: 1945, edicao: '1ª', num_paginas: 152, localizacao: 'H-08', descricao: 'Alegoria política sobre totalitarismo usando animais.',                     capa_url: capaUrl('9788535906424') },
    ];
    const livrosResult = await trx('livros').insert(livrosData).returning('id');
    const lIds = extractIds(livrosResult, livrosData.length);

    // Exemplares
    const exemplaresData = [
      [lIds[0],  'T-0001', 'Bom',     daysAgoStr(500)],
      [lIds[0],  'T-0002', 'Regular', daysAgoStr(400)],
      [lIds[1],  'T-0003', 'Bom',     daysAgoStr(480)],
      [lIds[1],  'T-0004', 'Bom',     daysAgoStr(300)],
      [lIds[2],  'T-0005', 'Novo',    daysAgoStr(100)],
      [lIds[2],  'T-0006', 'Bom',     daysAgoStr(200)],
      [lIds[3],  'T-0007', 'Bom',     daysAgoStr(350)],
      [lIds[3],  'T-0008', 'Regular', daysAgoStr(600)],
      [lIds[4],  'T-0009', 'Bom',     daysAgoStr(450)],
      [lIds[4],  'T-0010', 'Bom',     daysAgoStr(500)],
      [lIds[4],  'T-0011', 'Ruim',    daysAgoStr(700)],
      [lIds[5],  'T-0012', 'Bom',     daysAgoStr(420)],
      [lIds[5],  'T-0013', 'Regular', daysAgoStr(380)],
      [lIds[6],  'T-0014', 'Bom',     daysAgoStr(550)],
      [lIds[6],  'T-0015', 'Bom',     daysAgoStr(490)],
      [lIds[7],  'T-0016', 'Novo',    daysAgoStr(80)],
      [lIds[7],  'T-0017', 'Bom',     daysAgoStr(200)],
      [lIds[8],  'T-0018', 'Bom',     daysAgoStr(600)],
      [lIds[8],  'T-0019', 'Bom',     daysAgoStr(400)],
      [lIds[8],  'T-0020', 'Regular', daysAgoStr(700)],
      [lIds[9],  'T-0021', 'Bom',     daysAgoStr(300)],
      [lIds[9],  'T-0022', 'Novo',    daysAgoStr(60)],
      [lIds[9],  'T-0023', 'Bom',     daysAgoStr(250)],
      [lIds[10], 'T-0024', 'Bom',     daysAgoStr(520)],
      [lIds[10], 'T-0025', 'Regular', daysAgoStr(430)],
      [lIds[11], 'T-0026', 'Bom',     daysAgoStr(480)],
      [lIds[11], 'T-0027', 'Novo',    daysAgoStr(90)],
    ];
    for (const [id_livro, num_tombo, condicao, data_aquisicao] of exemplaresData) {
      await trx('exemplares').insert({ id_livro, num_tombo, condicao, disponivel: 1, data_aquisicao });
    }

    // Membros
    const validadeStr = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };
    const membrosData = [
      { nome: 'Ana Silva',       cpf: '111.111.111-01', email: 'ana.silva@email.com',   telefone: '(11) 9 1111-0001', endereco: 'Rua das Flores, 10 - SP',   tipo: 'Estudante', data_validade: validadeStr(365) },
      { nome: 'Bruno Souza',     cpf: '222.222.222-02', email: 'bruno.souza@email.com', telefone: '(11) 9 2222-0002', endereco: 'Av. Paulista, 200 - SP',    tipo: 'Professor', data_validade: validadeStr(365) },
      { nome: 'Carla Mendes',    cpf: '333.333.333-03', email: 'carla.mendes@email.com',telefone: '(11) 9 3333-0003', endereco: 'Rua Augusta, 30 - SP',       tipo: 'Comum',     data_validade: validadeStr(365) },
      { nome: 'Daniel Ferreira', cpf: '444.444.444-04', email: 'daniel.f@email.com',    telefone: '(21) 9 4444-0004', endereco: 'Rua Ipanema, 50 - RJ',      tipo: 'Estudante', data_validade: validadeStr(365) },
      { nome: 'Elisa Costa',     cpf: '555.555.555-05', email: 'elisa.costa@email.com', telefone: '(21) 9 5555-0005', endereco: 'Av. Brasil, 100 - RJ',      tipo: 'Professor', data_validade: validadeStr(365) },
      { nome: 'Felipe Lima',     cpf: '666.666.666-06', email: 'felipe.lima@email.com', telefone: '(31) 9 6666-0006', endereco: 'Rua Liberdade, 15 - MG',    tipo: 'Comum',     data_validade: validadeStr(365) },
      { nome: 'Gabriela Rocha',  cpf: '777.777.777-07', email: 'gabi.rocha@email.com',  telefone: '(31) 9 7777-0007', endereco: 'Av. Contorno, 80 - MG',     tipo: 'Estudante', data_validade: validadeStr(365) },
      { nome: 'Henrique Alves',  cpf: '888.888.888-08', email: 'henrique.a@email.com',  telefone: '(85) 9 8888-0008', endereco: 'Rua do Sol, 5 - CE',        tipo: 'Comum',     data_validade: validadeStr(365) },
    ];
    for (const m of membrosData) {
      await trx('membros').insert(m);
    }
  });

  console.log('🌱 Seed executado com sucesso.');
}

module.exports = { runSeed };
