/* ===== CONFIGURACIÓN (cambia estos valores) ===== */
const CONFIG = {
  currency: "COP",
  locale: "es-CO",
  // Archivo de inventario CSV (debe estar en la misma carpeta que index.html)
  inventoryFile: "inventario.csv",
  // Carpeta con las fotos livianas que usa la página (columna "imagen" del CSV)
  imagesFolder: "imgs/low_res/",
  // Carpeta de respaldo con las fotos originales: se usa si falta la versión liviana
  backupImagesFolder: "imgs/",
  // Dirección del formulario en Formspree (ver README). Ejemplo: "https://formspree.io/f/abcd1234"
  formEndpoint: "https://formspree.io/f/xzerdlgz",
  // Opcional: número de WhatsApp con código de país, sin + ni espacios. Ejemplo: "573001234567"
  whatsapp: "573015964970"
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

/* Lista de productos cargada desde el CSV */
let products = [];

/* Evita que texto escrito por alguien se interprete como código */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ===== Lectura del inventario CSV ===== */
/*
  La fila 1 debe tener los títulos: nombre, precio, cantidad.
  Acepta coma (,) o punto y coma (;) como separador, porque Excel en español
  suele guardar con punto y coma.
*/
function parseCsv(text) {
  text = text.replace(/^\uFEFF/, "");
  const firstLine = text.split(/\r?\n/, 1)[0];
  const separator = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') inQuotes = false;
      else field += char;
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === separator) {
      row.push(field); field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter(r => r.some(cell => cell.trim() !== ""));
  if (nonEmpty.length === 0) return [];

  const headers = nonEmpty[0].map(h => h.trim().toLowerCase());
  return nonEmpty.slice(1).map(cells => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim(); });
    return obj;
  });
}

async function loadInventory() {
  const response = await fetch(CONFIG.inventoryFile, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo leer el inventario");

  const rows = parseCsv(await response.text());

  const items = [];
  rows.forEach((row, index) => {
    const name = String(row.nombre ?? "").trim();
    const price = row.precio === "" ? NaN : Number(row.precio);
    const quantity = row.cantidad === "" ? NaN : Number(row.cantidad);

    const validRow =
      name !== "" &&
      Number.isFinite(price) && price >= 0 &&
      Number.isInteger(quantity) && quantity >= 0;

    if (!validRow) {
      console.warn(`Fila ${index + 2} del inventario no es válida`, row);
      return;
    }

    const image = String(row.imagen ?? "").trim();
    const description = String(row.descripcion ?? "").trim();
    items.push({ id: index + 1, name, price, quantity, image, description });
  });

  return items;
}

/* ===== Filtro por nombre ===== */
function getFilteredProducts() {
  const term = searchInput.value.trim().toLowerCase();
  return products.filter(p =>
    !term ||
    p.name.toLowerCase().includes(term) ||
    p.description.toLowerCase().includes(term)
  );
}

/* ===== Imágenes ===== */
/*
  Devuelve la etiqueta <img> del producto, o nada si no tiene imagen.
  Primero usa la foto liviana; si no existe, carga la original de respaldo.
*/
function productImage(product, lazy) {
  if (!product.image) return "";
  const file = encodeURIComponent(product.image);
  const src = CONFIG.imagesFolder + file;
  const backup = CONFIG.backupImagesFolder + file;
  return `<img src="${src}" data-backup="${backup}" alt="${escapeHtml(product.name)}"${lazy ? ' loading="lazy"' : ""}>`;
}

/* Si una foto liviana no carga, cambia a la original (solo una vez) */
document.addEventListener("error", event => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.backup) return;
  const backup = img.dataset.backup;
  delete img.dataset.backup;
  img.src = backup;
}, true);

/* ===== Tarjetas ===== */
function stockText(quantity) {
  return quantity > 0 ? `Disponibles: ${quantity}` : "Agotado";
}

function renderProducts() {
  const list = getFilteredProducts();

  grid.innerHTML = list.map(p => `
    <article class="product-card${p.quantity > 0 ? "" : " sold-out"}">
      <div class="card-media">
        ${productImage(p, true)}
        ${p.quantity > 0 ? "" : '<span class="badge">Agotado</span>'}
      </div>
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

/* ===== WhatsApp ===== */
/* Enlace a un chat de WhatsApp con el mensaje ya escrito */
function whatsappUrl(message) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
}

/* Mensaje con la información del producto, según si hay unidades o no */
function productWhatsappMessage(product) {
  const price = money.format(product.price);
  return product.quantity > 0
    ? `Hola, me interesa el producto ${product.name} (${price}). ¿Me pueden dar más información?`
    : `Hola, me interesa el producto ${product.name} (${price}), que aparece agotado. ¿Saben cuándo vuelve a estar disponible?`;
}

/* ===== Ventana de detalle ===== */
function openDetails(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  dialogBody.innerHTML = `
    ${productImage(product, false)}
    <span class="tag">${escapeHtml(stockText(product.quantity))}</span>
    <h2>${escapeHtml(product.name)}</h2>
    <p class="price">${money.format(product.price)}</p>
    ${product.description ? `<p class="description">${escapeHtml(product.description)}</p>` : ""}
    <div class="dialog-actions">
      ${CONFIG.whatsapp ? `
        <a href="${whatsappUrl(productWhatsappMessage(product))}" target="_blank" rel="noopener" role="button" class="btn-whatsapp">
          ${document.getElementById("whatsapp-icon").innerHTML}
          <span>Preguntar por WhatsApp</span>
        </a>` : ""}
      <button type="button" id="ask-btn" class="secondary">Pedir información por correo</button>
    </div>
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
      whatsappUrl("Hola, quiero más información sobre uno de los productos de alma Fragante.");
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
