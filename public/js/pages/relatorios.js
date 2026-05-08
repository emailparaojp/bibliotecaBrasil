/* pages/relatorios.js */
const RelatoriosPage = (() => {

  async function render() {
    document.getElementById('topbarActions').innerHTML = '';
    document.getElementById('mainContent').innerHTML = `
      <div class="tabs" id="relTabs">
        <button class="tab-btn active" data-rel="acervo">Acervo</button>
        <button class="tab-btn" data-rel="emprestimos">Empréstimos</button>
        <button class="tab-btn" data-rel="ranking">Ranking</button>
        <button class="tab-btn" data-rel="financeiro">Financeiro</button>
        <button class="tab-btn" data-rel="devolucoes">Devoluções</button>
      </div>
      <div id="relContent">${UI.loadingHtml()}</div>`;

    document.querySelectorAll('#relTabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#relTabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadRel(btn.dataset.rel);
      });
    });
    loadRel('acervo');
  }

  async function loadRel(type) {
    document.getElementById('relContent').innerHTML = UI.loadingHtml();
    try {
      switch (type) {
        case 'acervo':      await renderAcervo(); break;
        case 'emprestimos': await renderEmprestimos(); break;
        case 'ranking':     await renderRanking(); break;
        case 'financeiro':  await renderFinanceiro(); break;
        case 'devolucoes':  await renderDevolucoes(); break;
      }
    } catch (e) {
      document.getElementById('relContent').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  async function renderAcervo() {
    const data = await API.acervo();
    const r = data.resumo;
    document.getElementById('relContent').innerHTML = `
      <div class="stat-grid" style="margin-bottom:1.5rem">
        ${sCard('fa-book','blue', r.totalLivros,'Títulos cadastrados')}
        ${sCard('fa-copy','teal', r.totalExemplares,'Exemplares físicos')}
        ${sCard('fa-circle-check','green', r.disponiveis,'Disponíveis para empréstimo')}
        ${sCard('fa-right-left','orange', r.emprestados,'Atualmente emprestados')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="card">
          <div class="card-header"><span class="card-title">Por Categoria</span></div>
          ${UI.table(['Categoria','Títulos','Exemplares','Disponíveis'], data.porCategoria,
            c => `<td><span class="badge badge-gray">${esc(c.categoria)}</span></td>
                  <td>${c.total_livros}</td><td>${c.total_exemplares}</td>
                  <td><span class="badge ${c.disponiveis>0?'badge-green':'badge-gray'}">${c.disponiveis}</span></td>`)}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Por Condição dos Exemplares</span></div>
          ${UI.table(['Condição','Total'], data.porCondicao,
            c => `<td>${UI.statusBadge(c.condicao)}</td><td>${c.total}</td>`)}
        </div>
      </div>`;
  }

  async function renderEmprestimos() {
    const data = await API.situacaoEmp();
    const atrasados = await API.membrosComMultas();
    document.getElementById('relContent').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
        <div class="card">
          <div class="card-header"><span class="card-title">Status dos empréstimos</span></div>
          ${UI.table(['Status','Total'], data.porStatus,
            s => `<td>${UI.statusBadge(s.status)}</td><td style="font-weight:600">${s.total}</td>`)}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Atrasos por tipo de membro</span></div>
          ${data.atrasadosPorTipo.length ? UI.table(['Tipo','Atrasados','Total dias atraso'], data.atrasadosPorTipo,
            r => `<td>${UI.tipoBadge(r.tipo)}</td><td>${r.total_atrasados}</td><td>${r.total_dias_atraso||0}</td>`) :
            UI.emptyHtml('Nenhum atraso! 🎉')}
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title" style="color:#dc2626">Membros com multas pendentes (${atrasados.total})</span>
        </div>
        ${atrasados.total ? UI.table(['Membro','Tipo','Total multas','Valor pendente','Ação'], atrasados.membros,
          m => `<td><div style="font-weight:600">${esc(m.nome)}</div><div class="text-muted text-sm">${m.email||''}</div></td>
                <td>${UI.tipoBadge(m.tipo)}</td>
                <td>${m.total_multas}</td>
                <td style="font-weight:700;color:#dc2626">${UI.fmtCurrency(m.total_pendente)}</td>
                <td><button class="btn btn-sm btn-success" onclick="MultasPage.pagarTodas(${m.id},'${esc(m.nome)}')">
                  <i class="fa-solid fa-money-bill"></i> Quitar
                </button></td>`) :
          UI.emptyHtml('Nenhum membro com multa pendente! 🎉')}
      </div>`;
  }

  async function renderRanking() {
    const [livros, membros] = await Promise.all([API.maisEmprestados({ limit: 15 }), API.membrosAtivos({ limit: 10 })]);
    document.getElementById('relContent').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="card">
          <div class="card-header"><span class="card-title">📚 Top livros mais emprestados</span></div>
          ${UI.table(['#','Título','Autor','Empréstimos'], livros,
            (l, i) => `<td><span class="badge ${i===0?'badge-orange':i<3?'badge-yellow':'badge-gray'}">${(livros.indexOf(l)+1)}º</span></td>
                       <td style="font-weight:600">${esc(l.titulo)}</td>
                       <td class="text-muted">${esc(l.autor||'—')}</td>
                       <td><span class="badge badge-blue">${l.total_emprestimos}</span></td>`,
            (l, i, arr) => { l._i = arr.indexOf(l); return l; })}
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">👥 Membros mais ativos</span></div>
          ${UI.table(['#','Membro','Tipo','Total emp.'], membros,
            m => `<td><span class="badge badge-gray">${(membros.indexOf(m)+1)}º</span></td>
                  <td style="font-weight:600">${esc(m.nome)}</td>
                  <td>${UI.tipoBadge(m.tipo)}</td>
                  <td><span class="badge badge-blue">${m.total_emprestimos}</span></td>`)}
        </div>
      </div>`;

    // Fix: UI.table doesn't receive index naturally, redo
    document.getElementById('relContent').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="card">
          <div class="card-header"><span class="card-title">📚 Top livros mais emprestados</span></div>
          <div class="table-wrapper"><table>
            <thead><tr><th>#</th><th>Título</th><th>Autor</th><th>Empréstimos</th></tr></thead>
            <tbody>
              ${livros.map((l,i) => `<tr>
                <td><span class="badge ${i===0?'badge-orange':i<3?'badge-yellow':'badge-gray'}">${i+1}º</span></td>
                <td style="font-weight:600">${esc(l.titulo)}</td>
                <td class="text-muted">${esc(l.autor||'—')}</td>
                <td><span class="badge badge-blue">${l.total_emprestimos}</span></td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">👥 Membros mais ativos</span></div>
          <div class="table-wrapper"><table>
            <thead><tr><th>#</th><th>Membro</th><th>Tipo</th><th>Total emp.</th></tr></thead>
            <tbody>
              ${membros.map((m,i) => `<tr>
                <td><span class="badge ${i===0?'badge-orange':i<3?'badge-yellow':'badge-gray'}">${i+1}º</span></td>
                <td style="font-weight:600">${esc(m.nome)}</td>
                <td>${UI.tipoBadge(m.tipo)}</td>
                <td><span class="badge badge-blue">${m.total_emprestimos}</span></td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </div>
      </div>`;
  }

  async function renderFinanceiro() {
    const data = await API.financeiroMultas();
    const r = data.resumo;
    document.getElementById('relContent').innerHTML = `
      <div class="stat-grid" style="margin-bottom:1.5rem">
        ${sCard('fa-file-invoice-dollar','blue', r.total_multas,'Total de multas geradas')}
        ${sCard('fa-circle-xmark','red', UI.fmtCurrency(r.valor_pendente),'Valor pendente')}
        ${sCard('fa-circle-check','green', UI.fmtCurrency(r.valor_recebido),'Valor recebido')}
        ${sCard('fa-piggy-bank','orange', UI.fmtCurrency(r.valor_total),'Valor total gerado')}
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Histórico mensal de multas</span></div>
        ${data.porMes.length ? UI.table(['Mês','Multas geradas','Valor gerado','Valor recebido'], data.porMes,
          m => `<td style="font-weight:600">${m.mes}</td>
                <td>${m.total}</td>
                <td>${UI.fmtCurrency(m.valor_gerado)}</td>
                <td style="color:#16a34a;font-weight:600">${UI.fmtCurrency(m.valor_recebido)}</td>`) :
          UI.emptyHtml('Sem histórico ainda.')}
      </div>`;
  }

  async function renderDevolucoes() {
    const data = await API.devPrevistas({ dias: 14 });
    document.getElementById('relContent').innerHTML = `
      <div class="alert alert-info" style="margin-bottom:1rem">
        <i class="fa-solid fa-circle-info"></i>
        <strong>${data.total}</strong> devoluções previstas nos próximos ${data.dias_horizonte} dias.
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Devoluções previstas (14 dias)</span></div>
        ${data.total ? UI.table(['Membro','Livro','Tombo','Devolução prevista','Dias restantes','Contato'], data.devolucoes,
          d => `<td style="font-weight:600">${esc(d.membro_nome)}</td>
                <td>${esc(d.livro_titulo)}</td>
                <td><code>${d.num_tombo}</code></td>
                <td>${UI.fmtDate(d.data_prevista_devolucao)}</td>
                <td><span class="badge ${d.dias_restantes<=2?'badge-red':d.dias_restantes<=5?'badge-yellow':'badge-green'}">${d.dias_restantes} dia(s)</span></td>
                <td class="text-sm text-muted">${d.email||''}</td>`) :
          UI.emptyHtml('Nenhuma devolução prevista para os próximos 14 dias.')}
      </div>`;
  }

  function sCard(icon, color, value, label) {
    return `<div class="stat-card">
      <div class="stat-icon ${color}"><i class="fa-solid ${icon}"></i></div>
      <div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>
    </div>`;
  }

  return { render };
})();
