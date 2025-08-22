/* ========= CONFIG ========= */
const LOG_ENDPOINT =
  "https://login-clientes-func-atdce6a9fhe5dddf.brazilsouth-01.azurewebsites.net/api/logAcces";

const USERS = {
  // ANDESPETROLEUM - PETROORIENTAL
  ANPTR: {
    // SHA-256("Bru07Sc8,w@s")
    hash:
      "10024adc0cc60c006d77d442a8ad5f6ce3cb1444e1294babc59b2c3f181670c8",
    drive:
      "https://1drv.ms/f/c/ecc1feadee955b88/EkEDUwn0zNtMo2DyO8v8dpcBMGMRjMkMcDdPD4imxnQTXA?e=IPeiVr"
  },

  // CALDEROS Y AFINES
  CLDYAFN: {
    // SHA-256("e37kRhDGy9")
    hash:
      "bae599d7f78c8a6848c1646567748f439e0004f5a06c1d1abbd58260236dfa95",
    drive:
      "https://1drv.ms/f/c/ecc1feadee955b88/Eq4Kt60AezJLkB53MBDntRsB-FK33p-Yzf2NcZp5XP7Stw?e=AvQS9b"
  }
};

const CLIENTE = "ANDESPETROLEUM-PETROORIENTAL";
const ENTREGA_ID = "ANDES-2025-08-R1";

/* ===== Helpers ===== */
const $ = (s) => document.querySelector(s);

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function logAccess({ usuario, accepted, result }) {
  try {
    await fetch(LOG_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        PartitionKey: CLIENTE,
        RowKey: `${usuario}-${Date.now()}`,
        usuario,
        accepted, // si aceptó la política
        result,   // "success" | "failed" | "policy-missing"
        entrega: ENTREGA_ID,
        ts: new Date().toISOString(),
        ua: navigator.userAgent
      })
    });
  } catch (e) {
    // no bloquees la UX por errores de log
    // console.warn("Log falló (ignorado):", e);
  }
}

/* ===== App ===== */
window.addEventListener("DOMContentLoaded", () => {
  try {
    const form   = $("#loginForm");
    const msg    = $("#msg");
    const userEl = $("#user");
    const passEl = $("#pin");
    const goBtn  = $("#go");
    const chk    = $("#acepto");

    // ——— Modal de Política ———
    const dlg = $("#policy");
    const openPolicy = $("#openPolicy");
    const closePolicy = $("#closePolicy");
    const acceptPolicy = $("#acceptPolicy");

    const canShowModal = dlg && typeof dlg.showModal === "function";

    if (openPolicy && dlg) {
      openPolicy.addEventListener("click", (e) => {
        e.preventDefault();
        if (canShowModal) dlg.showModal();
        else dlg.setAttribute("open", "open"); // fallback
      });
    }
    if (closePolicy && dlg) {
      closePolicy.addEventListener("click", () => {
        if (canShowModal) dlg.close();
        else dlg.removeAttribute("open");
      });
    }
    if (acceptPolicy && dlg && chk && goBtn) {
      acceptPolicy.addEventListener("click", () => {
        chk.checked = true;
        goBtn.disabled = false;
        if (canShowModal) dlg.close();
        else dlg.removeAttribute("open");
      });
    }

    // ——— Habilitar botón por el check ———
    if (chk && goBtn) {
      // si ya estaba marcado (cache del navegador), respétalo
      goBtn.disabled = !chk.checked;

      chk.addEventListener("change", (e) => {
        goBtn.disabled = !e.target.checked;
      });
    }

    // ——— Submit del login ———
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.textContent = "";

        const usuario = (userEl?.value || "").trim();
        const pass    = passEl?.value || "";

        if (!chk?.checked) {
          msg.textContent = "Debe aceptar la política para continuar.";
          await logAccess({ usuario, accepted: false, result: "policy-missing" });
          return;
        }
        if (!usuario || !pass) {
          msg.textContent = "Ingrese usuario y contraseña.";
          return;
        }

        const u = USERS[usuario];
        const hash = await sha256Hex(pass);

        if (u && hash === u.hash) {
          await logAccess({ usuario, accepted: true, result: "success" });
          window.location.assign(u.drive);
        } else {
          msg.textContent = "Usuario o contraseña incorrectos.";
          await logAccess({ usuario, accepted: true, result: "failed" });
        }
      });
    }

    // ——— UX: Enter bloqueado si el botón está deshabilitado ———
    if (passEl && goBtn) {
      passEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && goBtn.disabled) e.preventDefault();
      });
    }
  } catch (err) {
    // Si algo raro pasa, no rompas toda la página
    // console.error("Error inicializando la app:", err);
  }
});
