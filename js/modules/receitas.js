import { addData, getAllData, deleteData } from '../db.js';

const ALERGENOS_LIST = ['Glúten', 'Ovos', 'Leite', 'Frutos de Casca Rija', 'Soja', 'Amendoins', 'Sésamo'];
const CATEGORIAS = ['Bolos de Aniversário', 'Pastelaria Semanal', 'Sobremesas', 'Padaria', 'Salgados'];
const bc = new BroadcastChannel('docegestao');

export const renderReceitas = async () => {
  const container = document.getElementById('tab-receitas');
  const receitas = await getAllData('receitas');

  container.innerHTML = `
  <div class="header-section">
    <h2>📖 Fichas Técnicas HACCP</h2>
    <div style="display:grid;grid-template-columns:1fr 120px;gap:8px;margin:10px 0">
      <input type="text" id="search-receita" placeholder="🔍 Pesquisar...">
      <select id="filter-categoria"><option value="">Todas</option>${CATEGORIAS.map(c=>`<option>${c}</option>`).join('')}</select>
    </div>
    <button id="btn-abrir-modal" class="btn-action">+ Criar Nova Ficha</button>
  </div>
  <div id="lista-receitas" class="grid-receitas"></div>
  <div id="modal-receita" class="modal"><div class="modal-content card">
    <div style="display:flex;justify-content:space-between"><h3 id="modal-titulo">Nova Ficha</h3><span class="close-modal" style="font-size:28px;cursor:pointer">&times;</span></div>
    <form id="form-receita">
      <div style="display:flex;gap:5px;margin:10px 0">
        <button type="button" class="tab-btn active" data-tab="geral" style="flex:1;padding:8px;border:none;background:var(--primary);color:white;border-radius:6px">Geral</button>
        <button type="button" class="tab-btn" data-tab="haccp" style="flex:1;padding:8px;border:1px solid #ddd;background:white;border-radius:6px">HACCP</button>
      </div>
      <div id="form-geral" class="form-section">
        <input id="rec-nome" placeholder="Nome da Receita" required>
        <select id="rec-categoria" required style="margin-top:6px"><option value="">Categoria</option>${CATEGORIAS.map(c=>`<option>${c}</option>`).join('')}</select>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div><label style="font-size:.8rem">Rendimento</label><input type="number" id="rec-rendimento" value="1" step="0.01"></div>
          <div><label style="font-size:.8rem">Margem %</label><input type="number" id="rec-margem" value="200" step="10"></div>
        </div>
        <h4 style="margin-top:12px">Ingredientes</h4>
        <table style="width:100%;font-size:.85rem"><thead><tr style="background:#f5f5f5"><th>Item</th><th>Qtd(g)</th><th>€/Kg</th><th>Sub</th><th></th></tr></thead><tbody id="corpo-tabela"></tbody></table>
        <button type="button" id="add-ingrediente" class="btn-small" style="margin-top:6px;padding:6px 10px;background:#4caf50;color:white;border:none;border-radius:6px">+ Item</button>
      </div>
      <div id="form-haccp" class="form-section" style="display:none">
        <h4>⚠️ Alérgenos</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">${ALERGENOS_LIST.map(a=>`<label><input type="checkbox" name="alergenos" value="${a}"> ${a}</label>`).join('')}</div>
        <textarea id="rec-preparacao" placeholder="Modo de preparação..." style="margin-top:10px;height:90px"></textarea>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <input type="number" id="rec-temp-coz" placeholder="Temp °C *">
          <input type="number" id="rec-validade" placeholder="Validade dias *">
        </div>
      </div>
      <div class="card" style="background:#333;color:white;margin-top:12px"><div style="display:flex;justify-content:space-between"><span>Custo: <strong id="custo-unitario" style="color:var(--primary)">0.00€</strong></span><span>Venda: <strong id="preco-venda" style="color:#4caf50">0.00€</strong></span></div></div>
      <button type="submit" class="btn-action" style="margin-top:12px">Guardar</button>
    </form>
  </div></div>`;

  setupLogic(receitas);
  renderLista(receitas);
  bc.onmessage = e => { if (e.data === 'upd') renderReceitas(); };
};

