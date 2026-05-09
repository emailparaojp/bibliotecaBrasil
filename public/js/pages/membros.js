const MembrosPage = (() => {
  function perfilBadge(perfil) {
    if (perfil === 'admin')        return '<span class="badge" style="background:#6366f1;color:#fff">Admin</span>';
    if (perfil === 'bibliotecario') return '<span class="badge" style="background:#0891b2;color:#fff">Bibliotecário</span>';
    return '<span class="text-muted" style="font-size:.8rem">—</span>';
  }

  let state = { busca: '', tipo: '', ativo: '', page: 1, limit: 15 };

  async function render() {
    state = { busca: '', tipo: '', ativo: '1', page: 1, limit: 15 };
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-primary" onclick="MembrosPage.openForm()">
        <i class="fa-solid fa-plus"></i> Novo Membro
      </button>`;
    document.getElementById('mainContent').innerHTML = `
      <div class="page-header">
        <div class="page-filters">
          <input class="input" id="fBusca" placeholder="Buscar nome, CPF, e-mail…">
          <select class="input" id="fTipo">
            <option value="">Todos os tipos</option>
            <option>Estudante</option><option>Professor</option><option>Comum</option>
          </select>
          <select class="input" id="fAtivo">
            <option value="1">Ativos</option>
            <option value="0">Inativos</option>
            <option value="">Todos</option>
          </select>
        </div>
      </div>
      <div class="card" id="membrosCard">${UI.loadingHtml()}</div>`;

    document.getElementById('fBusca').addEventListener('input', debounce(() => {
      state.busca = document.getElementById('fBusca').value; state.page = 1; loadData();
    }, 350));
    document.getElementById('fTipo').addEventListener('change', e => { state.tipo = e.target.value; state.page = 1; loadData(); });
    document.getElementById('fAtivo').addEventListener('change', e => { state.ativo = e.target.value; state.page = 1; loadData(); });

    loadData();
  }

  async function loadData() {
    document.getElementById('membrosCard').innerHTML = UI.loadingHtml();
    try {
      const data = await API.membros({ ...state, busca: state.busca||undefined, tipo: state.tipo||undefined, ativo: state.ativo||undefined });
      const { membros, total, pagina, limite } = data;
      const html = UI.table(
        ['Nome / CPF', 'Tipo', 'Perfil', 'Validade', 'Emp. Ativos', 'Multas', 'Status', 'Ações'],
        membros,
        m => `
          <td>
            <div style="font-weight:600">${esc(m.nome)}</div>
            <div class="text-muted text-sm">${m.cpf}</div>
          </td>
          <td>${UI.tipoBadge(m.tipo)}</td>
          <td>${perfilBadge(m.perfil)}</td>
          <td class="${new Date(m.data_validade)<new Date()?'' : ''}">
            <span class="${new Date(m.data_validade)<new Date()?'badge badge-red':'text-sm'}">
              ${UI.fmtDate(m.data_validade)}
            </span>
          </td>
          <td style="text-align:center">
            ${m.emprestimos_ativos > 0 ? `<span class="badge badge-blue">${m.emprestimos_ativos}</span>` : '<span class="text-muted">0</span>'}
          </td>
          <td>
            ${m.multas_pendentes > 0 ? `<span class="badge badge-red">${UI.fmtCurrency(m.multas_pendentes)}</span>` : '<span class="text-muted">R$ 0,00</span>'}
          </td>
          <td>${UI.ativoBadge(m.ativo)}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-sm btn-secondary" onclick="MembrosPage.openDetail(${m.id})" title="Detalhes">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-secondary" onclick="MembrosPage.openForm(${m.id})" title="Editar">
                <i class="fa-solid fa-pencil"></i>
              </button>
              <button class="btn btn-sm ${m.ativo?'btn-warning':'btn-success'}"
                onclick="MembrosPage.toggleAtivo(${m.id},${m.ativo},'${esc(m.nome)}')" title="${m.ativo?'Inativar':'Ativar'}">
                <i class="fa-solid ${m.ativo?'fa-ban':'fa-check'}"></i>
              </button>
            </div>
          </td>`
      );
      document.getElementById('membrosCard').innerHTML = html + UI.pagination(total, pagina, limite,
        `function(p){MembrosPage._goPage(p)}`);
    } catch (e) {
      document.getElementById('membrosCard').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  function _goPage(p) { state.page = p; loadData(); }

  /* ===== FORM ===== */
  async function openForm(id = null) {
    const title = id ? 'Editar Membro' : 'Novo Membro';
    UI.openModal(title, UI.loadingHtml(), '', true);
    try {
      let m = {};
      if (id) m = await API.membro(id);

      const body = `
        <form id="membroForm">
          <div class="form-grid">
            <div class="form-group form-col-full">
              <label>Nome completo *</label>
              <input class="input" name="nome" required value="${esc(m.nome||'')}">
            </div>
            <div class="form-group">
              <label>CPF *</label>
              <input class="input" name="cpf" required placeholder="000.000.000-00" value="${esc(m.cpf||'')}" ${id?'readonly':''}>
            </div>
            <div class="form-group">
              <label>Tipo *</label>
              <select class="input" name="tipo">
                ${['Estudante','Professor','Comum'].map(t=>`<option ${m.tipo===t?'selected':''}>${t}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>E-mail</label>
              <input class="input" name="email" type="email" value="${esc(m.email||'')}">
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input class="input" name="telefone" placeholder="(11) 9 0000-0000" value="${esc(m.telefone||'')}">
            </div>
            <div class="form-group form-col-full">
              <label>Endereço</label>
              <input class="input" name="endereco" value="${esc(m.endereco||'')}">
            </div>
            <div class="form-group form-col-full">
              <label>Observações</label>
              <textarea class="input" name="observacoes">${esc(m.observacoes||'')}</textarea>
            </div>
          </div>
        </form>`;

      UI.openModal(title, body,
        `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
         <button class="btn btn-primary" onclick="MembrosPage.salvar(${id||'null'})">
           <i class="fa-solid fa-floppy-disk"></i> Salvar
         </button>`, true);
    } catch (e) {
      document.getElementById('modalBody').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  async function salvar(id) {
    const form = document.getElementById('membroForm');
    if (!form.reportValidity()) return;
    const data = UI.formData(form);
    const btn = document.querySelector('#modalFooter .btn-primary');
    btn.disabled = true;
    try {
      if (id) { await API.editarMembro(id, data); UI.toast('Membro atualizado!'); }
      else    { await API.criarMembro(data);       UI.toast('Membro cadastrado!'); }
      UI.closeModal(); loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { btn.disabled = false; }
  }

  /* ===== DETAIL ===== */
  async function openDetail(id) {
    UI.openModal('Detalhes do Membro', UI.loadingHtml(), '', true);
    try {
      const m = await API.membro(id);
      const expirado = new Date(m.data_validade) < new Date();
      const body = `
        ${m.multas_pendentes > 0 ? `<div class="alert alert-danger"><i class="fa-solid fa-circle-xmark"></i>
          Membro possui ${UI.fmtCurrency(m.multas_pendentes)} em multas pendentes.</div>` : ''}
        ${expirado ? `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i>
          Matrícula expirada em ${UI.fmtDate(m.data_validade)}.</div>` : ''}

        <div class="detail-grid">
          <div class="detail-item"><label>Nome</label><span>${esc(m.nome)}</span></div>
          <div class="detail-item"><label>CPF</label><span>${m.cpf}</span></div>
          <div class="detail-item"><label>Tipo</label><span>${UI.tipoBadge(m.tipo)}</span></div>
          <div class="detail-item"><label>Perfil</label><span>${perfilBadge(m.perfil)}</span></div>
          <div class="detail-item"><label>Status</label><span>${UI.ativoBadge(m.ativo)}</span></div>
          <div class="detail-item"><label>E-mail</label><span>${m.email||'—'}</span></div>
          <div class="detail-item"><label>Telefone</label><span>${m.telefone||'—'}</span></div>
          <div class="detail-item"><label>Cadastro</label><span>${UI.fmtDate(m.data_cadastro)}</span></div>
          <div class="detail-item"><label>Validade</label>
            <span class="${expirado?'badge badge-red':''}">${UI.fmtDate(m.data_validade)}</span></div>
          <div class="detail-item form-col-full"><label>Endereço</label><span>${esc(m.endereco||'—')}</span></div>
        </div>

        ${m.emprestimosAtivos.length > 0 ? `
          <div class="section-title">Empréstimos ativos (${m.emprestimosAtivos.length})</div>
          <div class="table-wrapper"><table>
            <thead><tr><th>Livro</th><th>Tombo</th><th>Empréstimo</th><th>Devolução prevista</th><th>Status</th></tr></thead>
            <tbody>
              ${m.emprestimosAtivos.map(e=>`<tr>
                <td>${esc(e.livro_titulo)}</td><td><code>${e.num_tombo}</code></td>
                <td>${UI.fmtDate(e.data_emprestimo)}</td><td>${UI.fmtDate(e.data_prevista_devolucao)}</td>
                <td>${UI.statusBadge(e.status)}</td></tr>`).join('')}
            </tbody>
          </table></div>` : ''}

        ${m.reservasAtivas.length > 0 ? `
          <div class="section-title">Reservas ativas</div>
          <div class="table-wrapper"><table>
            <thead><tr><th>Livro</th><th>Data reserva</th><th>Expira em</th></tr></thead>
            <tbody>
              ${m.reservasAtivas.map(r=>`<tr>
                <td>${esc(r.livro_titulo)}</td>
                <td>${UI.fmtDateTime(r.data_reserva)}</td>
                <td>${UI.fmtDate(r.data_expiracao)}</td></tr>`).join('')}
            </tbody>
          </table></div>` : ''}`;

      UI.openModal(`👤 ${esc(m.nome)}`, body,
        `<button class="btn btn-secondary" onclick="UI.closeModal()">Fechar</button>
         ${expirado ? `<button class="btn btn-success" onclick="MembrosPage.renovarMat(${id},'${esc(m.nome)}')">
           <i class="fa-solid fa-rotate-right"></i> Renovar Matrícula
         </button>` : ''}
         <button class="btn btn-secondary" onclick="MembrosPage.verHistorico(${id},'${esc(m.nome)}')">
           <i class="fa-solid fa-clock-rotate-left"></i> Histórico
         </button>
         <button class="btn btn-warning" onclick="MembrosPage.gerenciarPerfil(${id},'${esc(m.nome)}','${m.perfil||''}')">
           <i class="fa-solid fa-shield-halved"></i> Perfil
         </button>
         <button class="btn btn-primary" onclick="MembrosPage.openForm(${id})">
           <i class="fa-solid fa-pencil"></i> Editar
         </button>`, true);
    } catch (e) {
      document.getElementById('modalBody').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  async function gerenciarPerfil(id, nome, perfilAtual) {
    const perfilLabel = { '': 'Nenhum (usuário comum)', 'bibliotecario': 'Bibliotecário', 'admin': 'Administrador' };
    const body = `
      <p style="margin-bottom:1rem;">Defina o nível de acesso administrativo de <strong>${esc(nome)}</strong>:</p>
      <div class="form-group">
        <label>Perfil de acesso</label>
        <select class="input" id="selectPerfil">
          <option value=""   ${!perfilAtual                    ? 'selected' : ''}>Nenhum (usuário comum)</option>
          <option value="bibliotecario" ${perfilAtual==='bibliotecario' ? 'selected' : ''}>Bibliotecário — acesso ao painel admin</option>
          <option value="admin"         ${perfilAtual==='admin'         ? 'selected' : ''}>Administrador — acesso total</option>
        </select>
      </div>
      <div class="alert alert-warning" style="margin-top:1rem;font-size:.875rem;">
        <i class="fa-solid fa-triangle-exclamation"></i>
        Perfis <strong>Bibliotecário</strong> e <strong>Administrador</strong> concedem acesso ao painel administrativo.
      </div>`;

    UI.openModal(`🛡️ Perfil — ${esc(nome)}`, body,
      `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="MembrosPage.salvarPerfil(${id},'${esc(nome)}')">
         <i class="fa-solid fa-floppy-disk"></i> Salvar perfil
       </button>`, true);
  }

  async function salvarPerfil(id, nome) {
    const perfil = document.getElementById('selectPerfil').value;
    const btn = document.querySelector('#modalFooter .btn-primary');
    btn.disabled = true;
    try {
      const r = await API.perfilMembro(id, perfil || 'nenhum');
      UI.toast(r.mensagem, 'success');
      UI.closeModal();
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { btn.disabled = false; }
  }

  async function renovarMat(id, nome) {
    const ok = await UI.confirm(`Renovar matrícula de <strong>${esc(nome)}</strong>?`, 'Renovar');
    if (!ok) return;
    try {
      const r = await API.renovarMat(id);
      UI.toast(`Matrícula renovada até ${UI.fmtDate(r.nova_validade)}!`);
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  async function toggleAtivo(id, ativo, nome) {
    const acao = ativo ? 'inativar' : 'ativar';
    const ok = await UI.confirm(`Deseja ${acao} o membro <strong>${esc(nome)}</strong>?`, ativo ? 'Inativar' : 'Ativar');
    if (!ok) return;
    try {
      await API.statusMembro(id, { ativo: !ativo });
      UI.toast(`Membro ${ativo ? 'inativado' : 'ativado'} com sucesso!`);
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  async function verHistorico(id, nome) {
    UI.openModal(`Histórico — ${esc(nome)}`, UI.loadingHtml(), `<button class="btn btn-secondary" onclick="UI.closeModal()">Fechar</button>`, true);
    try {
      const data = await API.historicoMembro(id, { limit: 50 });
      if (!data.historico.length) {
        document.getElementById('modalBody').innerHTML = UI.emptyHtml('Nenhum empréstimo no histórico.');
        return;
      }
      document.getElementById('modalBody').innerHTML = UI.table(
        ['Livro', 'Tombo', 'Empréstimo', 'Devolução', 'Status', 'Multa'],
        data.historico,
        h => `<td>${esc(h.livro_titulo)}</td>
              <td><code>${h.num_tombo}</code></td>
              <td>${UI.fmtDate(h.data_emprestimo)}</td>
              <td>${UI.fmtDate(h.data_devolucao)}</td>
              <td>${UI.statusBadge(h.status)}</td>
              <td>${h.multa_valor ? `${UI.pagoBadge(h.multa_paga)} ${UI.fmtCurrency(h.multa_valor)}` : '—'}</td>`
      );
    } catch (e) {
      document.getElementById('modalBody').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  return { render, openForm, salvar, openDetail, renovarMat, toggleAtivo, verHistorico, gerenciarPerfil, salvarPerfil, loadData, _goPage };
})();
