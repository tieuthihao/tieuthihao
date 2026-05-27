let DB = structuredClone(EXAM_DATA);
let current = Object.keys(DB)[0];

function loadLocal(){
 const raw=localStorage.getItem("telc_scroll_key_db");
 if(raw){try{DB=JSON.parse(raw)}catch(e){}}
}
function saveLocal(){localStorage.setItem("telc_scroll_key_db",JSON.stringify(DB))}
function progress(name){
 const vals=Object.values(DB[name].sections);
 return Math.round(vals.filter(v=>(v.answers||"").trim()).length/vals.length*100);
}
function renderSets(){
 const q=document.getElementById("searchInput").value.toLowerCase();
 const list=document.getElementById("setList"); list.innerHTML="";
 Object.keys(DB).filter(n=>n.toLowerCase().includes(q)).forEach(n=>{
  const b=document.createElement("button");
  b.className="setBtn"+(n===current?" active":"");
  b.textContent=`${n} · ${progress(n)}%`;
  b.onclick=()=>{current=n;renderAll()};
  list.appendChild(b);
 });
}
function setPDF(jump=false){
 const pdf=DB[current].pdf||"pdf24_converted.pdf";
 document.getElementById("pdfFrame").src = jump ? `${pdf}#page=${DB[current].startPage}` : pdf;
}
function renderHeader(){
 document.getElementById("activeTitle").textContent=current;
 document.getElementById("pageHint").textContent=`PDF page khoảng: ${DB[current].startPage}`;
 const p=progress(current);
 document.getElementById("progressText").textContent=p+"%";
 document.getElementById("progressBar").style.width=p+"%";
}
function renderKeys(){
 const panel=document.getElementById("keyTab"); panel.innerHTML="";
 Object.entries(DB[current].sections).forEach(([sec,info])=>{
  const div=document.createElement("div"); div.className="sec";
  div.innerHTML=`<div class="secHead"><div><h3>${sec}</h3><div class="badge">Câu ${info.range}</div></div><button class="showBtn">Hiện/Sửa</button></div>
  <div class="keyArea"><label>Answer Key</label><textarea class="ans">${info.answers||""}</textarea><label>Ghi chú</label><textarea class="note">${info.notes||""}</textarea>
  <div class="actions"><button class="save">Lưu Teil</button><button class="copy">Copy</button><button class="clear">Xóa</button></div></div>`;
  const area=div.querySelector(".keyArea");
  div.querySelector(".showBtn").onclick=()=>area.classList.toggle("show");
  div.querySelector(".save").onclick=()=>{info.answers=div.querySelector(".ans").value;info.notes=div.querySelector(".note").value;saveLocal();renderAll()};
  div.querySelector(".copy").onclick=()=>navigator.clipboard.writeText(div.querySelector(".ans").value);
  div.querySelector(".clear").onclick=()=>{info.answers="";info.notes=div.querySelector(".note").value;saveLocal();renderAll()};
  panel.appendChild(div);
 });
}
function normalize(s){return (s||"").toUpperCase().replace(/[;,\n]/g," ").replace(/\s+/g," ").trim()}
function official(){return normalize(Object.values(DB[current].sections).map(x=>x.answers).join(" ")).split(" ").filter(Boolean)}
function check(){
 const off=official(), user=normalize(document.getElementById("userAns").value).split(" ").filter(Boolean);
 document.getElementById("checkResult").innerHTML = user.map(x=>off.includes(x)?`<span class="good">${x} ✓</span>`:`<span class="wrong">${x} ✗</span>`).join(" ") || "Chưa nhập.";
}
function parseBulk(){
 const lines=document.getElementById("bulkInput").value.split(/\n/);
 let count=0;
 lines.forEach(line=>{
  const m=line.match(/^(.+?)\s*\|\s*(.+?)(?:\s*\([^)]*\))?\s*=\s*(.*)$/);
  if(!m) return;
  const set=m[1].trim().toUpperCase(), sec=m[2].trim(), ans=m[3].trim();
  const key=Object.keys(DB).find(k=>k.toUpperCase()===set);
  if(key && DB[key].sections[sec]){DB[key].sections[sec].answers=ans; count++;}
 });
 saveLocal(); renderAll(); alert("Đã import "+count+" dòng");
}
function exportText(){
 let lines=[];
 Object.entries(DB).forEach(([name,obj])=>{
  lines.push("===== "+name+" =====");
  Object.entries(obj.sections).forEach(([sec,info])=>lines.push(`${name} | ${sec} (${info.range}) = ${info.answers||""}`));
  lines.push("");
 });
 const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});
 const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="answer_keys_export.txt"; a.click();
}
function renderAll(){renderHeader();renderSets();renderKeys();}
document.getElementById("searchInput").oninput=renderSets;
document.getElementById("themeBtn").onclick=()=>document.body.classList.toggle("light");
document.getElementById("jumpPageBtn").onclick=()=>setPDF(true);
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");document.querySelectorAll(".panel").forEach(p=>p.classList.add("hidden"));document.getElementById(t.dataset.tab).classList.remove("hidden")});
document.getElementById("checkBtn").onclick=check;
document.getElementById("applyBulk").onclick=parseBulk;
document.getElementById("exportTxt").onclick=exportText;
document.getElementById("exportJson").onclick=()=>{const blob=new Blob([JSON.stringify(DB,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="telc_answer_keys.json";a.click()};
document.getElementById("importJson").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{DB=JSON.parse(r.result);saveLocal();renderAll();alert("Import OK")}catch(err){alert("JSON lỗi")}};r.readAsText(f)};
document.getElementById("resetBtn").onclick=()=>{if(confirm("Reset dữ liệu key đã nhập?")){localStorage.removeItem("telc_scroll_key_db");DB=structuredClone(EXAM_DATA);renderAll()}};
loadLocal(); setPDF(false); renderAll();
