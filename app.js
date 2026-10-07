/* Eduquest-Laboratorio de derivadas
   JS sin eval(): math.js interpreta y deriva expresiones.
   Los objetos FUNCTION_DATA y QUESTIONS son editables para ampliar contenidos. */
(() => {
"use strict";
const $ = id => document.getElementById(id);
const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

const FUNCTION_DATA = [
 {id:"constant",name:"Constante",fn:"5",deriv:"0",rule:"d/dx(c)=0",desc:"Una constante no cambia al variar x; su pendiente es cero."},
 {id:"identity",name:"Identidad",fn:"x",deriv:"1",rule:"d/dx(x)=1",desc:"La función identidad tiene pendiente constante igual a uno."},
 {id:"linear",name:"Lineal",fn:"3*x+2",deriv:"3",rule:"d/dx(ax+b)=a",desc:"La derivada de una función lineal es su pendiente."},
 {id:"quadratic",name:"Cuadrática",fn:"x^2-4",deriv:"2*x",rule:"d/dx(x²)=2x",desc:"La pendiente cambia con x y se anula en x=0."},
 {id:"exponential",name:"Exponencial",fn:"exp(0.3*x)",deriv:"0.3*exp(0.3*x)",rule:"d/dx(e^(ax))=a·e^(ax)",desc:"La función y su tasa de cambio permanecen relacionadas."},
 {id:"sine",name:"Seno",fn:"sin(x)",deriv:"cos(x)",rule:"d/dx(sin x)=cos x",desc:"La derivada del seno es el coseno."},
 {id:"product",name:"Regla del producto",fn:"x^2*sin(x)",deriv:"2*x*sin(x)+x^2*cos(x)",rule:"(fg)'=f'g+fg'",desc:"Deriva cada factor y suma los dos productos."},
 {id:"quotient",name:"Regla del cociente",fn:"1/x",deriv:"-1/x^2",rule:"(f/g)'=(f'g-fg')/g²",desc:"La derivada de 1/x es -1/x², para x≠0."},
 {id:"abs",name:"Valor absoluto",fn:"abs(x)",deriv:"sign(x)",rule:"d/dx|x|=sign(x), x≠0",desc:"En x=0 la función valor absoluto no es derivable por tener una esquina."},
 {id:"chain",name:"Regla de la cadena",fn:"sin(x^2)",deriv:"2*x*cos(x^2)",rule:"(f∘g)'=f'(g)g'",desc:"Deriva la función exterior y multiplica por la derivada interior."},
];

const QUESTIONS = [
 {q:"¿Cuál es la derivada de f(x)=x²−4?",a:["x−4","2x","x²","−4"],c:1},
 {q:"¿Cuál es la derivada de f(x)=sin(x)?",a:["sin(x)","−sin(x)","cos(x)","1"],c:2},
 {q:"¿Cuál es la derivada de f(x)=exp(0.3x)?",a:["exp(0.3x)","0.3exp(0.3x)","3exp(x)","0"],c:1},
 {q:"Para f(x)=1/x, ¿cuál es f′(x)?",a:["1/x²","−1/x²","−x²","x"],c:1},
 {q:"¿Qué regla se usa para f(x)=u(x)v(x)?",a:["Cadena","Cociente","Producto","Potencia"],c:2},
 {q:"¿Cuál es la derivada de una constante?",a:["1","La constante","0","x"],c:2},
 {q:"¿Cuál es la derivada de f(x)=x?",a:["0","x","1","−1"],c:2},
 {q:"Si f(x)=|x|, ¿en qué punto no existe la derivada?",a:["x=1","x=−1","x=0","No existe nunca"],c:2},
 {q:"En la regla del cociente, el denominador queda:",a:["g","g²","f²","1/g"],c:1},
 {q:"La regla de la cadena se aplica especialmente cuando:",a:["Hay una composición","Hay solo una constante","No hay x","La gráfica es horizontal"],c:0}
];

let state = {
 student: JSON.parse(localStorage.getItem("eduquestStudent") || "null"),
 view:"home", practiceIndex:0, practiceScore:0, practiceAnswered:false,
 finalIndex:0, finalScore:0, finalAnswered:false
};

function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2600)}
function show(id, yes=true){$(id)?.classList.toggle("hidden",!yes)}
function normalize(s){return String(s||"").replace(/\s+/g,"").replace(/^\+/,"")}
function safeDerivative(expr){try{return math.derivative(expr,"x").toString()}catch(e){return null}}
function equivalentSymbolic(a,b){
  try{
    const aa=math.parse(a), bb=math.parse(b);
    return math.simplify(aa,b!==undefined ? undefined : undefined) && normalize(math.simplify(aa.subtract?aa:aa).toString())===normalize(math.simplify(bb).toString());
  }catch(e){return false}
}
function numericEquivalent(a,b){
  try{
    const fa=math.compile(a), fb=math.compile(b);
    const samples=[-2,-1,-0.5,0.5,1,2,3];
    let used=0;
    for(const x of samples){
      let va=fa.evaluate({x}), vb=fb.evaluate({x});
      if(!Number.isFinite(va)||!Number.isFinite(vb)) continue;
      if(Math.abs(va-vb)>1e-5*(1+Math.abs(vb))) return false;
      used++;
    }
    return used>=2;
  }catch(e){return false}
}
function derivativeMatches(user,expected){
  if(!user||!expected) return false;
  if(normalize(user)===normalize(expected)) return true;
  try{
    const simp=math.simplify(`${user}-(${expected})`).toString();
    if(normalize(simp)==="0") return true;
  }catch(e){}
  return numericEquivalent(user,expected);
}
function renderConcepts(){
  $("conceptGrid").innerHTML=FUNCTION_DATA.map(f=>`
    <article class="card"><b>${f.name}</b><strong>${f.fn}</strong>
    <p>${f.desc}</p><div class="result-box"><span>${f.rule}</span><br><small>Derivada: ${f.deriv}</small></div></article>`).join("");
}
function renderCompare(){
  $("compareRows").innerHTML=[0,1,2].map(i=>`
    <div class="compare-row"><label>Función ${i+1}<select id="cmpFn${i}">
      ${FUNCTION_DATA.map(f=>`<option value="${f.fn}" data-deriv="${f.deriv}">${f.name}: ${f.fn}</option>`).join("")}
    </select></label>
    <label>Tu derivada<input id="cmpDeriv${i}" placeholder="Ej. 2*x"></label></div>`).join("");
}
function checkCompare(){
  let good=0, lines=[];
  for(let i=0;i<3;i++){
    const sel=$(`cmpFn${i}`), expected=sel.options[sel.selectedIndex].dataset.deriv, user=$(`cmpDeriv${i}`).value;
    const ok=derivativeMatches(user,expected); if(ok)good++;
    lines.push(`<div><b>${i+1}. ${sel.value}</b> → ${ok?"✓ Correcta":"✗ Revisa"} <span class="muted">Derivada esperada: ${expected}</span></div>`);
  }
  $("compareResult").innerHTML=`<b>${good}/3 correctas.</b>${lines.join("")}`;
}
function plot2D(expr, container="mainPlot"){
  if(typeof Plotly==="undefined"){toast("Plotly todavía no está disponible.");return}
  const d=safeDerivative(expr)||"0", x=[], y=[], dy=[];
  for(let i=-80;i<=80;i++){const xv=i/10;x.push(xv);try{y.push(math.evaluate(expr,{x:xv}));}catch(e){y.push(null)}try{dy.push(math.evaluate(d,{x:xv}));}catch(e){dy.push(null)}}
  Plotly.newPlot($(container),[
    {x,y,mode:"lines",name:`f(x)=${expr}`,line:{width:3}},
    {x,y:dy,mode:"lines",name:`f′(x)=${d}`,line:{width:3}}
  ],{paper_bgcolor:"transparent",plot_bgcolor:"transparent",font:{color:"#F7FBFF"},margin:{l:45,r:20,t:20,b:45},legend:{orientation:"h"},xaxis:{gridcolor:"rgba(255,255,255,.1)"},yaxis:{gridcolor:"rgba(255,255,255,.1)"}},{responsive:true,displaylogo:false});
  return d;
}
function plotSurface(){
  if(typeof Plotly==="undefined")return;
  const xs=[],ys=[],z=[];
  for(let i=-25;i<=25;i++)xs.push(i/5);
  for(let j=-25;j<=25;j++)ys.push(j/5);
  for(const x of xs){const row=[];for(const y of ys)row.push(Math.sin(Math.sqrt(x*x+y*y)));z.push(row)}
  Plotly.newPlot($("mainPlot"),[{x:xs,y:ys,z,type:"surface",colorscale:"Viridis",showscale:false}],{paper_bgcolor:"transparent",plot_bgcolor:"transparent",font:{color:"#fff"},margin:{l:0,r:0,t:0,b:0}},{responsive:true,displaylogo:false});
  $("geometryText").textContent="Superficie espacial z = sin(√(x²+y²)). Observa cómo una superficie puede representar variación en dos direcciones.";
}
function plotSolid(){
  if(typeof Plotly==="undefined")return;
  const theta=[],r=[],z=[];
  for(let i=0;i<=80;i++){const t=2*Math.PI*i/80;theta.push(t);r.push(1+0.35*Math.cos(3*t));z.push(0.2*Math.sin(2*t))}
  const X=[],Y=[],Z=[];
  for(let k=0;k<25;k++){const zz=-1+2*k/24;X.push(theta.map((t,i)=>r[i]*Math.cos(t)));Y.push(theta.map((t,i)=>r[i]*Math.sin(t)));Z.push(theta.map(()=>zz))}
  Plotly.newPlot($("mainPlot"),[{x:X.flat(),y:Y.flat(),z:Z.flat(),type:"scatter3d",mode:"markers",marker:{size:2,color:Z.flat()}}],{paper_bgcolor:"transparent",font:{color:"#fff"},margin:{l:0,r:0,t:0,b:0},scene:{xaxis:{gridcolor:"#234"},yaxis:{gridcolor:"#234"},zaxis:{gridcolor:"#234"}}},{responsive:true,displaylogo:false});
  $("geometryText").textContent="Sólido espacial ilustrativo. Puedes modificar la función radial en app.js para estudiar otros sólidos de revolución.";
}
function drawGeometry(){
  const expr=$("geomFn").value, mode=$("geomMode").value;
  if(mode==="2d"){const d=plot2D(expr);$("geometryText").textContent=`f(x) = ${expr}. Derivada calculada: ${d||"no disponible simbólicamente"}. La pendiente cambia a medida que cambia x.`}
  else if(mode==="surface")plotSurface(); else plotSolid();
}
function buildPractice(){
  const q=QUESTIONS[state.practiceIndex];
  $("question").innerHTML=`<span class="eyebrow">Pregunta ${state.practiceIndex+1}/${QUESTIONS.length}</span><h3>${q.q}</h3>`;
  $("answers").innerHTML=q.a.map((a,i)=>`<button class="answer" data-answer="${i}">${a}</button>`).join("");
  $("exerciseFeedback").textContent="";
  state.practiceAnswered=false;
  qsa("#answers .answer").forEach(b=>b.addEventListener("click",()=>answerPractice(+b.dataset.answer)));
}
function answerPractice(i){
  if(state.practiceAnswered)return; state.practiceAnswered=true;
  const q=QUESTIONS[state.practiceIndex], ok=i===q.c;
  qsa("#answers .answer").forEach((b,j)=>{if(j===q.c)b.classList.add("correct");if(j===i&&!ok)b.classList.add("wrong")});
  if(ok){state.practiceScore++;$("practiceScore").textContent=state.practiceScore}
  $("exerciseFeedback").textContent=ok?"✓ Correcto. Explica la regla que aplicaste para fortalecer tu argumentación.":`✗ No es correcta. La respuesta es: ${q.a[q.c]}.`;
}
function nextPractice(){state.practiceIndex=(state.practiceIndex+1)%QUESTIONS.length;buildPractice()}
function resetPractice(){state.practiceIndex=0;state.practiceScore=0;$("practiceScore").textContent=0;buildPractice()}
function generateChallenge(){
  const t=$("genType").value; let q="",a="";
  if(t==="quadratic"){const n=Math.floor(Math.random()*5)+2;q=`Deriva f(x)=x^${n}−${n}`;a=`${n}x^${n-1}`}
  if(t==="exponential"){const n=(Math.floor(Math.random()*5)+1)/10;q=`Deriva f(x)=exp(${n}x)`;a=`${n}*exp(${n}x)`}
  if(t==="trig"){q="Deriva f(x)=sin(x²)";a="2x·cos(x²)"}
  if(t==="rational"){const n=Math.floor(Math.random()*4)+1;q=`Deriva f(x)=${n}/x`;a=`−${n}/x²`}
  $("generatedChallenge").innerHTML=`<b>${q}</b><p class="muted">Respuesta para comprobar: ${a}</p>`;
}
function makeLesson(){
  const data={title:$("lessonTitle").value.trim(),level:$("lessonLevel").value.trim(),time:$("lessonTime").value.trim(),objective:$("lessonObjective").value.trim(),question:$("lessonQuestion").value.trim(),evidence:$("lessonEvidence").value.trim()};
  if(!data.title||!data.objective||!data.question||!data.evidence){toast("Completa título, objetivo, pregunta y evidencia.");return null}
  localStorage.setItem("eduquestLesson",JSON.stringify(data));
  const steps=[
    ["Observar",`Presentar una gráfica de ${data.question} y pedir que identifiquen dónde aumenta, disminuye o cambia la pendiente.`],
    ["Calcular",`Resolver la situación aplicando reglas de derivación y comprobar el resultado con el laboratorio de ${data.level}.`],
    ["Explicar",`Argumentar por qué la derivada obtenida representa la razón de cambio y relacionarla con la representación geométrica.`],
    ["Transferir",`Aplicar el procedimiento a una función o contexto nuevo y entregar ${data.evidence}.`]
  ];
  $("lessonOutput").innerHTML=`<h3>${data.title}</h3><p><b>Nivel:</b> ${data.level} · <b>Duración:</b> ${data.time}</p><p><b>Objetivo:</b> ${data.objective}</p>${steps.map((s,i)=>`<div class="rule"><b>${i+1}. ${s[0]}</b><span>${s[1]}</span></div>`).join("")}<div class="result-box"><b>Guion para estudiantes</b><p>“${data.question} Observa, calcula, explica tu razonamiento y transfiere la estrategia a una situación nueva. Tu evidencia será: ${data.evidence}.”</p></div>`;
  return data;
}
function exportLesson(){
  const data=JSON.parse(localStorage.getItem("eduquestLesson")||"null");if(!data){toast("Primero genera una secuencia.");return}
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="eduquest-secuencia.json";a.click();URL.revokeObjectURL(a.href);
}
function importLesson(e){
  const file=e.target.files[0];if(!file)return;const reader=new FileReader();
  reader.onload=()=>{try{const d=JSON.parse(reader.result);["title","level","time","objective","question","evidence"].forEach(k=>{const el=$("lesson"+({title:"Title",level:"Level",time:"Time",objective:"Objective",question:"Question",evidence:"Evidence"}[k]));if(el)el.value=d[k]||""});makeLesson();toast("Proyecto JSON importado.");}catch(err){toast("JSON inválido.")}};reader.readAsText(file);e.target.value="";
}
function clearLesson(){["lessonTitle","lessonObjective","lessonQuestion","lessonEvidence"].forEach(id=>$(id).value="");$("lessonOutput").innerHTML='<p class="muted">Completa el formulario para generar el guion.</p>';localStorage.removeItem("eduquestLesson")}
async function copyLesson(){const text=$("lessonOutput").innerText;if(!text||text.includes("Completa")){toast("Genera primero el guion.");return}try{await navigator.clipboard.writeText(text);toast("Guion copiado.");}catch(e){toast("No fue posible copiar automáticamente.")}}
function renderFinal(){
  const q=QUESTIONS[state.finalIndex]; $("finalQuestion").innerHTML=`<span class="eyebrow">Pregunta ${state.finalIndex+1}/10</span><h3>${q.q}</h3>`;
  $("finalAnswers").innerHTML=q.a.map((a,i)=>`<button class="answer" data-final="${i}">${a}</button>`).join("");
  $("finalFeedback").textContent="";$("finalProgress").textContent=`${state.finalIndex}/10`;state.finalAnswered=false;
  qsa("#finalAnswers .answer").forEach(b=>b.addEventListener("click",()=>{if(!state.finalAnswered){state.finalSelected=+b.dataset.final;state.finalAnswered=true;qsa("#finalAnswers .answer").forEach((x,j)=>{if(j===q.c)x.classList.add("correct");if(j===state.finalSelected&&j!==q.c)x.classList.add("wrong")});$("finalFeedback").textContent=state.finalSelected===q.c?"✓ Respuesta correcta. Pulsa Responder para continuar.":"Revisa la explicación conceptual y pulsa Responder para continuar."}}));
}
function finalNext(){
  if(!state.finalAnswered){toast("Selecciona una respuesta.");return}
  const q=QUESTIONS[state.finalIndex];if(state.finalSelected===q.c)state.finalScore++;
  state.finalIndex++;
  if(state.finalIndex>=10){finishFinal();return}
  $("finalScore").textContent=`${state.finalScore}/10`;renderFinal();
}
function finishFinal(){
  $("finalProgress").textContent="10/10";$("finalScore").textContent=`${state.finalScore}/10`;
  const pct=state.finalScore*10;
  $("finalCertificate").classList.remove("hidden");
  $("finalCertificate").innerHTML=`<span class="eyebrow">RESULTADO FINAL</span><h2>${state.student?.name||"Estudiante"}</h2><p>${state.student?.email||""}</p><h1>${pct}/100</h1><p>${pct>=80?"Dominio satisfactorio":"Continúa practicando y argumentando tus procedimientos."}</p><button class="btn green" id="speakResult">🔊 Escuchar resultado</button>`;
  $("speakResult").onclick=()=>speak($("finalCertificate").innerText);
  localStorage.setItem("eduquestLastEvaluation",JSON.stringify({student:state.student,score:state.finalScore,date:new Date().toISOString()}));
}
function resetFinal(){state.finalIndex=0;state.finalScore=0;$("finalScore").textContent="—";$("finalCertificate").classList.add("hidden");renderFinal()}
function speak(text){if(!("speechSynthesis" in window)){toast("SpeechSynthesis no está disponible.");return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="es-CO";u.rate=.95;speechSynthesis.speak(u)}
function go(view){
  state.view=view;qsa(".view").forEach(v=>v.classList.remove("active-view"));$(view)?.classList.add("active-view");
  qsa(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const titles={home:"Portada",concepts:"Conceptos",explain:"Explicación",exercises:"Ejercicios",geometry:"Geometría 2D/3D",xr:"Laboratorio XR",teacher:"Modo docente",evaluation:"Evaluación final"};
  $("pageTitle").textContent=titles[view]||"Eduquest";
  $("sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});
  if(view==="geometry")setTimeout(drawGeometry,50);if(view==="xr")setTimeout(()=>plot2D("x^2-4","xrPlot"),50);if(view==="evaluation"){renderFinal();$("evalStudent").textContent=state.student?.name||"Estudiante";$("evalEmail").textContent=state.student?.email||""}
}
function login(){
  $("loginForm").addEventListener("submit",e=>{
    e.preventDefault();const name=$("studentName").value.trim(),email=$("studentEmail").value.trim();
    if(name.length<3||!$("consent").checked||!$("studentEmail").validity.valid){$("loginMsg").textContent="Completa los datos y acepta el uso académico.";return}
    state.student={name,email};localStorage.setItem("eduquestStudent",JSON.stringify(state.student));$("studentBadge").textContent=name;show("login",false);show("app",true);go("home");
  });
}
function initStatus(){
  const mathOK=typeof math!=="undefined";$("mathDot").classList.toggle("ok",mathOK);$("mathStatus").textContent=mathOK?"Motor matemático listo":"Motor matemático no cargado";
  const xrOK="xr" in navigator; $("xrDot").classList.toggle("ok",xrOK);$("xrStatus").textContent=xrOK?"WebXR disponible":"WebXR no disponible · modo 2D";
  $("cameraNotice").textContent=xrOK?"WebXR detectado · 2D disponible":"Cámara/visor no requeridos · 2D disponible";
}
function bind(){
  $("enterBtn").onclick=()=>{show("cover",false);show("login",true);$("studentName").focus()};
  login();
  qsa("[data-view]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
  $("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
  $("contrastBtn").onclick=()=>document.body.classList.toggle("hiContrast");
  $("speakBtn").onclick=()=>speak(document.querySelector(".active-view")?.innerText||"Eduquest");
  $("speakConcepts").onclick=()=>speak($("concepts").innerText);
  $("checkAll").onclick=checkCompare;
  $("nextQuestion").onclick=nextPractice;$("resetPractice").onclick=resetPractice;$("generateChallenge").onclick=generateChallenge;
  $("drawGeometry").onclick=drawGeometry;
  $("downloadGraph").onclick=()=>{if(typeof Plotly!=="undefined")Plotly.downloadImage("mainPlot",{format:"png",filename:"eduquest-derivada",width:1200,height:700})};
  $("xrLaunch").onclick=async()=>{if(navigator.xr){try{const ok=await navigator.xr.isSessionSupported("immersive-vr");toast(ok?"Tu dispositivo admite una sesión VR inmersiva.":"No hay modo VR inmersivo disponible.");}catch(e){toast("WebXR requiere HTTPS y compatibilidad del dispositivo.")}}else toast("WebXR no está disponible. Usa la escena 2D/3D.");};
  $("xrFallback").onclick=()=>plot2D("x^2-4","xrPlot");
  $("teacherForm").onsubmit=e=>{e.preventDefault();makeLesson()};
  $("clearLesson").onclick=clearLesson;$("exportLesson").onclick=exportLesson;$("importLesson").onchange=importLesson;$("copyLesson").onclick=copyLesson;
  $("finalNext").onclick=finalNext;$("finalRestart").onclick=resetFinal;
  $("logoutBtn").onclick=()=>{localStorage.removeItem("eduquestStudent");state.student=null;show("app",false);show("login",true);$("loginForm").reset();$("studentBadge").textContent="Estudiante"};
  const saved=localStorage.getItem("eduquestLesson");if(saved){try{const d=JSON.parse(saved);$("lessonTitle").value=d.title||"";$("lessonLevel").value=d.level||"Grado 11°";$("lessonTime").value=d.time||"60 minutos";$("lessonObjective").value=d.objective||"";$("lessonQuestion").value=d.question||"";$("lessonEvidence").value=d.evidence||""}catch(e){}}
}
function start(){
  $("cover").style.setProperty("--cover-url",`url("${$("coverImage").src}")`);
  renderConcepts();renderCompare();buildPractice();initStatus();bind();
}
document.addEventListener("DOMContentLoaded",start);
})();