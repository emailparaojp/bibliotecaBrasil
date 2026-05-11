'use strict';

/**
 * Seed rico — popula o banco com dados de demonstração completos.
 * Apaga todos os dados existentes antes de inserir.
 *
 * Uso:  npm run seed:rich
 */

require('dotenv').config();
const bcrypt            = require('bcryptjs');
const { runMigrations } = require('./migrations');
const { getDb, closeDb } = require('./index');

function daysAgo(n)     { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; }
function hoursAgo(n)    { const d = new Date(); d.setTime(d.getTime() - n * 3600000); return d.toISOString().replace('T', ' ').split('.')[0]; }
function today()        { return new Date().toISOString().split('T')[0]; }

async function runSeedRich() {
  await runMigrations();
  const knex = getDb();

  console.log('🗑️  Limpando dados existentes...');

  if (process.env.DATABASE_URL) {
    await knex.raw('TRUNCATE multas, reservas, emprestimos, exemplares, livros, membros, categorias, editoras, autores RESTART IDENTITY CASCADE');
  } else {
    for (const t of ['multas','reservas','emprestimos','exemplares','livros','membros','categorias','editoras','autores']) {
      await knex(t).delete();
    }
    try { await knex.raw('DELETE FROM sqlite_sequence'); } catch (_) { /* ok */ }
  }

  const adminHash = bcrypt.hashSync('administrador123', 10);

  await knex.transaction(async (trx) => {

    /* ─────────────────────────── AUTORES ─────────────────────────── */
    await trx('autores').insert([
      { nome: 'Machado de Assis',          nacionalidade: 'Brasileira', bio: 'Joaquim Maria Machado de Assis, maior escritor do Realismo brasileiro. Fundador e primeiro presidente da ABL.' },
      { nome: 'Clarice Lispector',          nacionalidade: 'Brasileira', bio: 'Uma das mais importantes escritoras brasileiras do século XX, conhecida pelo estilo introspectivo e experimental.' },
      { nome: 'Jorge Amado',                nacionalidade: 'Brasileira', bio: 'Um dos escritores brasileiros mais lidos em todo o mundo, célebre por retratar a Bahia e seu povo.' },
      { nome: 'Graciliano Ramos',           nacionalidade: 'Brasileira', bio: 'Representante máximo do romance regionalista do Nordeste, com escrita seca e precisa.' },
      { nome: 'José Saramago',              nacionalidade: 'Portuguesa', bio: 'Nobel de Literatura em 1998. Conhecido pelo estilo singular sem pontuação convencional.' },
      { nome: 'Gabriel García Márquez',     nacionalidade: 'Colombiana', bio: 'Nobel de Literatura em 1982. Pai do realismo mágico com Cem Anos de Solidão.' },
      { nome: 'J.K. Rowling',               nacionalidade: 'Britânica',  bio: 'Autora da saga Harry Potter, uma das séries mais vendidas da história da literatura.' },
      { nome: 'George Orwell',              nacionalidade: 'Britânica',  bio: 'Autor de 1984 e A Revolução dos Bichos, obras fundamentais da literatura política do século XX.' },
      { nome: 'João Guimarães Rosa',        nacionalidade: 'Brasileira', bio: 'Autor de Grande Sertão: Veredas, considerada a mais importante obra da literatura brasileira moderna.' },
      { nome: 'Érico Veríssimo',            nacionalidade: 'Brasileira', bio: 'Escritor gaúcho, autor de O Tempo e o Vento, trilogia épica da história do Rio Grande do Sul.' },
      { nome: 'Paulo Coelho',               nacionalidade: 'Brasileira', bio: 'Um dos escritores mais traduzidos do mundo, autor de O Alquimista.' },
      { nome: 'Franz Kafka',                nacionalidade: 'Tcheca',     bio: 'Escritor austro-húngaro cujo nome originou o adjetivo kafkiano, para situações absurdas e opressivas.' },
      { nome: 'Fiódor Dostoiévski',         nacionalidade: 'Russa',      bio: 'Um dos maiores romancistas da humanidade. Autor de Crime e Castigo e Os Irmãos Karamazov.' },
      { nome: 'Antoine de Saint-Exupéry',  nacionalidade: 'Francesa',   bio: 'Aviador e escritor francês, autor do lendário O Pequeno Príncipe.' },
      { nome: 'Umberto Eco',                nacionalidade: 'Italiana',   bio: 'Semioticista e romancista italiano, autor de O Nome da Rosa.' },
      { nome: 'Agatha Christie',            nacionalidade: 'Britânica',  bio: 'A rainha do crime. A escritora mais vendida de todos os tempos, superada apenas pela Bíblia e Shakespeare.' },
      { nome: 'Carlos Drummond de Andrade', nacionalidade: 'Brasileira', bio: 'O maior poeta brasileiro do século XX. Sua obra abrange desde o cotidiano até grandes questões existenciais.' },
    ]);

    /* ─────────────────────────── EDITORAS ────────────────────────── */
    await trx('editoras').insert([
      { nome: 'Companhia das Letras', cidade: 'São Paulo',      pais: 'Brasil', site: 'https://www.companhiadasletras.com.br' },
      { nome: 'Record',               cidade: 'Rio de Janeiro', pais: 'Brasil', site: 'https://www.record.com.br' },
      { nome: 'Rocco',                cidade: 'Rio de Janeiro', pais: 'Brasil', site: 'https://www.rocco.com.br' },
      { nome: 'Editora Globo',        cidade: 'São Paulo',      pais: 'Brasil', site: 'https://www.globolivros.com.br' },
      { nome: 'Arqueiro',             cidade: 'São Paulo',      pais: 'Brasil', site: 'https://www.arqueirobr.com.br' },
      { nome: 'Saraiva',              cidade: 'São Paulo',      pais: 'Brasil', site: 'https://www.saraivaconteudo.com.br' },
      { nome: 'L&PM',                 cidade: 'Porto Alegre',   pais: 'Brasil', site: 'https://www.lpm.com.br' },
      { nome: 'Nova Fronteira',       cidade: 'Rio de Janeiro', pais: 'Brasil', site: 'https://www.novafronteira.com.br' },
    ]);

    /* ────────────────────────── CATEGORIAS ───────────────────────── */
    await trx('categorias').insert([
      { nome: 'Romance',              descricao: 'Obras ficcionais em prosa que exploram relações humanas, emoções e narrativas.' },
      { nome: 'Literatura Brasileira',descricao: 'Obras de autores nacionais com temáticas diversas da realidade brasileira.' },
      { nome: 'Ficção Científica',    descricao: 'Narrativas baseadas em cenários futuristas, tecnológicos ou científicos especulativos.' },
      { nome: 'Fantasia',             descricao: 'Obras que incluem elementos mágicos, sobrenaturais ou mundos imaginários.' },
      { nome: 'Distopia',             descricao: 'Ficção que retrata sociedades futuras opressivas, totalitárias ou degeneradas.' },
      { nome: 'Realismo Mágico',      descricao: 'Corrente literária que mescla elementos da realidade cotidiana com fantasia e magia.' },
      { nome: 'Poesia',               descricao: 'Obras em verso que exploram linguagem, ritmo, imagens e emoções.' },
      { nome: 'Biografia',            descricao: 'Relatos da vida real de pessoas, escritos por terceiros ou autobiograficamente.' },
      { nome: 'Ciências Humanas',     descricao: 'Obras de filosofia, sociologia, história, antropologia e áreas afins.' },
      { nome: 'Infanto-Juvenil',      descricao: 'Obras destinadas a crianças e jovens, incluindo contos, fábulas e aventuras.' },
      { nome: 'Mistério e Policial',  descricao: 'Narrativas de investigação criminal, detetives e suspense.' },
      { nome: 'Clássicos Universais', descricao: 'Grandes obras da literatura mundial reconhecidas como patrimônio cultural da humanidade.' },
    ]);

    /* ──────────────────────────── LIVROS ─────────────────────────── */
    const capaUrl = isbn => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    await trx('livros').insert([
      { isbn:'9788535902778', titulo:'Dom Casmurro',                     id_autor:1,  id_editora:1, id_categoria:1,  ano_publicacao:1899, edicao:'1ª', num_paginas:256, idioma:'Português', localizacao:'A-01', descricao:'Narrado por Bentinho, que suspeita de traição de Capitu. Clássico do Realismo brasileiro.',                                    capa_url:capaUrl('9788535902778') },
      { isbn:'9788535914849', titulo:'Memórias Póstumas de Brás Cubas',  id_autor:1,  id_editora:1, id_categoria:1,  ano_publicacao:1881, edicao:'1ª', num_paginas:288, idioma:'Português', localizacao:'A-01', descricao:'Primeiro romance póstumo-realista: narrado por um defunto autor.',                                                             capa_url:capaUrl('9788535914849') },
      { isbn:'9788535905618', titulo:'Quincas Borba',                    id_autor:1,  id_editora:1, id_categoria:1,  ano_publicacao:1891, edicao:'1ª', num_paginas:264, idioma:'Português', localizacao:'A-01', descricao:'Terceiro da trilogia realista: a loucura, a fortuna e o Humanitismo.',                                                         capa_url:capaUrl('9788535905618') },
      { isbn:'9788532511010', titulo:'A Hora da Estrela',                id_autor:2,  id_editora:3, id_categoria:2,  ano_publicacao:1977, edicao:'1ª', num_paginas:88,  idioma:'Português', localizacao:'B-01', descricao:'Última obra publicada em vida: a nordestina Macabéa e a escrita como urgência.',                                              capa_url:capaUrl('9788532511010') },
      { isbn:'9788532523440', titulo:'A Paixão Segundo G.H.',            id_autor:2,  id_editora:3, id_categoria:2,  ano_publicacao:1964, edicao:'1ª', num_paginas:152, idioma:'Português', localizacao:'B-01', descricao:'Mergulho na consciência de uma mulher após um ato perturbador envolvendo uma barata.',                                         capa_url:capaUrl('9788532523440') },
      { isbn:'9788532523457', titulo:'Perto do Coração Selvagem',        id_autor:2,  id_editora:3, id_categoria:2,  ano_publicacao:1943, edicao:'1ª', num_paginas:192, idioma:'Português', localizacao:'B-01', descricao:'Primeiro romance de Clarice, de exploração interior radical.',                                                                capa_url:capaUrl('9788532523457') },
      { isbn:'9788501088628', titulo:'Gabriela, Cravo e Canela',         id_autor:3,  id_editora:2, id_categoria:1,  ano_publicacao:1958, edicao:'1ª', num_paginas:390, idioma:'Português', localizacao:'C-01', descricao:'Marco da literatura nordestina: a chegada de Gabriela ao Ilhéus dos anos 1920.',                                              capa_url:capaUrl('9788501088628') },
      { isbn:'9788501083388', titulo:'Capitães da Areia',                id_autor:3,  id_editora:2, id_categoria:2,  ano_publicacao:1937, edicao:'1ª', num_paginas:320, idioma:'Português', localizacao:'C-01', descricao:'Meninos de rua em Salvador nos anos 1930, sob o olhar humanista de Amado.',                                                  capa_url:capaUrl('9788501083388') },
      { isbn:'9788501091697', titulo:'Tereza Batista Cansada de Guerra', id_autor:3,  id_editora:2, id_categoria:1,  ano_publicacao:1972, edicao:'1ª', num_paginas:360, idioma:'Português', localizacao:'C-01', descricao:'A história de uma mulher que luta contra o destino e a opressão no sertão baiano.',                                           capa_url:capaUrl('9788501091697') },
      { isbn:'9788578273132', titulo:'Vidas Secas',                      id_autor:4,  id_editora:1, id_categoria:2,  ano_publicacao:1938, edicao:'1ª', num_paginas:176, idioma:'Português', localizacao:'D-01', descricao:'O sofrimento de Fabiano e sua família de retirantes no árido sertão nordestino.',                                             capa_url:capaUrl('9788578273132') },
      { isbn:'9788578274016', titulo:'São Bernardo',                     id_autor:4,  id_editora:1, id_categoria:2,  ano_publicacao:1934, edicao:'1ª', num_paginas:196, idioma:'Português', localizacao:'D-01', descricao:'Paulo Honório constrói uma fazenda e uma vida à custa de tudo e todos.',                                                       capa_url:capaUrl('9788578274016') },
      { isbn:'9789722039598', titulo:'Ensaio sobre a Cegueira',          id_autor:5,  id_editora:1, id_categoria:1,  ano_publicacao:1995, edicao:'1ª', num_paginas:310, idioma:'Português', localizacao:'E-01', descricao:'Uma epidemia de cegueira branca assola uma cidade — metáfora da perda da humanidade.',                                       capa_url:capaUrl('9789722039598') },
      { isbn:'9789722041782', titulo:'O Evangelho Segundo Jesus Cristo', id_autor:5,  id_editora:1, id_categoria:1,  ano_publicacao:1991, edicao:'1ª', num_paginas:444, idioma:'Português', localizacao:'E-01', descricao:'Releitura ficcional da vida de Jesus Cristo, que gerou polêmica ao misturar o humano e o divino.',                             capa_url:capaUrl('9789722041782') },
      { isbn:'9788501039385', titulo:'Cem Anos de Solidão',              id_autor:6,  id_editora:2, id_categoria:6,  ano_publicacao:1967, edicao:'1ª', num_paginas:448, idioma:'Português', localizacao:'F-01', descricao:'A saga épica da família Buendía e da cidade de Macondo ao longo de sete gerações.',                                           capa_url:capaUrl('9788501039385') },
      { isbn:'9788501058225', titulo:'Amor nos Tempos do Cólera',        id_autor:6,  id_editora:2, id_categoria:1,  ano_publicacao:1985, edicao:'1ª', num_paginas:400, idioma:'Português', localizacao:'F-01', descricao:'A história de um amor não correspondido que dura mais de cinquenta anos.',                                                     capa_url:capaUrl('9788501058225') },
      { isbn:'9788532521934', titulo:'Harry Potter e a Pedra Filosofal', id_autor:7,  id_editora:3, id_categoria:4,  ano_publicacao:1997, edicao:'1ª', num_paginas:232, idioma:'Português', localizacao:'G-01', descricao:'O início da jornada do jovem bruxo Harry Potter na Escola de Magia e Bruxaria de Hogwarts.',                                   capa_url:capaUrl('9788532521934') },
      { isbn:'9788532523662', titulo:'Harry Potter e a Câmara Secreta',  id_autor:7,  id_editora:3, id_categoria:4,  ano_publicacao:1998, edicao:'1ª', num_paginas:272, idioma:'Português', localizacao:'G-01', descricao:'Harry retorna a Hogwarts e descobre uma câmara misteriosa que ameaça os alunos.',                                             capa_url:capaUrl('9788532523662') },
      { isbn:'9788532527301', titulo:'Harry Potter e o Prisioneiro de Azkaban', id_autor:7, id_editora:3, id_categoria:4, ano_publicacao:1999, edicao:'1ª', num_paginas:336, idioma:'Português', localizacao:'G-01', descricao:'Um fugitivo perigoso escapa da prisão mágica de Azkaban e parece estar atrás de Harry.', capa_url:capaUrl('9788532527301') },
      { isbn:'9788535914177', titulo:'1984',                             id_autor:8,  id_editora:1, id_categoria:5,  ano_publicacao:1949, edicao:'1ª', num_paginas:416, idioma:'Português', localizacao:'H-01', descricao:'Distopia clássica sobre vigilância total, manipulação da verdade e totalitarismo.',                                           capa_url:capaUrl('9788535914177') },
      { isbn:'9788535906424', titulo:'A Revolução dos Bichos',           id_autor:8,  id_editora:1, id_categoria:5,  ano_publicacao:1945, edicao:'1ª', num_paginas:152, idioma:'Português', localizacao:'H-01', descricao:'Alegoria política sobre como revoluções podem ser corrompidas pelo poder.',                                                     capa_url:capaUrl('9788535906424') },
      { isbn:'9788535903393', titulo:'Grande Sertão: Veredas',           id_autor:9,  id_editora:1, id_categoria:2,  ano_publicacao:1956, edicao:'1ª', num_paginas:608, idioma:'Português', localizacao:'I-01', descricao:'Monólogo de Riobaldo sobre pacto com o diabo, amor e violência nos sertões de Minas.',                                        capa_url:capaUrl('9788535903393') },
      { isbn:'9788526001312', titulo:'O Tempo e o Vento — O Continente',  id_autor:10, id_editora:4, id_categoria:2, ano_publicacao:1949, edicao:'1ª', num_paginas:752, idioma:'Português', localizacao:'I-02', descricao:'Épica saga familiar que conta a história do Rio Grande do Sul através dos Terra Cambará.', capa_url:capaUrl('9788526001312') },
      { isbn:'9788576655237', titulo:'O Alquimista',                     id_autor:11, id_editora:5, id_categoria:1,  ano_publicacao:1988, edicao:'1ª', num_paginas:208, idioma:'Português', localizacao:'J-01', descricao:'A jornada de Santiago, um pastor andaluz em busca de seu tesouro pessoal.',                                                    capa_url:capaUrl('9788576655237') },
      { isbn:'9788525406866', titulo:'A Metamorfose',                    id_autor:12, id_editora:7, id_categoria:12, ano_publicacao:1915, edicao:'1ª', num_paginas:120, idioma:'Português', localizacao:'J-02', descricao:'Gregor Samsa acorda transformado em inseto — símbolo da alienação do homem moderno.',                                         capa_url:capaUrl('9788525406866') },
      { isbn:'9788535914184', titulo:'Crime e Castigo',                  id_autor:13, id_editora:1, id_categoria:12, ano_publicacao:1866, edicao:'1ª', num_paginas:560, idioma:'Português', localizacao:'J-03', descricao:'Raskólnikov planeja e comete um assassinato e é dilacerado pela culpa e os questionamentos morais.',                            capa_url:capaUrl('9788535914184') },
      { isbn:'9786558882893', titulo:'O Pequeno Príncipe',               id_autor:14, id_editora:8, id_categoria:10, ano_publicacao:1943, edicao:'1ª', num_paginas:96,  idioma:'Português', localizacao:'K-01', descricao:'O encontro de um aviador com um principezinho vindo de outro planeta, cheio de sabedoria.',                                    capa_url:capaUrl('9786558882893') },
      { isbn:'9788501079824', titulo:'O Nome da Rosa',                   id_autor:15, id_editora:2, id_categoria:11, ano_publicacao:1980, edicao:'1ª', num_paginas:624, idioma:'Português', localizacao:'K-02', descricao:'Um monge e seu aprendiz investigam uma série de mortes misteriosas em uma abadia medieval.',                                    capa_url:capaUrl('9788501079824') },
      { isbn:'9788504018752', titulo:'Morte no Nilo',                    id_autor:16, id_editora:6, id_categoria:11, ano_publicacao:1937, edicao:'1ª', num_paginas:288, idioma:'Português', localizacao:'K-03', descricao:'Hercule Poirot investiga um assassinato a bordo de um navio no Nilo egípcio.',                                               capa_url:capaUrl('9788504018752') },
      { isbn:'9788504018769', titulo:'Assassinato no Expresso do Oriente', id_autor:16, id_editora:6, id_categoria:11, ano_publicacao:1934, edicao:'1ª', num_paginas:270, idioma:'Português', localizacao:'K-03', descricao:'Um passageiro é encontrado morto no famoso trem Orient Express. Poirot é o detetive.', capa_url:capaUrl('9788504018769') },
      { isbn:'9788535916324', titulo:'Alguma Poesia',                    id_autor:17, id_editora:1, id_categoria:7,  ano_publicacao:1930, edicao:'1ª', num_paginas:96,  idioma:'Português', localizacao:'L-01', descricao:'Primeiro livro de poemas de Drummond, com o emblemático "No meio do caminho tinha uma pedra".',                              capa_url:capaUrl('9788535916324') },
    ]);

    /* ─────────────────────────── EXEMPLARES ──────────────────────── */
    await trx('exemplares').insert([
      { id_livro:1,  num_tombo:'T-001', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(700) },
      { id_livro:1,  num_tombo:'T-002', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(600) },
      { id_livro:1,  num_tombo:'T-003', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(400) },
      { id_livro:2,  num_tombo:'T-004', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(650) },
      { id_livro:2,  num_tombo:'T-005', condicao:'Ruim',   disponivel:1, data_aquisicao:daysAgo(800) },
      { id_livro:3,  num_tombo:'T-006', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(500) },
      { id_livro:3,  num_tombo:'T-007', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(500) },
      { id_livro:4,  num_tombo:'T-008', condicao:'Novo',   disponivel:1, data_aquisicao:daysAgo(90)  },
      { id_livro:4,  num_tombo:'T-009', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:5,  num_tombo:'T-010', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(400) },
      { id_livro:5,  num_tombo:'T-011', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(700) },
      { id_livro:6,  num_tombo:'T-012', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(350) },
      { id_livro:6,  num_tombo:'T-013', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(350) },
      { id_livro:7,  num_tombo:'T-014', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(500) },
      { id_livro:7,  num_tombo:'T-015', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(500) },
      { id_livro:7,  num_tombo:'T-016', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(700) },
      { id_livro:8,  num_tombo:'T-017', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(450) },
      { id_livro:8,  num_tombo:'T-018', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(450) },
      { id_livro:9,  num_tombo:'T-019', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:9,  num_tombo:'T-020', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(550) },
      { id_livro:10, num_tombo:'T-021', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(600) },
      { id_livro:10, num_tombo:'T-022', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(600) },
      { id_livro:10, num_tombo:'T-023', condicao:'Novo',   disponivel:1, data_aquisicao:daysAgo(60)  },
      { id_livro:11, num_tombo:'T-024', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(500) },
      { id_livro:11, num_tombo:'T-025', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(700) },
      { id_livro:12, num_tombo:'T-026', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(400) },
      { id_livro:12, num_tombo:'T-027', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(400) },
      { id_livro:13, num_tombo:'T-028', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(350) },
      { id_livro:13, num_tombo:'T-029', condicao:'Novo',   disponivel:1, data_aquisicao:daysAgo(50)  },
      { id_livro:14, num_tombo:'T-030', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(550) },
      { id_livro:14, num_tombo:'T-031', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(550) },
      { id_livro:14, num_tombo:'T-032', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(750) },
      { id_livro:15, num_tombo:'T-033', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(400) },
      { id_livro:15, num_tombo:'T-034', condicao:'Novo',   disponivel:1, data_aquisicao:daysAgo(70)  },
      { id_livro:16, num_tombo:'T-035', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:16, num_tombo:'T-036', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:16, num_tombo:'T-037', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(500) },
      { id_livro:17, num_tombo:'T-038', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:17, num_tombo:'T-039', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:18, num_tombo:'T-040', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:18, num_tombo:'T-041', condicao:'Novo',   disponivel:1, data_aquisicao:daysAgo(45)  },
      { id_livro:19, num_tombo:'T-042', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(450) },
      { id_livro:19, num_tombo:'T-043', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(450) },
      { id_livro:19, num_tombo:'T-044', condicao:'Ruim',   disponivel:1, data_aquisicao:daysAgo(900) },
      { id_livro:20, num_tombo:'T-045', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(400) },
      { id_livro:20, num_tombo:'T-046', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(600) },
      { id_livro:21, num_tombo:'T-047', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(500) },
      { id_livro:21, num_tombo:'T-048', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(500) },
      { id_livro:22, num_tombo:'T-049', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(400) },
      { id_livro:22, num_tombo:'T-050', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(650) },
      { id_livro:23, num_tombo:'T-051', condicao:'Novo',   disponivel:1, data_aquisicao:daysAgo(80)  },
      { id_livro:23, num_tombo:'T-052', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(250) },
      { id_livro:23, num_tombo:'T-053', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(250) },
      { id_livro:24, num_tombo:'T-054', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(350) },
      { id_livro:24, num_tombo:'T-055', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(350) },
      { id_livro:25, num_tombo:'T-056', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(400) },
      { id_livro:25, num_tombo:'T-057', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(600) },
      { id_livro:26, num_tombo:'T-058', condicao:'Novo',   disponivel:1, data_aquisicao:daysAgo(60)  },
      { id_livro:26, num_tombo:'T-059', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:26, num_tombo:'T-060', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:27, num_tombo:'T-061', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(380) },
      { id_livro:27, num_tombo:'T-062', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(700) },
      { id_livro:28, num_tombo:'T-063', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:28, num_tombo:'T-064', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(300) },
      { id_livro:29, num_tombo:'T-065', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(350) },
      { id_livro:29, num_tombo:'T-066', condicao:'Novo',   disponivel:1, data_aquisicao:daysAgo(55)  },
      { id_livro:30, num_tombo:'T-067', condicao:'Bom',    disponivel:1, data_aquisicao:daysAgo(500) },
      { id_livro:30, num_tombo:'T-068', condicao:'Regular',disponivel:1, data_aquisicao:daysAgo(700) },
    ]);

    /* ─────────────────────────── MEMBROS ─────────────────────────── */
    await trx('membros').insert([
      { nome:'Ana Silva',           cpf:'111.111.111-01', email:'ana.silva@email.com',        telefone:'(11) 9 1111-0001', endereco:'Rua das Flores, 10 — São Paulo/SP',      tipo:'Estudante', data_validade:daysFromNow(300), observacoes:null },
      { nome:'Bruno Souza',         cpf:'222.222.222-02', email:'bruno.souza@email.com',      telefone:'(11) 9 2222-0002', endereco:'Av. Paulista, 200 — São Paulo/SP',        tipo:'Professor', data_validade:daysFromNow(365), observacoes:null },
      { nome:'Carla Mendes',        cpf:'333.333.333-03', email:'carla.mendes@email.com',     telefone:'(11) 9 3333-0003', endereco:'Rua Augusta, 30 — São Paulo/SP',          tipo:'Comum',     data_validade:daysFromNow(200), observacoes:'Possui pendências de multa.' },
      { nome:'Daniel Ferreira',     cpf:'444.444.444-04', email:'daniel.f@email.com',         telefone:'(21) 9 4444-0004', endereco:'Rua Ipanema, 50 — Rio de Janeiro/RJ',     tipo:'Estudante', data_validade:daysFromNow(280), observacoes:null },
      { nome:'Elisa Costa',         cpf:'555.555.555-05', email:'elisa.costa@email.com',      telefone:'(21) 9 5555-0005', endereco:'Av. Brasil, 100 — Rio de Janeiro/RJ',     tipo:'Professor', data_validade:daysFromNow(365), observacoes:null },
      { nome:'Felipe Lima',         cpf:'666.666.666-06', email:'felipe.lima@email.com',      telefone:'(31) 9 6666-0006', endereco:'Rua Liberdade, 15 — Belo Horizonte/MG',   tipo:'Comum',     data_validade:daysFromNow(150), observacoes:null },
      { nome:'Gabriela Rocha',      cpf:'777.777.777-07', email:'gabi.rocha@email.com',       telefone:'(31) 9 7777-0007', endereco:'Av. Contorno, 80 — Belo Horizonte/MG',    tipo:'Estudante', data_validade:daysFromNow(320), observacoes:'Bolsista universitária.' },
      { nome:'Henrique Alves',      cpf:'888.888.888-08', email:'henrique.a@email.com',       telefone:'(85) 9 8888-0008', endereco:'Rua do Sol, 5 — Fortaleza/CE',            tipo:'Comum',     data_validade:daysFromNow(180), observacoes:null },
      { nome:'Isabela Santos',      cpf:'999.999.999-09', email:'isabela.s@email.com',        telefone:'(85) 9 9999-0009', endereco:'Av. Meireles, 60 — Fortaleza/CE',         tipo:'Estudante', data_validade:daysFromNow(310), observacoes:null },
      { nome:'João Pereira',        cpf:'101.010.101-10', email:'joao.pereira@email.com',     telefone:'(51) 9 1010-1010', endereco:'Av. Ipiranga, 300 — Porto Alegre/RS',     tipo:'Professor', data_validade:daysFromNow(365), observacoes:null },
      { nome:'Larissa Oliveira',    cpf:'121.212.121-11', email:'larissa.o@email.com',        telefone:'(51) 9 1212-1212', endereco:'Rua Voluntários, 45 — Porto Alegre/RS',   tipo:'Estudante', data_validade:daysFromNow(290), observacoes:null },
      { nome:'Marcos Vieira',       cpf:'131.313.131-12', email:'marcos.v@email.com',         telefone:'(41) 9 1313-1313', endereco:'Rua XV de Novembro, 100 — Curitiba/PR',   tipo:'Comum',     data_validade:daysFromNow(120), observacoes:null },
      { nome:'Natália Ribeiro',     cpf:'141.414.141-13', email:'natalia.r@email.com',        telefone:'(41) 9 1414-1414', endereco:'Av. Batel, 25 — Curitiba/PR',             tipo:'Estudante', data_validade:daysFromNow(340), observacoes:null },
      { nome:'Otávio Carvalho',     cpf:'151.515.151-14', email:'otavio.c@email.com',         telefone:'(71) 9 1515-1515', endereco:'Av. Oceânica, 80 — Salvador/BA',          tipo:'Professor', data_validade:daysFromNow(365), observacoes:null },
      { nome:'Patrícia Gomes',      cpf:'161.616.161-15', email:'patricia.g@email.com',       telefone:'(71) 9 1616-1616', endereco:'Barra, Rua 2 — Salvador/BA',              tipo:'Comum',     data_validade:daysFromNow(200), observacoes:null },
      { nome:'Rafael Nascimento',   cpf:'171.717.171-16', email:'rafael.n@email.com',         telefone:'(92) 9 1717-1717', endereco:'Av. Eduardo Ribeiro, 10 — Manaus/AM',     tipo:'Estudante', data_validade:daysFromNow(260), observacoes:null },
      { nome:'Simone Martins',      cpf:'181.818.181-17', email:'simone.m@email.com',         telefone:'(92) 9 1818-1818', endereco:"Rua Lobo d'Almada, 5 — Manaus/AM",        tipo:'Professor', data_validade:daysFromNow(365), observacoes:null },
      { nome:'Thiago Barbosa',      cpf:'191.919.191-18', email:'thiago.b@email.com',         telefone:'(62) 9 1919-1919', endereco:'Av. Goiás, 200 — Goiânia/GO',             tipo:'Comum',     data_validade:daysFromNow(100), observacoes:null },
      { nome:'Vanessa Correia',     cpf:'202.020.202-19', email:'vanessa.c@email.com',        telefone:'(62) 9 2020-2020', endereco:'Rua 68, 100 — Goiânia/GO',               tipo:'Estudante', data_validade:daysFromNow(270), observacoes:null },
      { nome:'Wellington Pinto',    cpf:'212.121.212-20', email:'wellington.p@email.com',     telefone:'(98) 9 2121-2121', endereco:'Av. dos Holandeses, 50 — São Luís/MA',    tipo:'Comum',     data_validade:daysFromNow(90),  observacoes:null },
      { nome:'Administrador',       cpf:'101.010.101-01', email:'admin@bibliotecabrasil.local', telefone:'', endereco:'', tipo:'Professor', data_validade:daysFromNow(3650), senha_hash:adminHash, perfil:'admin' },
    ]);

    /* ─────────────────────────── EMPRÉSTIMOS ─────────────────────── */
    await trx('emprestimos').insert([
      // Ativos
      { id_exemplar:1,  id_membro:1,  data_emprestimo:daysAgo(3),  data_prevista_devolucao:daysFromNow(4),  data_devolucao:null, num_renovacoes:0, status:'Ativo' },
      { id_exemplar:8,  id_membro:2,  data_emprestimo:daysAgo(5),  data_prevista_devolucao:daysFromNow(9),  data_devolucao:null, num_renovacoes:0, status:'Ativo' },
      { id_exemplar:35, id_membro:4,  data_emprestimo:daysAgo(2),  data_prevista_devolucao:daysFromNow(5),  data_devolucao:null, num_renovacoes:0, status:'Ativo' },
      { id_exemplar:42, id_membro:6,  data_emprestimo:daysAgo(1),  data_prevista_devolucao:daysFromNow(6),  data_devolucao:null, num_renovacoes:0, status:'Ativo' },
      { id_exemplar:14, id_membro:9,  data_emprestimo:daysAgo(4),  data_prevista_devolucao:daysFromNow(3),  data_devolucao:null, num_renovacoes:0, status:'Ativo' },
      // Atrasados
      { id_exemplar:26, id_membro:3,  data_emprestimo:daysAgo(20), data_prevista_devolucao:daysAgo(13), data_devolucao:null, num_renovacoes:0, status:'Atrasado' },
      { id_exemplar:17, id_membro:7,  data_emprestimo:daysAgo(15), data_prevista_devolucao:daysAgo(8),  data_devolucao:null, num_renovacoes:0, status:'Atrasado' },
      { id_exemplar:30, id_membro:10, data_emprestimo:daysAgo(25), data_prevista_devolucao:daysAgo(11), data_devolucao:null, num_renovacoes:1, status:'Atrasado' },
      // Devolvidos
      { id_exemplar:51, id_membro:1,  data_emprestimo:daysAgo(30), data_prevista_devolucao:daysAgo(23), data_devolucao:daysAgo(25), num_renovacoes:0, status:'Devolvido' },
      { id_exemplar:47, id_membro:2,  data_emprestimo:daysAgo(45), data_prevista_devolucao:daysAgo(31), data_devolucao:daysAgo(33), num_renovacoes:0, status:'Devolvido' },
      { id_exemplar:38, id_membro:5,  data_emprestimo:daysAgo(20), data_prevista_devolucao:daysAgo(6),  data_devolucao:daysAgo(8),  num_renovacoes:0, status:'Devolvido' },
      { id_exemplar:58, id_membro:11, data_emprestimo:daysAgo(25), data_prevista_devolucao:daysAgo(18), data_devolucao:daysAgo(20), num_renovacoes:0, status:'Devolvido' },
      { id_exemplar:63, id_membro:12, data_emprestimo:daysAgo(35), data_prevista_devolucao:daysAgo(28), data_devolucao:daysAgo(30), num_renovacoes:0, status:'Devolvido' },
      { id_exemplar:45, id_membro:13, data_emprestimo:daysAgo(40), data_prevista_devolucao:daysAgo(33), data_devolucao:daysAgo(32), num_renovacoes:0, status:'Devolvido' },
      { id_exemplar:54, id_membro:8,  data_emprestimo:daysAgo(50), data_prevista_devolucao:daysAgo(43), data_devolucao:daysAgo(45), num_renovacoes:0, status:'Devolvido' },
      { id_exemplar:56, id_membro:14, data_emprestimo:daysAgo(60), data_prevista_devolucao:daysAgo(46), data_devolucao:daysAgo(48), num_renovacoes:1, status:'Devolvido' },
    ]);

    // Marcar exemplares dos empréstimos ativos/atrasados como indisponíveis
    await trx('exemplares').whereIn('id', [1, 8, 35, 42, 14, 26, 17, 30]).update({ disponivel: 0 });

    // Para o demo de reservas, marcar alguns exemplares adicionais como indisponíveis
    await trx('exemplares').whereIn('num_tombo', ['T-027','T-002','T-003','T-017','T-018']).update({ disponivel: 0 });

    /* ──────────────────────────── RESERVAS ───────────────────────── */
    await trx('reservas').insert([
      { id_livro:1,  id_membro:15, data_reserva:hoursAgo(12),  data_expiracao:daysFromNow(2), status:'Ativa' },
      { id_livro:12, id_membro:16, data_reserva:hoursAgo(6),   data_expiracao:daysFromNow(1), status:'Ativa' },
      { id_livro:8,  id_membro:17, data_reserva:hoursAgo(2),   data_expiracao:daysFromNow(3), status:'Ativa' },
      { id_livro:4,  id_membro:18, data_reserva:hoursAgo(18),  data_expiracao:daysFromNow(2), status:'Ativa' },
      { id_livro:2,  id_membro:19, data_reserva:hoursAgo(120), data_expiracao:daysAgo(2),     status:'Expirada' },
      { id_livro:16, id_membro:20, data_reserva:hoursAgo(200), data_expiracao:daysAgo(5),     status:'Cancelada' },
    ]);

    /* ──────────────────────────── MULTAS ─────────────────────────── */
    await trx('multas').insert([
      { id_emprestimo:6,  id_membro:3,  valor:6.50, motivo:'Devolução em atraso — 13 dia(s)', data_geracao:today(), data_pagamento:null,      pago:0 },
      { id_emprestimo:7,  id_membro:7,  valor:4.00, motivo:'Devolução em atraso — 8 dia(s)',  data_geracao:today(), data_pagamento:null,      pago:0 },
      { id_emprestimo:8,  id_membro:10, valor:5.50, motivo:'Devolução em atraso — 11 dia(s)', data_geracao:today(), data_pagamento:null,      pago:0 },
      { id_emprestimo:10, id_membro:2,  valor:1.00, motivo:'Devolução em atraso — 2 dia(s)',  data_geracao:daysAgo(33), data_pagamento:daysAgo(33), pago:1 },
      { id_emprestimo:12, id_membro:11, valor:1.00, motivo:'Devolução em atraso — 2 dia(s)',  data_geracao:daysAgo(20), data_pagamento:daysAgo(19), pago:1 },
      { id_emprestimo:13, id_membro:12, valor:1.00, motivo:'Devolução em atraso — 2 dia(s)',  data_geracao:daysAgo(30), data_pagamento:daysAgo(29), pago:1 },
      { id_emprestimo:16, id_membro:14, valor:1.00, motivo:'Devolução em atraso — 2 dia(s)',  data_geracao:daysAgo(48), data_pagamento:daysAgo(47), pago:1 },
    ]);
  });

  console.log('🌱 Seed rico executado com sucesso!');
  console.log('   📚 30 livros | 68 exemplares | 17 autores | 8 editoras | 12 categorias');
  console.log('   👥 21 membros (+ admin) | 16 empréstimos | 6 reservas | 7 multas');
  console.log('   🔑 Admin portal — CPF: 101.010.101-01 | Senha: administrador123');
}

