/* pages/emprestimos.js */
const EmprestimosPage = (() => {
  let state = { tab: 'ativos', page: 1, limit: 15, id_membro: '', id_livro: '' };

  async function render() {
    state = { tab: 'ativos', page: 1, limit: 15, id_membro: '', id_livro: '' };
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-primary" onclick="EmprestimosPage.openNovoModal()">
        <i class="fa-solid fa-plus"></i> Novo Empréstimo
      </button>`;
    document.getElementById('mainContent').innerHTML = `
      <div class="tabs" id="empTabs">
        <button class="tab-btn active" data-tab="ativos">Ativos</button>
        <button class="tab-btn" data-tab="atrasados" id="tabAtrasados">Atrasados</button>
        <button class="tab-btn" data-tab="todos">Todos</button>
      </div>
      <div class="page-header" id="empFilters" style="display:none">
        <div class="page-filters">
          <input class="input" id="fMembro" placeholder="ID do membro…" type="number">
          <input class="input" id="fLivro" placeholder="ID do livro…" type="number">
        </div>
      </div>
      <div class="card" id="empCard">${UI.loadingHtml()}</div>`;

    document.querySelectorAll('#empTabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#empTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.tab = btn.dataset.tab;
        state.page = 1;
        document.getElementById('empFilters').style.display = state.tab === 'todos' ? 'flex' : 'none';
        loadData();
      });
    });
    ['fMembro','fLivro'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', debounce(() => {
        state.id_membro = document.getElementById('fMembro').value;
        state.id_livro  = document.getElementById('fLivro').value;
        state.page = 1; loadData();
      }, 400));
    });

    // Load atrasados count for badge
    try {
      const { atrasados } = await API.atrasados();
      const cnt = atrasados.length;
      if (cnt > 0) document.getElementById('tabAtrasados').innerHTML =
        `Atrasados <span class="tab-badge">${cnt}</span>`;
    } catch { /* ignore */ }

    loadData();
  }

  async function loadData() {
    document.getElementById('empCard').innerHTML = UI.loadingHtml();
    try {
      let data;
      if (state.tab === 'atrasados') {
        data = await API.atrasados();
        renderAtrasados(data);
        return;
      }
      const params = { page: state.page, limit: state.limit };
      if (state.tab === 'ativos') params.status = 'Ativo';
      if (state.id_membro) params.id_membro = state.id_membro;
      if (state.id_livro)  params.id_livro  = state.id_livro;
      data = await API.emprestimos(params);

      const html = UI.table(
        ['Membro', 'Livro / Tombo', 'Empréstimo', 'Devolução prevista', 'Status', 'Ações'],
        data.emprestimos,
        e => `
          <td>
            <div style="font-weight:600">${esc(e.membro_nome)}</div>
            <div class="text-muted text-sm">#${e.membro_id}</div>
          </td>
          <td>
            <div>${esc(e.livro_titulo)}</div>
            <div class="text-muted text-sm"><code>${e.num_tombo}</code></div>
          </td>
          <td>${UI.fmtDate(e.data_emprestimo)}</td>
          <td>
            ${UI.fmtDate(e.data_prevista_devolucao)}
            ${e.num_renovacoes > 0 ? `<span class="badge badge-purple" style="margin-left:.25rem">${e.num_renovacoes}x</span>` : ''}
          </td>
          <td>${UI.statusBadge(e.status)}
            ${e.multa_valor ? ` ${UI.pagoBadge(e.multa_paga)}` : ''}</td>
          <td>
            <div class="row-actions">
              ${e.status === 'Ativo' ? `
                <button class="btn btn-sm btn-success" onclick="EmprestimosPage.devolver(${e.id})" title="Devolver">
                  <i class="fa-solid fa-rotate-left"></i> Devolver
                </button>
                <button class="btn btn-sm btn-warning" onclick="EmprestimosPage.renovar(${e.id})" title="Renovar">
                  <i class="fa-solid fa-rotate-right"></i>
                </button>` : ''}
              <button class="btn btn-sm btn-secondary" onclick="EmprestimosPage.openDetail(${e.id})" title="Detalhes">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </td>`
      );
      document.getElementById('empCard').innerHTML = html + UI.pagination(data.total, data.pagina, data.limite,
        `function(p){EmprestimosPage._goPage(p)}`);
    } catch (e) {
      document.getElementById('empCard').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  function renderAtrasados({ atrasados, multa_diaria }) {
    const html = UI.table(
      ['Membro', 'Livro / Tombo', 'Vencimento', 'Dias atraso', 'Multa', 'Contato', 'Ação'],
      atrasados,
      e => `
        <td>
          <div style="font-weight:600">${esc(e.membro_nome)}</div>
        </td>
        <td>
          <div>${esc(e.livro_titulo)}</div>
          <code>${e.num_tombo}</code>
        </td>
        <td>${UI.fmtDate(e.data_prevista_devolucao)}</td>
        <td><span class="badge badge-red">${e.dias_atraso} dias</span></td>
        <td style="font-weight:600;color:#dc2626">${UI.fmtCurrency(e.multa_estimada)}</td>
        <td class="text-sm text-muted">${e.email||''}<br>${e.telefone||''}</td>
        <td>
          <button class="btn btn-sm btn-success" onclick="EmprestimosPage.devolver(${e.id})">
            <i class="fa-solid fa-rotate-left"></i> Devolver
          </button>
        </td>`
    );
    document.getElementById('empCard').innerHTML = html;
  }

  function _goPage(p) { state.page = p; loadData(); }

  /* ===== DETAIL ===== */
  async function openDetail(id) {
    UI.openModal('Detalhes do Empréstimo', UI.loadingHtml(), '', true);
    try {
      const e = await API.emprestimo(id);
      const body = `
        <div class="detail-grid">
          <div class="detail-item"><label>Status</label><span>${UI.statusBadge(e.status)}</span></div>
          <div class="detail-item"><label>Membro</label><span>${esc(e.membro_nome)}</span></div>
          <div class="detail-item"><label>Livro</label><span>${esc(e.livro_titulo)}</span></div>
          <div class="detail-item"><label>Número de tombo</label><span><code>${e.num_tombo}</code></span></div>
          <div class="detail-item"><label>Data de empréstimo</label><span>${UI.fmtDate(e.data_emprestimo)}</span></div>
          <div class="detail-item"><label>Devolução prevista</label><span>${UI.fmtDate(e.data_prevista_devolucao)}</span></div>
          <div class="detail-item"><label>Data devolvido</label><span>${UI.fmtDate(e.data_devolucao)}</span></div>
          <div class="detail-item"><label>Renovações</label><span>${e.num_renovacoes}</span></div>
          ${e.dias_atraso > 0 ? `<div class="detail-item"><label>Dias de atraso</label>
            <span class="badge badge-red">${e.dias_atraso} dias</span></div>` : ''}
          ${e.multa_valor ? `<div class="detail-item"><label>Multa</label>
            <span>${UI.fmtCurrency(e.multa_valor)} — ${UI.pagoBadge(e.multa_paga)}</span></div>` : ''}
        </div>`;

      UI.openModal('Empréstimo #' + id, body,
        `<button class="btn btn-secondary" onclick="UI.closeModal()">Fechar</button>
         ${e.status === 'Ativo' ? `
           <button class="btn btn-warning" onclick="EmprestimosPage.renovar(${id})">
             <i class="fa-solid fa-rotate-right"></i> Renovar
           </button>
           <button class="btn btn-success" onclick="EmprestimosPage.devolver(${id})">
             <i class="fa-solid fa-rotate-left"></i> Devolver
           </button>` : ''}`, true);
    } catch (e) {
      document.getElementById('modalBody').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  /* ===== DEVOLVER ===== */
  async function devolver(id) {
    const ok = await UI.confirm('Confirmar devolução deste livro?', 'Devolver');
    if (!ok) return;
    try {
      const r = await API.devolverEmp(id);
      let msg = r.mensagem;
      if (r.multa_gerada) msg += ` Multa gerada: ${UI.fmtCurrency(r.multa_gerada.valor)} (${r.multa_gerada.motivo})`;
      if (r.aviso_reserva) msg += ` ⚠️ ${r.aviso_reserva.mensagem}`;
      UI.toast(msg, r.multa_gerada ? 'warning' : 'success');
      UI.closeModal();
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  /* ===== RENOVAR ===== */
  async function renovar(id) {
    const ok = await UI.confirm('Renovar o prazo deste empréstimo?', 'Renovar');
    if (!ok) return;
    try {
      const r = await API.renovarEmp(id);
      UI.toast(`${r.mensagem} Nova data: ${UI.fmtDate(r.nova_data_devolucao)}`);
      UI.closeModal();
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  /* ===== NOVO EMPRÉSTIMO ===== */
  async function openNovoModal() {
    UI.openModal('Novo Empréstimo', `
      <form id="empForm">
        <div class="section-title" style="margin-top:0">1. Selecionar Membro</div>
        <div class="form-group">
          <label>Buscar membro *</label>
          <div class="search-combo">
            <input class="input" id="empMembroInput" placeholder="Nome, CPF…" autocomplete="off">
            <ul class="search-combo-list" id="empMembroList" style="display:none"></ul>
          </div>
          <input type="hidden" id="empMembroId" name="id_membro">
          <div id="membroInfo" class="text-sm text-muted mt-1"></div>
        </div>

        <div class="section-title">2. Selecionar Exemplar</div>
        <div class="form-group">
          <label>Buscar livro *</label>
          <div class="search-combo">
            <input class="input" id="empLivroInput" placeholder="Título, ISBN…" autocomplete="off">
            <ul class="search-combo-list" id="empLivroList" style="display:none"></ul>
          </div>
        </div>
        <div class="form-group" id="empExemplarGroup" style="display:none">
          <label>Exemplar disponível *</label>
          <select class="input" id="empExemplarSel" name="id_exemplar">
            <option value="">— selecione —</option>
          </select>
        </div>
      </form>`,
      `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" id="btnSalvarEmp" onclick="EmprestimosPage.salvarNovo()">
         <i class="fa-solid fa-check"></i> Emprestar
       </button>`);

    // Membro combo
    UI.searchCombo(
      document.getElementById('empMembroInput'),
      document.getElementById('empMembroList'),
      async q => {
        const data = await API.membros({ busca: q, ativo: '1', limit: 8 });
        return data.membros.map(m => ({ ...m, _label: `${m.nome} — ${m.cpf}` }));
      },
      m => {
        document.getElementById('empMembroId').value = m.id;
        document.getElementById('empMembroInput').value = m.nome;
        document.getElementById('membroInfo').innerHTML =
          `${UI.tipoBadge(m.tipo)} ${UI.ativoBadge(m.ativo)}
           ${m.multas_pendentes > 0 ? `<span class="badge badge-red">Multa: ${UI.fmtCurrency(m.multas_pendentes)}</span>` : ''}
           ${m.emprestimos_ativos > 0 ? `<span class="badge badge-blue">${m.emprestimos_ativos} emp. ativo(s)</span>` : ''}`;
      }
    );

    // Livro combo
    UI.searchCombo(
      document.getElementById('empLivroInput'),
      document.getElementById('empLivroList'),
      async q => {
        const data = await API.livros({ busca: q, disponivel: '1', limit: 8 });
        return data.livros.map(l => ({ ...l, _label: `${l.titulo} — ${l.autor_nome||''}` }));
      },
      async l => {
        document.getElementById('empLivroInput').value = l.titulo;
        const { exemplares } = await API.exemplares(l.id);
        const disponiveis = exemplares.filter(e => e.disponivel);
        const grp = document.getElementById('empExemplarGroup');
        const sel = document.getElementById('empExemplarSel');
        sel.innerHTML = '<option value="">— selecione —</option>' +
          disponiveis.map(e => `<option value="${e.id}">${e.num_tombo} — ${e.condicao}</option>`).join('');
        grp.style.display = disponiveis.length ? 'flex' : 'none';
        if (!disponiveis.length) grp.innerHTML = '<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i>Nenhum exemplar disponível para este livro.</div>';
      }
    );
  }

  async function salvarNovo() {
    const idMembro   = document.getElementById('empMembroId')?.value;
    const idExemplar = document.getElementById('empExemplarSel')?.value;
    if (!idMembro)   { UI.toast('Selecione um membro.', 'warning'); return; }
    if (!idExemplar) { UI.toast('Selecione um exemplar.', 'warning'); return; }
    const btn = document.getElementById('btnSalvarEmp');
    btn.disabled = true;
    try {
      const r = await API.realizarEmp({ id_membro: Number(idMembro), id_exemplar: Number(idExemplar) });
      UI.toast(`Empréstimo realizado! Devolução prevista: ${UI.fmtDate(r.data_prevista_devolucao)}`);
      UI.closeModal();
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); btn.disabled = false; }
  }

  return { render, loadData, _goPage, openDetail, devolver, renovar, openNovoModal, salvarNovo };
})();
