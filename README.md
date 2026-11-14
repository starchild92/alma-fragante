# Mi sitio web de productos y contacto

Sitio estático (HTML, CSS y JavaScript). Es gratis y no necesita servidor.

## Estructura de archivos

```
mi-web/
├── index.html          → La página (estructura)
├── inventario.xlsx     → TU inventario en Excel (nombre, precio, cantidad)
├── css/styles.css      → Los colores y tamaños propios
├── js/app.js           → La lógica (lee el Excel, buscador, formulario)
└── README.md           → Este archivo
```

## Paso 1: Edita tu inventario en Excel

1. Abre `inventario.xlsx` con Excel, Google Sheets o Numbers.
2. La fila 1 son los títulos y no se cambian: `nombre`, `precio`, `cantidad`.
3. Cada fila siguiente es un producto:
   - **nombre**: el nombre del producto.
   - **precio**: solo números, en pesos, sin puntos ni comas (ejemplo: `185000`).
   - **cantidad**: unidades disponibles. Si es `0`, la página muestra "Agotado".
4. Guarda el archivo en formato `.xlsx`.

Para agregar un producto, escribe en la fila siguiente. Para quitar uno, borra la fila completa.

Las filas sin nombre, o con precio o cantidad que no sean números, no se muestran.

Por ahora la página solo lee la primera hoja del Excel.

## Paso 2: Personaliza tu información

1. **Nombre de tu empresa**: en `index.html`, busca "Mi Empresa" y cámbialo (aparece 3 veces).
2. **Moneda y WhatsApp**: en `js/app.js`, revisa el bloque `CONFIG`.

## Paso 3: Activa el formulario de contacto (gratis)

El sitio no tiene servidor propio, así que usamos **Formspree**, un servicio gratuito que te envía los mensajes al correo.

1. Crea una cuenta en formspree.io (plan gratuito).
2. Crea un formulario nuevo y copia su dirección, que tiene esta forma: `https://formspree.io/f/abcd1234`.
3. Pégala en `js/app.js`, reemplazando `https://formspree.io/f/TU_ID_AQUI`.

## Paso 4: Publica gratis en GitHub Pages

1. Crea una cuenta en github.com.
2. Crea un repositorio nuevo (por ejemplo `mi-web`) y márcalo como **Public**.
3. Sube todos los archivos de la carpeta `mi-web` (botón *Add file → Upload files*).
4. Ve a **Settings → Pages**. En *Source* elige **Deploy from a branch**, rama **main**, carpeta **/ (root)** y guarda.
5. En un par de minutos tu sitio estará en `https://TU-USUARIO.github.io/mi-web/`.

Alternativa igual de gratis: arrastra la carpeta a **app.netlify.com/drop**.

Para actualizar los productos, cambia el Excel y súbelo de nuevo, reemplazando el archivo anterior. Luego recarga la página.

## Cómo probarlo en tu computador

Con doble clic en `index.html` el navegador **no** deja leer el Excel, y la lista de productos aparecerá como "No pudimos cargar el inventario". Para probarlo en tu computador necesitas un servidor local. Si no sabes cómo, publícalo en GitHub Pages o Netlify y pruébalo ahí.

## Qué sigue (opcional)

- Dominio propio (por ejemplo `miempresa.com`), que cuesta dinero cada año.
- Más páginas, como "Sobre nosotros".
- Fotos de tus productos.
