/* api.js — wrapper de fetch para a API REST */
const API = (() => {
  const BASE = '/api';

  async function request(method, path, body, params = {}) {
    const url = new URL(BASE + path, location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    const opts = { method, headers: {} };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.erro
        || (data.erros && data.erros.map(e => `${e.campo}: ${e.mensagem}`).join('; '))
        || `Erro ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  return {
    get:    (path, params)  => request('GET',    path, undefined, params),
    post:   (path, body)    => request('POST',   path, body),
    put:    (path, body)    => request('PUT',    path, body),
    patch:  (path, body)    => request('PATCH',  path, body),
    delete: (path)          => request('DELETE', path),

    // Atalhos de domínio
    dashboard:      ()       => API.get('/relatorios/dashboard'),
    acervo:         ()       => API.get('/relatorios/acervo'),
    inventario:     ()       => API.get('/relatorios/inventario'),
    maisEmprestados:(p)      => API.get('/relatorios/livros-mais-emprestados', p),
    situacaoEmp:    ()       => API.get('/relatorios/situacao-emprestimos'),
    devPrevistas:   (p)      => API.get('/relatorios/devolucoes-previstas', p),
    financeiroMultas:()      => API.get('/relatorios/financeiro-multas'),
    membrosComMultas:()      => API.get('/relatorios/membros-com-multas'),
    membrosAtivos:  (p)      => API.get('/relatorios/membros-mais-ativos', p),

    livros:     (p)  => API.get('/livros', p),
    livro:      (id) => API.get(`/livros/${id}`),
    criarLivro: (b)  => API.post('/livros', b),
    editarLivro:(id,b)=> API.put(`/livros/${id}`, b),
    deletarLivro:(id)=> API.delete(`/livros/${id}`),
    exemplares: (id) => API.get(`/livros/${id}/exemplares`),
    addExemplar:(id,b)=> API.post(`/livros/${id}/exemplares`, b),
    editExemplar:(lid,eid,b)=> API.put(`/livros/${lid}/exemplares/${eid}`, b),
    delExemplar:(lid,eid)=> API.delete(`/livros/${lid}/exemplares/${eid}`),

    autores:     (p)  => API.get('/autores', p),
    autor:       (id) => API.get(`/autores/${id}`),
    criarAutor:  (b)  => API.post('/autores', b),
    editarAutor: (id,b)=> API.put(`/autores/${id}`, b),
    deletarAutor:(id)=> API.delete(`/autores/${id}`),

    editoras:     (p)  => API.get('/editoras', p),
    editora:      (id) => API.get(`/editoras/${id}`),
    criarEditora: (b)  => API.post('/editoras', b),
    editarEditora:(id,b)=> API.put(`/editoras/${id}`, b),
    deletarEditora:(id)=> API.delete(`/editoras/${id}`),

    categorias:     (p)  => API.get('/categorias', p),
    categoria:      (id) => API.get(`/categorias/${id}`),
    criarCategoria: (b)  => API.post('/categorias', b),
    editarCategoria:(id,b)=> API.put(`/categorias/${id}`, b),
    deletarCategoria:(id)=> API.delete(`/categorias/${id}`),

    membros:    (p)  => API.get('/membros', p),
    membro:     (id) => API.get(`/membros/${id}`),
    criarMembro:(b)  => API.post('/membros', b),
    editarMembro:(id,b)=> API.put(`/membros/${id}`, b),
    renovarMat: (id) => API.patch(`/membros/${id}/renovar-matricula`),
    statusMembro:(id,b)=> API.patch(`/membros/${id}/status`, b),
    historicoMembro:(id,p)=> API.get(`/membros/${id}/historico`, p),

    emprestimos: (p)  => API.get('/emprestimos', p),
    emprestimo:  (id) => API.get(`/emprestimos/${id}`),
    atrasados:   ()   => API.get('/emprestimos/atrasados'),
    realizarEmp: (b)  => API.post('/emprestimos', b),
    devolverEmp: (id) => API.patch(`/emprestimos/${id}/devolver`),
    renovarEmp:  (id) => API.patch(`/emprestimos/${id}/renovar`),

    reservas:    (p)  => API.get('/reservas', p),
    criarReserva:(b)  => API.post('/reservas', b),
    cancelarRes: (id) => API.patch(`/reservas/${id}/cancelar`),
    filaReserva: (id) => API.get(`/reservas/livro/${id}/fila`),

    multas:      (p)  => API.get('/multas', p),
    multa:       (id) => API.get(`/multas/${id}`),
    pagarMulta:  (id) => API.patch(`/multas/${id}/pagar`),
    multasMembro:(id) => API.get(`/multas/membro/${id}`),
    pagarTodas:  (id) => API.patch(`/multas/membro/${id}/pagar-tudo`),
  };
})();
