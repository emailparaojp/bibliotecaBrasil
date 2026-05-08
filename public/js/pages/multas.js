/* pages/multas.js */
const MultasPage = (() => {
  let state = { pago: '0', page: 1, limit: 15 };

  async function render() {
    state = { pago: '0', page: 1, limit: 15 };
    document.getElementById('topbarActions').innerHTML = '';
    document.getElementById('mainContent').innerHTML = `
      <div class="tabs" id="multaTabs">
        <button class="tab-btn active" data-pago="0">Pendentes</button>
        <button class="tab-btn" data-pago="1">Pagas</button>
        <button class="tab-btn" data-pago="">Todas</button>
      </div>
      <div id="multaSumario" style="margin-bottom:1rem"></div>
      <div class="card" id="multaCard">${UI.loadingHtml()}</div>`;

    document.querySelectorAll('#multaTabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#multaTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.pago = btn.dataset.pago;
        state.page = 1;
        loadData();
      });
    });
    loadData();
  }

  async function loadData() {
    document.getElementById('multaCard').innerHTML = UI.loadingHtml();
    try {
      const params = { page: state.page, limit: state.limit };
      if (state.pago !== '') params.pago = state.pago;
      const data = await API.multas(params);

      // Sumário financeiro
      document.getElementById('multaSumario').innerHTML = `
        <div style="display:flex;gap:1rem;flex-wrap:wrap">
          <div class="stat-card" style="flex:1;min-width:140px">
            <div class="stat-icon red"><i class="fa-solid fa-file-invoice-dollar"></i></div>
            <div><div class="stat-value">${data.total_multas||0}</div><div class="stat-label">Total de multas</div></div>
          </div>
          <div class="stat-card" style="flex:1;min-width:140px">
            <div class="stat-icon red"><i class="fa-solid fa-circle-xmark"></i></div>
            <div><div class="stat-value">${UI.fmtCurrency(data.total_pendente)}</div><div class="stat-label">Valor pendente</div></div>
          </div>
          <div class="stat-card" style="flex:1;min-width:140px">
            <div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div>
            <div><div class="stat-value">${UI.fmtCurrency(data.total_recebido)}</div><div class="stat-label">Valor recebido</div></div>
          </div>
        </div>`;

      const html = UI.table(
        ['Membro', 'Livro', 'Motivo', 'Valor', 'Gerada em', 'Status', 'Ações'],
        data.multas,
        m => `
          <td>
            <div style="font-weight:600">${esc(m.membro_nome)}</div>
            <div class="text-muted text-sm">#${m.membro_id}</div>
          </td>
          <td>${esc(m.livro_titulo)}</td>
          <td class="text-sm">${esc(m.motivo)}</td>
          <td style="font-weight:700;color:${m.pago?'#16a34a':'#dc2626'}">${UI.fmtCurrency(m.valor)}</td>
          <td>${UI.fmtDate(m.data_geracao)}</td>
          <td>${UI.pagoBadge(m.pago)}
            ${m.pago && m.data_pagamento ? `<div class="text-muted text-sm">${UI.fmtDate(m.data_pagamento)}</div>` : ''}</td>
          <td>
            <div class="row-actions">
              ${!m.pago ? `
                <button class="btn btn-sm btn-success" onclick="MultasPage.pagar(${m.id})">
                  <i class="fa-solid fa-money-bill"></i> Pagar
                </button>
                <button class="btn btn-sm btn-secondary" onclick="MultasPage.pagarTodas(${m.membro_id},'${esc(m.membro_nome)}')" title="Quitar todas do membro">
                  <i class="fa-solid fa-check-double"></i>
                </button>` : ''}
            </div>
          </td>`
      );
      document.getElementById('multaCard').innerHTML = html + UI.pagination(data.total, data.pagina||1, data.limite||state.limit,
        `function(p){MultasPage._goPage(p)}`);
    } catch (e) {
      document.getElementById('multaCard').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  function _goPage(p) { state.page = p; loadData(); }

  async function pagar(id) {
    const ok = await UI.confirm('Registrar pagamento desta multa?', 'Confirmar pagamento');
    if (!ok) return;
    try {
      const r = await API.pagarMulta(id);
      UI.toast(`Pagamento de ${UI.fmtCurrency(r.valor)} registrado!`);
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  async function pagarTodas(idMembro, nome) {
    UI.openModal(`Quitar todas as multas — ${esc(nome)}`, UI.loadingHtml(), '', true);
    try {
      const data = await API.multasMembro(idMembro);
      const pendentes = data.multas.filter(m => !m.pago);
      if (!pendentes.length) {
        document.getElementById('modalBody').innerHTML = `<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i>Membro não possui multas pendentes.</div>`;
        document.getElementById('modalFooter').innerHTML = `<button class="btn btn-secondary" onclick="UI.closeModal()">Fechar</button>`;
        return;
      }
      const total = pendentes.reduce((s, m) => s + m.valor, 0);
      document.getElementById('modalBody').innerHTML = `
        <div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i>
          ${pendentes.length} multa(s) pendente(s) totalizando <strong>${UI.fmtCurrency(total)}</strong>.
        </div>
        ${UI.table(['Motivo','Valor','Gerada em'], pendentes, m =>
          `<td>${esc(m.motivo)}</td><td style="font-weight:600">${UI.fmtCurrency(m.valor)}</td><td>${UI.fmtDate(m.data_geracao)}</td>`)}`;

      document.getElementById('modalFooter').innerHTML = `
        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn-success" onclick="MultasPage._confirmarPagarTodas(${idMembro})">
          <i class="fa-solid fa-money-bill-wave"></i> Quitar ${UI.fmtCurrency(total)}
        </button>`;
    } catch (e) {
      document.getElementById('modalBody').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
      document.getElementById('modalFooter').innerHTML = `<button class="btn btn-secondary" onclick="UI.closeModal()">Fechar</button>`;
    }
  }

  async function _confirmarPagarTodas(idMembro) {
    const btn = document.querySelector('#modalFooter .btn-success');
    btn.disabled = true;
    try {
      const r = await API.pagarTodas(idMembro);
      UI.toast(`${r.mensagem} Total: ${UI.fmtCurrency(r.total_pago)}`);
      UI.closeModal();
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); btn.disabled = false; }
  }

  return { render, loadData, _goPage, pagar, pagarTodas, _confirmarPagarTodas };
})();
