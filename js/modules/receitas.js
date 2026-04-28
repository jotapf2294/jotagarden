import { addData, getAllData, deleteData } from '../db.js';

const ALERGENOS = ['Glúten','Ovos','Leite','Frutos Casca Rija','Soja','Amendoins','Sésamo','Peixe','Crustáceos','Mostarda','Aipo','Tremoço','Sulfitos','Moluscos'];
const CATEGORIAS = ['Bolos Aniversário','Pastelaria','Sobremesas','Padaria','Salgados','Sem Glúten','Vegan'];
const bc = new BroadcastChannel('docegestao');

export const renderReceitas = async () => {
  const c = document.getElementById('tab-receitas');
  const receitas = await getAllData('receitas');

  c.innerHTML = `
  <div class="receitas-layout">
    <aside class="receitas-sidebar">
      <div class="sidebar-head">
        <h2>📖 Fichas HACCP</h2>
        <div class="filters">
          <input id="search" placeholder="🔍 Pesquisar...">
          <select id="f-cat"><option value="">Todas categorias</option>${CATEGORIAS.map(x=>`<option>${x}</option>`).join('')}</select>
        </div>
        <button id="btn-nova" class="btn-action">+ Nova Ficha</button>
      </div>
      <div id="lista-rec" class="lista"></div>
    </aside>
    <main class="receitas-main" id="detail">
      <div class="empty"><div style="font-size:5rem">🧁</div><h2>Seleciona uma receita</h2><p>Vista otimizada para tablet e desktop</p></div>
    </main>
  </div>

  <div id="modal" class="modalx">
    <div class="modalx-box">
      <header><h2 id="m-tit">Nova Ficha Técnica</h2><button class="x">&times;</button></header>
      <form id="f-rec">
        <nav class="tabs">
          <button type="button" data-t="g" class="on">1. Geral</button>
          <button type="button" data-t="c">2. Composição</button>
          <button type="button" data-t="h">3. HACCP</button>
          <button type="button" data-t="r">4. Rotulagem</button>
        </nav>
        <div class="panes">
          <div class="pane on" id="p-g">
            <div class="grid2">
              <div><label>Nome *</label><input id="n-nome" required></div>
              <div><label>Código</label><input id="n-cod" placeholder="BB-001"></div>
              <div><label>Categoria *</label><select id="n-cat" required><option value="">Escolher</option>${CATEGORIAS.map(x=>`<option>${x}</option>`).join('')}</select></div>
              <div><label>Versão</label><input id="n-ver" value="1.0"></div>
              <div><label>Rendimento</label><input type="number" id="n-rend" value="1" step="0.1"></div>
              <div><label>Peso un (g)</label><input type="number" id="n-peso"></div>
              <div><label>Margem %</label><input type="number" id="n-marg" value="200"></div>
              <div><label>PVP €</label><input id="n-pvp" readonly style="background:#f5f5f5"></div>
            </div>
            <label>Descrição</label><textarea id="n-desc" rows="2"></textarea>
          </div>
          <div class="pane" id="p-c">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
              <h4>Ingredientes (ordem decrescente)</h4><button type="button" id="add-ing" class="btn-s">+ Ingrediente</button>
            </div>
            <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ingrediente *</th><th>Qtd g</th><th>%</th><th>€/kg</th><th>Origem</th><th>Fornecedor</th><th></th></tr></thead><tbody id="tb-ing"></tbody></table></div>
            <div class="tot"><span>Peso total: <b id="t-peso">0g</b></span><span>Custo total: <b id="t-custo">0€</b></span><span>Custo/un: <b id="t-unit">0€</b></span></div>
          </div>
          <div class="pane" id="p-h">
            <div class="grid2">
              <div><label>Temp cozedura °C *</label><input type="number" id="h-temp" required></div>
              <div><label>Tempo min</label><input type="number" id="h-tempo"></div>
              <div><label>Temp armazenamento</label><input id="h-arm" placeholder="0-4°C"></div>
              <div><label>Validade dias *</label><input type="number" id="h-val" required></div>
              <div><label>aw (atividade água)</label><input type="number" step="0.01" id="h-aw"></div>
              <div><label>pH</label><input type="number" step="0.1" id="h-ph"></div>
            </div>
            <h4>PCC - Pontos Críticos</h4><div id="pcc-wrap"></div><button type="button" id="add-pcc" class="btn-s">+ Adicionar PCC</button>
            <h4>Alérgenos Reg.1169/2011</h4><div class="alerg">${ALERGENOS.map(a=>`<label><input type="checkbox" value="${a}"><span>${a}</span></label>`).join('')}</div>
            <label>Modo preparação detalhado *</label><textarea id="h-prep" rows="6" required></textarea>
            <label>Perigos identificados</label><textarea id="h-perigos" rows="2" placeholder="Biológicos, químicos, físicos..."></textarea>
          </div>
          <div class="pane" id="p-r">
            <div class="grid2">
              <div><label>Denominação legal</label><input id="r-denom"></div>
              <div><label>Lote tipo</label><input id="r-lote" placeholder="LAAAAMMDD"></div>
            </div>
            <label>Lista ingredientes (auto)</label><textarea id="r-lista" rows="3" readonly style="background:#f9f9f9"></textarea>
            <h4>Info nutricional /100g</h4>
            <div class="grid4">
              <div><label>Energia kcal</label><input type="number" id="n-kcal"></div>
              <div><label>Lípidos g</label><input type="number" step="0.1" id="n-lip"></div>
              <div><label>Saturados g</label><input type="number" step="0.1" id="n-sat"></div>
              <div><label>Hidratos g</label><input type="number" step="0.1" id="n-hc"></div>
              <div><label>Açúcares g</label><input type="number" step="0.1" id="n-ac"></div>
              <div><label>Proteínas g</label><input type="number" step="0.1" id="n-prot"></div>
              <div><label>Sal g</label><input type="number" step="0.1" id="n-sal"></div>
              <div><label>Fibras g</label><input type="number" step="0.1" id="n-fib"></div>
            </div>
          </div>
        <footer><div class="bar"><span>Custo: <b id="v-custo">0€</b></span><span>PVP: <b id="v-pvp">0€</b></span><span>Margem: <b id="v-marg">0%</b></span></div><div><button type="button" class="btn-ghost x">Cancelar</button><button type="submit" class="btn-pri">💾 Guardar</button></div></footer>
      </form>
    </div>
  </div>`;

  // CSS
  if(!document.getElementById('css-rec')){ const s=document.createElement('style'); s.id='css-rec'; s.textContent=`
 .receitas-layout{display:flex;gap:12px;height:calc(100vh - 130px)}
 .receitas-sidebar{width:360px;background:#fff;border-radius:12px;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(0,0,0,.08)}
 .sidebar-head{padding:16px;border-bottom:1px solid #eee}
 .filters{display:grid;grid-template-columns:1fr 140px;gap:8px;margin:10px 0}
 .filters input,.filters select{padding:9px;border:1px solid #ddd;border-radius:8px}
 .lista{flex:1;overflow:auto;padding:8px}
 .rec-item{padding:12px;border:1px solid #f0f0f0;border-radius:10px;margin-bottom:8px;cursor:pointer;transition:.15s}
 .rec-item:hover{border-color:var(--primary);background:#fff5f8}
 .rec-item.on{background:var(--primary);color:#fff;border-color:var(--primary)}
 .rec-item h4{margin:0 0 4px;font-size:1rem}
 .rec-item.meta{font-size:.8rem;opacity:.8;display:flex;justify-content:space-between}
 .receitas-main{flex:1;background:#fff;border-radius:12px;padding:24px;overflow:auto;box-shadow:0 2px 8px rgba(0,0,0,.08)}
 .empty{text-align:center;margin-top:20vh;color:#999}
 .modalx{position:fixed;inset:0;background:rgba(0,0,0,.7);display:none;z-index:999;align-items:center;justify-content:center;padding:20px}
 .modalx.show{display:flex}
 .modalx-box{background:#fff;width:100%;max-width:1100px;height:92vh;border-radius:16px;display:flex;flex-direction:column;overflow:hidden}
 .modalx-box header{display:flex;justify-content:space-between;align-items:center;padding:18px 24px;background:linear-gradient(135deg,#fff5f8,#fff);border-bottom:2px solid var(--primary)}
 .modalx-box header h2{margin:0}
 .modalx-box.x{background:none;border:none;font-size:32px;cursor:pointer;color:#999}
 .tabs{display:flex;background:#fafafa;border-bottom:1px solid #e5e5e5;padding:0 20px;gap:2px}
 .tabs button{padding:14px 22px;border:none;background:none;cursor:pointer;font-weight:500;border-bottom:3px solid transparent}
 .tabs button.on{border-color:var(--primary);color:var(--primary);background:#fff}
 .panes{flex:1;overflow:auto}
 .pane{display:none;padding:24px;animation:fade.2s}
 .pane.on{display:block}
 .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
 .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
 .panes label{display:block;font-size:.85rem;font-weight:600;margin:0 0 5px;color:#444}
 .panes input,.panes select,.panes textarea{width:100%;padding:10px;border:1.5px solid #e5e5e5;border-radius:8px;font-size:.95rem;transition:.15s}
 .panes input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(255,107,157,.1)}
 .tbl-wrap{border:1px solid #eee;border-radius:10px;overflow:auto;max-height:340px}
 .tbl{width:100%;border-collapse:collapse;min-width:900px}
 .tbl th{background:#f8f9fa;padding:10px;text-align:left;font-size:.8rem;text-transform:uppercase;color:#666;position:sticky;top:0}
 .tbl td{padding:6px;border-top:1px solid #f0f0f0}
 .tbl input{padding:7px;border:1px solid #e5e5e5;border-radius:6px}
 .tot{display:flex;gap:24px;margin-top:12px;padding:12px;background:#f8f9fa;border-radius:8px;font-weight:500}
 .alerg{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
 .alerg label{display:flex;align-items:center;gap:6px;padding:8px;border:1.5px solid #eee;border-radius:8px;cursor:pointer;font-size:.85rem}
 .alerg input:checked+span{font-weight:600}
 .alerg label:has(input:checked){border-color:var(--primary);background:#fff5f8}
 .btn-s{background:#4caf50;color:#fff;border:none;padding:7px 14px;border-radius:7px;cursor:pointer;font-size:.85rem}
 .modalx-box footer{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-top:1px solid #eee;background:#fafafa}
 .bar{display:flex;gap:24px;font-size:.95rem}
 .btn-pri{background:var(--primary);color:#fff;border:none;padding:11px 24px;border-radius:9px;font-weight:600;cursor:pointer}
 .btn-ghost{background:#fff;border:1px solid #ddd;padding:11px 20px;border-radius:9px;cursor:pointer;margin-right:8px}
 .detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:20px 0}
 .stat{background:#f8f9fa;padding:16px;border-radius:10px;border-left:4px solid var(--primary)}
 .stat small{color:#666;font-size:.8rem;text-transform:uppercase}
 .stat h3{margin:4px 0 0;font-size:1.6rem}
  @media(max-width:900px){.receitas-layout{flex-direction:column;height:auto}.receitas-sidebar{width:100%;height:45vh}.grid2,.grid4{grid-template-columns:1fr}.alerg{grid-template-columns:1fr 1fr}.modalx-box{height:100vh;border-radius:0}}
  @keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1}}
  `; document.head.appendChild(s); }

  setup(receitas);
};

