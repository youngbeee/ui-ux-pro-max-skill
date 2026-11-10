/* ============================================================
   BREAK PARTS · Configuración editable
   Cambia estos valores sin tocar el resto del código.
   ============================================================ */
window.BP_CONFIG = Object.assign({
  // WhatsApp oficial (código de país + número, sin espacios ni "+")
  whatsapp: "51945051499",
  telefono: "945 051 499",

  // Mensaje inicial de la cotización
  mensajeCotizacion: "Hola, estoy interesado en los siguientes productos de BREAK PARTS. ¿Podrían ayudarme con una cotización?",

  // Dirección física. Déjala vacía hasta tenerla confirmada.
  direccion: "",          // ej.: "Av. Ejemplo 123, Lima"
  // Mapa: pega aquí la URL de "Insertar un mapa" de Google Maps (empieza con https://www.google.com/maps/embed?...)
  mapaEmbed: "",
  // Enlace para abrir la ubicación en Google Maps (opcional)
  mapaEnlace: "",

  // Horarios de atención. Ejemplo: [["Lunes a viernes", "8:30 – 18:00"], ["Sábados", "8:30 – 13:00"]]
  horarios: [],

  // Catálogo
  datos: "data/productos.json",
  imagenes: { modo: "archivos", miniatura: "img/t/", grande: "img/p/", paquetes: "img/packs/" },
  porPagina: 24,
  sincronizarURL: true
}, window.BP_CONFIG || {});
