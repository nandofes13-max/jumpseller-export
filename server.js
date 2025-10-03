import express from "express";
import fetch from "node-fetch";
import { Parser } from "json2csv";

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/export", async (req, res) => {
  const { email, apiKey } = req.body;

  if (!email || !apiKey) {
    return res.status(400).json({ message: "Faltan credenciales" });
  }

  try {
    let allProducts = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://api.jumpseller.com/v1/products.json?page=${page}&limit=200`,
        {
          headers: {
            Authorization: "Basic " + Buffer.from(`${email}:${apiKey}`).toString("base64"),
          },
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error API Jumpseller (HTTP ${response.status}): ${errText}`);
      }

      const data = await response.json();
      if (data.length === 0) {
        hasMore = false;
      } else {
        allProducts = allProducts.concat(data);
        page++;
      }
    }

    // ✅ Transformación de productos
    const products = allProducts.map((p) => {
      return {
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
        categories: (p.product.categories || []).map((c) => c.name).join(" / "),
        images: (p.product.images || []).map((img) => img.url).join(","),
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
        custom_field_1_label: p.product.fields?.[0]?.label || "",
        custom_field_1_value: p.product.fields?.[0]?.value || "",
        custom_field_1_type: p.product.fields?.[0]?.type || "",
        google_product_category: p.product.google_product_category || "",
      };
    });

    const parser = new Parser();
    const csv = parser.parse(products);

    res.header("Content-Type", "text/csv");
    res.attachment("products.csv");
    return res.send(csv);
  } catch (error) {
    console.error("Error en la API:", error.message);
    return res.status(500).json({
      message: "Error al exportar productos",
      detail: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
