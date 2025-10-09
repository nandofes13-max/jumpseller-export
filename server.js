const express = require("express");
const axios = require("axios");
const { Parser } = require("json2csv");

const app = express();
const PORT = process.env.PORT || 10000;

// URL base de la API de Jumpseller
const BASE_URL = "https://api.jumpseller.com/v1/products.json";

// Credenciales de entorno
const API_USER = process.env.JUMPSELLER_USER;
const API_PASS = process.env.JUMPSELLER_PASS;

app.get("/", (req, res) => {
  res.send("Servidor corriendo correctamente");
});

// 🧾 Función para obtener todos los productos paginados
async function fetchAllProducts(page = 1, acc = []) {
  const url = `${BASE_URL}?page=${page}`;
  const response = await axios.get(url, {
    auth: { username: API_USER, password: API_PASS }
  });

  const data = response.data || [];
  const products = acc.concat(data);

  if (data.length === 30) {
    return fetchAllProducts(page + 1, products);
  }

  return products;
}

// 🔡 Formateo de nombres de columnas
const formatHeader = header => {
  if (header === "sku") return "SKU"; // caso especial
  return header
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// 🧩 Endpoint principal de exportación
app.get("/export", async (req, res) => {
  try {
    console.log("Descargando productos desde Jumpseller...");
    const allProductsRaw = await fetchAllProducts();
    const allProducts = allProductsRaw.map(p => p.product);

    console.log(`Total de productos obtenidos: ${allProducts.length}`);

    // Mapeo de campos según la documentación oficial
    const mappedProducts = allProducts.map(p => ({
      permalink: p.permalink || "",
      name: p.name || "",
      description: p.description || "",
      page_title: p.page_title || "",
      meta_description: p.meta_description || "",
      width: parseFloat(p.width || 0),
      length: parseFloat(p.length || 0),
      height: parseFloat(p.height || 0),
      brand: p.brand || "",
      barcode: p.barcode || "",
      categories: Array.isArray(p.categories)
        ? p.categories
            .map((c, i) => p.categories.slice(0, i + 1).map(x => x.name).join(" / "))
            .join(",")
        : "",
      images: Array.isArray(p.images)
        ? p.images.map(i => i.url).join(", ")
        : "",
      digital: !!p.digital,
      featured: !!p.featured,
      status: p.status || "",
      sku: p.sku || "",
      weight: parseFloat(p.weight || 0),
      cost_per_item: parseFloat(p.cost_per_item || 0),
      compare_at_price: parseFloat(p.compare_at_price || 0),
      stock: parseInt(p.stock || 0),
      stock_unlimited: !!p.stock_unlimited,
      stock_notification: !!p.stock_notification,
      stock_threshold: parseInt(p.stock_threshold || 0),
      price: parseFloat(p.price || 0),
      minimum_quantity: parseInt(p.minimum_quantity || 0),
      maximum_quantity: parseInt(p.maximum_quantity || 0),
      custom_field_label:
        (p.fields && p.fields[0] && p.fields[0].label) || "",
      custom_field_value:
        (p.fields && p.fields[0] && p.fields[0].value) || "",
      custom_field_type:
        (p.fields && p.fields[0] && p.fields[0].type) || "",
      google_product_category: p.google_product_category || ""
    }));

    // 📄 Definir encabezados formateados
    const fields = Object.keys(mappedProducts[0]).map(h => ({
      label: formatHeader(h),
      value: h
    }));

    // 🧠 Crear parser dentro del endpoint (sin conflictos)
    const parser = new Parser({ fields });
    const csv = parser.parse(mappedProducts);

    // 📦 Enviar archivo CSV al cliente
    res.header("Content-Type", "text/csv");
    res.attachment("productos.csv");
    res.send(csv);

    console.log("Exportación completada correctamente ✅");
  } catch (error) {
    console.error("❌ Error al exportar CSV:", error);
    res.status(500).send("Error al exportar CSV");
  }
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