function setup(recs){
  const lista=document.getElementById('lista-rec');
  const detail=document.getElementById('detail');
  const modal=document.getElementById('modal');

  const renderLista = (dados) => {
    lista.innerHTML = dados.map(r=>`
      <div class="rec-item" data-id="${r.id}">
        <h4>${r.nome}</h4>
        <div class="meta"><span>${r.codigo||'s/cod'} • ${r.categoria}</span><span>v${r.versao||'1.0'}</span></div>
        <div class="meta" style="margin-top:4px"><span>PVP ${r.venda?.toFixed(2)||'0.00'}€</span><span>${r.validade||'?'} dias</span></div>
      </div>`).join('');
    lista.querySelectorAll('.rec-item').forEach(el=>{
      el.onclick=()=>{
        lista.querySelectorAll('.rec-item').forEach(i=>i.classList.remove('on'));
        el.classList.add('on');
        showDetail(recs.find(x=>x.id===el.dataset.id));
      };
    });
  };

  const showDetail = (r)=>{
    detail.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;gap:20px;flex-wrap:wrap">
        <div><h1 style="margin:0 0 6px">${r.nome}</h1><div style="color:#666">${r.codigo||'Sem código'} • ${r.categoria} • Versão ${r.versao||'1.0'}</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-s" style="background:var(--primary)" onclick="editRec('${r.id}')">✏️ Editar</button>
          <button class="btn-s" style="background:#5D4037" onclick="ft('${r.id}')">📄 Ficha Técnica</button>
          <button class="btn-s" style="background:#2196F3" onclick="prod('${r.id}')">🏭 Produção</button>
          <button class="btn-s" style="background:#ff4444" onclick="delRec('${r.id}')">🗑️</button>
        </div>
      </div>
      <div class="detail-grid">
        <div class="stat"><small>Custo/Un</small><h3>${(r.custoTotal/(r.rendimento||1)).toFixed(2)}€</h3></div>
        <div class="stat"><small>PVP</small><h3 style="color:#4caf50">${r.venda?.toFixed(2)||'0.00'}€</h3></div>
        <div class="stat"><small>Margem</small><h3>${r.margem||200}%</h3></div>
        <div class="stat"><small>Validade</small><h3>${r.validade||'?'}d</h3></div>
        <div class="stat"><small>Cozedura</small><h3>${r.tempCoz||'?'}°C</h3></div>
        <div class="stat"><small>Peso</small><h3>${r.pesoUn||'?'}g</h3></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px">
        <div><h3>📋 Composição</h3><div class="tbl-wrap"><table class="tbl" style="min-width:auto"><thead><tr><th>Ingrediente</th><th>%</th><th>Qtd</th><th>Origem</th></tr></thead><tbody>${r.ingredientes?.map(i=>{const tot=r.ingredientes.reduce((a,b)=>a+b.qtd,0);return `<tr><td>${i.nome}</td><td>${((i.qtd/tot)*100).toFixed(1)}%</td><td>${i.qtd}g</td><td>${i.origem||'—'}</td></tr>`}).join('')||''}</tbody></table></div>${r.alergenos?.length?`<div style="margin-top:12px;padding:12px;background:#ffebee;border-left:4px solid #d32f2f;border-radius:6px"><strong>⚠️ Alérgenos:</strong> ${r.alergenos.join(', ')}</div>`:''}</div>
        <div><h3>🔬 HACCP / ASAE</h3><p><strong>Armazenamento:</strong> ${r.armazenamento?.temp||'0-4°C'} | aw ${r.armazenamento?.aw||'—'} | pH ${r.armazenamento?.ph||'—'}</p><p><strong>PCCs identificados:</strong> ${r.pccs?.length||0}</p>${r.pccs?.map(p=>`<div style="padding:8px;background:#f5f5f5;margin:4px 0;border-radius:6px;font-size:.85rem"><b>${p.etapa}:</b> ${p.perigo} (${p.tipo}) - Limite: ${p.limite}</div>`).join('')||'<p style="color:#999">Nenhum PCC definido</p>'}<h4 style="margin-top:16px">Preparação</h4><div style="background:#f9f9f9;padding:12px;border-radius:8px;max-height:180px;overflow:auto;white-space:pre-wrap;font-size:.9rem">${r.preparacao||'—'}</div></div>
      </div>`;
  };

  window.editRec = id => openModal(recs.find(x=>x.id===id));
  window.delRec = async id => { if(confirm('Eliminar?')){ await deleteData('receitas',id); bc.postMessage('u'); location.reload(); } };
  window.ft = id => gerarFT(recs.find(x=>x.id===id));
  window.prod = id => gerarProd(recs.find(x=>x.id===id));

  document.getElementById('btn-nova').onclick = ()=>openModal(null);
  document.getElementById('search').oninput = e=>{ const t=e.target.value.toLowerCase(); renderLista(recs.filter(r=>r.nome.toLowerCase().includes(t)||r.codigo?.toLowerCase().includes(t))); };
  document.getElementById('f-cat').onchange = e=>{ const v=e.target.value; renderLista(v?recs.filter(r=>r.categoria===v):recs); };

  renderLista(recs);
  if(recs[0]) lista.querySelector('.rec-item')?.click();

  // MODAL LOGIC
  const openModal = (rec)=>{
    modal.classList.add('show');
    document.getElementById('f-rec').dataset.edit = rec?.id||'';
    // preencher campos...
    if(rec){
      document.getElementById('m-tit').textContent='Editar Ficha';
      ['n-nome','n-cod','n-cat','n-ver','n-rend','n-peso','n-marg','n-desc','h-temp','h-tempo','h-arm','h-val','h-aw','h-ph','h-prep','h-perigos','r-denom','r-lote','n-kcal','n-lip','n-sat','n-hc','n-ac','n-prot','n-sal','n-fib'].forEach(id=>{
        const el=document.getElementById(id); if(el) el.value = rec[id.replace(/^[a-z]-/,'').replace('-','')]||rec[id]||'';
      });
      document.getElementById('n-nome').value=rec.nome; document.getElementById('n-cat').value=rec.categoria;
      document.getElementById('h-temp').value=rec.tempCoz; document.getElementById('h-val').value=rec.validade;
      document.getElementById('h-prep').value=rec.preparacao;
      // ingredientes
      const tb=document.getElementById('tb-ing'); tb.innerHTML=''; rec.ingredientes?.forEach(i=>addIngRow(i));
      // alergenos
      document.querySelectorAll('.alerg input').forEach(cb=>cb.checked=rec.alergenos?.includes(cb.value));
    } else {
      document.getElementById('f-rec').reset(); document.getElementById('tb-ing').innerHTML=''; addIngRow();
    }
    calc();
  };

  document.querySelectorAll('.x').forEach(b=>b.onclick=()=>modal.classList.remove('show'));
  document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{ document.querySelectorAll('.tabs button,.pane').forEach(x=>x.classList.remove('on')); b.classList.add('on'); document.getElementById('p-'+b.dataset.t).classList.add('on'); });
  document.getElementById('add-ing').onclick=()=>addIngRow();
  document.getElementById('add-pcc').onclick=()=>addPccRow();
  document.getElementById('tb-ing').oninput=calc;
  ['n-rend','n-marg'].forEach(id=>document.getElementById(id).oninput=calc);

  document.getElementById('f-rec').onsubmit=async e=>{
    e.preventDefault();
    const rec = collectData(); if(document.getElementById('f-rec').dataset.edit) rec.id=document.getElementById('f-rec').dataset.edit;
    await addData('receitas',rec); bc.postMessage('u'); modal.classList.remove('show'); location.reload();
  };

  function addIngRow(d={}){ const tr=document.createElement('tr'); tr.innerHTML=`<td><input value="${d.nome||''}" required></td><td><input type="number" value="${d.qtd||0}" style="width:80px"></td><td class="pct">0%</td><td><input type="number" step="0.01" value="${d.preco||0}" style="width:80px"></td><td><input value="${d.origem||''}" placeholder="PT"></td><td><input value="${d.fornecedor||''}"></td><td><button type="button" onclick="this.closest('tr').remove();calc()" style="background:#ff4444;color:#fff;border:none;padding:4px 8px;border-radius:4px">×</button></td>`; document.getElementById('tb-ing').appendChild(tr); }
  function addPccRow(d={}){ const div=document.createElement('div'); div.style.cssText='display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr auto;gap:8px;margin-bottom:8px'; div.innerHTML=`<input placeholder="Etapa" value="${d.etapa||''}"><select><option>${d.tipo||'Biológico'}</option>${['Biológico','Químico','Físico','Alergénico'].map(x=>`<option>${x}</option>`).join('')}</select><input placeholder="Perigo" value="${d.perigo||''}"><input placeholder="Limite crítico" value="${d.limite||''}"><button type="button" onclick="this.parentElement.remove()" style="background:#ff4444;color:#fff;border:none;padding:6px 10px;border-radius:6px">×</button>`; document.getElementById('pcc-wrap').appendChild(div); }
  window.calc=calc;
  function calc(){ let tot=0,custo=0; document.querySelectorAll('#tb-ing tr').forEach(tr=>{ const q=parseFloat(tr.children[1].querySelector('input').value)||0; const p=parseFloat(tr.children[3].querySelector('input').value)||0; tot+=q; custo+=q/1000*p; }); document.querySelectorAll('#tb-ing tr').forEach(tr=>{ const q=parseFloat(tr.children[1].querySelector('input').value)||0; tr.querySelector('.pct').textContent=tot?((q/tot)*100).toFixed(1)+'%':'0%'; }); const rend=parseFloat(document.getElementById('n-rend').value)||1; const marg=parseFloat(document.getElementById('n-marg').value)||200; const unit=custo/rend; const pvp=unit*(1+marg/100); ['t-peso','v-custo'].forEach(id=>document.getElementById(id.replace('t-','').replace('v-','')==='peso'?'t-peso':'v-custo').textContent= id==='t-peso'?tot+'g':unit.toFixed(2)+'€'); document.getElementById('t-custo').textContent=custo.toFixed(2)+'€'; document.getElementById('t-unit').textContent=unit.toFixed(2)+'€'; document.getElementById('v-pvp').textContent=pvp.toFixed(2)+'€'; document.getElementById('v-marg').textContent=marg+'%'; document.getElementById('n-pvp').value=pvp.toFixed(2); document.getElementById('r-lista').value=Array.from(document.querySelectorAll('#tb-ing tr')).map(tr=>tr.children[0].querySelector('input').value).filter(Boolean).join(', '); }
  function collectData(){ const ings=[]; document.querySelectorAll('#tb-ing tr').forEach(tr=>{ const [n,q,_,p,o,f]=[...tr.querySelectorAll('input')].map(i=>i.value); if(n) ings.push({nome:n,qtd:parseFloat(q)||0,preco:parseFloat(p)||0,origem:o,fornecedor:f}); }); const pccs=[]; document.querySelectorAll('#pcc-wrap > div').forEach(d=>{ const [e,t,p,l]=[...d.querySelectorAll('input,select')].map(x=>x.value); if(e) pccs.push({etapa:e,tipo:t,perigo:p,limite:l}); }); const custo=ings.reduce((a,i)=>a+i.qtd/1000*i.preco,0); const rend=parseFloat(document.getElementById('n-rend').value)||1; const marg=parseFloat(document.getElementById('n-marg').value)||200; return { id:Date.now().toString(), nome:document.getElementById('n-nome').value, codigo:document.getElementById('n-cod').value, categoria:document.getElementById('n-cat').value, versao:document.getElementById('n-ver').value, rendimento:rend, pesoUn:document.getElementById('n-peso').value, margem:marg, descricao:document.getElementById('n-desc').value, ingredientes:ings, custoTotal:custo, venda:custo/rend*(1+marg/100), tempCoz:document.getElementById('h-temp').value, tempo:document.getElementById('h-tempo').value, validade:document.getElementById('h-val').value, armazenamento:{temp:document.getElementById('h-arm').value, aw:document.getElementById('h-aw').value, ph:document.getElementById('h-ph').value}, pccs, alergenos:[...document.querySelectorAll('.alerg input:checked')].map(c=>c.value), preparacao:document.getElementById('h-prep').value, perigos:document.getElementById('h-perigos').value, rotulagem:{denominacao:document.getElementById('r-denom').value, lote:document.getElementById('r-lote').value, ingredientes:document.getElementById('r-lista').value}, nutricional:{kcal:document.getElementById('n-kcal').value,lipidos:document.getElementById('n-lip').value,saturados:document.getElementById('n-sat').value,hidratos:document.getElementById('n-hc').value,acucares:document.getElementById('n-ac').value,proteinas:document.getElementById('n-prot').value,sal:document.getElementById('n-sal').value,fibras:document.getElementById('n-fib').value}, dataCriacao:new Date().toISOString() }; }
}

function gerarFT(r){
  const w=open('','_blank'); const tot=r.ingredientes.reduce((a,b)=>a+b.qtd,0);
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>FT ${r.nome}</title><style>@page{size:A4;margin:15mm}body{font-family:Arial;font-size:10pt}h1{color:#d81b60;border-bottom:3px solid #d81b60;padding-bottom:6px}.hdr{display:flex;justify-content:space-between;margin-bottom:16px}.box{border:1.5px solid #333;margin:12px 0;padding:0}.box h3{background:#333;color:#fff;margin:0;padding:6px 10px;font-size:10pt;text-transform:uppercase}.box.c{padding:10px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:5px;text-align:left}th{background:#f0f0f0}.alerg{background:#ffebee;border:2px solid #c62828;padding:8px;text-align:center;font-weight:bold;color:#b71c1c;margin:10px 0}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="text-align:center;margin-bottom:12px"><button onclick="print()" style="padding:8px 16px;background:#d81b60;color:#fff;border:none;border-radius:6px">🖨️ Imprimir</button></div><div class="hdr"><div><h1>FICHA TÉCNICA HACCP</h1><div style="font-size:18px;font-weight:bold;color:#d81b60">${r.nome}</div></div><div style="text-align:right"><div><b>Código:</b> ${r.codigo||'—'}</div><div><b>Versão:</b> ${r.versao||'1.0'}</div><div><b>Data:</b> ${new Date().toLocaleDateString('pt-PT')}</div></div></div><div class="box"><h3>1. Identificação</h3><div class="c"><table><tr><th width="20%">Denominação</th><td colspan="3">${r.rotulagem?.denominacao||r.nome}</td></tr><tr><th>Categoria</th><td>${r.categoria}</td><th>Peso un</th><td>${r.pesoUn||'?'}g</td></tr><tr><th>Rendimento</th><td>${r.rendimento} un</td><th>Validade</th><td>${r.validade} dias a ${r.armazenamento?.temp||'0-4°C'}</td></tr></table></div></div><div class="box"><h3>2. Lista de Ingredientes (ordem decrescente)</h3><div class="c">${r.ingredientes.sort((a,b)=>b.qtd-a.qtd).map(i=>`${i.nome} (${((i.qtd/tot)*100).toFixed(1)}%)`).join(', ')}.</div></div>${r.alergenos?.length?`<div class="alerg">⚠️ CONTÉM ALERGÉNIOS: ${r.alergenos.join(', ').toUpperCase()}</div>`:''}<div class="box"><h3>3. Características Físico-Químicas</h3><div class="c"><table><tr><th>Parâmetro</th><th>Valor</th><th>Parâmetro</th><th>Valor</th></tr><tr><td>Temperatura cozedura</td><td>${r.tempCoz}°C / ${r.tempo||'?'} min</td><td>aw</td><td>${r.armazenamento?.aw||'—'}</td></tr><tr><td>pH</td><td>${r.armazenamento?.ph||'—'}</td><td>Humidade</td><td>—</td></tr></table></div></div><div class="box"><h3>4. PCC - Pontos Críticos de Controlo</h3><div class="c"><table><tr><th>Etapa</th><th>Perigo</th><th>Tipo</th><th>Limite Crítico</th></tr>${r.pccs?.map(p=>`<tr><td>${p.etapa}</td><td>${p.perigo}</td><td>${p.tipo}</td><td>${p.limite}</td></tr>`).join('')||'<tr><td colspan="4">A definir</td></tr>'}</table></div></div><div class="box"><h3>5. Modo de Preparação</h3><div class="c" style="white-space:pre-wrap">${r.preparacao}</div></div></body></html>`); w.document.close();
}