function setupLogic(receitasTodas){
  let receitas = receitasTodas;
  const modal = document.getElementById('modal-receita');
  const form = document.getElementById('form-receita');
  document.querySelector('.close-modal').onclick = () => modal.style.display='none';
  modal.onclick = e => { if(e.target===modal) modal.style.display='none'; };
  document.getElementById('btn-abrir-modal').onclick = () => {
    delete form.dataset.editId; form.reset();
    document.getElementById('corpo-tabela').innerHTML='';
    document.getElementById('modal-titulo').innerText='Nova Ficha';
    switchTab('geral'); adicionarLinha(); modal.style.display='block';
  };
  document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  function switchTab(t){ document.querySelectorAll('.tab-btn').forEach(el=>{el.style.background=el.dataset.tab===t?'var(--primary)':'white';el.style.color=el.dataset.tab===t?'white':'#333';}); document.querySelectorAll('.form-section').forEach(s=>s.style.display='none'); document.getElementById('form-'+t).style.display='block';}
  document.getElementById('add-ingrediente').onclick = adicionarLinha;
  document.getElementById('corpo-tabela').addEventListener('input', calcular);
  ['rec-rendimento','rec-margem'].forEach(id=>document.getElementById(id).addEventListener('input', calcular));
  form.onsubmit = async e => {
    e.preventDefault();
    if(!document.querySelectorAll('#corpo-tabela tr').length){alert('Adiciona ingredientes');return;}
    if(!document.getElementById('rec-temp-coz').value || !document.getElementById('rec-validade').value){alert('Preenche Temp e Validade HACCP');switchTab('haccp');return;}
    const dados = capturarDados(); if(form.dataset.editId) dados.id = form.dataset.editId;
    await addData('receitas', dados); modal.style.display='none'; bc.postMessage('upd'); renderReceitas();
  };
  const filtrar = () => {
    const termo = document.getElementById('search-receita').value.toLowerCase();
    const cat = document.getElementById('filter-categoria').value;
    renderLista(receitas.filter(r=> r.nome.toLowerCase().includes(termo) && (!cat || r.categoria===cat)));
  };
  document.getElementById('search-receita').oninput = filtrar;
  document.getElementById('filter-categoria').onchange = filtrar;
}

