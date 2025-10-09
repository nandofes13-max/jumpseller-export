const express = require("express");
const fetch = require("node-fetch");
const { Parser } = require("json2csv");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

app.post("/export", async (req, res) => {
  const { login, token } = req.body;

  if (!login || !token) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  try {
    let allProducts = [];
    let page = 1;
    let morePages = true;

    while (morePages) {
      const url = `https://api.jumpseller.com/v1/products.json?page=${page}&limit=200`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString("base64")}`
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Error al llamar API" });
      }

      const data = await response.json();
      if (data.length === 0) {
        morePages = false;
        break;
      }

      allProducts = allProducts.concat(data.map(p => p.product));
      page++;
    }

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
  categories: p.categories
    .map((c, i) => p.categories.slice(0, i + 1).map(x => x.name).join(" / "))
    .join(","),
  images: p.images.map(i => i.url).join(", "),
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
  custom_field_label: (p.fields[0] && p.fields[0].label) || "",
  custom_field_value: (p.fields[0] && p.fields[0].value) || "",
  custom_field_type: (p.fields[0] && p.fields[0].type) || "",
  google_product_category: p.google_product_category || ""
}));

// 🔠 Reemplazar guiones bajos y ajustar títulos de columnas antes de exportar
const formatHeader = header => {
  if (header === "sku") return "SKU"; // caso especial
  return header
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Si usás json2csv u otra librería similar:
const { Parser } = require("json2csv");
const parser = new Parser({
  fields: Object.keys(mappedProducts[0]).map(h => ({
    label: formatHeader(h),
    value: h
  }))
});

const csv = parser.parse(mappedProducts);


    // ✅ Generar encabezados con mayúscula inicial
    let fields = [];
    if (mappedProducts.length > 0) {
      fields = Object.keys(mappedProducts[0]).map(key => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: key
      }));
    }

    const parser = new Parser({ fields });
    const csv = parser.parse(mappedProducts);

    res.header("Content-Type", "text/csv");
    res.attachment("Productos.csv");
    res.send(csv);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
