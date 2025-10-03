const express = require("express");
const fetch = require("node-fetch");
const { Parser } = require("json2csv");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/export", async (req, res) => {
  const { login, token, store } = req.body;
  if (!login || !token || !store) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  let page = 1;
  const limit = 200;
  let allProducts = [];

  try {
    while (true) {
      const url = `https://api.jumpseller.com/v1/products.json?page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        headers: {
          Authorization:
            "Basic " + Buffer.from(`${login}:${token}`).toString("base64"),
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error API (${response.status}): ${text}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) break;

      allProducts = allProducts.concat(data);
      if (data.length < limit) break;
      page++;
    }

    // Mapeo de productos con campos limpios
    const products = allProducts.map((p) => ({
      permalink: p.product.permalink || "",
      name: p.product.name || "",
      description: p.product.description || "",
      page_title: p.product.page_title || "",
      meta_description: p.product.meta_description || "",
      width: p.product.width || 0,
      length: p.product.length || 0,
      height: p.product.height || 0,
      brand: p.product.brand || "",
      barcode: p.product.barcode || "",
      categories: p.product.categories
        ? p.product.categories.map((c) => c.name).join(" / ")
        : "",
      images: p.product.images
        ? p.product.images.map((img) => img.url).join(", ")
        : "",
      digital: p.product.digital ? "YES" : "NO",
      featured: p.product.featured ? "YES" : "NO",
      status: p.product.status || "",
      sku: p.product.sku || "",
      weight: p.product.weight || 0,
      cost_per_item: p.product.cost_per_item || "",
      compare_at_price: p.product.compare_at_price || "",
      stock: p.product.stock || 0,
      stock_unlimited: p.product.stock_unlimited ? "YES" : "NO",
      stock_notification: p.product.stock_notification ? "YES" : "NO",
      stock_threshold: p.product.stock_threshold || 0,
      price: p.product.price || 0,
      minimum_quantity: p.product.minimum_quantity || "",
      maximum_quantity: p.product.maximum_quantity || "",
      fields_label:
        p.product.fields && p.product.fields[0]
          ? p.product.fields[0].label
          : "",
      fields_value:
        p.product.fields && p.product.fields[0]
          ? p.product.fields[0].value
          : "",
      fields_type:
        p.product.fields && p.product.fields[0]
          ? p.product.fields[0].type
          : "",
      google_product_category: p.product.google_product_category || "",
    }));

    const parser = new Parser();
    const csv = parser.parse(products);

    res.header("Content-Type", "text/csv");
    res.attachment("productos.csv");
    return res.send(csv);
  } catch (err) {
    console.error("❌ Error exportando:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