function adicionarLinha(){
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><input class="ing-nome" required style="padding:4px;border:1px solid #ddd"></td>
  <td><input type="number" class="ing-qtd" value="0" style="width:70px;padding:4px;border:1px solid #ddd"></td>
  <td><input type="number" class="ing-preco" value="0" step="0.01" style="width:70px;padding:4px;border:1px solid #ddd"></td>
  <td class="ing-sub">0.00€</td>
  <td><button type="button" class="btn-remove" style="background:#ff4444;color:white;border:none;border-radius:4px;padding:2px 6px">×</button></td>`;
  tr.querySelector('.btn-remove').onclick = ()=>{tr.remove();calcular();};
  document.getElementById('corpo-tabela').appendChild(tr);
}
function calcular(){
  let total=0;
  document.querySelectorAll('#corpo-tabela tr').forEach(r=>{
    const q=parseFloat(r.querySelector('.ing-qtd').value)||0;
    const p=parseFloat(r.querySelector('.ing-preco').value)||0;
    const sub=(q/1000)*p; total+=sub; r.querySelector('.ing-sub').innerText=sub.toFixed(2)+'€';
  });
  const rend=parseFloat(document.getElementById('rec-rendimento').value)||1;
  const marg=parseFloat(document.getElementById('rec-margem').value)||200;
  const custo=total/rend; const venda=custo*(1+marg/100);
  document.getElementById('custo-unitario').innerText=custo.toFixed(2)+'€';
  document.getElementById('preco-venda').innerText=venda.toFixed(2)+'€';
}
function capturarDados(){
  const ings=[]; document.querySelectorAll('#corpo-tabela tr').forEach(r=>{ const n=r.querySelector('.ing-nome').value; if(n) ings.push({nome:n,qtd:parseFloat(r.querySelector('.ing-qtd').value)||0,preco:parseFloat(r.querySelector('.ing-preco').value)||0});});
  const custo=ings.reduce((a,i)=>a+(i.qtd/1000)*i.preco,0);
  const rend=parseFloat(document.getElementById('rec-rendimento').value)||1;
  const marg=parseFloat(document.getElementById('rec-margem').value)||200;
  return { id:Date.now().toString(), nome:document.getElementById('rec-nome').value, categoria:document.getElementById('rec-categoria').value, rendimento:rend, margem:marg, ingredientes:ings, alergenos:Array.from(document.querySelectorAll('input[name="alergenos"]:checked')).map(c=>c.value), preparacao:document.getElementById('rec-preparacao').value, tempCoz:document.getElementById('rec-temp-coz').value, validade:document.getElementById('rec-validade').value, custoTotal:custo, venda:(custo/rend)*(1+marg/100) };
}
function renderLista(receitas){
  const lista=document.getElementById('lista-receitas');
  lista.innerHTML = receitas.length ? receitas.map(r=>`
    <div class="card">
      <div style="background:var(--secondary);display:inline-block;padding:2px 8px;border-radius:10px;font-size:.7rem">${r.categoria}</div>
      <h4 style="margin:6px 0">${r.nome}</h4>
      <div style="display:flex;justify-content:space-between;font-size:.9rem"><span>Custo ${r.custoTotal.toFixed(2)}€</span><span style="color:#4caf50;font-weight:bold">Venda ${r.venda.toFixed(2)}€</span></div>
      ${r.alergenos?.length?`<div style="color:#e57373;font-size:.75rem;margin-top:4px">⚠️ ${r.alergenos.join(', ')}</div>`:''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:8px">
        <button class="btn-small btn-edit" data-id="${r.id}" style="padding:6px;background:var(--primary);color:white;border:none;border-radius:6px">📝 Editar</button>
        <button class="btn-small btn-dup" data-id="${r.id}" style="padding:6px;background:#2196F3;color:white;border:none;border-radius:6px">📋 Duplicar</button>
        <button class="btn-small btn-ft" data-id="${r.id}" style="padding:6px;background:#5D4037;color:white;border:none;border-radius:6px">📄 FT</button>
        <button class="btn-small btn-prod" data-id="${r.id}" style="padding:6px;background:#6c757d;color:white;border:none;border-radius:6px">👨‍🍳 Fabrico</button>
      </div>
      <button class="btn-small btn-del" data-id="${r.id}" style="width:100%;margin-top:4px;padding:4px;background:#ff4444;color:white;border:none;border-radius:6px">🗑️</button>
    </div>`).join('') : '<p class="card" style="text-align:center">Nenhuma receita. Cria a primeira!</p>';

  document.querySelectorAll('.btn-edit').forEach(b=>b.onclick=()=>abrirEdicao(b.dataset.id, receitas));
  document.querySelectorAll('.btn-dup').forEach(b=>b.onclick=async()=>{ const r=receitas.find(x=>x.id===b.dataset.id); await addData('receitas',{...r,id:Date.now().toString(),nome:r.nome+' (Cópia)'}); bc.postMessage('upd'); renderReceitas(); });
  document.querySelectorAll('.btn-del').forEach(b=>b.onclick=async()=>{ if(confirm('Eliminar?')){ await deleteData('receitas',b.dataset.id); bc.postMessage('upd'); renderReceitas(); }});
  document.querySelectorAll('.btn-ft').forEach(b=>b.onclick=()=>gerarFT(b.dataset.id,receitas));
  document.querySelectorAll('.btn-prod').forEach(b=>b.onclick=()=>gerarProd(b.dataset.id,receitas));
}
function abrirEdicao(id,receitas){
  const r=receitas.find(x=>x.id===id); const form=document.getElementById('form-receita'); form.dataset.editId=id;
  document.getElementById('modal-titulo').innerText='Editar'; document.getElementById('corpo-tabela').innerHTML='';
  ['rec-nome','rec-categoria','rec-rendimento','rec-margem','rec-preparacao','rec-temp-coz','rec-validade'].forEach(id=>document.getElementById(id).value=r[id.replace('rec-','').replace('-','')]||r[id.replace('rec-','')]||'');
  document.getElementById('rec-nome').value=r.nome; document.getElementById('rec-categoria').value=r.categoria; document.getElementById('rec-rendimento').value=r.rendimento; document.getElementById('rec-margem').value=r.margem; document.getElementById('rec-preparacao').value=r.preparacao; document.getElementById('rec-temp-coz').value=r.tempCoz; document.getElementById('rec-validade').value=r.validade;
  r.ingredientes.forEach(i=>{adicionarLinha(); const tr=document.querySelector('#corpo-tabela tr:last-child'); tr.querySelector('.ing-nome').value=i.nome; tr.querySelector('.ing-qtd').value=i.qtd; tr.querySelector('.ing-preco').value=i.preco;});
  document.querySelectorAll('input[name="alergenos"]').forEach(cb=>cb.checked=r.alergenos.includes(cb.value)); calcular(); document.getElementById('modal-receita').style.display='block';
}
function gerarFT(id,receitas){ const r=receitas.find(x=>x.id===id); const peso=r.ingredientes.reduce((a,i)=>a+i.qtd,0); const w=open('','_blank'); w.document.write(`<title>FT ${r.nome}</title><style>body{font-family:Arial;padding:20px}h1{color:#FF6B9D}</style><h1>FICHA TÉCNICA - ${r.nome}</h1><p><b>Categoria:</b> ${r.categoria} | <b>Validade:</b> ${r.validade} dias | <b>Temp:</b> ${r.tempCoz}°C</p><h3>Ingredientes</h3><ul>${r.ingredientes.map(i=>`<li>${i.nome} - ${i.qtd}g (${((i.qtd/peso)*100).toFixed(1)}%)</li>`).join('')}</ul><p><b>Alergénios:</b> ${r.alergenos.join(', ')}</p><p><b>Preparação:</b><br>${r.preparacao}</p><button onclick="print()">Imprimir</button>`); w.document.close(); }
function gerarProd(id,receitas){ const r=receitas.find(x=>x.id===id); const w=open('','_blank'); w.document.write(`<title>Produção ${r.nome}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px}</style><h1>ORDEM DE FABRICO - ${r.nome}</h1><p>Data: ${new Date().toLocaleDateString('pt-PT')}</p><table><tr><th>Ingrediente</th><th>Qtd</th><th>OK</th></tr>${r.ingredientes.map(i=>`<tr><td>${i.nome}</td><td>${i.qtd}g</td><td>☐</td></tr>`).join('')}</table><p>Temp alvo: ${r.tempCoz}°C</p><button onclick="print()">Imprimir</button>`); w.document.close(); }
