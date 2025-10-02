const express = require("express");
const axios = require("axios");
const { Parser } = require("json2csv");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Endpoint para exportar CSV usando credenciales temporales del usuario
app.post("/export", async (req, res) => {
  const { login, token } = req.body;

  if (!login || !token) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  let page = 1;
  let allProducts = [];

  try {
    while (true) {
      const url = `https://${login}:${token}@api.jumpseller.com/v1/products.json?page=${page}&limit=200`;
      const response = await axios.get(url);

      if (!response.data || response.data.length === 0) break;

      allProducts = allProducts.concat(response.data.map(p => p.product));
      page++;
    }

    if (allProducts.length === 0) {
      return res.status(404).json({ error: "No se encontraron productos" });
    }

    const fields = [
      "permalink", "name", "description", "page_title", "meta_description",
      "width", "length", "height", "brand", "barcode",
      "categories", "images", "digital", "featured", "status",
      "sku", "weight", "cost_per_item", "compare_at_price",
      "stock", "stock_unlimited", "stock_notification", "stock_threshold",
      "price", "minimum_quantity", "maximum_quantity",
      "fields[0].label", "fields[0].value", "fields[0].type",
      "google_product_category"
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(allProducts);

    // Enviar CSV al navegador sin guardar credenciales
    res.header("Content-Type", "text/csv");
    res.attachment("Productos.csv");
    return res.send(csv);

  } catch (error) {
    console.error("Error al exportar:", error.message);
    return res.status(500).json({ error: "Error al exportar productos" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
