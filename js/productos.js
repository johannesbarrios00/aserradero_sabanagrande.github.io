const CatalogoStore = (() => {
  const { jsonUrl, storageKey, defaultImage } = window.TIENDA_CONFIG;

  function leerLocal() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function guardarLocal(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  async function leerDesdeJsonOficial() {
    try {
      const resp = await fetch(jsonUrl, { cache: "no-store" });
      if (!resp.ok) throw new Error("No se pudo leer productos.json");
      const data = await resp.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async function cargarParaVista(esAdmin) {
    if (!esAdmin) {
      const oficiales = await leerDesdeJsonOficial();
      if (oficiales.length > 0) {
        return { items: oficiales, origen: "Catálogo oficial" };
      }
      const borrador = leerLocal();
      if (borrador && borrador.length > 0) {
        return { items: borrador, origen: "Vista previa provisional" };
      }
      return { items: [], origen: "Catálogo listo" };
    }

    const local = leerLocal();
    if (local !== null) {
      return { items: local, origen: "Borrador provisional" };
    }

    const oficiales = await leerDesdeJsonOficial();
    guardarLocal(oficiales);
    return { items: oficiales, origen: "Sincronizado con productos.json" };
  }

  function agregar(producto) {
    const actuales = leerLocal() || [];
    const precioAnterior = Number(producto.precio_antes) || 0;
    const nuevo = {
      id: Date.now(),
      nombre: producto.nombre.trim(),
      categoria: producto.categoria || "Colchones",
      medidas: producto.medidas.trim(),
      precio: Number(producto.precio) || 0,
      precio_antes: precioAnterior > 0 ? precioAnterior : null,
      etiqueta: (producto.etiqueta || "").trim(),
      stock: Number(producto.stock) || 0,
      imagen: producto.imagen || defaultImage,
      descripcion: (producto.descripcion || "").trim()
    };
    const actualizados = [nuevo, ...actuales];
    guardarLocal(actualizados);
    return actualizados;
  }

  function eliminar(id) {
    const actuales = leerLocal() || [];
    const actualizados = actuales.filter((item) => item.id !== id);
    guardarLocal(actualizados);
    return actualizados;
  }

  async function reiniciarDesdeJson() {
    localStorage.removeItem(storageKey);
    return cargarParaVista(true);
  }

  return {
    cargarParaVista,
    agregar,
    eliminar,
    reiniciarDesdeJson
  };
})();
