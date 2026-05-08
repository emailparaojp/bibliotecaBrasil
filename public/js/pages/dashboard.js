/* pages/dashboard.js */
const DashboardPage = (() => {

  function statCard(icon, colorClass, value, label, link = '') {
    const inner = `
      <div class="stat-icon ${colorClass}"><i class="fa-solid ${icon}"></i></div>
      <div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
    return link
      ? `<a href="${link}" class="stat-card" style="text-decoration:none">${inner}</a>`
      : `<div class="stat-card">${inner}</div>`;
  }

  async function render() {
    document.getElementById('mainContent').innerHTML = UI.loadingHtml();
    document.getElementById('topbarActions').innerHTML = '';
    try {
      const d = await API.dashboard();
      const atrasados = d.emprestimos.atrasados;

      document.getElementById('mainContent').innerHTML = `
        <div class="stat-grid">
          ${statCard('book',             'blue',   d.acervo.livros,                        'Títulos no acervo',       '#livros')}
          ${statCard('copy',             'teal',   d.acervo.exemplares,                    'Exemplares físicos')}
          ${statCard('users',            'purple', d.membros.ativos,                       'Membros ativos',          '#membros')}
          ${statCard('right-left',       'blue',   d.emprestimos.ativos,                   'Empréstimos ativos',      '#emprestimos')}
          ${statCard('clock',            atrasados>0?'red':'green', atrasados,             'Em atraso',               '#emprestimos')}
          ${statCard('file-invoice-dollar', d.multas.quantidade_pendente>0?'red':'green',
                     `${d.multas.quantidade_pendente}`,                                    'Multas pendentes',        '#multas')}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fa-solid fa-right-left" style="color:#2563eb;margin-right:.5rem"></i>Hoje</span>
            </div>
            <div class="card-body">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;text-align:center">
                <div>
                  <div style="font-size:2rem;font-weight:700;color:#2563eb">${d.emprestimos.realizados_hoje}</div>
                  <div style="font-size:.8rem;color:#64748b;margin-top:.25rem">Empréstimos</div>
                </div>
                <div>
                  <div style="font-size:2rem;font-weight:700;color:#16a34a">${d.emprestimos.devolucoes_hoje}</div>
                  <div style="font-size:.8rem;color:#64748b;margin-top:.25rem">Devoluções</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="fa-solid fa-bolt" style="color:#d97706;margin-right:.5rem"></i>Ações rápidas</span>
            </div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:.5rem">
              <button class="btn btn-primary w-full" onclick="Router.go('emprestimos')">
                <i class="fa-solid fa-plus"></i> Novo Empréstimo
              </button>
              <button class="btn btn-secondary w-full" onclick="Router.go('reservas')">
                <i class="fa-solid fa-bookmark"></i> Nova Reserva
              </button>
              <button class="btn btn-secondary w-full" onclick="Router.go('relatorios')">
                <i class="fa-solid fa-chart-bar"></i> Ver Relatórios
              </button>
            </div>
          </div>
        </div>

        <div id="dashAtrasados"></div>
        <div id="dashDevolucoes"></div>
      `;

      // Load atrasados
      if (atrasados > 0) {
        try {
          const { atrasados: lista } = await API.atrasados();
          const slice = lista.slice(0, 5);
          document.getElementById('dashAtrasados').innerHTML = `
            <div class="card" style="margin-bottom:1rem">
              <div class="card-header">
                <span class="card-title" style="color:#dc2626">
                  <i class="fa-solid fa-clock" style="margin-right:.4rem"></i>Empréstimos em atraso (${atrasados})
                </span>
                <a href="#emprestimos" class="btn btn-sm btn-secondary">Ver todos</a>
              </div>
              ${UI.table(
                ['Membro', 'Livro', 'Tombo', 'Dias atraso', 'Multa estimada', 'Ação'],
                slice,
                r => `<td>${r.membro_nome}</td>
                      <td>${r.livro_titulo}</td>
                      <td><code>${r.num_tombo}</code></td>
                      <td><span class="badge badge-red">${r.dias_atraso} dias</span></td>
                      <td>${UI.fmtCurrency(r.multa_estimada)}</td>
                      <td><button class="btn btn-sm btn-warning" onclick="EmprestimosPage.devolver(${r.id})">
                        <i class="fa-solid fa-rotate-left"></i> Devolver
                      </button></td>`
              )}
            </div>`;
        } catch { /* silencioso */ }
      }

      // Próximas devoluções
      try {
        const { devolucoes } = await API.devPrevistas({ dias: 3 });
        if (devolucoes.length > 0) {
          document.getElementById('dashDevolucoes').innerHTML = `
            <div class="card">
              <div class="card-header">
                <span class="card-title">
                  <i class="fa-solid fa-calendar-check" style="color:#0d9488;margin-right:.4rem"></i>Devoluções previstas nos próximos 3 dias
                </span>
              </div>
              ${UI.table(
                ['Membro', 'Livro', 'Devolução', 'Dias restantes'],
                devolucoes.slice(0, 8),
                r => `<td>${r.membro_nome}</td>
                      <td>${r.livro_titulo}</td>
                      <td>${UI.fmtDate(r.data_prevista_devolucao)}</td>
                      <td><span class="badge ${r.dias_restantes <= 1 ? 'badge-red' : 'badge-yellow'}">${r.dias_restantes} dia(s)</span></td>`
              )}
            </div>`;
        }
      } catch { /* silencioso */ }

    } catch (e) {
      document.getElementById('mainContent').innerHTML = `<div class="alert alert-danger"><i class="fa-solid fa-circle-xmark"></i>${e.message}</div>`;
    }
  }

  return { render };
})();
