/* portal-catalog.js — public book catalog page */

const CatalogPage = (() => {
  let state = { q: '', categoria: '', autor: '', disponivel: false, page: 1 };
  let cats = [], autors = [];

  async function loadFilters() {
    [cats, autors] = await Promise.all([PortalAPI.categorias(), PortalAPI.autores()]);
  }

  function filtersHtml() {
    const catOptions = cats.map(c =>
      `<option value="${c.id}" ${state.categoria == c.id ? 'selected' : ''}>${esc(c.nome)}</option>`
    ).join('');
    const autOptions = autors.map(a =>
      `<option value="${a.id}" ${state.autor == a.id ? 'selected' : ''}>${esc(a.nome)}</option>`
    ).join('');

    return `
      <div class="catalog-filters">
        <select id="filterCat"><option value="">Todas as categorias</option>${catOptions}</select>
        <select id="filterAut"><option value="">Todos os autores</option>${autOptions}</select>
        <label><input type="checkbox" id="filterDisp" ${state.disponivel ? 'checked' : ''}> Somente disponíveis</label>
      </div>
    `;
  }

  function bookCardHtml(livro) {
    const cover = livro.capa_url
      ? `<img src="${esc(livro.capa_url)}" alt="capa" loading="lazy">`
      : `<i class="fa-solid fa-book-open book-card-cover-placeholder"></i>`;

    return `
      <div class="book-card" data-id="${livro.id}">
        <div class="book-card-cover">${cover}</div>
        <div class="book-card-body">
          <div class="book-card-title">${esc(livro.titulo)}</div>
          <div class="book-card-author">${esc(livro.autor || '')}</div>
          <div class="book-card-badges">
            ${PUI.availBadge(livro.disponiveis)}
            <span class="pbadge pbadge-gray">${esc(livro.categoria || '')}</span>
          </div>
        </div>
      </div>
    `;
  }

  async function render(params = {}) {
    if (params) Object.assign(state, params);

    PUI.loading('portalContent');

    try {
      if (!cats.length) await loadFilters();

      const data = await PortalAPI.livros({
        q: state.q,
        categoria: state.categoria,
        autor: state.autor,
        disponivel: state.disponivel ? '1' : '',
        page: state.page,
        limit: 12,
      });

      const booksHtml = data.data.length
        ? data.data.map(bookCardHtml).join('')
        : `<div class="portal-empty"><i class="fa-solid fa-magnifying-glass"></i><p>Nenhum livro encontrado.</p></div>`;

      const pagesHtml = data.pages > 1 ? paginationHtml(data.page, data.pages) : '';

      PUI.setContent(`
        <div class="portal-hero">
          <h1><i class="fa-solid fa-book-open"></i> Acervo Digital</h1>
          <p>Pesquise, veja disponibilidade e faça reservas online</p>
          <div class="search-bar">
            <input type="text" id="searchInput" placeholder="Título, autor ou ISBN…" value="${esc(state.q)}" />
            <button id="searchBtn"><i class="fa-solid fa-search"></i></button>
          </div>
        </div>
        ${filtersHtml()}
        <div class="filter-count" style="margin-bottom:.75rem;color:var(--p-text-muted);font-size:.85rem;">
          ${data.total} livro${data.total !== 1 ? 's' : ''} encontrado${data.total !== 1 ? 's' : ''}
        </div>
        <div class="book-grid" id="bookGrid">${booksHtml}</div>
        ${pagesHtml}
      `);

      bindEvents();
    } catch (err) {
      PUI.setContent(`<div class="portal-empty"><i class="fa-solid fa-circle-exclamation"></i><p>${esc(err.message)}</p></div>`);
    }
  }

  function paginationHtml(current, total) {
    let btns = `<button ${current <= 1 ? 'disabled' : ''} data-pg="${current - 1}">‹</button>`;
    for (let i = 1; i <= total; i++) {
      if (total > 7 && Math.abs(i - current) > 2 && i !== 1 && i !== total) {
        if (i === 2 || i === total - 1) btns += `<button disabled>…</button>`;
        continue;
      }
      btns += `<button class="${i === current ? 'active' : ''}" data-pg="${i}">${i}</button>`;
    }
    btns += `<button ${current >= total ? 'disabled' : ''} data-pg="${current + 1}">›</button>`;
    return `<div class="portal-pagination">${btns}</div>`;
  }

  function bindEvents() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn   = document.getElementById('searchBtn');

    function doSearch() {
      state.q = (searchInput?.value || '').trim();
      state.page = 1;
      render();
    }

    searchBtn?.addEventListener('click', doSearch);
    searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

    document.getElementById('filterCat')?.addEventListener('change', e => {
      state.categoria = e.target.value;
      state.page = 1;
      render();
    });
    document.getElementById('filterAut')?.addEventListener('change', e => {
      state.autor = e.target.value;
      state.page = 1;
      render();
    });
    document.getElementById('filterDisp')?.addEventListener('change', e => {
      state.disponivel = e.target.checked;
      state.page = 1;
      render();
    });

    document.getElementById('bookGrid')?.addEventListener('click', e => {
      const card = e.target.closest('.book-card');
      if (card) PortalRouter.go('book', { id: card.dataset.id });
    });

    document.querySelector('.portal-pagination')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-pg]');
      if (btn && !btn.disabled) {
        state.page = Number(btn.dataset.pg);
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  return { render };
})();
