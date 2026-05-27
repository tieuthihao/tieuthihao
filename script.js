let currentSet = Object.keys(EXAM_DATA)[0];
let localData = structuredClone(EXAM_DATA);

function loadLocal(){
  const saved = localStorage.getItem("telc_data_v2");
  if(saved){
    try{ localData = JSON.parse(saved); }catch(e){}
  }
  const notes = localStorage.getItem("telc_global_notes") || "";
  document.getElementById("globalNotes").value = notes;
}
function saveLocal(){
  localStorage.setItem("telc_data_v2", JSON.stringify(localData));
}
function renderSets(){
  const list = document.getElementById("setList");
  const q = document.getElementById("searchInput").value.toLowerCase();
  list.innerHTML = "";
  Object.keys(localData).filter(x=>x.toLowerCase().includes(q)).forEach(name=>{
    const btn=document.createElement("button");
    btn.className="setBtn"+(name===currentSet?" active":"");
    btn.textContent=name+" · "+calcSetProgress(name)+"%";
    btn.onclick=()=>{currentSet=name; renderAll();};
    list.appendChild(btn);
  });
}
function calcSetProgress(name){
  const secs = localData[name].sections;
  const total = Object.keys(secs).length;
  const filled = Object.values(secs).filter(s => (s.answers||"").trim()).length;
  return Math.round(filled/total*100);
}
function renderStudy(){
  const panel=document.getElementById("studyPanel");
  const data=localData[currentSet];
  panel.innerHTML="";
  Object.entries(data.sections).forEach(([section, info])=>{
    const card=document.createElement("div");
    card.className="sectionCard";
    card.innerHTML=`
      <div class="sectionHead">
        <div>
          <h3>${section}</h3>
          <div class="badge">Câu: ${info.range || ""}</div>
        </div>
        <button class="smallBtn">Hiện đáp án</button>
      </div>
      <div class="keyBox">
        <label>Answer Key</label>
        <textarea class="answerArea">${info.answers || ""}</textarea>
        <label>Ghi chú Teil này</label>
        <textarea class="noteArea">${info.notes || ""}</textarea>
        <div class="actions">
          <button class="smallBtn saveBtn">Lưu Teil</button>
          <button class="smallBtn copyBtn">Copy key</button>
          <button class="smallBtn clearBtn">Xóa key</button>
        </div>
      </div>
    `;
    const toggle=card.querySelector(".sectionHead button");
    const keyBox=card.querySelector(".keyBox");
    toggle.onclick=()=>{keyBox.classList.toggle("show"); toggle.textContent=keyBox.classList.contains("show")?"Ẩn đáp án":"Hiện đáp án";};
    card.querySelector(".saveBtn").onclick=()=>{
      info.answers=card.querySelector(".answerArea").value;
      info.notes=card.querySelector(".noteArea").value;
      saveLocal(); renderAll();
    };
    card.querySelector(".copyBtn").onclick=()=>navigator.clipboard.writeText(card.querySelector(".answerArea").value);
    card.querySelector(".clearBtn").onclick=()=>{
      card.querySelector(".answerArea").value="";
      info.answers="";
      saveLocal(); renderAll();
    };
    panel.appendChild(card);
  });
}
function renderHeader(){
  document.getElementById("activeTitle").textContent=currentSet;
  const p=calcSetProgress(currentSet);
  document.getElementById("progressText").textContent=p+"%";
  document.getElementById("progressBar").style.width=p+"%";
}
function normalize(s){return (s||"").toUpperCase().replace(/[,\n;]/g," ").replace(/\s+/g," ").trim();}
function collectOfficial(){
  return normalize(Object.values(localData[currentSet].sections).map(s=>s.answers).join(" "));
}
function checkAnswers(){
  const official=collectOfficial().split(" ").filter(Boolean);
  const user=normalize(document.getElementById("userAnswer").value).split(" ").filter(Boolean);
  let html="";
  user.forEach(ans=>{
    html += official.includes(ans) ? `<span class="correct">${ans} ✓</span> ` : `<span class="wrong">${ans} ✗</span> `;
  });
  document.getElementById("checkResult").innerHTML=html || "Chưa nhập đáp án.";
}
function renderAll(){
  renderHeader(); renderSets(); renderStudy();
}
document.getElementById("searchInput").oninput=renderSets;
document.getElementById("themeBtn").onclick=()=>document.body.classList.toggle("light");
document.getElementById("checkBtn").onclick=checkAnswers;
document.getElementById("saveNotesBtn").onclick=()=>{
  localStorage.setItem("telc_global_notes", document.getElementById("globalNotes").value);
  alert("Đã lưu ghi chú");
};
document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".panel").forEach(p=>p.classList.add("hidden"));
    document.getElementById(btn.dataset.tab+"Panel").classList.remove("hidden");
  };
});
document.getElementById("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(localData,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="telc-answer-keys.json";
  a.click();
};
document.getElementById("importInput").onchange=(e)=>{
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      localData=JSON.parse(reader.result);
      saveLocal(); renderAll(); alert("Import thành công");
    }catch(err){alert("File JSON lỗi");}
  };
  reader.readAsText(file);
};
document.getElementById("resetBtn").onclick=()=>{
  if(confirm("Xóa dữ liệu local và về data.js gốc?")){
    localStorage.removeItem("telc_data_v2");
    localData=structuredClone(EXAM_DATA);
    renderAll();
  }
};
loadLocal();
renderAll();
