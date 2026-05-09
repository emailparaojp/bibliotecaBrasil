/* portal-api.js — API client for public portal + auth */
const PortalAPI = (() => {
  const BASE = '/api';

  function getMemberToken() {
    return localStorage.getItem('memberToken') || '';
  }

  async function request(method, path, body, params = {}, authRequired = false) {
    const url = new URL(BASE + path, location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    const opts = { method, headers: {} };
    const token = getMemberToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    if (res.status === 401) {
      localStorage.removeItem('memberToken');
      localStorage.removeItem('memberInfo');
      if (typeof PortalRouter !== 'undefined') PortalRouter.go('login');
      throw new Error('Sessão expirada. Faça login novamente.');
    }
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
    // Public catalog
    livros:     (p)  => request('GET', '/portal/livros', undefined, p),
    livro:      (id) => request('GET', `/portal/livros/${id}`),
    categorias: ()   => request('GET', '/portal/categorias'),
    autores:    ()   => request('GET', '/portal/autores'),

    // Auth
    register: (b) => request('POST', '/auth/register', b),
    login:    (b) => request('POST', '/auth/login', b),
    me:       ()  => request('GET',  '/auth/me'),
    updateMe: (b) => request('PUT',  '/auth/me', b),

    // Member area (auth required)
    criarReserva:  (b)  => request('POST', '/portal/reservas', b),
    cancelarReserva:(id) => request('DELETE', `/portal/reservas/${id}`),
    minhasReservas: ()  => request('GET', '/portal/minhas-reservas'),
    meuHistorico:   ()  => request('GET', '/portal/meu-historico'),
    minhasMultas:   ()  => request('GET', '/portal/minhas-multas'),
  };
})();
