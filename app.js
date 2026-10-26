"use strict";

// MODELO: guarda datos y hace cálculos. No utiliza el DOM.
class Carrito {
  constructor(productos, moneda = "€") {
    this.productos = productos.map(producto => ({
      ...producto,
      price: Number(producto.price),
      quantity: 0
    }));
    this.moneda = moneda;
  }

  actualizarUnidades(sku, unidades) {
    const producto = this.productos.find(producto => producto.SKU === sku);
    producto.quantity = Math.max(0, parseInt(unidades, 10) || 0);
  }

  obtenerInformacionProducto(sku) {
    const producto = this.productos.find(producto => producto.SKU === sku);
    return {
      ...producto,
      subtotal: Number((producto.price * producto.quantity).toFixed(2))
    };
  }

  obtenerCarrito() {
    const products = this.productos
      .filter(producto => producto.quantity > 0)
      .map(producto => this.obtenerInformacionProducto(producto.SKU));

    let total = 0;
    for (const producto of products) {
      total += producto.subtotal;
    }

    return { products, total: Number(total.toFixed(2)), currency: this.moneda };
  }
}

// VISTA: utiliza el DOM para mostrar los datos del carrito.
let carrito;
const tabla = document.querySelector("#productos");
const resumen = document.querySelector("#resumen");
const total = document.querySelector("#total");
const estado = document.querySelector("#estado");

function dinero(cantidad) {
  return cantidad.toFixed(2) + " " + carrito.moneda;
}

function mostrarResumen() {
  const datos = carrito.obtenerCarrito();
  resumen.replaceChildren();

  for (const producto of datos.products) {
    const li = document.createElement("li");
    li.textContent = `${producto.quantity} × ${producto.title}: ${dinero(producto.subtotal)}`;
    resumen.append(li);
  }

  total.textContent = dinero(datos.total);
}

function mostrarProductos() {
  for (const producto of carrito.productos) {
    const fila = document.createElement("tr");
    // Plantilla fija. Los datos recibidos se añaden después con textContent.
    fila.innerHTML = `
      <td><strong></strong><small></small></td>
      <td class="cantidad">
        <button type="button" class="menos">−</button>
        <input type="text" value="0" readonly>
        <button type="button" class="mas">+</button>
      </td>
      <td class="precio"></td>
      <td class="subtotal"></td>
    `;

    const menos = fila.querySelector(".menos");
    const mas = fila.querySelector(".mas");
    const cantidad = fila.querySelector("input");
    const subtotal = fila.querySelector(".subtotal");

    fila.querySelector("strong").textContent = producto.title;
    fila.querySelector("small").textContent = "REF: " + producto.SKU;
    fila.querySelector(".precio").textContent = dinero(producto.price);
    subtotal.textContent = dinero(0);
    cantidad.setAttribute("aria-label", "Unidades de " + producto.title);
    menos.setAttribute("aria-label", "Quitar una unidad de " + producto.title);
    mas.setAttribute("aria-label", "Añadir una unidad de " + producto.title);

    //EVENTOS: cada clic cambia el modelo y refresca la vista.
    function cambiarCantidad(cambio) {
      carrito.actualizarUnidades(producto.SKU, producto.quantity + cambio);
      const datos = carrito.obtenerInformacionProducto(producto.SKU);
      cantidad.value = datos.quantity;
      subtotal.textContent = dinero(datos.subtotal);
      mostrarResumen();
    }

    menos.addEventListener("click", () => cambiarCantidad(-1));
    mas.addEventListener("click", () => cambiarCantidad(1));
    tabla.append(fila);
  }
}

// PETICIÓN HTTP: recibe los productos e inicia la aplicación.
const URL_API = "api.php"; // Aquí puedes poner la URL de tu API de JSONBlob.

async function iniciar() {
  try {
    const respuesta = await fetch(URL_API);
    if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);

    const datos = await respuesta.json();
    carrito = new Carrito(datos.products, datos.currency);
    mostrarProductos();
    mostrarResumen();
    estado.textContent = "Productos cargados. Usa − y + para cambiar las unidades.";
  } catch (error) {
    estado.textContent = "No se pudieron cargar los productos: " + error.message;
  }
}

iniciar();
