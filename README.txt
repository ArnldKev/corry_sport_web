CORRY SPORT — Catálogo web

USO
Abre index.html directamente en un navegador moderno o usa Live Server en VS Code.
HTML, CSS y JavaScript nativos: no requiere instalación, compilación ni servicios externos.

CATÁLOGO
31 productos y 7 categorías transcritos de CATALOGO CORRY SPORT.pptx (edición 2025).
Nombres, tallas S/M/L/XL, color y precios conservan los datos del PowerPoint.
products.js contiene los datos; sourceSlide identifica la diapositiva de origen.
Los identificadores CS-01…CS-31 son referencias internas de la web, no códigos del fabricante.
La diapositiva 4 contiene dos productos llamados Rodillera de compresión. Se conservan ambos, con fotos e identificadores distintos.
Las fotos originales se extrajeron según su posición en cada diapositiva y se optimizaron a WebP sin sustituir productos.
Los precios se indican como referenciales; no se afirma disponibilidad en tiempo real.

PEDIDOS Y CONTACTO
Número de WhatsApp actualizado por el propietario: +51 916 852 942.
Para cambiarlo, actualiza WHATSAPP_NUMBER en script.js y los enlaces/número de index.html.
El usuario selecciona la talla antes de agregar. El pedido permite cantidades de 1 a 99 por producto/talla, cambio de talla y eliminación.
El pedido se guarda localmente en el navegador con la clave corrySportCartV2. No usa los productos de plantilla guardados por la versión anterior.
WhatsApp abre una consulta con productos, tallas, cantidades y Total a pagar. No envía mensajes automáticamente ni cobra pagos.
El formulario de contacto abre WhatsApp; no necesita un servidor ni guarda datos del formulario.
Confirma el número comercial, los precios vigentes y las condiciones de entrega antes de publicar.

DISEÑO Y ACCESIBILIDAD
Paleta original: negro #0b0b0f, naranja #ef3b1d y dorado #f2a93b.
Fotos de portada y marca tomadas del propio catálogo.
Diseño responsive, carga diferida, tamaños de imagen reservados, controles semánticos y diálogo con navegación por teclado.
Animaciones progresivas con IntersectionObserver y soporte para prefers-reduced-motion.
Sin fuentes remotas, rastreadores ni librerías de interfaz.

ARCHIVOS PRINCIPALES
index.html: estructura, textos y formulario.
styles.css: estilos y adaptación a pantallas.
products.js: catálogo y procedencia de cada producto.
script.js: filtros, búsqueda, diálogos, pedido y WhatsApp.
assets/catalogo/: las 31 fotos optimizadas.

VERIFICACIÓN
No existía una suite de pruebas en el proyecto original.
Se verificó en Microsoft Edge mediante Playwright: filtros, búsqueda sin tildes, orden, paginación, tallas obligatorias, cantidades, combinación de tallas, persistencia y recuperación ante almacenamiento corrupto.
Se comprobó la composición de los enlaces de WhatsApp sin enviar mensajes.
Se revisaron anchos de 320, 375, 390, 680, 768, 1024 y 1440 px, además del movimiento reducido y navegación por teclado.
Las mediciones de Core Web Vitals reales dependen del hosting y del tráfico; no se atribuyen resultados de campo a estas pruebas locales.

