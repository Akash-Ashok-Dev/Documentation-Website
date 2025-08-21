const STORAGE_KEY = 'docs.notebook.v1';
let docs = [];
let editingId = null;

const el = (sel) => document.querySelector(sel);
const els = (sel) => Array.from(document.querySelectorAll(sel));
const status = el('#status');

function load(){
  try{ docs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch{ docs = [] }
}
function persist(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  flashSaved();
}
function flashSaved(){
  status.textContent = 'Saved';
  status.style.opacity = '1';
  setTimeout(()=>{ status.style.opacity = '.7'; }, 800);
}

// UI helpers
function showCompose(isEdit=false){
  el('#compose').classList.remove('hidden');
  el('#compose-title').textContent = isEdit? 'Edit document' : 'New document';
  window.scrollTo({top:0, behavior:'smooth'});
}
function hideCompose(){
  el('#compose').classList.add('hidden');
  el('#title').value = '';
  el('#body').value = '';
  editingId = null;
}
function renderList(){
  const q = el('#search').value.trim().toLowerCase();
  const target = el('#list');
  target.innerHTML = '';
  const filtered = q? docs.filter(d => d.title.toLowerCase().includes(q)) : docs;
  if(filtered.length === 0){ el('#empty').classList.remove('hidden'); }
  else{ el('#empty').classList.add('hidden'); }
  filtered.sort((a,b)=> b.updated - a.updated).forEach(doc => {
    const card = document.createElement('article');
    card.className = 'card';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = doc.title || '(Untitled)';
    const meta = document.createElement('div');
    meta.className = 'meta';
    const dt = new Date(doc.updated || doc.created);
    meta.textContent = 'Updated ' + dt.toLocaleString();
    const open = document.createElement('button');
    open.className = 'btn';
    open.textContent = 'Open';
    open.addEventListener('click', ()=> openViewer(doc.id));
    card.addEventListener('click', (e)=>{ if(e.target===open) return; openViewer(doc.id); });
    card.append(title, meta, open);
    target.append(card);
  })
}

// CRUD
function saveDoc(){
  const title = el('#title').value.trim();
  const body = el('#body').value.trim();
  if(!title && !body){ alert('Please enter a title or body.'); return; }
  const now = Date.now();
  if(editingId){
    const idx = docs.findIndex(d=>d.id===editingId);
    if(idx>-1){ docs[idx] = {...docs[idx], title, body, updated:now}; }
  }else{
    const id = crypto.randomUUID? crypto.randomUUID() : String(now) + Math.random().toString(36).slice(2,7);
    docs.push({id, title, body, created:now, updated:now});
  }
  persist();
  hideCompose();
  renderList();
}

function openViewer(id){
  const doc = docs.find(d=>d.id===id); if(!doc) return;
  el('#view-title').textContent = doc.title || '(Untitled)';
  const body = el('#view-body');
  body.textContent = doc.body || '';
  el('#viewer').showModal();
  el('#btn-edit').onclick = ()=>{ startEdit(id); };
  el('#btn-delete').onclick = ()=>{ confirmDelete(id); };
}

function startEdit(id){
  const doc = docs.find(d=>d.id===id); if(!doc) return;
  editingId = id;
  el('#title').value = doc.title;
  el('#body').value = doc.body;
  showCompose(true);
  el('#viewer').close();
}

function confirmDelete(id){
  const doc = docs.find(d=>d.id===id); if(!doc) return;
  if(confirm(`Delete \"${doc.title || 'Untitled'}\"? This cannot be undone.`)){
    docs = docs.filter(d=>d.id!==id);
    persist();
    el('#viewer').close();
    renderList();
  }
}

// Export / Import
function exportAll(){
  const blob = new Blob([JSON.stringify({version:1, exported:Date.now(), docs}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'document-notebook-export.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
async function importAll(file){
  if(!file) return;
  try{
    const text = await file.text();
    const data = JSON.parse(text);
    if(!data || !Array.isArray(data.docs)) throw new Error('Invalid file');
    docs = data.docs;
    persist();
    renderList();
  }catch(err){
    alert('Import failed: ' + (err.message||err));
  }
}

// Wire up
function init(){
  load();
  renderList();
  el('#btn-new').addEventListener('click', ()=>{ showCompose(false); el('#title').focus(); });
  el('#btn-save').addEventListener('click', saveDoc);
  el('#btn-cancel').addEventListener('click', hideCompose);
  el('#btn-close').addEventListener('click', ()=> el('#viewer').close());
  el('#btn-export').addEventListener('click', exportAll);
  el('#importer').addEventListener('change', (e)=> importAll(e.target.files?.[0]));
  el('#search').addEventListener('input', renderList);
  ['title','body'].forEach(id=> el('#'+id).addEventListener('input', ()=>{ status.textContent='Editing…'; }));
  window.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      const v = el('#viewer'); if(v.open) v.close(); else hideCompose();
    }
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){
      if(!el('#compose').classList.contains('hidden')){ e.preventDefault(); saveDoc(); }
    }
  });
}

init();
