/* portal-book.js — book detail page */

const BookPage = (() => {

  async function render({ id }) {
    PUI.loading('portalContent');
    try {
      const livro = await PortalAPI.livro(id);

      const cover = livro.capa_url
        ? `<img src="${esc(livro.capa_url)}" alt="capa">`
        : `<i class="fa-solid fa-book-open book-detail-cover-placeholder"></i>`;

      const exemplaresHtml = livro.exemplares.length
        ? livro.exemplares.map(ex => `
            <div class="exemplar-item">
              <span class="exemplar-code">${esc(ex.codigo)}</span>
              ${PUI.statusBadge(ex.status)}
              <span class="pbadge pbadge-gray">${esc(ex.condicao || '')}</span>
              ${ex.localizacao ? `<span style="color:var(--p-text-muted);font-size:.8rem;">${esc(ex.localizacao)}</span>` : ''}
            </div>
          `).join('')
        : `<p style="color:var(--p-text-muted);">Nenhum exemplar cadastrado.</p>`;

      const totalDisp = livro.exemplares.filter(e => e.status === 'Disponível').length;
      const member = getMember();

      let reserveBtn = '';
      if (totalDisp > 0 || livro.exemplares.length > 0) {
        if (member) {
          reserveBtn = `<button class="pbtn pbtn-primary" id="btnReservar"><i class="fa-solid fa-bookmark"></i> Reservar</button>`;
        } else {
          reserveBtn = `<button class="pbtn pbtn-outline" id="btnLoginToReserve"><i class="fa-solid fa-lock"></i> Entrar para reservar</button>`;
        }
      }

      PUI.setContent(`
        <button class="portal-back" id="backBtn"><i class="fa-solid fa-arrow-left"></i> Voltar ao acervo</button>
        <div class="book-detail">
          <div class="book-detail-top">
            <div class="book-detail-cover">${cover}</div>
            <div class="book-detail-info">
              <h1>${esc(livro.titulo)}</h1>
              <div class="book-detail-meta">
                ${livro.autor    ? `<span><strong>Autor:</strong> ${esc(livro.autor)}</span>` : ''}
                ${livro.editora  ? `<span><strong>Editora:</strong> ${esc(livro.editora)}</span>` : ''}
                ${livro.categoria? `<span><strong>Categoria:</strong> ${esc(livro.categoria)}</span>` : ''}
                ${livro.ano_publicacao ? `<span><strong>Ano:</strong> ${livro.ano_publicacao}</span>` : ''}
                ${livro.isbn     ? `<span><strong>ISBN:</strong> ${esc(livro.isbn)}</span>` : ''}
                ${livro.edicao   ? `<span><strong>Edição:</strong> ${esc(livro.edicao)}</span>` : ''}
              </div>
              ${PUI.availBadge(totalDisp)}
              <div style="margin-top:1.25rem;display:flex;gap:.75rem;flex-wrap:wrap;">
                ${reserveBtn}
              </div>
            </div>
          </div>

          ${livro.descricao ? `
            <div class="book-detail-section">
              <h3>Sinopse</h3>
              <p style="line-height:1.65;color:var(--p-text-muted);">${esc(livro.descricao)}</p>
            </div>` : ''}

          <div class="book-detail-section">
            <h3>Exemplares (${livro.exemplares.length})</h3>
            <div class="exemplar-list">${exemplaresHtml}</div>
          </div>

          ${livro.biografia ? `
            <div class="book-detail-section">
              <h3>Sobre o Autor</h3>
              <p style="line-height:1.65;color:var(--p-text-muted);">${esc(livro.biografia)}</p>
            </div>` : ''}
        </div>
      `);

      // Events
      document.getElementById('backBtn')?.addEventListener('click', () => PortalRouter.go('catalog'));

      document.getElementById('btnReservar')?.addEventListener('click', () => reservar(livro));

      document.getElementById('btnLoginToReserve')?.addEventListener('click', () => {
        PortalRouter.go('login', { redirect: `book:${id}` });
      });

    } catch (err) {
      PUI.setContent(`<div class="portal-empty"><i class="fa-solid fa-circle-exclamation"></i><p>${esc(err.message)}</p></div>`);
    }
  }

  async function reservar(livro) {
    const btn = document.getElementById('btnReservar');
    if (btn) { btn.disabled = true; btn.textContent = 'Aguarde…'; }
    try {
      const r = await PortalAPI.criarReserva({ id_livro: livro.id });
      PUI.toast(r.mensagem, 'success', 5000);
    } catch (err) {
      PUI.toast(err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Reservar'; }
    }
  }

  function getMember() {
    try { return JSON.parse(localStorage.getItem('memberInfo')); } catch { return null; }
  }

  return { render };
})();