function gerarProd(r){
  const w=open('','_blank'); const lote=`L${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>OP ${r.nome}</title><style>@page{size:A4;margin:12mm}body{font-family:Arial;font-size:10.5pt}h1{margin:0}.top{background:#5D4037;color:#fff;padding:12px;display:flex;justify-content:space-between;align-items:center}.lote{background:#d81b60;color:#fff;text-align:center;padding:8px;font-weight:bold;font-size:13pt;margin:10px 0}.box{border:2px solid #5D4037;margin:12px 0}.box h3{background:#5D4037;color:#fff;margin:0;padding:6px 10px;font-size:10pt}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:8px}th{background:#f5f5f5}.chk{width:40px;text-align:center;font-size:16pt}.sign{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:30px}.sign div{border-top:1px solid #000;text-align:center;padding-top:6px;font-size:9pt}@media print{.no-print{display:none}}</style></head><body><div class="no-print" style="text-align:center"><button onclick="print()" style="padding:8px 16px;background:#d81b60;color:#fff;border:none">Imprimir OP</button></div><div class="top"><div><h1>ORDEM DE PRODUÇÃO</h1><div style="font-size:14pt">${r.nome}</div></div><div style="text-align:right">Data: ${new Date().toLocaleDateString('pt-PT')}<br>Operador: _____________</div></div><div class="lote">LOTE: ${lote} | VALIDADE: ${new Date(Date.now()+(r.validade||3)*86400000).toLocaleDateString('pt-PT')}</div><div class="box"><h3>CHECKLIST PESAGEM - INGREDIENTES</h3><table><thead><tr><th>Ingrediente</th><th>Qtd Teórica</th><th>Qtd Real</th><th>Lote MP</th><th class="chk">✓</th></tr></thead><tbody>${r.ingredientes.map(i=>`<tr><td><b>${i.nome}</b><br><small>Origem: ${i.origem||'—'} | Forn: ${i.fornecedor||'—'}</small></td><td>${i.qtd}g</td><td>__________</td><td>__________</td><td class="chk">☐</td></tr>`).join('')}</tbody></table></div><div class="box"><h3>CONTROLO PCC</h3><table><thead><tr><th>PCC</th><th>Limite</th><th>Valor Medido</th><th>Conforme</th><th>Rubrica</th></tr></thead><tbody>${r.pccs?.map(p=>`<tr><td>${p.etapa} - ${p.perigo}</td><td>${p.limite}</td><td>________</td><td>☐ Sim ☐ Não</td><td>______</td></tr>`).join('')||`<tr><td>Cozedura</td><td>${r.tempCoz}°C</td><td>____°C</td><td>☐</td><td>___</td></tr>`}</tbody></table></div><div class="box"><h3>INSTRUÇÕES</h3><div style="padding:10px;white-space:pre-wrap;min-height:80px">${r.preparacao}</div></div><div class="sign"><div>Operador Produção</div><div>Controlo Qualidade</div><div>Responsável</div></div></body></html>`); w.document.close();
}
