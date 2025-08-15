/* ========= CONFIG ========= */
const LOG_ENDPOINT = "https://login-clientes-func-atdce6a9fhe5dddf.brazilsouth-01.azurewebsites.net/api/logAcces";

const USERS = {
  // ANDESPETROLEUM - PETROORIENTAL
  "ANPTR": {
      hash: "10024adc0cc60c006d77d442a8ad5f6ce3cb1444e1294babc59b2c3f181670c8",
    drive: "https://1drv.ms/f/c/ecc1feadee955b88/EkEDUwn0zNtMo2DyO8v8dpcBMGMRjMkMcDdPD4imxnQTXA?e=IPeiVr"

    //CLDEROS Y AFINES
    "CLDYAFN": {
        hash: "$2y$19$D1.DtE9LdTGBXKzoDeYH.OAodTVUGes81n4cET/wuad.MZRhab9Ry",
    drive: "https://1drv.ms/f/c/ecc1feadee955b88/Eq4Kt60AezJLkB53MBDntRsB-FK33p-Yzf2NcZp5XP7Stw?e=AvQS9b"
  }
};

const CLIENTE    = "ANDESPETROLEUM-PETROORIENTAL";
const ENTREGA_ID = "ANDES-2025-08-R1";

/* ========= Helpers ========= */
const $ = s => document.querySelector(s);

async function sha256Hex(str){
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

async function logAccess({usuario, accepted, result}){
  try{
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        PartitionKey: CLIENTE,
        RowKey: `${usuario}-${Date.now()}`,
        usuario,
        accepted,                 // si aceptó la política
        result,                   // "success" | "failed" | "policy-missing"
        entrega: ENTREGA_ID,
        ts: new Date().toISOString(),
        ua: navigator.userAgent
      })
    });
  }catch(e){ /* no bloquea la UX si falla el log */ }
}

/* ========= UI: política (modal) y botón ========= */
const dlg = $("#policy");
$("#openPolicy").addEventListener("click", ()=> dlg.showModal());
$("#closePolicy").addEventListener("click", ()=> dlg.close());
$("#acceptPolicy").addEventListener("click", ()=>{
  const chk = $("#acepto");
  chk.checked = true;
  $("#go").disabled = false;
  dlg.close();
});

// habilita/deshabilita “Ingresar” según el check
$("#acepto").addEventListener("change", (e)=>{
  $("#go").disabled = !e.target.checked;
});

/* ========= Login ========= */
$("#loginForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const msg   = $("#msg");
  const user  = $("#user").value.trim();
  const pass  = $("#pin").value;

  msg.textContent = "";

  if(!$("#acepto").checked){
    msg.textContent = "Debe aceptar la política para continuar.";
    await logAccess({usuario:user, accepted:false, result:"policy-missing"});
    return;
  }
  if(!user || !pass){
    msg.textContent = "Ingrese usuario y contraseña.";
    return;
  }

  const u = USERS[user];
  const hash = await sha256Hex(pass);

  if(u && hash === u.hash){
    await logAccess({usuario:user, accepted:true, result:"success"});
    window.location.assign(u.drive);
  }else{
    msg.textContent = "Usuario o contraseña incorrectos.";
    await logAccess({usuario:user, accepted:true, result:"failed"});
  }
});

/* ========= Detalles UX menores ========= */
// Evita enviar con Enter si el botón está deshabilitado
$("#pin").addEventListener("keydown", (e)=>{
  if(e.key === "Enter" && $("#go").disabled){ e.preventDefault(); }
});
