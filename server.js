import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Parser } from "json2csv";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Configuración para poder usar __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, "public")));

// Ruta raíz -> devolver index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Ruta para exportar productos
app.post("/export", async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;

    const response = await fetch("https://api.jumpseller.com/v1/products.json", {
      headers: {
        Authorization: "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();

    // Transformar productos al formato CSV con los campos que definimos
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

    const opts = { fields };
    const parser = new Parser(opts);

    // Mapear productos para dar formato correcto a ciertos campos
    const productos = data.map((p) => ({
      permalink: p.permalink,
      name: p.name,
      description: p.description,
      page_title: p.page_title,
      meta_description: p.meta_description,
      width: p.width || 0,
      length: p.length || 0,
      height: p.height || 0,
      brand: p.brand,
      barcode: p.barcode,
      categories: p.categories ? p.categories.map(c => c.name).join(" / ") : "",
      images: p.images && p.images[0] ? p.images[0].url : "",
      digital: p.digital ? "YES" : "NO",
      featured: p.featured ? "YES" : "NO",
      status: p.status,
      sku: p.sku,
      weight: p.weight || 0,
      cost_per_item: p.cost_per_item || "",
      compare_at_price: p.compare_at_price || "",
      stock: p.stock,
      stock_unlimited: p.stock_unlimited ? "YES" : "NO",
      stock_notification: p.stock_notification ? "YES" : "NO",
      stock_threshold: p.stock_threshold || 0,
      price: p.price,
      minimum_quantity: p.minimum_quantity || "",
      maximum_quantity: p.maximum_quantity || "",
      "fields[0].label": p.fields && p.fields[0] ? p.fields[0].label : "",
      "fields[0].value": p.fields && p.fields[0] ? p.fields[0].value : "",
      "fields[0].type": p.fields && p.fields[0] ? p.fields[0].type : "",
      google_product_category: p.google_product_category || ""
    }));

    const csv = parser.parse(productos);

    res.header("Content-Type", "text/csv");
    res.attachment("productos.csv");
    res.send(csv);
  } catch (error) {
    console.error("Error en exportación:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
