/* pages/reservas.js */
const ReservasPage = (() => {
  let state = { status: 'Ativa', page: 1, limit: 15 };

  async function render() {
    state = { status: 'Ativa', page: 1, limit: 15 };
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-primary" onclick="ReservasPage.openNovaModal()">
        <i class="fa-solid fa-plus"></i> Nova Reserva
      </button>`;
    document.getElementById('mainContent').innerHTML = `
      <div class="tabs" id="resTabs">
        <button class="tab-btn active" data-status="Ativa">Ativas</button>
        <button class="tab-btn" data-status="Expirada">Expiradas</button>
        <button class="tab-btn" data-status="Concluida">Concluídas</button>
        <button class="tab-btn" data-status="Cancelada">Canceladas</button>
        <button class="tab-btn" data-status="">Todas</button>
      </div>
      <div class="card" id="resCard">${UI.loadingHtml()}</div>`;

    document.querySelectorAll('#resTabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#resTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.status = btn.dataset.status;
        state.page = 1;
        loadData();
      });
    });
    loadData();
  }

  async function loadData() {
    document.getElementById('resCard').innerHTML = UI.loadingHtml();
    try {
      const params = {};
      if (state.status) params.status = state.status;
      const reservas = await API.reservas(params);
      const html = UI.table(
        ['Membro', 'Livro', 'Data reserva', 'Expira em', 'Disponíveis', 'Status', 'Ações'],
        reservas,
        r => `
          <td>
            <div style="font-weight:600">${esc(r.membro_nome)}</div>
            <div class="text-muted text-sm">#${r.membro_id}</div>
          </td>
          <td>
            <div>${esc(r.livro_titulo)}</div>
            <div class="text-muted text-sm">${r.isbn||''}</div>
          </td>
          <td>${UI.fmtDateTime(r.data_reserva)}</td>
          <td>${UI.fmtDate(r.data_expiracao)}</td>
          <td style="text-align:center">
            <span class="badge ${r.exemplares_disponiveis>0?'badge-green':'badge-red'}">
              ${r.exemplares_disponiveis}
            </span>
          </td>
          <td>${UI.statusBadge(r.status)}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-sm btn-secondary" onclick="ReservasPage.verFila(${r.livro_id},'${esc(r.livro_titulo)}')" title="Ver fila">
                <i class="fa-solid fa-list-ol"></i>
              </button>
              ${r.status === 'Ativa' ? `
                <button class="btn btn-sm btn-danger" onclick="ReservasPage.cancelar(${r.id},'${esc(r.membro_nome)}')" title="Cancelar">
                  <i class="fa-solid fa-xmark"></i> Cancelar
                </button>` : ''}
            </div>
          </td>`
      );
      document.getElementById('resCard').innerHTML = html ||
        UI.emptyHtml('Nenhuma reserva encontrada.');
    } catch (e) {
      document.getElementById('resCard').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  async function cancelar(id, nome) {
    const ok = await UI.confirm(`Cancelar a reserva de <strong>${esc(nome)}</strong>?`, 'Cancelar reserva');
    if (!ok) return;
    try {
      await API.cancelarRes(id);
      UI.toast('Reserva cancelada.');
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  async function verFila(idLivro, titulo) {
    UI.openModal(`Fila de reservas — ${esc(titulo)}`, UI.loadingHtml(),
      `<button class="btn btn-secondary" onclick="UI.closeModal()">Fechar</button>`, true);
    try {
      const data = await API.filaReserva(idLivro);
      const body = `
        <div class="detail-grid" style="margin-bottom:1rem">
          <div class="detail-item"><label>Livro</label><span>${esc(data.livro)}</span></div>
          <div class="detail-item"><label>Exemplares disponíveis</label>
            <span class="badge ${data.exemplares_disponiveis>0?'badge-green':'badge-red'}">${data.exemplares_disponiveis}</span></div>
        </div>
        ${data.fila.length === 0 ? UI.emptyHtml('Fila vazia.') :
          UI.table(['Posição','Membro','Data reserva','Expira em'],
          data.fila,
          f => `<td><span class="badge badge-blue">${f.posicao}º</span></td>
                <td>${esc(f.membro_nome)}</td>
                <td>${UI.fmtDateTime(f.data_reserva)}</td>
                <td>${UI.fmtDate(f.data_expiracao)}</td>`)}`;
      document.getElementById('modalBody').innerHTML = body;
    } catch (e) {
      document.getElementById('modalBody').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  async function openNovaModal() {
    UI.openModal('Nova Reserva', `
      <form id="resForm">
        <div class="form-group" style="margin-bottom:1rem">
          <label>Membro *</label>
          <div class="search-combo">
            <input class="input" id="resMembroInput" placeholder="Buscar membro…" autocomplete="off">
            <ul class="search-combo-list" id="resMembroList" style="display:none"></ul>
          </div>
          <input type="hidden" id="resMembroId" name="id_membro">
          <div id="resMembroInfo" class="text-sm mt-1"></div>
        </div>
        <div class="form-group">
          <label>Livro *</label>
          <div class="search-combo">
            <input class="input" id="resLivroInput" placeholder="Buscar livro (apenas indisponíveis)…" autocomplete="off">
            <ul class="search-combo-list" id="resLivroList" style="display:none"></ul>
          </div>
          <input type="hidden" id="resLivroId" name="id_livro">
          <div id="resLivroInfo" class="text-sm mt-1"></div>
        </div>
      </form>`,
      `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" id="btnSalvarRes" onclick="ReservasPage.salvarNova()">
         <i class="fa-solid fa-bookmark"></i> Reservar
       </button>`);

    UI.searchCombo(
      document.getElementById('resMembroInput'),
      document.getElementById('resMembroList'),
      async q => { const d = await API.membros({ busca: q, ativo: '1', limit: 8 }); return d.membros.map(m => ({ ...m, _label: `${m.nome} — ${m.cpf}` })); },
      m => {
        document.getElementById('resMembroId').value = m.id;
        document.getElementById('resMembroInput').value = m.nome;
        document.getElementById('resMembroInfo').innerHTML = `${UI.tipoBadge(m.tipo)}`;
      }
    );

    UI.searchCombo(
      document.getElementById('resLivroInput'),
      document.getElementById('resLivroList'),
      async q => {
        const d = await API.livros({ busca: q, disponivel: '0', limit: 8 });
        return d.livros.map(l => ({ ...l, _label: `${l.titulo} — ${l.autor_nome||''}` }));
      },
      l => {
        document.getElementById('resLivroId').value = l.id;
        document.getElementById('resLivroInput').value = l.titulo;
        document.getElementById('resLivroInfo').innerHTML =
          `<span class="badge badge-red">0 exemplares disponíveis</span>`;
      }
    );
  }

  async function salvarNova() {
    const idMembro = document.getElementById('resMembroId')?.value;
    const idLivro  = document.getElementById('resLivroId')?.value;
    if (!idMembro) { UI.toast('Selecione um membro.', 'warning'); return; }
    if (!idLivro)  { UI.toast('Selecione um livro.', 'warning'); return; }
    const btn = document.getElementById('btnSalvarRes');
    btn.disabled = true;
    try {
      const r = await API.criarReserva({ id_membro: Number(idMembro), id_livro: Number(idLivro) });
      UI.toast(`Reserva realizada! Posição na fila: ${r.posicao_fila}º. Expira em: ${UI.fmtDate(r.data_expiracao)}`);
      UI.closeModal();
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); btn.disabled = false; }
  }

  return { render, loadData, cancelar, verFila, openNovaModal, salvarNova };
})();
