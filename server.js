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
  id: p.id || 0,
  permalink: p.permalink || "",
  name: p.name || "",
  page_title: p.page_title || "",
  description: p.description || "",
  type: p.type || "",
  days_to_expire: p.days_to_expire || 365,
  price: p.price || 0.0,
  discount: p.discount || 0.0,
  weight: p.weight || 0.0,
  length: p.length || 0.0,
  width: p.width || 0.0,
  height: p.height || 0.0,
  diameter: p.diameter || 0.0,
  cost_per_item: p.cost_per_item || 0.0,
  compare_at_price: p.compare_at_price || 0.0,
  stock: p.stock || 0,
  stock_unlimited: p.stock_unlimited || false,
  stock_threshold: p.stock_threshold || 0,
  stock_notification: p.stock_notification || false,
  back_in_stock_enabled: p.back_in_stock_enabled || false,
  sku: p.sku || "",
  brand: p.brand || "",
  barcode: p.barcode || "",
  google_product_category: p.google_product_category || "",
  featured: p.featured || false,
  reviews_enabled: p.reviews_enabled || false,
  status: p.status || "available",
  created_at: p.created_at || "",
  updated_at: p.updated_at || "",
  package_format: p.package_format || "",
  categories: p.categories || [],
  images: p.images || [],
  variants: p.variants || [],
  digital_products: p.digital_products || []
}));


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