module.exports = { runSeedRich };

// Executar diretamente: node src/database/seedRich.js
if (require.main === module) {
  runSeedRich().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
const bcrypt            = require('bcryptjs');
const { runMigrations } = require('./migrations');
const { getDb }         = require('./index');

function daysAgo(n)     { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; }
function today()        { return new Date().toISOString().split('T')[0]; }

function runSeedRich() {
  runMigrations();
  const db = getDb();

  console.log('🗑️  Limpando dados existentes...');
  db.exec(`
    DELETE FROM multas;
    DELETE FROM reservas;
    DELETE FROM emprestimos;
    DELETE FROM exemplares;
    DELETE FROM livros;
    DELETE FROM membros;
    DELETE FROM categorias;
    DELETE FROM editoras;
    DELETE FROM autores;
    DELETE FROM sqlite_sequence;
  `);

  const seed = db.transaction(() => {

    /* ─────────────────────────── AUTORES ─────────────────────────── */
    const insAutor = db.prepare(
      'INSERT INTO autores (nome, nacionalidade, bio) VALUES (?, ?, ?)'
    );
    // IDs 1-17
    insAutor.run('Machado de Assis',          'Brasileira',  'Joaquim Maria Machado de Assis, maior escritor do Realismo brasileiro. Fundador e primeiro presidente da ABL.');
    insAutor.run('Clarice Lispector',          'Brasileira',  'Uma das mais importantes escritoras brasileiras do século XX, conhecida pelo estilo introspectivo e experimental.');
    insAutor.run('Jorge Amado',                'Brasileira',  'Um dos escritores brasileiros mais lidos em todo o mundo, célebre por retratar a Bahia e seu povo.');
    insAutor.run('Graciliano Ramos',           'Brasileira',  'Representante máximo do romance regionalista do Nordeste, com escrita seca e precisa.');
    insAutor.run('José Saramago',              'Portuguesa',  'Nobel de Literatura em 1998. Conhecido pelo estilo singular sem pontuação convencional.');
    insAutor.run('Gabriel García Márquez',     'Colombiana',  'Nobel de Literatura em 1982. Pai do realismo mágico com Cem Anos de Solidão.');
    insAutor.run('J.K. Rowling',               'Britânica',   'Autora da saga Harry Potter, uma das séries mais vendidas da história da literatura.');
    insAutor.run('George Orwell',              'Britânica',   'Autor de 1984 e A Revolução dos Bichos, obras fundamentais da literatura política do século XX.');
    insAutor.run('João Guimarães Rosa',        'Brasileira',  'Autor de Grande Sertão: Veredas, considerada a mais importante obra da literatura brasileira moderna.');
    insAutor.run('Érico Veríssimo',            'Brasileira',  'Escritor gaúcho, autor de O Tempo e o Vento, trilogia épica da história do Rio Grande do Sul.');
    insAutor.run('Paulo Coelho',               'Brasileira',  'Um dos escritores mais traduzidos do mundo, autor de O Alquimista.');
    insAutor.run('Franz Kafka',                'Tcheca',      'Escritor austro-húngaro cujo nome originou o adjetivo kafkiano, para situações absurdas e opressivas.');
    insAutor.run('Fiódor Dostoiévski',         'Russa',       'Um dos maiores romancistas da humanidade. Autor de Crime e Castigo e Os Irmãos Karamazov.');
    insAutor.run('Antoine de Saint-Exupéry',  'Francesa',    'Aviador e escritor francês, autor do lendário O Pequeno Príncipe.');
    insAutor.run('Umberto Eco',                'Italiana',    'Semioticista e romancista italiano, autor de O Nome da Rosa.');
    insAutor.run('Agatha Christie',            'Britânica',   'A rainha do crime. A escritora mais vendida de todos os tempos, superada apenas pela Bíblia e Shakespeare.');
    insAutor.run('Carlos Drummond de Andrade','Brasileira',  'O maior poeta brasileiro do século XX. Sua obra abrange desde o cotidiano até grandes questões existenciais.');

    /* ─────────────────────────── EDITORAS ────────────────────────── */
    const insEditora = db.prepare(
      'INSERT INTO editoras (nome, cidade, pais, site) VALUES (?, ?, ?, ?)'
    );
    // IDs 1-8
    insEditora.run('Companhia das Letras', 'São Paulo',       'Brasil',  'https://www.companhiadasletras.com.br');
    insEditora.run('Record',               'Rio de Janeiro',  'Brasil',  'https://www.record.com.br');
    insEditora.run('Rocco',                'Rio de Janeiro',  'Brasil',  'https://www.rocco.com.br');
    insEditora.run('Editora Globo',        'São Paulo',       'Brasil',  'https://www.globolivros.com.br');
    insEditora.run('Arqueiro',             'São Paulo',       'Brasil',  'https://www.arqueirobr.com.br');
    insEditora.run('Saraiva',              'São Paulo',       'Brasil',  'https://www.saraivaconteudo.com.br');
    insEditora.run('L&PM',                 'Porto Alegre',    'Brasil',  'https://www.lpm.com.br');
    insEditora.run('Nova Fronteira',       'Rio de Janeiro',  'Brasil',  'https://www.novafronteira.com.br');

    /* ────────────────────────── CATEGORIAS ───────────────────────── */
    const insCat = db.prepare(
      'INSERT INTO categorias (nome, descricao) VALUES (?, ?)'
    );
    // IDs 1-12
    insCat.run('Romance',              'Obras ficcionais em prosa que exploram relações humanas, emoções e narrativas.');
    insCat.run('Literatura Brasileira','Obras de autores nacionais com temáticas diversas da realidade brasileira.');
    insCat.run('Ficção Científica',    'Narrativas baseadas em cenários futuristas, tecnológicos ou científicos especulativos.');
    insCat.run('Fantasia',             'Obras que incluem elementos mágicos, sobrenaturais ou mundos imaginários.');
    insCat.run('Distopia',             'Ficção que retrata sociedades futuras opressivas, totalitárias ou degeneradas.');
    insCat.run('Realismo Mágico',      'Corrente literária que mescla elementos da realidade cotidiana com fantasia e magia.');
    insCat.run('Poesia',               'Obras em verso que exploram linguagem, ritmo, imagens e emoções.');
    insCat.run('Biografia',            'Relatos da vida real de pessoas, escritos por terceiros ou autobiograficamente.');
    insCat.run('Ciências Humanas',     'Obras de filosofia, sociologia, história, antropologia e áreas afins.');
    insCat.run('Infanto-Juvenil',      'Obras destinadas a crianças e jovens, incluindo contos, fábulas e aventuras.');
    insCat.run('Mistério e Policial',  'Narrativas de investigação criminal, detetives e suspense.');
    insCat.run('Clássicos Universais', 'Grandes obras da literatura mundial reconhecidas como patrimônio cultural da humanidade.');

    /* ──────────────────────────── LIVROS ─────────────────────────── */
    const insLivro = db.prepare(`
      INSERT INTO livros
        (isbn, titulo, subtitulo, id_autor, id_editora, id_categoria, ano_publicacao, edicao, num_paginas, idioma, localizacao, descricao, capa_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    const capaUrl = isbn => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

    // Machado de Assis — Prateleira A
    insLivro.run('9788535902778','Dom Casmurro',                    null, 1,1,1,1899,'1ª',256,'Português','A-01','Narrado por Bentinho, que suspeita de traição de Capitu. Clássico do Realismo brasileiro.',capaUrl('9788535902778'));
    insLivro.run('9788535914849','Memórias Póstumas de Brás Cubas',null, 1,1,1,1881,'1ª',288,'Português','A-01','Primeiro romance póstumo-realista: narrado por um defunto autor.',capaUrl('9788535914849'));
    insLivro.run('9788535905618','Quincas Borba',                   null, 1,1,1,1891,'1ª',264,'Português','A-01','Terceiro da trilogia realista: a loucura, a fortuna e o Humanitismo.',capaUrl('9788535905618'));

    // Clarice Lispector — Prateleira B
    insLivro.run('9788532511010','A Hora da Estrela',               null, 2,3,2,1977,'1ª',88 ,'Português','B-01','Última obra publicada em vida: a nordestina Macabéa e a escrita como urgência.',capaUrl('9788532511010'));
    insLivro.run('9788532523440','A Paixão Segundo G.H.',           null, 2,3,2,1964,'1ª',152,'Português','B-01','Mergulho na consciência de uma mulher após um ato perturbador envolvendo uma barata.',capaUrl('9788532523440'));
    insLivro.run('9788532523457','Perto do Coração Selvagem',       null, 2,3,2,1943,'1ª',192,'Português','B-01','Primeiro romance de Clarice, de exploração interior radical.',capaUrl('9788532523457'));

    // Jorge Amado — Prateleira C
    insLivro.run('9788501088628','Gabriela, Cravo e Canela',        null, 3,2,1,1958,'1ª',390,'Português','C-01','Marco da literatura nordestina: a chegada de Gabriela ao Ilhéus dos anos 1920.',capaUrl('9788501088628'));
    insLivro.run('9788501083388','Capitães da Areia',               null, 3,2,2,1937,'1ª',320,'Português','C-01','Meninos de rua em Salvador nos anos 1930, sob o olhar humanista de Amado.',capaUrl('9788501083388'));
    insLivro.run('9788501091697','Tereza Batista Cansada de Guerra',null, 3,2,1,1972,'1ª',360,'Português','C-01','A história de uma mulher que luta contra o destino e a opressão no sertão baiano.',capaUrl('9788501091697'));

    // Graciliano Ramos — Prateleira D
    insLivro.run('9788578273132','Vidas Secas',                     null, 4,1,2,1938,'1ª',176,'Português','D-01','O sofrimento de Fabiano e sua família de retirantes no árido sertão nordestino.',capaUrl('9788578273132'));
    insLivro.run('9788578274016','São Bernardo',                    null, 4,1,2,1934,'1ª',196,'Português','D-01','Paulo Honório constrói uma fazenda e uma vida à custa de tudo e todos.',capaUrl('9788578274016'));

    // José Saramago — Prateleira E
    insLivro.run('9789722039598','Ensaio sobre a Cegueira',         null, 5,1,1,1995,'1ª',310,'Português','E-01','Uma epidemia de cegueira branca assola uma cidade — metáfora da perda da humanidade.',capaUrl('9789722039598'));
    insLivro.run('9789722041782','O Evangelho Segundo Jesus Cristo',null, 5,1,1,1991,'1ª',444,'Português','E-01','Releitura ficcional da vida de Jesus Cristo, que gerou polêmica ao misturar o humano e o divino.',capaUrl('9789722041782'));

    // García Márquez — Prateleira F
    insLivro.run('9788501039385','Cem Anos de Solidão',             null, 6,2,6,1967,'1ª',448,'Português','F-01','A saga épica da família Buendía e da cidade de Macondo ao longo de sete gerações.',capaUrl('9788501039385'));
    insLivro.run('9788501058225','Amor nos Tempos do Cólera',       null, 6,2,1,1985,'1ª',400,'Português','F-01','A história de um amor não correspondido que dura mais de cinquenta anos.',capaUrl('9788501058225'));

    // J.K. Rowling — Prateleira G
    insLivro.run('9788532521934','Harry Potter e a Pedra Filosofal',          null, 7,3,4,1997,'1ª',232,'Português','G-01','O início da jornada do jovem bruxo Harry Potter na Escola de Magia e Bruxaria de Hogwarts.',capaUrl('9788532521934'));
    insLivro.run('9788532523662','Harry Potter e a Câmara Secreta',           null, 7,3,4,1998,'1ª',272,'Português','G-01','Harry retorna a Hogwarts e descobre uma câmara misteriosa que ameaça os alunos.',capaUrl('9788532523662'));
    insLivro.run('9788532527301','Harry Potter e o Prisioneiro de Azkaban',   null, 7,3,4,1999,'1ª',336,'Português','G-01','Um fugitivo perigoso escapa da prisão mágica de Azkaban e parece estar atrás de Harry.',capaUrl('9788532527301'));

    // George Orwell — Prateleira H
    insLivro.run('9788535914177','1984',                            null, 8,1,5,1949,'1ª',416,'Português','H-01','Distopia clássica sobre vigilância total, manipulação da verdade e totalitarismo.',capaUrl('9788535914177'));
    insLivro.run('9788535906424','A Revolução dos Bichos',          null, 8,1,5,1945,'1ª',152,'Português','H-01','Alegoria política sobre como revoluções podem ser corrompidas pelo poder.',capaUrl('9788535906424'));

    // Outros autores — Prateleiras I..
    insLivro.run('9788535903393','Grande Sertão: Veredas',          null, 9,1,2,1956,'1ª',608,'Português','I-01','Monólogo de Riobaldo sobre pacto com o diabo, amor e violência nos sertões de Minas.',capaUrl('9788535903393'));
    insLivro.run('9788526001312','O Tempo e o Vento — O Continente',null,10,4,2,1949,'1ª',752,'Português','I-02','Épica saga familiar que conta a história do Rio Grande do Sul através dos Terra Cambará.',capaUrl('9788526001312'));
    insLivro.run('9788576655237','O Alquimista',                    null,11,5,1,1988,'1ª',208,'Português','J-01','A jornada de Santiago, um pastor andaluz em busca de seu tesouro pessoal.',capaUrl('9788576655237'));
    insLivro.run('9788525406866','A Metamorfose',                   null,12,7,12,1915,'1ª',120,'Português','J-02','Gregor Samsa acorda transformado em inseto — símbolo da alienação do homem moderno.',capaUrl('9788525406866'));
    insLivro.run('9788535914184','Crime e Castigo',                 null,13,1,12,1866,'1ª',560,'Português','J-03','Raskólnikov planeja e comete um assassinato e é dilacerado pela culpa e os questionamentos morais.',capaUrl('9788535914184'));
    insLivro.run('9786558882893','O Pequeno Príncipe',              null,14,8,10,1943,'1ª',96 ,'Português','K-01','O encontro de um aviador com um principezinho vindo de outro planeta, cheio de sabedoria.',capaUrl('9786558882893'));
    insLivro.run('9788501079824','O Nome da Rosa',                  null,15,2,11,1980,'1ª',624,'Português','K-02','Um monge e seu aprendiz investigam uma série de mortes misteriosas em uma abadia medieval.',capaUrl('9788501079824'));
    insLivro.run('9788504018752','Morte no Nilo',                   null,16,6,11,1937,'1ª',288,'Português','K-03','Hercule Poirot investiga um assassinato a bordo de um navio no Nilo egípcio.',capaUrl('9788504018752'));
    insLivro.run('9788504018769','Assassinato no Expresso do Oriente',null,16,6,11,1934,'1ª',270,'Português','K-03','Um passageiro é encontrado morto no famoso trem Orient Express. Poirot é o detetive.',capaUrl('9788504018769'));
    insLivro.run('9788535916324','Alguma Poesia',                   null,17,1,7,1930,'1ª',96 ,'Português','L-01','Primeiro livro de poemas de Drummond, com o emblemático "No meio do caminho tinha uma pedra".',capaUrl('9788535916324'));

    /* ─────────────────────────── EXEMPLARES ──────────────────────── */
    // Todos entram como disponivel=1; atualizaremos os emprestados depois.
    const insEx = db.prepare(`
      INSERT INTO exemplares (id_livro, num_tombo, condicao, disponivel, data_aquisicao)
      VALUES (?, ?, ?, 1, ?)`);

    // book_id → [tombo, condicao, data_aquisicao] (tombo sequencial T-001..T-068)
    const exs = [
      // livro 1 — Dom Casmurro (ex 1-3)
      [1,'T-001','Bom',    daysAgo(700)],
      [1,'T-002','Regular',daysAgo(600)],
      [1,'T-003','Bom',    daysAgo(400)],
      // livro 2 — Memórias Póstumas (ex 4-5)
      [2,'T-004','Bom',    daysAgo(650)],
      [2,'T-005','Ruim',   daysAgo(800)],
      // livro 3 — Quincas Borba (ex 6-7)
      [3,'T-006','Bom',    daysAgo(500)],
      [3,'T-007','Bom',    daysAgo(500)],
      // livro 4 — A Hora da Estrela (ex 8-9)
      [4,'T-008','Novo',   daysAgo(90)],
      [4,'T-009','Bom',    daysAgo(300)],
      // livro 5 — A Paixão Segundo G.H. (ex 10-11)
      [5,'T-010','Bom',    daysAgo(400)],
      [5,'T-011','Regular',daysAgo(700)],
      // livro 6 — Perto do Coração Selvagem (ex 12-13)
      [6,'T-012','Bom',    daysAgo(350)],
      [6,'T-013','Bom',    daysAgo(350)],
      // livro 7 — Gabriela (ex 14-16)
      [7,'T-014','Bom',    daysAgo(500)],
      [7,'T-015','Bom',    daysAgo(500)],
      [7,'T-016','Regular',daysAgo(700)],
      // livro 8 — Capitães da Areia (ex 17-18)
      [8,'T-017','Bom',    daysAgo(450)],
      [8,'T-018','Bom',    daysAgo(450)],
      // livro 9 — Tereza Batista (ex 19-20)
      [9,'T-019','Bom',    daysAgo(300)],
      [9,'T-020','Regular',daysAgo(550)],
      // livro 10 — Vidas Secas (ex 21-23)
      [10,'T-021','Bom',   daysAgo(600)],
      [10,'T-022','Bom',   daysAgo(600)],
      [10,'T-023','Novo',  daysAgo(60)],
      // livro 11 — São Bernardo (ex 24-25)
      [11,'T-024','Bom',   daysAgo(500)],
      [11,'T-025','Regular',daysAgo(700)],
      // livro 12 — Ensaio sobre a Cegueira (ex 26-27)
      [12,'T-026','Bom',   daysAgo(400)],
      [12,'T-027','Bom',   daysAgo(400)],
      // livro 13 — O Evangelho Segundo JC (ex 28-29)
      [13,'T-028','Bom',   daysAgo(350)],
      [13,'T-029','Novo',  daysAgo(50)],
      // livro 14 — Cem Anos de Solidão (ex 30-32)
      [14,'T-030','Bom',   daysAgo(550)],
      [14,'T-031','Bom',   daysAgo(550)],
      [14,'T-032','Regular',daysAgo(750)],
      // livro 15 — Amor nos Tempos do Cólera (ex 33-34)
      [15,'T-033','Bom',   daysAgo(400)],
      [15,'T-034','Novo',  daysAgo(70)],
      // livro 16 — HP Pedra Filosofal (ex 35-37)
      [16,'T-035','Bom',   daysAgo(300)],
      [16,'T-036','Bom',   daysAgo(300)],
      [16,'T-037','Regular',daysAgo(500)],
      // livro 17 — HP Câmara Secreta (ex 38-39)
      [17,'T-038','Bom',   daysAgo(300)],
      [17,'T-039','Bom',   daysAgo(300)],
      // livro 18 — HP Prisioneiro (ex 40-41)
      [18,'T-040','Bom',   daysAgo(300)],
      [18,'T-041','Novo',  daysAgo(45)],
      // livro 19 — 1984 (ex 42-44)
      [19,'T-042','Bom',   daysAgo(450)],
      [19,'T-043','Bom',   daysAgo(450)],
      [19,'T-044','Ruim',  daysAgo(900)],
      // livro 20 — Revolução dos Bichos (ex 45-46)
      [20,'T-045','Bom',   daysAgo(400)],
      [20,'T-046','Regular',daysAgo(600)],
      // livro 21 — Grande Sertão (ex 47-48)
      [21,'T-047','Bom',   daysAgo(500)],
      [21,'T-048','Bom',   daysAgo(500)],
      // livro 22 — O Tempo e o Vento (ex 49-50)
      [22,'T-049','Bom',   daysAgo(400)],
      [22,'T-050','Regular',daysAgo(650)],
      // livro 23 — O Alquimista (ex 51-53)
      [23,'T-051','Novo',  daysAgo(80)],
      [23,'T-052','Bom',   daysAgo(250)],
      [23,'T-053','Bom',   daysAgo(250)],
      // livro 24 — A Metamorfose (ex 54-55)
      [24,'T-054','Bom',   daysAgo(350)],
      [24,'T-055','Bom',   daysAgo(350)],
      // livro 25 — Crime e Castigo (ex 56-57)
      [25,'T-056','Bom',   daysAgo(400)],
      [25,'T-057','Regular',daysAgo(600)],
      // livro 26 — O Pequeno Príncipe (ex 58-60)
      [26,'T-058','Novo',  daysAgo(60)],
      [26,'T-059','Bom',   daysAgo(300)],
      [26,'T-060','Bom',   daysAgo(300)],
      // livro 27 — O Nome da Rosa (ex 61-62)
      [27,'T-061','Bom',   daysAgo(380)],
      [27,'T-062','Regular',daysAgo(700)],
      // livro 28 — Morte no Nilo (ex 63-64)
      [28,'T-063','Bom',   daysAgo(300)],
      [28,'T-064','Bom',   daysAgo(300)],
      // livro 29 — Assassinato no Expresso (ex 65-66)
      [29,'T-065','Bom',   daysAgo(350)],
      [29,'T-066','Novo',  daysAgo(55)],
      // livro 30 — Alguma Poesia (ex 67-68)
      [30,'T-067','Bom',   daysAgo(500)],
      [30,'T-068','Regular',daysAgo(700)],
    ];
    for (const [idLivro, tombo, condicao, dtAq] of exs) {
      insEx.run(idLivro, tombo, condicao, dtAq);
    }

    /* ─────────────────────────── MEMBROS ─────────────────────────── */
    const insMembro = db.prepare(`
      INSERT INTO membros (nome, cpf, email, telefone, endereco, tipo, data_validade, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    // IDs 1-20
    insMembro.run('Ana Silva',           '111.111.111-01','ana.silva@email.com',        '(11) 9 1111-0001','Rua das Flores, 10 — São Paulo/SP',      'Estudante', daysFromNow(300), null);
    insMembro.run('Bruno Souza',         '222.222.222-02','bruno.souza@email.com',      '(11) 9 2222-0002','Av. Paulista, 200 — São Paulo/SP',        'Professor', daysFromNow(365), null);
    insMembro.run('Carla Mendes',        '333.333.333-03','carla.mendes@email.com',     '(11) 9 3333-0003','Rua Augusta, 30 — São Paulo/SP',          'Comum',     daysFromNow(200), 'Possui pendências de multa.');
    insMembro.run('Daniel Ferreira',     '444.444.444-04','daniel.f@email.com',         '(21) 9 4444-0004','Rua Ipanema, 50 — Rio de Janeiro/RJ',     'Estudante', daysFromNow(280), null);
    insMembro.run('Elisa Costa',         '555.555.555-05','elisa.costa@email.com',      '(21) 9 5555-0005','Av. Brasil, 100 — Rio de Janeiro/RJ',     'Professor', daysFromNow(365), null);
    insMembro.run('Felipe Lima',         '666.666.666-06','felipe.lima@email.com',      '(31) 9 6666-0006','Rua Liberdade, 15 — Belo Horizonte/MG',   'Comum',     daysFromNow(150), null);
    insMembro.run('Gabriela Rocha',      '777.777.777-07','gabi.rocha@email.com',       '(31) 9 7777-0007','Av. Contorno, 80 — Belo Horizonte/MG',    'Estudante', daysFromNow(320), 'Bolsista universitária.');
    insMembro.run('Henrique Alves',      '888.888.888-08','henrique.a@email.com',       '(85) 9 8888-0008','Rua do Sol, 5 — Fortaleza/CE',            'Comum',     daysFromNow(180), null);
    insMembro.run('Isabela Santos',      '999.999.999-09','isabela.s@email.com',        '(85) 9 9999-0009','Av. Meireles, 60 — Fortaleza/CE',         'Estudante', daysFromNow(310), null);
    insMembro.run('João Pereira',        '101.010.101-10','joao.pereira@email.com',     '(51) 9 1010-1010','Av. Ipiranga, 300 — Porto Alegre/RS',     'Professor', daysFromNow(365), null);
    insMembro.run('Larissa Oliveira',    '121.212.121-11','larissa.o@email.com',        '(51) 9 1212-1212','Rua Voluntários, 45 — Porto Alegre/RS',   'Estudante', daysFromNow(290), null);
    insMembro.run('Marcos Vieira',       '131.313.131-12','marcos.v@email.com',         '(41) 9 1313-1313','Rua XV de Novembro, 100 — Curitiba/PR',   'Comum',     daysFromNow(120), null);
    insMembro.run('Natália Ribeiro',     '141.414.141-13','natalia.r@email.com',        '(41) 9 1414-1414','Av. Batel, 25 — Curitiba/PR',             'Estudante', daysFromNow(340), null);
    insMembro.run('Otávio Carvalho',     '151.515.151-14','otavio.c@email.com',         '(71) 9 1515-1515','Av. Oceânica, 80 — Salvador/BA',          'Professor', daysFromNow(365), null);
    insMembro.run('Patrícia Gomes',      '161.616.161-15','patricia.g@email.com',       '(71) 9 1616-1616','Barra, Rua 2 — Salvador/BA',              'Comum',     daysFromNow(200), null);
    insMembro.run('Rafael Nascimento',   '171.717.171-16','rafael.n@email.com',         '(92) 9 1717-1717','Av. Eduardo Ribeiro, 10 — Manaus/AM',     'Estudante', daysFromNow(260), null);
    insMembro.run('Simone Martins',      '181.818.181-17','simone.m@email.com',         '(92) 9 1818-1818','Rua Lobo d\'Almada, 5 — Manaus/AM',       'Professor', daysFromNow(365), null);
    insMembro.run('Thiago Barbosa',      '191.919.191-18','thiago.b@email.com',         '(62) 9 1919-1919','Av. Goiás, 200 — Goiânia/GO',             'Comum',     daysFromNow(100), null);
    insMembro.run('Vanessa Correia',     '202.020.202-19','vanessa.c@email.com',        '(62) 9 2020-2020','Rua 68, 100 — Goiânia/GO',               'Estudante', daysFromNow(270), null);
    insMembro.run('Wellington Pinto',    '212.121.212-20','wellington.p@email.com',     '(98) 9 2121-2121','Av. dos Holandeses, 50 — São Luís/MA',    'Comum',     daysFromNow(90),  null);

    // Usuário administrador padrão (ID 21)
    const adminHash = bcrypt.hashSync('administrador123', 10);
    db.prepare(`
      INSERT INTO membros (nome, cpf, email, telefone, endereco, tipo, data_validade, senha_hash, perfil)
      VALUES (?, ?, ?, ?, ?, ?, date('now', '+10 years'), ?, ?)
    `).run('Administrador', '101.010.101-01', 'admin@bibliotecabrasil.local', '', '', 'Professor', adminHash, 'admin');

    /* ─────────────────────────── EMPRÉSTIMOS ─────────────────────── */
    const insEmp = db.prepare(`
      INSERT INTO emprestimos
        (id_exemplar, id_membro, data_emprestimo, data_prevista_devolucao, data_devolucao, num_renovacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);

    // ── Ativos (5) ──────────────────────────────────────────────────
    // emp 1: Ana (Estudante,7d) — Dom Casmurro T-001 (ex_id=1)
    insEmp.run(1,  1, daysAgo(3),  daysFromNow(4),  null, 0, 'Ativo');
    // emp 2: Bruno (Professor,14d) — Hora Estrela T-008 (ex_id=8)
    insEmp.run(8,  2, daysAgo(5),  daysFromNow(9),  null, 0, 'Ativo');
    // emp 3: Daniel (Estudante,7d) — HP Pedra T-035 (ex_id=35)
    insEmp.run(35, 4, daysAgo(2),  daysFromNow(5),  null, 0, 'Ativo');
    // emp 4: Felipe (Comum,7d) — 1984 T-042 (ex_id=42)
    insEmp.run(42, 6, daysAgo(1),  daysFromNow(6),  null, 0, 'Ativo');
    // emp 5: Isabela (Estudante,7d) — Gabriela T-014 (ex_id=14)
    insEmp.run(14, 9, daysAgo(4),  daysFromNow(3),  null, 0, 'Ativo');

    // ── Atrasados (3) ───────────────────────────────────────────────
    // emp 6: Carla (Comum,7d) — Ensaio Cegueira T-026 (ex_id=26) — 13 dias atrasado
    insEmp.run(26, 3, daysAgo(20), daysAgo(13), null, 0, 'Atrasado');
    // emp 7: Gabriela (Estudante,7d) — Capitães Areia T-017 (ex_id=17) — 8 dias atrasado
    insEmp.run(17, 7, daysAgo(15), daysAgo(8),  null, 0, 'Atrasado');
    // emp 8: João (Professor,14d) — Cem Anos T-030 (ex_id=30) — 11 dias atrasado
    insEmp.run(30,10, daysAgo(25), daysAgo(11), null, 1, 'Atrasado');

    // ── Devolvidos (8) ──────────────────────────────────────────────
    // emp 9: Ana — O Alquimista T-051 (ex_id=51), no prazo
    insEmp.run(51, 1, daysAgo(30), daysAgo(23), daysAgo(25), 0, 'Devolvido');
    // emp 10: Bruno — Grande Sertão T-047 (ex_id=47), 2 dias atrasado
    insEmp.run(47, 2, daysAgo(45), daysAgo(31), daysAgo(33), 0, 'Devolvido');
    // emp 11: Elisa — HP Câmara T-038 (ex_id=38), no prazo
    insEmp.run(38, 5, daysAgo(20), daysAgo(6),  daysAgo(8),  0, 'Devolvido');
    // emp 12: Larissa — O Pequeno Príncipe T-058 (ex_id=58), 2 dias atrasado
    insEmp.run(58,11, daysAgo(25), daysAgo(18), daysAgo(20), 0, 'Devolvido');
    // emp 13: Marcos — Morte no Nilo T-063 (ex_id=63), 2 dias atrasado
    insEmp.run(63,12, daysAgo(35), daysAgo(28), daysAgo(30), 0, 'Devolvido');
    // emp 14: Natália — Revolução dos Bichos T-045 (ex_id=45), no prazo
    insEmp.run(45,13, daysAgo(40), daysAgo(33), daysAgo(32), 0, 'Devolvido');
    // emp 15: Henrique — A Metamorfose T-054 (ex_id=54), no prazo
    insEmp.run(54, 8, daysAgo(50), daysAgo(43), daysAgo(45), 0, 'Devolvido');
    // emp 16: Otávio — Crime e Castigo T-056 (ex_id=56), 2 dias atrasado (com renovação)
    insEmp.run(56,14, daysAgo(60), daysAgo(46), daysAgo(48), 1, 'Devolvido');

    // ── Marcar exemplares dos empréstimos ativos/atrasados como indisponíveis ──
    const updEx = db.prepare('UPDATE exemplares SET disponivel = 0 WHERE id = ?');
    // ativos: ex 1,8,35,42,14
    // atrasados: ex 26,17,30
    for (const exId of [1, 8, 35, 42, 14, 26, 17, 30]) {
      updEx.run(exId);
    }

    /* ──────────────────────────── RESERVAS ───────────────────────── */
    const insRes = db.prepare(`
      INSERT INTO reservas (id_livro, id_membro, data_reserva, data_expiracao, status)
      VALUES (?, ?, datetime('now', '-' || ? || ' hours'), ?, ?)`);

    // Ativas (4) — para livros cujos exemplares estão todos emprestados/atrasados
    // livro 1 (Dom Casmurro): T-001 emprestado, T-002 e T-003 livres → reserva válida apenas se TODOS indisponíveis.
    // Para o demo, usamos livros que têm exemplares emprestados para mostrar a fila.
    // livro 12 (Ensaio Cegueira): T-026 atrasado, T-027 livre → vamos simular T-027 também emprestado
    const updEx2 = db.prepare('UPDATE exemplares SET disponivel = 0 WHERE num_tombo = ?');
    updEx2.run('T-027'); // Ensaio cegueira — segundo exemplar também emprestado (simula livro lotado)
    updEx2.run('T-002'); // Dom Casmurro — segundo exemplar emprestado
    updEx2.run('T-003'); // Dom Casmurro — terceiro também
    updEx2.run('T-017'); // Capitães — já atrasado, T-018 também vai ficar emprestado
    updEx2.run('T-018');

    insRes.run(1,  15, 12, daysFromNow(2), 'Ativa');    // Patrícia quer Dom Casmurro
    insRes.run(12, 16, 6,  daysFromNow(1), 'Ativa');    // Rafael quer Ensaio sobre a Cegueira
    insRes.run(8,  17, 2,  daysFromNow(3), 'Ativa');    // Simone quer Capitães da Areia
    insRes.run(4,  18, 18, daysFromNow(2), 'Ativa');    // Thiago quer A Hora da Estrela
    // Expirada
    insRes.run(2,  19, 120, daysAgo(2), 'Expirada');    // Vanessa queria Memórias Póstumas
    // Cancelada
    insRes.run(16, 20, 200, daysAgo(5), 'Cancelada');   // Wellington cancelou HP

    /* ──────────────────────────── MULTAS ─────────────────────────── */
    const insMulra = db.prepare(`
      INSERT INTO multas (id_emprestimo, id_membro, valor, motivo, data_geracao, data_pagamento, pago)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);

    // ── Pendentes — empréstimos atrasados (emp 6, 7, 8) ─────────────
    insMulra.run(6,  3,  6.50, 'Devolução em atraso — 13 dia(s)',  today(), null, 0);
    insMulra.run(7,  7,  4.00, 'Devolução em atraso — 8 dia(s)',   today(), null, 0);
    insMulra.run(8, 10,  5.50, 'Devolução em atraso — 11 dia(s)',  today(), null, 0);

    // ── Pagas — empréstimos devolvidos com atraso (emp 10,12,13,16) ──
    insMulra.run(10,  2, 1.00, 'Devolução em atraso — 2 dia(s)',   daysAgo(33), daysAgo(33), 1);
    insMulra.run(12, 11, 1.00, 'Devolução em atraso — 2 dia(s)',   daysAgo(20), daysAgo(19), 1);
    insMulra.run(13, 12, 1.00, 'Devolução em atraso — 2 dia(s)',   daysAgo(30), daysAgo(29), 1);
    insMulra.run(16, 14, 1.00, 'Devolução em atraso — 2 dia(s)',   daysAgo(48), daysAgo(47), 1);
  });

  seed();
  console.log('🌱 Seed rico executado com sucesso!');
  console.log('   📚 30 livros | 68 exemplares | 17 autores | 8 editoras | 12 categorias');
  console.log('   👥 21 membros (+ admin) | 16 empréstimos | 6 reservas | 7 multas');
  console.log('   🔑 Admin portal — CPF: 101.010.101-01 | Senha: administrador123');
}

module.exports = { runSeedRich };

// Executar diretamente: node src/database/seedRich.js
if (require.main === module) {
  runSeedRich();
}
