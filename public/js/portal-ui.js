/* portal-ui.js — UI helpers for public portal */

const PUI = (() => {

  function toast(msg, type = 'info', duration = 3500) {
    const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const el = document.createElement('div');
    el.className = `portal-toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${esc(msg)}</span>`;
    document.getElementById('portalToastContainer').appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  function openModal(title, bodyHtml, footerHtml = '') {
    document.getElementById('portalModalTitle').textContent = title;
    document.getElementById('portalModalBody').innerHTML = bodyHtml;
    document.getElementById('portalModalFooter').innerHTML = footerHtml;
    document.getElementById('portalModalBackdrop').classList.add('open');
  }

  function closeModal() {
    document.getElementById('portalModalBackdrop').classList.remove('open');
  }

  function loading(containerId) {
    const el = document.getElementById(containerId) || document.getElementById('portalContent');
    el.innerHTML = `<div class="portal-loading"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
  }

  function setContent(html) {
    document.getElementById('portalContent').innerHTML = html;
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
  }

  function currency(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function statusBadge(s) {
    const map = {
      'Ativa': ['green','clock'],
      'Cancelada': ['gray','ban'],
      'Expirada': ['yellow','triangle-exclamation'],
      'Atendida': ['blue','check'],
      'Ativo': ['blue','right-left'],
      'Atrasado': ['red','triangle-exclamation'],
      'Devolvido': ['gray','check'],
    };
    const [color, icon] = map[s] || ['gray', 'circle'];
    return `<span class="pbadge pbadge-${color}"><i class="fa-solid fa-${icon}"></i> ${esc(s)}</span>`;
  }

  function availBadge(disp) {
    if (disp > 0) return `<span class="pbadge pbadge-green"><i class="fa-solid fa-circle-check"></i> ${disp} disponível</span>`;
    return `<span class="pbadge pbadge-red"><i class="fa-solid fa-circle-xmark"></i> Indisponível</span>`;
  }

  function coverImg(url, cls = '') {
    if (url) return `<img src="${esc(url)}" alt="capa" loading="lazy" ${cls ? `class="${cls}"` : ''}>`;
    return `<i class="fa-solid fa-book-open" ${cls ? `class="${cls}"` : ''}></i>`;
  }

  return { toast, openModal, closeModal, loading, setContent, formatDate, currency, statusBadge, availBadge, coverImg };
})();

// Global esc helper (shared across portal scripts)
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// CPF mask helper
function maskCPF(value) {
  return value.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

// CPF validation (dígitos verificadores)
function validarCPF(cpf) {
  const raw = cpf.replace(/\D/g, '');
  // CPF administrativo especial — bypassa validação de dígitos
  if (raw === '10101010101') return true;
  if (raw.length !== 11 || /^(\d)\1{10}$/.test(raw)) return false;
  function calc(str, weights) {
    const sum = str.split('').reduce((a, d, i) => a + parseInt(d) * weights[i], 0);
    const r = (sum * 10) % 11;
    return (r === 10 || r === 11) ? 0 : r;
  }
  const d1 = calc(raw.slice(0,9), [10,9,8,7,6,5,4,3,2]);
  if (d1 !== parseInt(raw[9])) return false;
  const d2 = calc(raw.slice(0,10), [11,10,9,8,7,6,5,4,3,2]);
  return d2 === parseInt(raw[10]);
}
