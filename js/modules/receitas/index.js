import { addData, getAllData, deleteData, updateData } from '../../db.js';
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
  try {
    receitasCache = await getAllData('receitas') || [];
    console.log('✅ Receitas carregadas:', receitasCache.length);

    const lista = document.getElementById('lista-rec');
    const detail = document.getElementById('detail-rec');
    if (!lista) return;

    // FIX: Limpa filtros pra garantir que a nova ficha aparece
    const searchInput = document.getElementById('search-rec');
    const catSelect = document.getElementById('f-cat-rec');
    if (searchInput) searchInput.value = '';
    if (catSelect) catSelect.value = '';

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
  } catch (err) {
    console.error('❌ Erro ao carregar receitas:', err);
    window.toast('❌ Erro ao carregar fichas');
  }
}

function setupFilters() {
  const searchInput = document.getElementById('search-rec');
  const catSelect = document.getElementById('f-cat-rec');

  const filter = debounce(() => {
    const termo = searchInput.value.toLowerCase().trim();
    const cat = catSelect.value;

    const filtradas = receitasCache.filter(r => {
      const matchTermo =!termo || 
        r.nome.toLowerCase().includes(termo) || 
        r.codigo?.toLowerCase().includes(termo) ||
        r.descricao?.toLowerCase().includes(termo);
      const matchCat =!cat || r.categoria === cat;
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
    if (e.data === 'update-receitas') {
      console.log('📡 Update recebido via BroadcastChannel');
      loadReceitas();
    }
  };
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('[type="submit"]');
  form.dataset.dirty = 'false';

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'A guardar...';
    }

    const rec = collectModalData(modalInstance);

    if (!rec.nome?.trim() ||!rec.categoria) {
      window.toast('❌ Preenche Nome e Categoria');
      return;
    }

    if (!rec.ingredientes?.length) {
      window.toast('❌ Adiciona pelo menos 1 ingrediente');
      return;
    }

    const isEdit =!!rec.id && receitasCache.some(r => r.id === rec.id);

    if (isEdit) {
      rec.updatedAt = new Date().toISOString();
      await updateData('receitas', rec);
      window.toast('✅ Ficha atualizada!');
    } else {
      rec.id = rec.id || Date.now().toString();
      rec.createdAt = new Date().toISOString();
      rec.updatedAt = new Date().toISOString();
      await addData('receitas', rec);
      window.toast('✅ Ficha guardada!');
    }

    // FIX PRINCIPAL: Recarrega lista ANTES de fechar modal
    await loadReceitas();
    
    closeModal(modalInstance);
    bc.postMessage('update-receitas');

    // Auto-seleciona a ficha guardada
    setTimeout(() => {
      document.querySelector(`.rec-item[data-id="${rec.id}"]`)?.click();
    }, 100);

  } catch (err) {
    console.error('❌ Erro ao guardar:', err);
    window.toast('❌ Erro ao guardar ficha');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Guardar';
    }
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
    console.error('❌ Erro ao eliminar:', err);
    window.toast('❌ Erro ao eliminar');
  }
}

// Marca formulário como "sujo" ao editar
document.addEventListener('input', (e) => {
  if (e.target.closest('#f-rec')) {
    e.target.closest('#f-rec').dataset.dirty = 'true';
  }
});

// Debug: exporta pro window
window.loadReceitas = loadReceitas;
window.receitasCache = receitasCache;