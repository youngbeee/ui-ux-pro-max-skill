/* ============================================================
   FRENOS PARTS ESTOC · Configuración editable
   Cambia estos valores sin tocar el resto del código.
   ============================================================ */
window.BP_CONFIG = Object.assign({
  // WhatsApp oficial (código de país + número, sin espacios ni "+")
  whatsapp: "51981232672",
  telefono: "981 232 672",

  // Mensaje inicial de la cotización
  mensajeCotizacion: "Hola, estoy interesado en los siguientes productos de FRENOS PARTS ESTOC. ¿Podrían ayudarme con una cotización?",

  // Dirección física. Déjala vacía hasta tenerla confirmada.
  direccion: "Jr. Antonio Raimondi 450, La Victoria, Lima",         // ej.: "Av. Ejemplo 123, Lima"
  // Mapa: pega aquí la URL de "Insertar un mapa" de Google Maps (empieza con https://www.google.com/maps/embed?...)
  mapaEmbed: "https://www.google.com/maps?q=Jr.+Antonio+Raimondi+450,+La+Victoria,+Lima,+Per%C3%BA&z=17&output=embed",
  // Enlace para abrir la ubicación en Google Maps (opcional)
  mapaEnlace: "https://www.google.com/maps/search/?api=1&query=Jr.+Antonio+Raimondi+450,+La+Victoria,+Lima,+Per%C3%BA",

  // Horarios de atención. Ejemplo: [["Lunes a viernes", "8:30 – 18:00"], ["Sábados", "8:30 – 13:00"]]
  horarios: [],

  // Catálogo
  datos: "data/productos.json",
  imagenes: { modo: "archivos", miniatura: "img/t/", grande: "img/p/", paquetes: "img/packs/" },
  porPagina: 24,
  sincronizarURL: true
}, window.BP_CONFIG || {});
