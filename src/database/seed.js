'use strict';

const { getDb } = require('./index');

function runSeed() {
  const db = getDb();

  const jaSeeded = db.prepare("SELECT COUNT(*) as c FROM autores").get();
  if (jaSeeded.c > 0) {
    console.log('ℹ️  Banco já possui dados. Seed ignorado.');
    return;
  }

  const seedData = db.transaction(() => {
    // Autores
    const insAutor = db.prepare('INSERT INTO autores (nome, nacionalidade, bio) VALUES (?, ?, ?)');
    insAutor.run('Machado de Assis', 'Brasileira', 'Joaquim Maria Machado de Assis, maior escritor do Realismo brasileiro.');
    insAutor.run('Clarice Lispector', 'Brasileira', 'Uma das mais importantes escritoras da literatura brasileira do século XX.');
    insAutor.run('Jorge Amado', 'Brasileira', 'Um dos escritores brasileiros mais lidos em todo o mundo.');
    insAutor.run('Graciliano Ramos', 'Brasileira', 'Representante máximo do romance regionalista do Nordeste.');
    insAutor.run('José Saramago', 'Portuguesa', 'Nobel de Literatura em 1998.');
    insAutor.run('Gabriel García Márquez', 'Colombiana', 'Nobel de Literatura em 1982, pai do realismo mágico.');
    insAutor.run('J.K. Rowling', 'Britânica', 'Autora da série Harry Potter.');
    insAutor.run('George Orwell', 'Britânica', 'Autor de 1984 e A Revolução dos Bichos.');

    // Editoras
    const insEditora = db.prepare('INSERT INTO editoras (nome, cidade, pais, site) VALUES (?, ?, ?, ?)');
    insEditora.run('Companhia das Letras', 'São Paulo', 'Brasil', 'https://www.companhiadasletras.com.br');
    insEditora.run('Record', 'Rio de Janeiro', 'Brasil', 'https://www.record.com.br');
    insEditora.run('Rocco', 'Rio de Janeiro', 'Brasil', 'https://www.rocco.com.br');
    insEditora.run('Editora Globo', 'São Paulo', 'Brasil', 'https://www.globolivros.com.br');
    insEditora.run('Suma', 'São Paulo', 'Brasil', null);

    // Categorias
    const insCat = db.prepare('INSERT INTO categorias (nome, descricao) VALUES (?, ?)');
    insCat.run('Romance', 'Obras ficcionais em prosa que exploram relações humanas e emoções.');
    insCat.run('Literatura Brasileira', 'Obras de autores nacionais com temática diversa.');
    insCat.run('Ficção Científica', 'Narrativas baseadas em cenários futuristas ou científicos.');
    insCat.run('Fantasia', 'Obras que incluem elementos mágicos ou sobrenaturais.');
    insCat.run('Distopia', 'Ficção que retrata sociedades futuras opressivas ou degeneradas.');
    insCat.run('Realismo Mágico', 'Corrente literária que mescla realidade e fantasia.');
    insCat.run('Poesia', 'Obras em verso que exploram linguagem, ritmo e imagens.');
    insCat.run('Biografia', 'Relatos da vida de pessoas reais.');
    insCat.run('Ciências Humanas', 'Obras de filosofia, sociologia, história e afins.');
    insCat.run('Infanto-Juvenil', 'Obras destinadas a crianças e jovens.');

    // Livros
    const insLivro = db.prepare(`
      INSERT INTO livros (isbn, titulo, subtitulo, id_autor, id_editora, id_categoria, ano_publicacao, edicao, num_paginas, localizacao, descricao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    insLivro.run('9788535902778', 'Dom Casmurro', null, 1, 1, 1, 1899, '1ª', 256, 'A-01', 'Clássico do Realismo brasileiro narrado por Bentinho.');
    insLivro.run('9788535914849', 'Memórias Póstumas de Brás Cubas', null, 1, 1, 1, 1881, '1ª', 288, 'A-01', 'Primeiro romance póstumo-realista da literatura brasileira.');
    insLivro.run('9788532511010', 'A Hora da Estrela', null, 2, 3, 2, 1977, '1ª', 88, 'B-02', 'A última obra publicada em vida por Clarice Lispector.');
    insLivro.run('9788532523440', 'A Paixão Segundo G.H.', null, 2, 3, 2, 1964, '1ª', 152, 'B-02', 'Mergulho na consciência de uma mulher após um ato perturbador.');
    insLivro.run('9788501088628', 'Gabriela, Cravo e Canela', null, 3, 2, 1, 1958, '1ª', 390, 'C-03', 'Marco da literatura nordestina de Jorge Amado.');
    insLivro.run('9788501083388', 'Capitães da Areia', null, 3, 2, 2, 1937, '1ª', 320, 'C-03', 'Meninos de rua em Salvador nos anos 1930.');
    insLivro.run('9788578273132', 'Vidas Secas', null, 4, 1, 2, 1938, '1ª', 176, 'D-04', 'O sofrimento de uma família de retirantes no sertão nordestino.');
    insLivro.run('9789722039598', 'Ensaio sobre a Cegueira', null, 5, 1, 1, 1995, '1ª', 310, 'E-05', 'Uma epidemia de cegueira branca assola uma cidade.');
    insLivro.run('9788501039385', 'Cem Anos de Solidão', null, 6, 2, 6, 1967, '1ª', 448, 'F-06', 'A saga da família Buendía ao longo de sete gerações.');
    insLivro.run('9788532521934', 'Harry Potter e a Pedra Filosofal', null, 7, 3, 4, 1997, '1ª', 232, 'G-07', 'O início da jornada de Harry Potter no mundo mágico.');
    insLivro.run('9788535914177', '1984', null, 8, 1, 5, 1949, '1ª', 416, 'H-08', 'Distopia clássica sobre totalitarismo e vigilância.');
    insLivro.run('9788535906424', 'A Revolução dos Bichos', null, 8, 1, 5, 1945, '1ª', 152, 'H-08', 'Alegoria política sobre totalitarismo usando animais.');

    // Exemplares (2 a 4 por livro)
    const insExemplar = db.prepare(`
      INSERT INTO exemplares (id_livro, num_tombo, condicao, disponivel, data_aquisicao)
      VALUES (?, ?, ?, 1, date('now', '-' || ? || ' days'))`);

    const exemplares = [
      [1, 'T-0001', 'Bom', 500], [1, 'T-0002', 'Regular', 400],
      [2, 'T-0003', 'Bom', 480], [2, 'T-0004', 'Bom', 300],
      [3, 'T-0005', 'Novo', 100], [3, 'T-0006', 'Bom', 200],
      [4, 'T-0007', 'Bom', 350], [4, 'T-0008', 'Regular', 600],
      [5, 'T-0009', 'Bom', 450], [5, 'T-0010', 'Bom', 500], [5, 'T-0011', 'Ruim', 700],
      [6, 'T-0012', 'Bom', 420], [6, 'T-0013', 'Regular', 380],
      [7, 'T-0014', 'Bom', 550], [7, 'T-0015', 'Bom', 490],
      [8, 'T-0016', 'Novo', 80],  [8, 'T-0017', 'Bom', 200],
      [9, 'T-0018', 'Bom', 600], [9, 'T-0019', 'Bom', 400], [9, 'T-0020', 'Regular', 700],
      [10, 'T-0021', 'Bom', 300], [10, 'T-0022', 'Novo', 60], [10, 'T-0023', 'Bom', 250],
      [11, 'T-0024', 'Bom', 520], [11, 'T-0025', 'Regular', 430],
      [12, 'T-0026', 'Bom', 480], [12, 'T-0027', 'Novo', 90],
    ];
    for (const [idLivro, tombo, condicao, diasAtras] of exemplares) {
      insExemplar.run(idLivro, tombo, condicao, diasAtras);
    }

    // Membros
    const insMembro = db.prepare(`
      INSERT INTO membros (nome, cpf, email, telefone, endereco, tipo, data_validade)
      VALUES (?, ?, ?, ?, ?, ?, date('now', '+365 days'))`);

    insMembro.run('Ana Silva', '111.111.111-01', 'ana.silva@email.com', '(11) 9 1111-0001', 'Rua das Flores, 10 - SP', 'Estudante');
    insMembro.run('Bruno Souza', '222.222.222-02', 'bruno.souza@email.com', '(11) 9 2222-0002', 'Av. Paulista, 200 - SP', 'Professor');
    insMembro.run('Carla Mendes', '333.333.333-03', 'carla.mendes@email.com', '(11) 9 3333-0003', 'Rua Augusta, 30 - SP', 'Comum');
    insMembro.run('Daniel Ferreira', '444.444.444-04', 'daniel.f@email.com', '(21) 9 4444-0004', 'Rua Ipanema, 50 - RJ', 'Estudante');
    insMembro.run('Elisa Costa', '555.555.555-05', 'elisa.costa@email.com', '(21) 9 5555-0005', 'Av. Brasil, 100 - RJ', 'Professor');
    insMembro.run('Felipe Lima', '666.666.666-06', 'felipe.lima@email.com', '(31) 9 6666-0006', 'Rua Liberdade, 15 - MG', 'Comum');
    insMembro.run('Gabriela Rocha', '777.777.777-07', 'gabi.rocha@email.com', '(31) 9 7777-0007', 'Av. Contorno, 80 - MG', 'Estudante');
    insMembro.run('Henrique Alves', '888.888.888-08', 'henrique.a@email.com', '(85) 9 8888-0008', 'Rua do Sol, 5 - CE', 'Comum');
  });

  seedData();
  console.log('🌱 Seed executado com sucesso.');
}

module.exports = { runSeed };
