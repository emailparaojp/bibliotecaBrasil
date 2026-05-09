/* portal-minha-area.js — member area (tabs: reservas, histórico, multas, perfil) */

const MinhaAreaPage = (() => {

  let activeTab = 'reservas';

  function getMember() {
    try { return JSON.parse(localStorage.getItem('memberInfo')); } catch { return null; }
  }

  async function render(params = {}) {
    const member = getMember();
    if (!member) { PortalRouter.go('login'); return; }

    if (params.tab) activeTab = params.tab;

    PUI.loading('portalContent');
    try {
      // Fetch all in parallel
      const [reservas, historico, multas, perfil] = await Promise.all([
        PortalAPI.minhasReservas(),
        PortalAPI.meuHistorico(),
        PortalAPI.minhasMultas(),
        PortalAPI.me(),
      ]);

      // Store updated member info
      const semSenha = { ...perfil }; delete semSenha.senha_hash;
      localStorage.setItem('memberInfo', JSON.stringify(semSenha));

      const multasPend = multas.filter(m => !m.pago);
      const multasVal  = multasPend.reduce((a, m) => a + m.valor, 0);

      PUI.setContent(`
        <div class="minha-area-header">
          <h1><i class="fa-solid fa-user-circle" style="color:var(--p-primary);"></i> Minha Área</h1>
          <p>Olá, <strong>${esc(perfil.nome.split(' ')[0])}</strong>! Tipo: <strong>${esc(perfil.tipo)}</strong>
            ${multasPend.length ? `<span class="pbadge pbadge-red" style="margin-left:.5rem;"><i class="fa-solid fa-triangle-exclamation"></i> ${PUI.currency(multasVal)} em multas</span>` : ''}
          </p>
        </div>

        <div class="area-tabs">
          <button class="area-tab ${activeTab==='reservas'?'active':''}" data-tab="reservas">
            <i class="fa-solid fa-bookmark"></i> Reservas (${reservas.filter(r=>r.status==='Ativa').length})
          </button>
          <button class="area-tab ${activeTab==='historico'?'active':''}" data-tab="historico">
            <i class="fa-solid fa-clock-rotate-left"></i> Histórico
          </button>
          <button class="area-tab ${activeTab==='multas'?'active':''}" data-tab="multas">
            <i class="fa-solid fa-file-invoice-dollar"></i> Multas
            ${multasPend.length ? `<span class="pbadge pbadge-red" style="margin-left:.35rem;">${multasPend.length}</span>` : ''}
          </button>
          <button class="area-tab ${activeTab==='perfil'?'active':''}" data-tab="perfil">
            <i class="fa-solid fa-id-card"></i> Perfil
          </button>
        </div>

        <div class="area-section ${activeTab==='reservas'?'active':''}" id="tabReservas">
          ${reservasHtml(reservas)}
        </div>
        <div class="area-section ${activeTab==='historico'?'active':''}" id="tabHistorico">
          ${historicoHtml(historico)}
        </div>
        <div class="area-section ${activeTab==='multas'?'active':''}" id="tabMultas">
          ${multasHtml(multas)}
        </div>
        <div class="area-section ${activeTab==='perfil'?'active':''}" id="tabPerfil">
          ${perfilHtml(perfil)}
        </div>
      `);

      bindEvents(reservas, perfil);
    } catch (err) {
      PUI.setContent(`<div class="portal-empty"><i class="fa-solid fa-circle-exclamation"></i><p>${esc(err.message)}</p></div>`);
    }
  }

  function reservasHtml(reservas) {
    if (!reservas.length) return empty('bookmark', 'Nenhuma reserva encontrada.');
    return `<div class="portal-card-list">` + reservas.map(r => `
      <div class="portal-list-card">
        <div class="portal-list-card-cover">
          ${r.capa_url ? `<img src="${esc(r.capa_url)}" alt="">` : '<i class="fa-solid fa-book-open"></i>'}
        </div>
        <div class="portal-list-card-info">
          <h4>${esc(r.titulo)}</h4>
          <p>Reservado em ${PUI.formatDate(r.data_reserva)} · Expira ${PUI.formatDate(r.data_expiracao)}</p>
        </div>
        <div style="margin-left:auto;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;">
          ${PUI.statusBadge(r.status)}
          ${r.status === 'Ativa'
            ? `<button class="pbtn pbtn-danger pbtn-sm" data-cancel-id="${r.id}"><i class="fa-solid fa-ban"></i> Cancelar</button>`
            : ''}
        </div>
      </div>
    `).join('') + `</div>`;
  }

  function historicoHtml(emp) {
    if (!emp.length) return empty('clock-rotate-left', 'Nenhum empréstimo no histórico.');
    return `<div class="portal-card-list">` + emp.map(e => `
      <div class="portal-list-card">
        <div class="portal-list-card-cover">
          ${e.capa_url ? `<img src="${esc(e.capa_url)}" alt="">` : '<i class="fa-solid fa-book-open"></i>'}
        </div>
        <div class="portal-list-card-info">
          <h4>${esc(e.titulo)}</h4>
          <p>Empréstimo: ${PUI.formatDate(e.data_emprestimo)} · Previsto: ${PUI.formatDate(e.data_prevista_devolucao)}</p>
          ${e.data_devolucao ? `<p>Devolvido: ${PUI.formatDate(e.data_devolucao)}</p>` : ''}
        </div>
        <div style="margin-left:auto;">
          ${PUI.statusBadge(e.status)}
        </div>
      </div>
    `).join('') + `</div>`;
  }

  function multasHtml(multas) {
    if (!multas.length) return empty('file-invoice-dollar', 'Nenhuma multa encontrada.');
    return `<div class="portal-card-list">` + multas.map(m => `
      <div class="portal-list-card">
        <div class="portal-list-card-cover">
          ${m.capa_url ? `<img src="${esc(m.capa_url)}" alt="">` : '<i class="fa-solid fa-book-open"></i>'}
        </div>
        <div class="portal-list-card-info">
          <h4>${esc(m.titulo || 'Livro não identificado')}</h4>
          <p>${esc(m.motivo || '')} · ${PUI.formatDate(m.created_at)}</p>
        </div>
        <div style="margin-left:auto;text-align:right;">
          <div class="multa-value ${m.pago ? 'paga' : ''}">${PUI.currency(m.valor)}</div>
          ${m.pago
            ? `<span class="pbadge pbadge-green"><i class="fa-solid fa-check"></i> Pago</span>`
            : `<span class="pbadge pbadge-red"><i class="fa-solid fa-circle-xmark"></i> Pendente</span>`}
        </div>
      </div>
    `).join('') + `</div>`;
  }

  function perfilHtml(p) {
    return `
      <div style="max-width:500px;">
        <form id="perfilForm">
          <div class="form-group">
            <label>Nome completo</label>
            <input type="text" id="pNome" value="${esc(p.nome)}" />
          </div>
          <div class="form-group">
            <label>CPF (não editável)</label>
            <input type="text" value="${esc(p.cpf)}" disabled />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>E-mail</label>
              <input type="email" id="pEmail" value="${esc(p.email || '')}" />
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="text" id="pTelefone" value="${esc(p.telefone || '')}" />
            </div>
          </div>
          <div class="form-group">
            <label>Endereço</label>
            <input type="text" id="pEndereco" value="${esc(p.endereco || '')}" />
          </div>

          <hr style="border:none;border-top:1px solid var(--p-border);margin:1.5rem 0;">
          <p style="font-size:.875rem;font-weight:600;margin-bottom:1rem;color:var(--p-text);">Alterar senha (opcional)</p>
          <div class="form-group">
            <label>Senha atual</label>
            <input type="password" id="pSenhaAtual" placeholder="Deixe em branco para não alterar" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Nova senha</label>
              <input type="password" id="pNovaSenha" placeholder="Mín. 6 caracteres" />
            </div>
            <div class="form-group">
              <label>Confirmar nova senha</label>
              <input type="password" id="pNovaSenha2" placeholder="Repita" />
            </div>
          </div>

          <p id="perfilError" style="color:var(--p-danger);font-size:.875rem;min-height:1.2rem;margin-bottom:.5rem;"></p>
          <button type="submit" class="pbtn pbtn-primary" id="btnSalvarPerfil">
            <i class="fa-solid fa-floppy-disk"></i> Salvar alterações
          </button>
        </form>
      </div>
    `;
  }

  function empty(icon, msg) {
    return `<div class="portal-empty"><i class="fa-solid fa-${esc(icon)}"></i><p>${esc(msg)}</p></div>`;
  }

  function bindEvents(reservas, perfil) {
    // Tab switching
    document.querySelectorAll('.area-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        document.querySelectorAll('.area-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.area-section').forEach(s => s.classList.remove('active'));
        document.getElementById('tab' + capitalize(btn.dataset.tab))?.classList.add('active');
      });
    });

    // Cancel reserva buttons
    document.querySelectorAll('[data-cancel-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Cancelar esta reserva?')) return;
        btn.disabled = true;
        try {
          await PortalAPI.cancelarReserva(btn.dataset.cancelId);
          PUI.toast('Reserva cancelada.', 'success');
          render();
        } catch (err) {
          PUI.toast(err.message, 'error');
          btn.disabled = false;
        }
      });
    });

    // Perfil form
    document.getElementById('perfilForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      document.getElementById('perfilError').textContent = '';
      const btn = document.getElementById('btnSalvarPerfil');
      btn.disabled = true;

      const body = {
        nome:     document.getElementById('pNome').value.trim(),
        email:    document.getElementById('pEmail').value.trim() || null,
        telefone: document.getElementById('pTelefone').value.trim() || null,
        endereco: document.getElementById('pEndereco').value.trim() || null,
      };

      const novaSenha  = document.getElementById('pNovaSenha').value;
      const novaSenha2 = document.getElementById('pNovaSenha2').value;
      const senhaAtual = document.getElementById('pSenhaAtual').value;

      if (novaSenha) {
        if (novaSenha.length < 6) { document.getElementById('perfilError').textContent = 'Nova senha deve ter no mínimo 6 caracteres.'; btn.disabled = false; return; }
        if (novaSenha !== novaSenha2) { document.getElementById('perfilError').textContent = 'Nova senha e confirmação não coincidem.'; btn.disabled = false; return; }
        body.nova_senha = novaSenha;
        body.senha_atual = senhaAtual;
      }

      try {
        const r = await PortalAPI.updateMe(body);
        localStorage.setItem('memberInfo', JSON.stringify(r.membro));
        PUI.toast('Perfil atualizado!', 'success');
        updateHeaderActions();
      } catch (err) {
        document.getElementById('perfilError').textContent = err.message;
      } finally {
        btn.disabled = false;
      }
    });
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  return { render };
})();
