const express = require("express");
const axios = require("axios");
const { Parser } = require("json2csv");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Guardar credenciales en memoria (temporal)
let credentials = { store: "", apiKey: "", apiPass: "" };

app.post("/set-credentials", (req, res) => {
  const { store, apiKey, apiPass } = req.body;
  if (!store || !apiKey || !apiPass) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }
  credentials = { store, apiKey, apiPass };
  res.json({ message: "Credenciales guardadas con éxito" });
});

app.get("/export-products", async (req, res) => {
  try {
    let page = 1;
    let allProducts = [];
    let hasMore = true;

    while (hasMore) {
      const url = `https://${credentials.apiKey}:${credentials.apiPass}@${credentials.store}.jumpseller.com/api/v1/products.json?page=${page}&limit=200`;
      const response = await axios.get(url);
      const products = response.data;

      if (!products || products.length === 0) {
        hasMore = false;
      } else {
        allProducts = allProducts.concat(products);
        page++;
      }
    }

    const fields = ["permalink","name","description","meta_title","meta_description",
      "width","length","height","brand","barcode","categories","images","digital",
      "featured","status","sku","weight","cost","compare_at_price","stock",
      "stock_unlimited","stock_notification","stock_threshold","price",
      "minimum_quantity","maximum_quantity","custom_field_1_label",
      "custom_field_1_value","custom_field_1_type","google_product_category"];
    const parser = new Parser({ fields });
    const csv = parser.parse(allProducts);

    res.header("Content-Type", "text/csv");
    res.attachment("Productos.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error exportando productos" });
  }
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
