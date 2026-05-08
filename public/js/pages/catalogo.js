/* pages/catalogo.js */
const CatalogoPage = (() => {
  const configs = {
    autores: {
      title: 'Autores', singular: 'Autor', icon: 'fa-user-pen',
      list: () => API.autores({ limit: 200 }),
      create: d => API.criarAutor(d),
      update: (id, d) => API.editarAutor(id, d),
      delete: id => API.deletarAutor(id),
      cols: ['Nome', 'Nacionalidade', 'Email', 'Ações'],
      row: a => `<td style="font-weight:600">${esc(a.nome)}</td>
                 <td>${esc(a.nacionalidade||'—')}</td>
                 <td class="text-sm text-muted">${esc(a.email||'—')}</td>`,
      fields: [
        { id: 'nome', label: 'Nome *', type: 'text', required: true },
        { id: 'nacionalidade', label: 'Nacionalidade', type: 'text' },
        { id: 'email', label: 'E-mail', type: 'email' },
        { id: 'biografia', label: 'Biografia', type: 'textarea' },
      ],
      searchKey: 'q',
    },
    editoras: {
      title: 'Editoras', singular: 'Editora', icon: 'fa-building',
      list: () => API.editoras({ limit: 200 }),
      create: d => API.criarEditora(d),
      update: (id, d) => API.editarEditora(id, d),
      delete: id => API.deletarEditora(id),
      cols: ['Nome', 'CNPJ', 'Cidade / Estado', 'Ações'],
      row: e => `<td style="font-weight:600">${esc(e.nome)}</td>
                 <td class="text-sm text-muted">${esc(e.cnpj||'—')}</td>
                 <td class="text-sm">${[e.cidade, e.estado].filter(Boolean).join(' / ')||'—'}</td>`,
      fields: [
        { id: 'nome', label: 'Nome *', type: 'text', required: true },
        { id: 'cnpj', label: 'CNPJ', type: 'text' },
        { id: 'endereco', label: 'Endereço', type: 'text' },
        { id: 'cidade', label: 'Cidade', type: 'text' },
        { id: 'estado', label: 'Estado', type: 'text' },
        { id: 'telefone', label: 'Telefone', type: 'text' },
        { id: 'email', label: 'E-mail', type: 'email' },
        { id: 'site', label: 'Site', type: 'text' },
      ],
      searchKey: 'q',
    },
    categorias: {
      title: 'Categorias', singular: 'Categoria', icon: 'fa-tags',
      list: () => API.categorias({ limit: 200 }),
      create: d => API.criarCategoria(d),
      update: (id, d) => API.editarCategoria(id, d),
      delete: id => API.deletarCategoria(id),
      cols: ['Nome', 'Descrição', 'Ações'],
      row: c => `<td style="font-weight:600">${esc(c.nome)}</td>
                 <td class="text-sm text-muted">${esc(c.descricao||'—')}</td>`,
      fields: [
        { id: 'nome', label: 'Nome *', type: 'text', required: true },
        { id: 'descricao', label: 'Descrição', type: 'textarea' },
      ],
      searchKey: 'q',
    },
  };

  let currentType = 'autores';
  let allData = [];

  function render(type) {
    currentType = type || 'autores';
    const cfg = configs[currentType];
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-primary" onclick="CatalogoPage.openForm()">
        <i class="fa-solid fa-plus"></i> Novo(a) ${cfg.singular}
      </button>`;
    document.getElementById('mainContent').innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fa-solid ${cfg.icon}"></i> ${cfg.title}</span>
          <input class="search-input" id="catSearch" placeholder="Pesquisar ${cfg.title.toLowerCase()}..." oninput="CatalogoPage._search(this.value)">
        </div>
        <div id="catTable">${UI.loadingHtml()}</div>
      </div>`;
    loadData();
  }

  async function loadData() {
    try {
      const cfg = configs[currentType];
      const data = await cfg.list();
      allData = data[currentType] || data.autores || data.editoras || data.categorias || data || [];
      renderTable(allData);
    } catch (e) {
      document.getElementById('catTable').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  function renderTable(rows) {
    const cfg = configs[currentType];
    document.getElementById('catTable').innerHTML = rows.length
      ? UI.table(cfg.cols, rows, r => `${cfg.row(r)}<td>
          <div class="row-actions">
            <button class="btn btn-sm btn-secondary" onclick="CatalogoPage.openForm(${r.id})">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button class="btn btn-sm btn-danger" onclick="CatalogoPage.del(${r.id},'${esc(r.nome)}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div></td>`)
      : UI.emptyHtml(`Nenhum(a) ${configs[currentType].singular.toLowerCase()} cadastrado(a).`);
  }

  function _search(q) {
    const lq = q.toLowerCase();
    renderTable(allData.filter(r =>
      Object.values(r).some(v => v && String(v).toLowerCase().includes(lq))
    ));
  }

  function buildForm(cfg, data) {
    return cfg.fields.map(f => {
      const val = data ? (data[f.id] || '') : '';
      if (f.type === 'textarea') {
        return `<div class="form-group">
          <label class="form-label">${f.label}</label>
          <textarea class="form-control" id="f_${f.id}" rows="3">${esc(val)}</textarea>
        </div>`;
      }
      return `<div class="form-group">
        <label class="form-label">${f.label}</label>
        <input class="form-control" id="f_${f.id}" type="${f.type}" value="${esc(val)}" ${f.required ? 'required' : ''}>
      </div>`;
    }).join('');
  }

  async function openForm(id) {
    const cfg = configs[currentType];
    let data = null;
    if (id) {
      UI.openModal(`Editar ${cfg.singular}`, UI.loadingHtml(), '', true);
      try {
        const res = await fetch(`/api/${currentType}/${id}`);
        data = await res.json();
      } catch (e) {
        UI.toast('Erro ao carregar dados.', 'error'); return;
      }
    }
    const form = buildForm(cfg, data);
    UI.openModal(
      id ? `Editar ${cfg.singular} — ${esc(data.nome||'')}` : `Novo(a) ${cfg.singular}`,
      `<form id="catForm">${form}</form>`,
      `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" onclick="CatalogoPage.save(${id||'null'})">
         <i class="fa-solid fa-floppy-disk"></i> Salvar
       </button>`,
      true
    );
  }

  async function save(id) {
    const cfg = configs[currentType];
    const body = {};
    for (const f of cfg.fields) {
      const el = document.getElementById(`f_${f.id}`);
      if (el) body[f.id] = el.value.trim();
    }
    const btn = document.querySelector('#modalFooter .btn-primary');
    btn.disabled = true;
    try {
      if (id) await cfg.update(id, body);
      else await cfg.create(body);
      UI.toast(id ? `${cfg.singular} atualizado(a)!` : `${cfg.singular} criado(a)!`);
      UI.closeModal();
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); btn.disabled = false; }
  }

  async function del(id, nome) {
    const ok = await UI.confirm(`Excluir "${esc(nome)}"? Esta ação não pode ser desfeita.`, 'Confirmar exclusão');
    if (!ok) return;
    try {
      await configs[currentType].delete(id);
      UI.toast('Excluído com sucesso!');
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  return { render, loadData, openForm, save, del, _search };
})();
