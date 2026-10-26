// La clase guarda los productos y hace los cálculos.
class Carrito {
  constructor(productos, moneda = "€") {
    this.productos = productos;
    this.moneda = moneda;
    for (const producto of productos) {
      producto.price = Number(producto.price);
      producto.quantity = 0;
      producto.subtotal = 0;
    }
  }

  obtenerInformacionProducto(sku) {
    return this.productos.find(producto => producto.SKU === sku);
  }

  actualizarUnidades(sku, unidades) {
    const producto = this.obtenerInformacionProducto(sku);
    producto.quantity = Math.max(0, unidades);
    producto.subtotal = Number((producto.price * producto.quantity).toFixed(2));
  }

  obtenerCarrito() {
    const products = this.productos.filter(producto => producto.quantity > 0);
    let total = 0;
    for (const producto of products) total += producto.subtotal;
    return { products, total: Number(total.toFixed(2)), currency: this.moneda };
  }
}

let carrito;
const tabla = document.querySelector("#productos");
const resumen = document.querySelector("#resumen");
const total = document.querySelector("#total");
const estado = document.querySelector("#estado");

function dinero(numero) {
  return numero.toFixed(2) + " " + carrito.moneda;
}

// Una sola función dibuja toda la pantalla.
function mostrar() {
  tabla.replaceChildren();
  resumen.replaceChildren();

  for (const producto of carrito.productos) {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td><strong></strong><small></small></td>
      <td class="cantidad">
        <button type="button" class="menos" aria-label="Quitar una unidad">−</button>
        <input type="text" readonly aria-label="Cantidad">
        <button type="button" class="mas" aria-label="Añadir una unidad">+</button>
      </td>
      <td class="precio"></td><td class="subtotal"></td>
    `;
    fila.querySelector("strong").textContent = producto.title;
    fila.querySelector("small").textContent = "REF: " + producto.SKU;
    fila.querySelector("input").value = producto.quantity;
    fila.querySelector(".precio").textContent = dinero(producto.price);
    fila.querySelector(".subtotal").textContent = dinero(producto.subtotal);
    fila.querySelector(".menos").onclick = () => cambiar(producto.SKU, -1);
    fila.querySelector(".mas").onclick = () => cambiar(producto.SKU, 1);
    tabla.append(fila);
  }

  const datos = carrito.obtenerCarrito();
  for (const producto of datos.products) {
    const li = document.createElement("li");
    li.textContent = `${producto.quantity} × ${producto.title}: ${dinero(producto.subtotal)}`;
    resumen.append(li);
  }
  total.textContent = dinero(datos.total);
}

// Cada botón cambia una cantidad y vuelve a dibujar la pantalla.
function cambiar(sku, cambio) {
  const producto = carrito.obtenerInformacionProducto(sku);
  carrito.actualizarUnidades(sku, producto.quantity + cambio);
  mostrar();
}

//Pedimos los productos e iniciamos el carrito.
const URL_API = "api.php";

async function iniciar() {
  try {
    const respuesta = await fetch(URL_API);
    if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
    const datos = await respuesta.json();
    carrito = new Carrito(datos.products, datos.currency);
    mostrar();
    estado.textContent = "Productos cargados. Usa − y + para cambiar las unidades.";
  } catch (error) {
    estado.textContent = "No se pudieron cargar los productos: " + error.message;
  }
}

iniciar();
