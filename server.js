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
        headers: { Authorization: `Basic ${Buffer.from(`${login}:${token}`).toString("base64")}` }
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
      width: p.width || 0,
      length: p.length || 0,
      height: p.height || 0,
      brand: p.brand || "",
      barcode: p.barcode || "",
      categories: p.categories.map(c => c.name).join(", "),
      images: p.images.map(i => i.url).join(", "),
      digital: p.digital || false,
      featured: p.featured || false,
      status: p.status || "",
      sku: p.sku || "",
      weight: p.weight || 0,
      cost_per_item: p.cost_per_item || "",
      compare_at_price: p.compare_at_price || "",
      stock: p.stock || 0,
      stock_unlimited: p.stock_unlimited || false,
      stock_notification: p.stock_notification || false,
      stock_threshold: p.stock_threshold || 0,
      price: p.price || 0,
      minimum_quantity: p.minimum_quantity || "",
      maximum_quantity: p.maximum_quantity || "",
      custom_field_label: (p.fields[0] && p.fields[0].label) || "",
      custom_field_value: (p.fields[0] && p.fields[0].value) || "",
      custom_field_type: (p.fields[0] && p.fields[0].type) || "",
      google_product_category: p.google_product_category || ""
    }));

    const parser = new Parser();
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
