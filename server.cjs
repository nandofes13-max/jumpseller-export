// server.cjs
const express = require("express");
const { createObjectCsvWriter } = require("csv-writer");
const path = require("path");

// ✅ Importar fetch compatible con CommonJS
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/exportar", async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    console.log("🔑 Credenciales recibidas:", apiKey, apiSecret);

    // Llamada a la API Jumpseller
    const response = await fetch("https://api.jumpseller.com/v1/products.json", {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      const txt = await response.text();
      console.error("❌ Error API:", txt);
      return res.status(401).json({ error: "Credenciales inválidas", details: txt });
    }

    const data = await response.json();

    // 🔧 Asegurarse de acceder correctamente a los productos
    const productos = Array.isArray(data.products) ? data.products : data;

    // Campos personalizados del CSV
    const registros = productos.map(p => ({
      id: p.id,
      nombre: p.name,
      precio: p.price || 0,
      stock: p.stock || 0,
      sku: p.sku || "",
      categoria: p.categories ? p.categories.map(c => c.name).join(" / ") : "",
    }));

    const csvWriter = createObjectCsvWriter({
      path: "productos.csv",
      header: [
        { id: "id", title: "ID" },
        { id: "nombre", title: "Nombre" },
        { id: "precio", title: "Precio" },
        { id: "stock", title: "Stock" },
        { id: "sku", title: "SKU" },
        { id: "categoria", title: "Categoría" },
      ],
    });

    await csvWriter.writeRecords(registros);
    console.log(`✅ CSV generado con ${registros.length} productos`);

    res.download("productos.csv");

  } catch (err) {
    console.error("🔥 Error interno:", err);
    res.status(500).json({ error: "Error interno en el servidor", details: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
