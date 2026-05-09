/* pages/livros.js */
const LivrosPage = (() => {
  let state = { busca: '', autor: '', categoria: '', disponivel: '', page: 1, limit: 15 };

  /* ===== RENDER ===== */
  async function render() {
    state = { busca: '', autor: '', categoria: '', disponivel: '', page: 1, limit: 15 };
    document.getElementById('topbarActions').innerHTML = `
      <button class="btn btn-primary" onclick="LivrosPage.openForm()">
        <i class="fa-solid fa-plus"></i> Novo Livro
      </button>`;
    document.getElementById('mainContent').innerHTML = `
      <div class="page-header">
        <div class="page-filters">
          <input class="input" id="fBusca" placeholder="Buscar título, ISBN…" value="${state.busca}">
          <input class="input" id="fAutor" placeholder="Autor…">
          <select class="input" id="fCategoria"><option value="">Todas categorias</option></select>
          <select class="input" id="fDisp">
            <option value="">Todos</option>
            <option value="1">Disponíveis</option>
            <option value="0">Indisponíveis</option>
          </select>
        </div>
      </div>
      <div class="card" id="livrosCard">${UI.loadingHtml()}</div>`;

    // Carrega categorias no select
    try {
      const cats = await API.categorias();
      const sel = document.getElementById('fCategoria');
      sel.innerHTML = '<option value="">Todas categorias</option>' + UI.selectOptions(cats, 'id', 'nome');
    } catch { /* ignora */ }

    // Events
    ['fBusca','fAutor'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', debounce(() => {
        state.busca    = document.getElementById('fBusca').value;
        state.autor    = document.getElementById('fAutor').value;
        state.page = 1; loadData();
      }, 350));
    });
    document.getElementById('fCategoria')?.addEventListener('change', e => { state.categoria = e.target.value; state.page = 1; loadData(); });
    document.getElementById('fDisp')?.addEventListener('change', e => { state.disponivel = e.target.value; state.page = 1; loadData(); });

    loadData();
  }

  async function loadData() {
    document.getElementById('livrosCard').innerHTML = UI.loadingHtml();
    try {
      const data = await API.livros({ ...state, busca: state.busca || undefined, autor: state.autor || undefined,
                                       categoria: state.categoria || undefined, disponivel: state.disponivel || undefined });
      const { livros, total, pagina, limite } = data;
      const html = UI.table(
        ['Capa', 'Título / Autor', 'ISBN', 'Categoria', 'Exemplares', 'Disponíveis', 'Ações'],
        livros,
        r => `
          <td style="width:52px;">
            ${r.tem_capa
              ? `<img src="/api/livros/${r.id}/capa" style="width:40px;height:54px;object-fit:cover;border-radius:4px;" loading="lazy">`
              : `<div style="width:40px;height:54px;background:#e0e7ff;border-radius:4px;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-book" style="color:#a5b4fc;font-size:.9rem;"></i></div>`}
          </td>
          <td>
            <div style="font-weight:600">${esc(r.titulo)}</div>
            <div class="text-muted text-sm">${esc(r.autor_nome || '—')}</div>
          </td>
          <td class="text-muted text-sm">${r.isbn || '—'}</td>
          <td>${r.categoria_nome ? `<span class="badge badge-gray">${esc(r.categoria_nome)}</span>` : '—'}</td>
          <td style="text-align:center">${r.total_exemplares}</td>
          <td style="text-align:center">
            <span class="badge ${r.exemplares_disponiveis > 0 ? 'badge-green' : 'badge-red'}">
              ${r.exemplares_disponiveis}
            </span>
          </td>
          <td>
            <div class="row-actions">
              <button class="btn btn-sm btn-secondary" onclick="LivrosPage.openDetail(${r.id})" title="Detalhes">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-secondary" onclick="LivrosPage.openForm(${r.id})" title="Editar">
                <i class="fa-solid fa-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="LivrosPage.deletar(${r.id},'${esc(r.titulo)}')" title="Remover">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>`
      );
      document.getElementById('livrosCard').innerHTML = html + UI.pagination(total, pagina, limite,
        `function(p){LivrosPage._goPage(p)}`);
    } catch (e) {
      document.getElementById('livrosCard').innerHTML = `<div class="alert alert-danger"><i class="fa-solid fa-circle-xmark"></i>${e.message}</div>`;
    }
  }

  function _goPage(p) { state.page = p; loadData(); }

  /* ===== FORM (criar/editar) ===== */
  async function openForm(id = null) {
    const title = id ? 'Editar Livro' : 'Novo Livro';
    UI.openModal(title, UI.loadingHtml(), '', true);

    try {
      const [autores, editoras, categorias] = await Promise.all([API.autores(), API.editoras(), API.categorias()]);
      let livro = {};
      if (id) livro = await API.livro(id);

      const body = `
        <form id="livroForm">
          <div class="form-grid">
            <div class="form-group form-col-full">
              <label>Título *</label>
              <input class="input" name="titulo" required value="${esc(livro.titulo||'')}">
            </div>
            <div class="form-group form-col-full">
              <label>Subtítulo</label>
              <input class="input" name="subtitulo" value="${esc(livro.subtitulo||'')}">
            </div>
            <div class="form-group">
              <label>ISBN</label>
              <input class="input" name="isbn" placeholder="978…" value="${esc(livro.isbn||'')}">
            </div>
            <div class="form-group">
              <label>Edição</label>
              <input class="input" name="edicao" value="${esc(livro.edicao||'')}">
            </div>
            <div class="form-group">
              <label>Autor</label>
              <select class="input" name="id_autor">
                <option value="">— Selecione —</option>
                ${UI.selectOptions(autores, 'id', 'nome', livro.autor_id||'')}
              </select>
            </div>
            <div class="form-group">
              <label>Editora</label>
              <select class="input" name="id_editora">
                <option value="">— Selecione —</option>
                ${UI.selectOptions(editoras, 'id', 'nome', livro.editora_id||'')}
              </select>
            </div>
            <div class="form-group">
              <label>Categoria</label>
              <select class="input" name="id_categoria">
                <option value="">— Selecione —</option>
                ${UI.selectOptions(categorias, 'id', 'nome', livro.categoria_id||'')}
              </select>
            </div>
            <div class="form-group">
              <label>Idioma</label>
              <select class="input" name="idioma">
                <option value="Português" ${livro.idioma==='Português'||!livro.idioma?'selected':''}>Português</option>
                <option value="Inglês" ${livro.idioma==='Inglês'?'selected':''}>Inglês</option>
                <option value="Espanhol" ${livro.idioma==='Espanhol'?'selected':''}>Espanhol</option>
                <option value="Francês" ${livro.idioma==='Francês'?'selected':''}>Francês</option>
                <option value="Outro" ${livro.idioma&&!['Português','Inglês','Espanhol','Francês'].includes(livro.idioma)?'selected':''}>Outro</option>
              </select>
            </div>
            <div class="form-group">
              <label>Ano de Publicação</label>
              <input class="input" name="ano_publicacao" type="number" min="1000" max="${new Date().getFullYear()+1}" value="${livro.ano_publicacao||''}">
            </div>
            <div class="form-group">
              <label>Número de Páginas</label>
              <input class="input" name="num_paginas" type="number" min="1" value="${livro.num_paginas||''}">
            </div>
            <div class="form-group">
              <label>Localização na estante</label>
              <input class="input" name="localizacao" placeholder="Ex: A-01" value="${esc(livro.localizacao||'')}">
            </div>
            <div class="form-group">
              <label>Capa do Livro</label>
              <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;">
                <div id="capaPreview" style="width:80px;height:110px;border-radius:6px;overflow:hidden;background:#e0e7ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  ${livro.id
                    ? `<img id="capaImg" src="/api/livros/${livro.id}/capa" onerror="this.style.display='none';document.getElementById('capaIcon').style.display=''" style="width:100%;height:100%;object-fit:cover;">`
                    : ''}
                  <i id="capaIcon" class="fa-solid fa-image" style="font-size:1.5rem;color:#a5b4fc;${livro.id?'display:none;':''}"></i>
                </div>
                <div>
                  <input type="file" id="capaFile" accept="image/*" style="display:none;">
                  <button type="button" class="btn btn-sm btn-secondary" onclick="document.getElementById('capaFile').click()">
                    <i class="fa-solid fa-upload"></i> Escolher imagem
                  </button>
                  <div class="text-muted text-sm" style="margin-top:.25rem;">JPG, PNG ou WebP · max 2MB</div>
                  <div id="capaNome" class="text-sm" style="margin-top:.25rem;color:var(--color-primary);"></div>
                </div>
              </div>
              <input type="hidden" name="capa_base64" id="capaBase64">
              <input type="hidden" name="capa_mime" id="capaMime">
            </div>
            <div class="form-group form-col-full">
              <label>Descrição</label>
              <textarea class="input" name="descricao" rows="3">${esc(livro.descricao||'')}</textarea>
            </div>
          </div>
        </form>`;

      UI.openModal(title, body,
        `<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
         <button class="btn btn-primary" onclick="LivrosPage.salvar(${id||'null'})">
           <i class="fa-solid fa-floppy-disk"></i> Salvar
         </button>`, true);

      // Bind file input after modal is open
      document.getElementById('capaFile')?.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { UI.toast('Imagem muito grande (máx 2MB).', 'error'); return; }
        const reader = new FileReader();
        reader.onload = e => {
          const dataUrl = e.target.result; // data:image/jpeg;base64,...
          const [meta, b64] = dataUrl.split(',');
          const mime = meta.replace('data:', '').replace(';base64', '');
          document.getElementById('capaBase64').value = b64;
          document.getElementById('capaMime').value = mime;
          document.getElementById('capaNome').textContent = file.name;
          const img = document.getElementById('capaImg') || Object.assign(document.createElement('img'), { id: 'capaImg', style: 'width:100%;height:100%;object-fit:cover;' });
          const icon = document.getElementById('capaIcon');
          img.src = dataUrl;
          img.style.display = '';
          if (icon) icon.style.display = 'none';
          if (!document.getElementById('capaImg')) document.getElementById('capaPreview').prepend(img);
        };
        reader.readAsDataURL(file);
      });

    } catch (e) {
      UI.openModal(title, `<div class="alert alert-danger">${e.message}</div>`);
    }
  }

  async function salvar(id) {
    const form = document.getElementById('livroForm');
    if (!form.reportValidity()) return;
    const data = UI.formData(form);
    // convert numerics
    ['id_autor','id_editora','id_categoria','ano_publicacao','num_paginas'].forEach(k => { if(data[k]) data[k] = Number(data[k]); });
    // Don't overwrite existing capa if no new image was selected
    if (!data.capa_base64) { delete data.capa_base64; delete data.capa_mime; }

    const btn = document.querySelector('#modalFooter .btn-primary');
    btn.disabled = true;
    try {
      if (id) { await API.editarLivro(id, data); UI.toast('Livro atualizado com sucesso!'); }
      else    { await API.criarLivro(data); UI.toast('Livro cadastrado com sucesso!'); }
      UI.closeModal();
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
    finally { btn.disabled = false; }
  }

  async function deletar(id, titulo) {
    const ok = await UI.confirm(`Remover o livro <strong>${esc(titulo)}</strong>? Todos os exemplares também serão removidos.`, 'Remover');
    if (!ok) return;
    try {
      await API.deletarLivro(id);
      UI.toast('Livro removido.');
      loadData();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  /* ===== DETAIL ===== */
  async function openDetail(id) {
    UI.openModal('Detalhes do Livro', UI.loadingHtml(), '', true);
    try {
      const l = await API.livro(id);
      const body = `
        <div class="detail-grid">
          <div class="detail-item"><label>Título</label><span>${esc(l.titulo)}</span></div>
          <div class="detail-item"><label>ISBN</label><span>${l.isbn||'—'}</span></div>
          <div class="detail-item"><label>Autor</label><span>${esc(l.autor_nome||'—')}</span></div>
          <div class="detail-item"><label>Editora</label><span>${esc(l.editora_nome||'—')}</span></div>
          <div class="detail-item"><label>Categoria</label><span>${esc(l.categoria_nome||'—')}</span></div>
          <div class="detail-item"><label>Ano</label><span>${l.ano_publicacao||'—'}</span></div>
          <div class="detail-item"><label>Edição</label><span>${l.edicao||'—'}</span></div>
          <div class="detail-item"><label>Idioma</label><span>${l.idioma||'—'}</span></div>
          <div class="detail-item"><label>Páginas</label><span>${l.num_paginas||'—'}</span></div>
          <div class="detail-item"><label>Localização</label><span>${l.localizacao||'—'}</span></div>
        </div>
        ${l.descricao ? `<p class="text-muted text-sm" style="margin-bottom:1rem">${esc(l.descricao)}</p>` : ''}

        <div class="section-title">Exemplares (${l.exemplares.length})</div>
        <div id="exemplaresList">
          ${l.exemplares.length === 0 ? UI.emptyHtml('Nenhum exemplar cadastrado.') : `
          <div class="table-wrapper">
            <table><thead><tr><th>Tombo</th><th>Condição</th><th>Situação</th><th>Aquisição</th><th>Ações</th></tr></thead>
            <tbody>
              ${l.exemplares.map(e => `<tr>
                <td><code>${esc(e.num_tombo)}</code></td>
                <td>${UI.statusBadge(e.condicao)}</td>
                <td>${e.disponivel ? '<span class="badge badge-green">Disponível</span>' : '<span class="badge badge-orange">Emprestado</span>'}</td>
                <td>${UI.fmtDate(e.data_aquisicao)}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-sm btn-secondary" onclick="LivrosPage.editExemplar(${id},${e.id},'${esc(e.num_tombo)}','${e.condicao}')">
                      <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="LivrosPage.delExemplar(${id},${e.id},'${esc(e.num_tombo)}')">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody></table>
          </div>`}
        </div>`;

      UI.openModal(`📖 ${esc(l.titulo)}`, body,
        `<button class="btn btn-secondary" onclick="UI.closeModal()">Fechar</button>
         <button class="btn btn-primary" onclick="LivrosPage.addExemplarModal(${id})">
           <i class="fa-solid fa-plus"></i> Adicionar Exemplar
         </button>`, true);
    } catch (e) {
      document.getElementById('modalBody').innerHTML = `<div class="alert alert-danger">${e.message}</div>`;
    }
  }

  async function addExemplarModal(idLivro) {
    UI.openModal('Adicionar Exemplar', `
      <form id="exemplarForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Número de tombo *</label>
            <input class="input" name="num_tombo" required placeholder="T-0001">
          </div>
          <div class="form-group">
            <label>Condição</label>
            <select class="input" name="condicao">
              <option>Novo</option><option selected>Bom</option><option>Regular</option><option>Ruim</option>
            </select>
          </div>
          <div class="form-group">
            <label>Data de aquisição</label>
            <input class="input" name="data_aquisicao" type="date" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
      </form>`,
      `<button class="btn btn-secondary" onclick="LivrosPage.openDetail(${idLivro})">Voltar</button>
       <button class="btn btn-primary" onclick="LivrosPage.salvarExemplar(${idLivro},null)">
         <i class="fa-solid fa-floppy-disk"></i> Adicionar
       </button>`);
  }

  async function editExemplar(idLivro, idExemplar, tombo, condicao) {
    UI.openModal('Editar Exemplar', `
      <form id="exemplarForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Número de tombo</label>
            <input class="input" name="num_tombo" value="${esc(tombo)}" readonly>
          </div>
          <div class="form-group">
            <label>Condição</label>
            <select class="input" name="condicao">
              ${['Novo','Bom','Regular','Ruim'].map(c=>`<option ${c===condicao?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Data de aquisição</label>
            <input class="input" name="data_aquisicao" type="date">
          </div>
        </div>
      </form>`,
      `<button class="btn btn-secondary" onclick="LivrosPage.openDetail(${idLivro})">Voltar</button>
       <button class="btn btn-primary" onclick="LivrosPage.salvarExemplar(${idLivro},${idExemplar})">
         <i class="fa-solid fa-floppy-disk"></i> Salvar
       </button>`);
  }

  async function salvarExemplar(idLivro, idExemplar) {
    const form = document.getElementById('exemplarForm');
    if (!form.reportValidity()) return;
    const data = UI.formData(form);
    const btn = document.querySelector('#modalFooter .btn-primary');
    btn.disabled = true;
    try {
      if (idExemplar) await API.editExemplar(idLivro, idExemplar, data);
      else            await API.addExemplar(idLivro, data);
      UI.toast('Exemplar salvo com sucesso!');
      openDetail(idLivro);
    } catch (e) { UI.toast(e.message, 'error'); btn.disabled = false; }
  }

  async function delExemplar(idLivro, idExemplar, tombo) {
    const ok = await UI.confirm(`Remover o exemplar <strong>${esc(tombo)}</strong>?`, 'Remover');
    if (!ok) return;
    try {
      await API.delExemplar(idLivro, idExemplar);
      UI.toast('Exemplar removido.');
      openDetail(idLivro);
    } catch (e) { UI.toast(e.message, 'error'); openDetail(idLivro); }
  }

  return { render, openForm, salvar, deletar, openDetail, addExemplarModal, editExemplar, salvarExemplar, delExemplar, loadData, _goPage };
})();

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
