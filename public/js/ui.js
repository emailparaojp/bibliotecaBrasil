/* ui.js — componentes reutilizáveis de UI */
const UI = (() => {

  /* ===== TOAST ===== */
  function toast(msg, type = 'success') {
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${msg}</span>`;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 350); }, 3500);
  }

  /* ===== MODAL ===== */
  function openModal(title, bodyHtml, footerHtml = '', large = false) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').innerHTML = footerHtml;
    const modal = document.getElementById('modal');
    modal.className = 'modal' + (large ? ' modal-lg' : '');
    document.getElementById('modalBackdrop').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('open');
    document.getElementById('modalBody').innerHTML = '';
    document.getElementById('modalFooter').innerHTML = '';
  }

  /* ===== CONFIRM ===== */
  function confirm(msg, dangerBtn = 'Confirmar') {
    return new Promise(resolve => {
      openModal('Confirmar ação', `
        <div class="alert alert-warning">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>${msg}</span>
        </div>`,
        `<button class="btn btn-secondary" id="confirmNo">Cancelar</button>
         <button class="btn btn-danger" id="confirmYes">${dangerBtn}</button>`
      );
      document.getElementById('confirmYes').onclick = () => { closeModal(); resolve(true); };
      document.getElementById('confirmNo').onclick  = () => { closeModal(); resolve(false); };
    });
  }

  /* ===== LOADING ===== */
  function loadingHtml() {
    return `<div class="empty-state"><i class="fa-solid fa-spinner fa-spin fa-xl"></i><p>Carregando…</p></div>`;
  }

  function emptyHtml(msg = 'Nenhum resultado encontrado.') {
    return `<div class="empty-state"><i class="fa-solid fa-inbox fa-xl"></i><p>${msg}</p></div>`;
  }

  /* ===== TABLE ===== */
  function table(cols, rows, rowFn) {
    if (!rows.length) return emptyHtml();
    const heads = cols.map(c => `<th>${c}</th>`).join('');
    const body  = rows.map(r => `<tr>${rowFn(r)}</tr>`).join('');
    return `<div class="table-wrapper"><table><thead><tr>${heads}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  /* ===== PAGINATION ===== */
  function pagination(total, page, limit, onPageChange) {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return `<div class="pagination"><span>${total} registro(s)</span></div>`;
    const from = (page - 1) * limit + 1;
    const to   = Math.min(page * limit, total);
    let btns = `<button ${page===1?'disabled':''} onclick="(${onPageChange})(${page-1})"><i class="fa-solid fa-chevron-left"></i></button>`;
    // Show limited page buttons
    const range = [];
    for (let i = Math.max(1, page-2); i <= Math.min(totalPages, page+2); i++) range.push(i);
    if (range[0] > 1) { btns += `<button onclick="(${onPageChange})(1)">1</button>`; if (range[0] > 2) btns += `<button disabled>…</button>`; }
    range.forEach(p => { btns += `<button class="${p===page?'active':''}" onclick="(${onPageChange})(${p})">${p}</button>`; });
    if (range[range.length-1] < totalPages) {
      if (range[range.length-1] < totalPages-1) btns += `<button disabled>…</button>`;
      btns += `<button onclick="(${onPageChange})(${totalPages})">${totalPages}</button>`;
    }
    btns += `<button ${page===totalPages?'disabled':''} onclick="(${onPageChange})(${page+1})"><i class="fa-solid fa-chevron-right"></i></button>`;
    return `<div class="pagination"><span>${from}–${to} de ${total}</span><div class="pagination-btns">${btns}</div></div>`;
  }

  /* ===== BADGES ===== */
  function statusBadge(status) {
    const map = {
      'Ativo':      ['badge-blue',   'Ativo'],
      'Atrasado':   ['badge-red',    'Atrasado'],
      'Devolvido':  ['badge-green',  'Devolvido'],
      'Renovado':   ['badge-purple', 'Renovado'],
      'Ativa':      ['badge-blue',   'Ativa'],
      'Cancelada':  ['badge-gray',   'Cancelada'],
      'Expirada':   ['badge-yellow', 'Expirada'],
      'Concluida':  ['badge-green',  'Concluída'],
      'Bom':        ['badge-green',  'Bom'],
      'Novo':       ['badge-blue',   'Novo'],
      'Regular':    ['badge-yellow', 'Regular'],
      'Ruim':       ['badge-red',    'Ruim'],
    };
    const [cls, lbl] = map[status] || ['badge-gray', status];
    return `<span class="badge ${cls}">${lbl}</span>`;
  }

  function tipoBadge(tipo) {
    const map = { 'Estudante': 'badge-blue', 'Professor': 'badge-purple', 'Comum': 'badge-gray' };
    return `<span class="badge ${map[tipo]||'badge-gray'}">${tipo}</span>`;
  }

  function ativoBadge(ativo) {
    return ativo ? `<span class="badge badge-green">Ativo</span>` : `<span class="badge badge-red">Inativo</span>`;
  }

  function pagoBadge(pago) {
    return pago ? `<span class="badge badge-green">Pago</span>` : `<span class="badge badge-red">Pendente</span>`;
  }

  /* ===== FORM HELPERS ===== */
  function formData(form) {
    const fd = new FormData(form);
    const obj = {};
    fd.forEach((v, k) => { obj[k] = v === '' ? null : v; });
    return obj;
  }

  function selectOptions(items, valueKey, labelKey, selectedValue = '') {
    return items.map(i => `<option value="${i[valueKey]}" ${i[valueKey]==selectedValue?'selected':''}>${i[labelKey]}</option>`).join('');
  }

  /* ===== DATE HELPERS ===== */
  function fmtDate(d) {
    if (!d) return '—';
    const [y, m, dia] = d.split('-');
    return `${dia}/${m}/${y}`;
  }

  function fmtDateTime(d) {
    if (!d) return '—';
    const [date, time] = d.split(' ');
    return fmtDate(date) + (time ? ` ${time.substring(0,5)}` : '');
  }

  function fmtCurrency(v) {
    if (v == null) return '—';
    return `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
  }

  /* ===== SEARCH COMBO ===== */
  function searchCombo(inputEl, listEl, fetchFn, onSelect) {
    let timer;
    inputEl.addEventListener('input', () => {
      clearTimeout(timer);
      const q = inputEl.value.trim();
      if (!q) { listEl.innerHTML = ''; listEl.style.display = 'none'; return; }
      timer = setTimeout(async () => {
        try {
          const results = await fetchFn(q);
          if (!results.length) {
            listEl.innerHTML = '<li class="no-results">Nenhum resultado</li>';
          } else {
            listEl.innerHTML = results.map((r, i) => `<li data-idx="${i}">${r._label}</li>`).join('');
            listEl.querySelectorAll('li:not(.no-results)').forEach((li, i) => {
              li.onclick = () => { onSelect(results[i]); listEl.style.display = 'none'; };
            });
          }
          listEl.style.display = 'block';
        } catch { listEl.style.display = 'none'; }
      }, 280);
    });
    document.addEventListener('click', e => {
      if (!inputEl.contains(e.target) && !listEl.contains(e.target)) listEl.style.display = 'none';
    });
  }

  return { toast, openModal, closeModal, confirm, loadingHtml, emptyHtml, table, pagination,
           statusBadge, tipoBadge, ativoBadge, pagoBadge, formData, selectOptions,
           fmtDate, fmtDateTime, fmtCurrency, searchCombo };
})();
