(function () {
  const $ = (id) => document.getElementById(id);
  const grid = $("grid");
  const inputBuscar = $("buscar");
  const selCategoria = $("categoria");
  const vacio = $("vacio");

  // Datos del negocio
  document.title = CONFIG.nombreNegocio + " | Catálogo";
  $("nombreNegocio").textContent = CONFIG.nombreNegocio;
  $("eslogan").textContent = CONFIG.eslogan;
  $("pie").textContent = CONFIG.pie;

  const enlaceWA = (texto) =>
    "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(texto);

  const saludo = "Hola " + CONFIG.nombreNegocio + ", quiero más información.";
  $("btnContacto").href = enlaceWA(saludo);
  $("flotante").href = enlaceWA(saludo);

  const precio = (n) =>
    CONFIG.moneda + Number(n).toLocaleString(CONFIG.localePrecio);

  // Categorías
  [...new Set(PRODUCTOS.map((p) => p.categoria).filter(Boolean))].forEach((c) => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    selCategoria.appendChild(o);
  });

  function crearTarjeta(p) {
    const card = document.createElement("article");
    card.className = "card" + (p.agotado ? " sin-stock" : "");

    const img = document.createElement("img");
    img.src = "images/" + p.imagen;
    img.alt = p.nombre;
    img.loading = "lazy";
    img.onerror = () => { img.onerror = null; img.src = "images/placeholder.svg"; };
    card.appendChild(img);

    if (p.agotado) {
      const tag = document.createElement("span");
      tag.className = "agotado";
      tag.textContent = "Agotado";
      card.appendChild(tag);
    }

    const body = document.createElement("div");
    body.className = "card-body";

    if (p.categoria) {
      const c = document.createElement("span");
      c.className = "cat";
      c.textContent = p.categoria;
      body.appendChild(c);
    }

    const h = document.createElement("h2");
    h.textContent = p.nombre;
    body.appendChild(h);

    const d = document.createElement("p");
    d.className = "desc";
    d.textContent = p.descripcion || "";
    body.appendChild(d);

    const pr = document.createElement("div");
    pr.className = "precio";
    pr.textContent = precio(p.precio);
    body.appendChild(pr);

    const a = document.createElement("a");
    a.className = "btn btn-wa" + (p.agotado ? " btn-off" : "");
    a.target = "_blank";
    a.rel = "noopener";
    if (p.agotado) {
      a.textContent = "No disponible";
    } else {
      a.textContent = "Pedir por WhatsApp";
      a.href = enlaceWA(
        "Hola " + CONFIG.nombreNegocio + ", me interesa este producto:\n\n" +
        "*" + p.nombre + "*\n" +
        "Precio: " + precio(p.precio) + "\n\n" +
        "¿Está disponible?"
      );
    }
    body.appendChild(a);

    card.appendChild(body);
    return card;
  }

  function pintar() {
    const q = inputBuscar.value.trim().toLowerCase();
    const cat = selCategoria.value;
    grid.innerHTML = "";

    const lista = PRODUCTOS.filter((p) => {
      const texto = (p.nombre + " " + (p.descripcion || "")).toLowerCase();
      return (!q || texto.includes(q)) && (!cat || p.categoria === cat);
    });

    lista.forEach((p) => grid.appendChild(crearTarjeta(p)));
    vacio.hidden = lista.length > 0;
  }

  inputBuscar.addEventListener("input", pintar);
  selCategoria.addEventListener("change", pintar);
  pintar();
})();
