// server.cjs
const express = require("express");
const fs = require("fs");
const { createObjectCsvWriter } = require("csv-writer");

// ✅ Solución: importar fetch para entornos CommonJS
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(express.static("public"));

// 📤 Endpoint principal para exportar productos
app.post("/exportar", async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;
    console.log("🔑 Credenciales recibidas:", apiKey, apiSecret);

    // Llamada a la API de Jumpseller
    const response = await fetch("https://api.jumpseller.com/v1/products.json", {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
    });

    if (!response.ok) throw new Error("Error al conectar con Jumpseller");

    const data = await response.json();

    // 🧾 Campos específicos del CSV (ajustá acá si querés otros)
    const productos = data.products.map((p) => ({
      id: p.id,
      nombre: p.name,
      precio: p.price,
      stock: p.stock,
      sku: p.sku,
      categoria: p.category ? p.category.name : "",
    }));

    // ✍️ Definición del CSV
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

    await csvWriter.writeRecords(productos);

    console.log(`✅ Archivo CSV generado con ${productos.length} productos`);
    res.download("productos.csv");
  } catch (err) {
    console.error("🔥 Error interno:", err);
    res.status(500).json({ error: "Error interno en el servidor", message: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));
