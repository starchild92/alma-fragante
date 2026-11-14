/* ===== CONFIGURACIÓN (cambia estos valores) ===== */
const CONFIG = {
  currency: "COP",
  locale: "es-CO",
  // Archivo de inventario Excel (debe estar en la misma carpeta que index.html)
  inventoryFile: "inventario.xlsx",
  // Dirección del formulario en Formspree (ver README). Ejemplo: "https://formspree.io/f/abcd1234"
  formEndpoint: "https://formspree.io/f/TU_ID_AQUI",
  // Opcional: número de WhatsApp con código de país, sin + ni espacios. Ejemplo: "573001234567"
  whatsapp: ""
};

/* ===== Elementos de la página ===== */
const grid = document.getElementById("product-grid");
const searchInput = document.getElementById("search");
const emptyMsg = document.getElementById("empty-msg");
const dialog = document.getElementById("product-dialog");
const dialogBody = document.getElementById("dialog-body");
const form = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

const money = new Intl.NumberFormat(CONFIG.locale, {
  style: "currency",
  currency: CONFIG.currency,
  maximumFractionDigits: 0
});

/* Lista de productos cargada desde el Excel */
let products = [];

/* Evita que texto escrito por alguien se interprete como código */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ===== Lectura del inventario Excel ===== */
/*
  La primera hoja debe tener en la fila 1 los títulos: nombre, precio, cantidad.
  Las filas sin nombre o con precio/cantidad no válidos se ignoran.
*/
async function loadInventory() {
  const response = await fetch(CONFIG.inventoryFile, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo leer el inventario");

  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const items = [];
  rows.forEach((row, index) => {
    const name = String(row.nombre ?? "").trim();
    const price = Number(row.precio);
    const quantity = Number(row.cantidad);

    const validRow =
      name !== "" &&
      Number.isFinite(price) && price >= 0 &&
      Number.isInteger(quantity) && quantity >= 0;

    if (!validRow) {
      console.warn(`Fila ${index + 2} del inventario no es válida`, row);
      return;
    }

    items.push({ id: index + 1, name, price, quantity });
  });

  return items;
}

/* ===== Filtro por nombre ===== */
function getFilteredProducts() {
  const term = searchInput.value.trim().toLowerCase();
  return products.filter(p => !term || p.name.toLowerCase().includes(term));
}

/* ===== Tarjetas ===== */
function stockText(quantity) {
  return quantity > 0 ? `Disponibles: ${quantity}` : "Agotado";
}

function renderProducts() {
  const list = getFilteredProducts();

  grid.innerHTML = list.map(p => `
    <article class="product-card">
      <div class="card-body">
        <span class="tag">${escapeHtml(stockText(p.quantity))}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="price">${money.format(p.price)}</p>
        <button type="button" class="outline" data-id="${p.id}">Ver detalles</button>
      </div>
    </article>
  `).join("");

  emptyMsg.hidden = list.length > 0;
}

function showLoadError() {
  grid.innerHTML = "";
  emptyMsg.hidden = false;
  emptyMsg.textContent =
    "No pudimos cargar el inventario. Si abriste la página con doble clic, " +
    "publícala como indica el README: el navegador no deja leer el archivo así.";
}

/* ===== Ventana de detalle ===== */
function openDetails(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  dialogBody.innerHTML = `
    <span class="tag">${escapeHtml(stockText(product.quantity))}</span>
    <h2>${escapeHtml(product.name)}</h2>
    <p class="price">${money.format(product.price)}</p>
    <button type="button" id="ask-btn">Pedir información de este producto</button>
  `;

  document.getElementById("ask-btn").addEventListener("click", () => {
    dialog.close();
    form.elements["message"].value =
      `Hola, me interesa el producto: ${product.name}. ¿Me pueden dar más información?`;
    document.getElementById("contacto").scrollIntoView({ behavior: "smooth" });
    form.elements["name"].focus();
  });

  dialog.showModal();
}

/* ===== Formulario de contacto ===== */
async function handleContactSubmit(event) {
  event.preventDefault();

  if (CONFIG.formEndpoint.includes("TU_ID")) {
    formStatus.textContent = "Falta configurar el formulario. Revisa el README.";
    return;
  }

  const data = new FormData(form);

  // Si el campo trampa tiene texto, es spam: no se envía
  if (data.get("website")) return;

  formStatus.textContent = "Enviando...";

  try {
    const response = await fetch(CONFIG.formEndpoint, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) throw new Error("Respuesta no válida");

    form.reset();
    formStatus.textContent = "¡Gracias! Te contactaremos pronto.";
  } catch (error) {
    formStatus.textContent = "No pudimos enviar el mensaje. Intenta de nuevo.";
  }
}

/* ===== Arranque ===== */
async function init() {
  searchInput.addEventListener("input", renderProducts);

  // Un solo escucha para todas las tarjetas (delegación de eventos)
  grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-id]");
    if (button) openDetails(Number(button.dataset.id));
  });

  form.addEventListener("submit", handleContactSubmit);

  if (CONFIG.whatsapp) {
    document.getElementById("whatsapp-link").href =
      `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hola, quiero más información.")}`;
    document.getElementById("whatsapp-wrap").hidden = false;
  }

  document.getElementById("year").textContent = new Date().getFullYear();

  try {
    products = await loadInventory();
    renderProducts();
  } catch (error) {
    console.error(error);
    showLoadError();
  }
}

init();
