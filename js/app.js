document.addEventListener("DOMContentLoaded", async () => {
  const { defaultImage, whatsappNumber } = window.TIENDA_CONFIG;
  const esAdmin = document.body.dataset.page === "admin";

  const grid = document.getElementById("catalogo-grid");
  const totalProductosEl = document.getElementById("total-productos");
  const totalStockEl = document.getElementById("total-stock");
  const buscarInput = document.getElementById("buscar-producto");
  const pills = document.querySelectorAll(".pill[data-cat]");
  const form = document.getElementById("form-subir-producto");
  const archivoInput = document.getElementById("imagen_archivo");
  const jsonPreview = document.getElementById("json-preview");
  const btnCopiar = document.getElementById("btn-copiar-json");
  const btnDescargar = document.getElementById("btn-descargar-json");
  const btnRestablecer = document.getElementById("btn-restablecer-json");
  const estadoSync = document.getElementById("estado-sync");
  const btnWhatsappGeneral = document.getElementById("btn-whatsapp-general");

  let productos = [];
  let categoriaActiva = "TODAS";
  let imagenDataUrl = "";

  if (btnWhatsappGeneral && whatsappNumber) {
    const msg = encodeURIComponent("Hola, vi su catálogo web y me gustaría cotizar colchones, camas o escaparates.");
    btnWhatsappGeneral.href = `https://wa.me/${whatsappNumber}?text=${msg}`;
  }

  function formatearPrecio(valor) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(Number(valor) || 0);
  }

  function crearUrlWhatsappProducto(p) {
    const texto = `Hola, me interesa *${p.nombre}* (${p.categoria} · ${p.medidas}) por ${formatearPrecio(p.precio)}. ¿Tienen disponibilidad?`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`;
  }

  function actualizarMetricas(origenTexto) {
    if (totalProductosEl) totalProductosEl.textContent = String(productos.length);
    const stockTotal = productos.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
    if (totalStockEl) totalStockEl.textContent = String(stockTotal);
    if (jsonPreview) jsonPreview.textContent = JSON.stringify(productos, null, 2);
    if (estadoSync && origenTexto) {
      estadoSync.textContent = `${origenTexto} · ${productos.length} referencia(s)`;
    }
  }

  function renderCatalogo() {
    if (!grid) return;

    const termino = (buscarInput?.value || "").trim().toLowerCase();

    const filtrados = productos.filter((p) => {
      const cat = p.categoria || "Colchones";
      const coincideCat = categoriaActiva === "TODAS" || cat === categoriaActiva;
      const texto = `${p.nombre} ${cat} ${p.medidas} ${p.etiqueta || ""} ${p.descripcion || ""}`.toLowerCase();
      const coincideTexto = !termino || texto.includes(termino);
      return coincideCat && coincideTexto;
    });

    if (filtrados.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>${esAdmin ? "Aún no has cargado productos" : "Próximamente nuevas referencias"}</h3>
          <p>${
            esAdmin
              ? "Agrega arriba tus colchones, camas o escaparates y descarga el archivo productos.json."
              : "Estamos actualizando nuestro catálogo de colchones, camas y escaparates."
          }</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtrados
      .map((p) => {
        const tieneDescuento = Number(p.precio_antes) > Number(p.precio);
        return `
        <article class="card">
          <div class="card__media">
            <img src="${p.imagen || defaultImage}" alt="${p.nombre}" onerror="this.src='${defaultImage}'" />
            <div class="card__badges">
              <span class="card__badge">${p.categoria || "Catálogo"}</span>
              ${p.etiqueta ? `<span class="card__badge card__badge--promo">${p.etiqueta}</span>` : ""}
            </div>
          </div>
          <div class="card__body">
            <h3 class="card__title">${p.nombre}</h3>
            <p class="card__meta">Medida: ${p.medidas}</p>
            ${p.descripcion ? `<p class="card__desc">${p.descripcion}</p>` : ""}

            <div class="card__pricing">
              <div>
                ${tieneDescuento ? `<span class="card__price-old">${formatearPrecio(p.precio_antes)}</span>` : ""}
                <span class="card__price">${formatearPrecio(p.precio)}</span>
              </div>
              <span class="card__stock">${Number(p.stock) > 0 ? `Disponible (${p.stock})` : "Bajo pedido"}</span>
            </div>

            <div class="card__actions">
              <a href="${crearUrlWhatsappProducto(p)}" target="_blank" rel="noopener" class="btn btn--whatsapp btn--small btn--full">
                Pedir por WhatsApp
              </a>
              ${
                esAdmin
                  ? `<button type="button" class="card__delete" data-id="${p.id}" title="Eliminar">Borrar</button>`
                  : ""
              }
            </div>
          </div>
        </article>
      `;
      })
      .join("");

    if (esAdmin) {
      grid.querySelectorAll(".card__delete").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          productos = CatalogoStore.eliminar(id);
          renderCatalogo();
          actualizarMetricas("Eliminado del borrador");
        });
      });
    }
  }

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((el) => el.classList.remove("active"));
      pill.classList.add("active");
      categoriaActiva = pill.dataset.cat || "TODAS";
      renderCatalogo();
    });
  });

  archivoInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      imagenDataUrl = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      imagenDataUrl = typeof reader.result === "string" ? reader.result : "";
    };
    reader.readAsDataURL(file);
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const urlEscrita = (data.get("imagen_url") || "").toString().trim();

    productos = CatalogoStore.agregar({
      nombre: data.get("nombre"),
      categoria: data.get("categoria"),
      medidas: data.get("medidas"),
      precio: data.get("precio"),
      precio_antes: data.get("precio_antes"),
      etiqueta: data.get("etiqueta"),
      stock: data.get("stock"),
      descripcion: data.get("descripcion"),
      imagen: imagenDataUrl || urlEscrita || defaultImage
    });

    form.reset();
    imagenDataUrl = "";
    renderCatalogo();
    actualizarMetricas("Producto agregado");
  });

  buscarInput?.addEventListener("input", renderCatalogo);

  btnCopiar?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(productos, null, 2));
      btnCopiar.textContent = "¡Copiado!";
      setTimeout(() => (btnCopiar.textContent = "Copiar"), 1600);
    } catch {
      alert("No se pudo copiar automáticamente.");
    }
  });

  btnDescargar?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(productos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "productos.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  btnRestablecer?.addEventListener("click", async () => {
    const res = await CatalogoStore.reiniciarDesdeJson();
    productos = res.items;
    renderCatalogo();
    actualizarMetricas(res.origen);
  });

  const inicial = await CatalogoStore.cargarParaVista(esAdmin);
  productos = inicial.items;
  renderCatalogo();
  actualizarMetricas(inicial.origen);
});
