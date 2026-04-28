export function injectStyles() {
  if (document.getElementById('css-receitas-v3')) return;

  const s = document.createElement('style');
  s.id = 'css-receitas-v3';
  s.textContent = `
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
.modalx-box.x{background:none;border:none;font-size:32px;cursor:pointer;color:#999;padding:0 8px}
.tabs{display:flex;background:#fafafa;border-bottom:1px solid #e5e5e5;padding:0 20px;gap:2px}
.tabs button{padding:14px 22px;border:none;background:none;cursor:pointer;font-weight:500;border-bottom:3px solid transparent}
.tabs button.on{border-color:var(--primary);color:var(--primary);background:#fff}
.panes{flex:1;overflow:auto}
.pane{display:none;padding:24px;animation:fade.2s}
.pane.on{display:block}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
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
.btn-s{background:var(--success);color:#fff;border:none;padding:7px 14px;border-radius:7px;cursor:pointer;font-size:.85rem}
.modalx-box footer{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-top:1px solid #eee;background:#fafafa}
.bar{display:flex;gap:24px;font-size:.95rem}
.btn-pri{background:var(--primary);color:#fff;border:none;padding:11px 24px;border-radius:9px;font-weight:600;cursor:pointer}
.btn-ghost{background:#fff;border:1px solid #ddd;padding:11px 20px;border-radius:9px;cursor:pointer;margin-right:8px}
.detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:20px 0}
.stat{background:#f8f9fa;padding:16px;border-radius:10px;border-left:4px solid var(--primary)}
.stat small{color:#666;font-size:.8rem;text-transform:uppercase}
.stat h3{margin:4px 0 0;font-size:1.6rem}
.pcc-row{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr auto;gap:8px;margin-bottom:8px}
 @media(max-width:900px){.receitas-layout{flex-direction:column;height:auto}.receitas-sidebar{width:100%;height:45vh}.grid2,.grid4{grid-template-columns:1fr}.alerg{grid-template-columns:1fr 1fr}.modalx-box{height:100vh;border-radius:0}.pcc-row{grid-template-columns:1fr}}
 @keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1}}
  `;
  document.head.appendChild(s);
}
