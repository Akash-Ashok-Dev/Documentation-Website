let docs = JSON.parse(localStorage.getItem("docs") || "[]");
let currentIndex = null;

const docsList = document.getElementById("docsList");
const addBtn = document.getElementById("addBtn");
const viewer = document.getElementById("viewer");
const editor = document.getElementById("editor");

const viewTitle = document.getElementById("viewTitle");
const viewBody = document.getElementById("viewBody");

const docTitle = document.getElementById("docTitle");
const docBody = document.getElementById("docBody");

function renderDocs() {
  docsList.innerHTML = "";
  docs.forEach((doc, i) => {
    let div = document.createElement("div");
    div.innerText = doc.title;
    div.onclick = () => openViewer(i);
    docsList.appendChild(div);
  });
}

function openViewer(i) {
  currentIndex = i;
  viewTitle.innerText = docs[i].title;
  viewBody.innerText = docs[i].body;
  viewer.classList.remove("hidden");
}

function openEditor(edit = false) {
  editor.classList.remove("hidden");
  if (edit && currentIndex !== null) {
    docTitle.value = docs[currentIndex].title;
    docBody.value = docs[currentIndex].body;
  } else {
    docTitle.value = "";
    docBody.value = "";
  }
}

function saveDoc() {
  let title = docTitle.value.trim();
  let body = docBody.value.trim();
  if (!title) return;

  if (currentIndex !== null && !viewer.classList.contains("hidden")) {
    docs[currentIndex] = { title, body };
  } else {
    docs.push({ title, body });
  }
  localStorage.setItem("docs", JSON.stringify(docs));
  editor.classList.add("hidden");
  viewer.classList.add("hidden");
  renderDocs();
}

document.getElementById("closeBtn").onclick = () => viewer.classList.add("hidden");
document.getElementById("editBtn").onclick = () => { viewer.classList.add("hidden"); openEditor(true); };
document.getElementById("deleteBtn").onclick = () => { docs.splice(currentIndex,1); localStorage.setItem("docs", JSON.stringify(docs)); viewer.classList.add("hidden"); renderDocs(); };
document.getElementById("saveBtn").onclick = saveDoc;
document.getElementById("cancelBtn").onclick = () => editor.classList.add("hidden");
addBtn.onclick = () => openEditor(false);

renderDocs();
