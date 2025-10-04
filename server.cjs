// server.js
const express = require("express");
const fetch = require("node-fetch");
const { Parser } = require("json2csv");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/export", async (req, res) => {
  try {
    const { login, token } = req.body;

    if (!login || !token) {
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    console.log("🔑 Credenciales recibidas:", login, token);

    const authHeader = "Basic " + Buffer.from(`${login}:${token}`).toString("base64");

    // Obtener productos de Jumpseller
   const response = await fetch("https://api.jumpseller.com/v1/products.json", {
  method: "GET",
  headers: {
    "Authorization": authHeader,
    "Accept": "application/json",
    "User-Agent": "JumpsellerExportApp/1.0"
  }
});
    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Error Jumpseller:", errText);
      return res.status(401).json({ error: "Failed to Login", message: errText });
    }

    const data = await response.json();
    const products = data || [];

    // Definir los campos que querés en el CSV
    const fields = [
      "permalink",
      "name",
      "description",
      "page_title",
      "meta_description",
      "width",
      "length",
      "height",
      "brand",
      "barcode",
      "categories",
      "images",
      "digital",
      "featured",
      "status",
      "sku",
      "weight",
      "cost_per_item",
      "compare_at_price",
      "stock",
      "stock_unlimited",
      "stock_notification",
      "stock_threshold",
      "price",
      "minimum_quantity",
      "maximum_quantity",
      "fields[0].label",
      "fields[0].value",
      "fields[0].type",
      "google_product_category"
    ];

    // Transformación para que quede como vos querés
    const transformed = products.map(p => ({
      permalink: p.permalink,
      name: p.name,
      description: p.description,
      page_title: p.page_title,
      meta_description: p.meta_description,
      width: p.width || 0.0,
      length: p.length || 0.0,
      height: p.height || 0.0,
      brand: p.brand || "",
      barcode: p.barcode || "",
      categories: p.categories ? p.categories.map(c => c.name).join(" / ") : "",
      images: p.images && p.images.length > 0 ? p.images[0].url : "",
      digital: p.digital ? "YES" : "NO",
      featured: p.featured ? "YES" : "NO",
      status: p.status,
      sku: p.sku,
      weight: p.weight || 0.0,
      cost_per_item: p.cost_per_item || 0,
      compare_at_price: p.compare_at_price || "",
      stock: p.stock || 0,
      stock_unlimited: p.stock_unlimited ? "YES" : "NO",
      stock_notification: p.stock_notification ? "YES" : "NO",
      stock_threshold: p.stock_threshold || 0,
      price: p.price || 0.0,
      minimum_quantity: p.minimum_quantity || "",
      maximum_quantity: p.maximum_quantity || "",
      "fields[0].label": p.fields?.[0]?.label || "",
      "fields[0].value": p.fields?.[0]?.value || "",
      "fields[0].type": p.fields?.[0]?.type || "",
      google_product_category: p.google_product_category || ""
    }));

    const parser = new Parser({ fields });
    const csv = parser.parse(transformed);

    res.header("Content-Type", "text/csv");
    res.attachment("Productos.csv");
    return res.send(csv);

  } catch (err) {
    console.error("🔥 Error interno:", err);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
