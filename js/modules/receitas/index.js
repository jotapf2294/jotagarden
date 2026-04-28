import { addData, getAllData, deleteData } from '../../db.js';
import { CATEGORIAS } from './constants.js';
import { injectStyles } from './styles.js';
import { renderLista } from './list.js';
import { showDetail } from './detail.js';
import { createModal, openModal, collectModalData, closeModal } from './modal.js';
import { gerarFichaTecnica, gerarEtiquetaProducao } from './export.js';
import { debounce } from './utils.js';

const bc = new BroadcastChannel('docegestao');
let receitasCache = [];
let modalInstance = null;

export const renderReceitas = async () => {
  injectStyles();

  const c = document.getElementById('tab-receitas');
  c.innerHTML = `
    <div style="display:flex;gap:16px;height:calc(100vh - 120px);min-height:500px">
      <aside style="width:360px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0">
        <div style="padding:16px;border-bottom:1px solid var(--border)">
          <h2 style="font-size:1rem;font-weight:600;margin:0 0 12px">📖 Fichas Técnicas</h2>
          <div style="display:grid;grid-template-columns:1fr 140px;gap:8px;margin-bottom:12px">
            <input id="search-rec" placeholder="🔍 Pesquisar..." aria-label="Pesquisar receitas" style="min-height:32px">
            <select id="f-cat-rec" aria-label="Filtrar por categoria" style="min-height:32px">
              <option value="">Todas</option>
              ${CATEGORIAS.map(x => `<option>${x}</option>`).join('')}
            </select>
          </div>
          <button id="btn-nova-rec" class="btn btn-primary btn-block">+ Nova Ficha</button>
        </div>
        <div id="lista-rec" style="flex:1;overflow-y:auto;padding:8px" role="list"></div>
      </aside>
      <main style="flex:1;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:24px;overflow-y:auto;min-width:0" id="detail-rec" role="main">
        <div class="empty-state">
          <div class="emoji">🧁</div>
          <h2 style="font-size:1.25rem;margin-bottom:8px">Seleciona uma receita</h2>
          <p>Vista otimizada para tablet e desktop</p>
        </div>
      </main>
    </div>
  `;

  // Mobile: stack vertical
  if (window.innerWidth < 1024) {
    c.querySelector('div[style*="display:flex"]').style.cssText = 'display:flex;flex-direction:column;gap:16px;height:auto';
    c.querySelector('aside').style.cssText = 'width:100%;height:45vh;flex-shrink:0';
  }

  if (!modalInstance) {
    modalInstance = createModal();
    modalInstance.querySelector('#f-rec').onsubmit = handleSubmit;
  }

  await loadReceitas();
  setupFilters();
  setupBroadcast();

  document.getElementById('btn-nova-rec').onclick = () => openModal(modalInstance, null);
};

async function loadReceitas() {
  receitasCache = await getAllData('receitas');
  const lista = document.getElementById('lista-rec');
  const detail = document.getElementById('detail-rec');

  renderLista(receitasCache, lista, (rec) => {
    showDetail(rec, detail, {
      onEdit: (r) => openModal(modalInstance, r),
      onDelete: handleDelete,
      onFT: gerarFichaTecnica,
      onProd: gerarEtiquetaProducao
    });
  });

  if (receitasCache[0] && window.innerWidth >= 1024) {
    lista.querySelector('.rec-item')?.click();
  }
}

function setupFilters() {
  const searchInput = document.getElementById('search-rec');
  const catSelect = document.getElementById('f-cat-rec');

  const filter = debounce(() => {
    const termo = searchInput.value.toLowerCase();
    const cat = catSelect.value;

    const filtradas = receitasCache.filter(r => {
      const matchTermo = !termo || r.nome.toLowerCase().includes(termo) || r.codigo?.toLowerCase().includes(termo);
      const matchCat = !cat || r.categoria === cat;
      return matchTermo && matchCat;
    });

    renderLista(filtradas, document.getElementById('lista-rec'), (rec) => {
      showDetail(rec, document.getElementById('detail-rec'), {
        onEdit: (r) => openModal(modalInstance, r),
        onDelete: handleDelete,
        onFT: gerarFichaTecnica,
        onProd: gerarEtiquetaProducao
      });
    });
  }, 300);

  searchInput.oninput = filter;
  catSelect.onchange = filter;
}

function setupBroadcast() {
  bc.onmessage = (e) => {
    if (e.data === 'update-receitas') loadReceitas();
  };
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  form.dataset.dirty = 'false';

  try {
    const rec = collectModalData(modalInstance);

    if (!rec.nome || !rec.categoria) {
      window.toast('❌ Preenche os campos obrigatórios *');
      return;
    }

    if (!rec.ingredientes.length) {
      window.toast('❌ Adiciona pelo menos 1 ingrediente');
      return;
    }

    await addData('receitas', rec);
    window.toast('✅ Ficha guardada!');
    closeModal(modalInstance);
    bc.postMessage('update-receitas');
    await loadReceitas();

    setTimeout(() => {
      document.querySelector(`.rec-item[data-id="${rec.id}"]`)?.click();
    }, 100);

  } catch (err) {
    console.error(err);
    window.toast('❌ Erro ao guardar');
  }
}

async function handleDelete(id) {
  if (!confirm('Eliminar esta ficha técnica? Esta ação não pode ser desfeita.')) return;

  try {
    await deleteData('receitas', id);
    window.toast('✅ Ficha eliminada');
    bc.postMessage('update-receitas');
    await loadReceitas();
    document.getElementById('detail-rec').innerHTML = `
      <div class="empty-state">
        <div class="emoji">🧁</div>
        <h2 style="font-size:1.25rem;margin-bottom:8px">Seleciona uma receita</h2>
        <p>Vista otimizada para tablet e desktop</p>
      </div>
    `;
  } catch (err) {
    console.error(err);
    window.toast('❌ Erro ao eliminar');
  }
}

document.addEventListener('input', (e) => {
  if (e.target.closest('#f-rec')) {
    e.target.closest('#f-rec').dataset.dirty = 'true';
  }
});
