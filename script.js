let db = structuredClone(EXAM_DATA);
let current = Object.keys(db)[0];

function saveDB(){ localStorage.setItem("telc_pdf_key_db", JSON.stringify(db)); }
function loadDB(){
  const raw = localStorage.getItem("telc_pdf_key_db");
  if(raw){ try{ db = JSON.parse(raw); }catch(e){} }
  document.getElementById("globalNotes").value = localStorage.getItem("telc_global_notes") || "";
}
function pct(name){
  const secs = db[name].sections;
  const total = Object.keys(secs).length;
  const filled = Object.values(secs).filter(x => (x.answers || "").trim()).length;
  return Math.round(filled / total * 100);
}
function renderSets(){
  const list = document.getElementById("setList");
  const q = document.getElementById("searchInput").value.toLowerCase();
  list.innerHTML = "";
  Object.keys(db).filter(n => n.toLowerCase().includes(q)).forEach(n => {
    const b = document.createElement("button");
    b.className = "setBtn" + (n === current ? " active" : "");
    b.textContent = `${n} · ${pct(n)}%`;
    b.onclick = () => { current = n; renderAll(); };
    list.appendChild(b);
  });
}
function setPdfPage(page){
  const pdf = db[current].pdf || "pdf24_converted.pdf";
  document.getElementById("pdfFrame").src = `${pdf}#page=${page}`;
  document.getElementById("pageInput").value = page;
}
function renderHeader(){
  const data = db[current];
  document.getElementById("activeTitle").textContent = current;
  document.getElementById("pageHint").textContent = `PDF page khoảng: ${data.startPage}`;
  const p = pct(current);
  document.getElementById("progressText").textContent = p + "%";
  document.getElementById("progressBar").style.width = p + "%";
  setPdfPage(data.startPage || 1);
}
function renderKeys(){
  const panel = document.getElementById("keyPanel");
  panel.innerHTML = "";
  Object.entries(db[current].sections).forEach(([sec, info]) => {
    const card = document.createElement("div");
    card.className = "sectionCard";
    card.innerHTML = `
      <div class="sectionHead">
        <div>
          <h3>${sec}</h3>
          <div class="badge">Câu ${info.range || ""}</div>
        </div>
        <button class="small toggleBtn">Hiện đáp án</button>
      </div>
      <div class="keyBox">
        <label>Answer Key</label>
        <textarea class="ans" placeholder="Ví dụ: 1A 2B 3C hoặc 41+ 42-">${info.answers || ""}</textarea>
        <label>Ghi chú Teil này</label>
        <textarea class="note" placeholder="Ghi chú, câu khó, lý do chọn...">${info.notes || ""}</textarea>
        <div class="actions">
          <button class="small saveBtn">Lưu Teil</button>
          <button class="small copyBtn">Copy</button>
          <button class="small clearBtn">Xóa</button>
        </div>
      </div>`;
    const box = card.querySelector(".keyBox");
    const toggle = card.querySelector(".toggleBtn");
    toggle.onclick = () => {
      box.classList.toggle("show");
      toggle.textContent = box.classList.contains("show") ? "Ẩn đáp án" : "Hiện đáp án";
    };
    card.querySelector(".saveBtn").onclick = () => {
      info.answers = card.querySelector(".ans").value;
      info.notes = card.querySelector(".note").value;
      saveDB(); renderAll();
    };
    card.querySelector(".copyBtn").onclick = () => navigator.clipboard.writeText(card.querySelector(".ans").value);
    card.querySelector(".clearBtn").onclick = () => {
      info.answers = "";
      card.querySelector(".ans").value = "";
      saveDB(); renderAll();
    };
    panel.appendChild(card);
  });
}
function normalize(s){ return (s || "").toUpperCase().replace(/[;,\n]/g, " ").replace(/\s+/g, " ").trim(); }
function official(){
  return normalize(Object.values(db[current].sections).map(x => x.answers).join(" ")).split(" ").filter(Boolean);
}
function check(){
  const off = official();
  const user = normalize(document.getElementById("userAnswer").value).split(" ").filter(Boolean);
  let html = "";
  user.forEach(x => html += off.includes(x) ? `<span class="good">${x} ✓</span> ` : `<span class="wrong">${x} ✗</span> `);
  document.getElementById("checkResult").innerHTML = html || "Chưa nhập đáp án.";
}
function renderAll(){ renderHeader(); renderSets(); renderKeys(); }

document.getElementById("searchInput").oninput = renderSets;
document.getElementById("themeBtn").onclick = () => document.body.classList.toggle("light");
document.getElementById("openPdfBtn").onclick = () => setPdfPage(db[current].startPage || 1);
document.getElementById("goPageBtn").onclick = () => setPdfPage(document.getElementById("pageInput").value || 1);
document.getElementById("checkBtn").onclick = check;
document.getElementById("saveNotesBtn").onclick = () => {
  localStorage.setItem("telc_global_notes", document.getElementById("globalNotes").value);
  alert("Đã lưu ghi chú");
};
document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    document.getElementById(t.dataset.tab).classList.remove("hidden");
  };
});
document.getElementById("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(db, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "telc_answer_keys_backup.json";
  a.click();
};
document.getElementById("importInput").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{ db = JSON.parse(reader.result); saveDB(); renderAll(); alert("Import thành công"); }
    catch(err){ alert("File JSON lỗi"); }
  };
  reader.readAsText(file);
};
document.getElementById("resetBtn").onclick = () => {
  if(confirm("Reset toàn bộ dữ liệu đã nhập?")){
    localStorage.removeItem("telc_pdf_key_db");
    db = structuredClone(EXAM_DATA);
    renderAll();
  }
};

loadDB();
renderAll();
