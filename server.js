import express from "express";
import fetch from "node-fetch";
import { parse } from "json2csv";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/export-products", async (req, res) => {
  const { email, token, store } = req.body;

  if (!email || !token || !store) {
    return res.status(400).json({ error: "Faltan credenciales" });
  }

  try {
    const response = await fetch(`https://api.jumpseller.com/v1/products.json`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error API Jumpseller: ${response.statusText}`);
    }

    const data = await response.json();
    const products = data.map((p) => mapProduct(p.product));

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
      "google_product_category",
    ];

    const csv = parse(products, { fields });

    res.header("Content-Type", "text/csv");
    res.attachment("products.csv");
    return res.send(csv);
  } catch (error) {
    console.error("Error al exportar productos:", error);
    res.status(500).json({ error: "Error al exportar productos", detail: error.message });
  }
});

function mapProduct(product) {
  return {
    permalink: product.permalink,
    name: product.name,
    description: product.description,
    page_title: product.page_title,
    meta_description: product.meta_description,
    width: "0.0",
    length: "0.0",
    height: "0.0",
    brand: product.brand,
    barcode: product.barcode,
    categories: product.categories
      ? product.categories.map((c, i) => (i === 0 ? c.name : `${product.categories[0].name} / ${c.name}`)).join(",")
      : "",
    images: product.images?.length ? product.images[0].url : "",
    digital: product.digital ? "YES" : "NO",
    featured: product.featured ? "YES" : "NO",
    status: product.status,
    sku: product.sku,
    weight: product.weight,
    cost_per_item: product.cost_per_item ? Number(product.cost_per_item).toFixed(1) : "",
    compare_at_price: product.compare_at_price || "",
    stock: product.stock || 0,
    stock_unlimited: product.stock_unlimited ? "YES" : "NO",
    stock_notification: product.stock_notification ? "YES" : "NO",
    stock_threshold: product.stock_threshold || 0,
    price: product.price ? Number(product.price).toFixed(1) : "",
    minimum_quantity: "",
    maximum_quantity: "",
    "fields[0].label": "Fecha",
    "fields[0].value": new Date().toLocaleDateString("es-AR"),
    "fields[0].type": "input",
    google_product_category: "",
  };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
