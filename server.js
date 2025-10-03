import express from "express";
import fetch from "node-fetch";
import { createObjectCsvStringifier } from "csv-writer";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.json());

// Ruta de prueba
app.get("/ping", (req, res) => {
  res.send("✅ Servidor funcionando correctamente.");
});

// Exportar productos
app.post("/export", async (req, res) => {
  const { login, apiKey } = req.body;

  if (!login || !apiKey) {
    return res.status(400).send("Faltan credenciales (login o API key).");
  }

  try {
    const response = await fetch("https://api.jumpseller.com/v1/products.json", {
      headers: {
        Authorization: "Basic " + Buffer.from(`${login}:${apiKey}`).toString("base64")
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send("Error en API Jumpseller: " + errorText);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(500).send("Respuesta inesperada de Jumpseller.");
    }

    // Armar CSV
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: "id", title: "ID" },
        { id: "name", title: "Nombre" },
        { id: "price", title: "Precio" },
        { id: "stock", title: "Stock" }
      ]
    });

    const records = data.map(prod => ({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      stock: prod.stock
    }));

    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=productos.csv");
    res.send(csv);

  } catch (error) {
    console.error("❌ Error al exportar:", error);
    res.status(500).send("Error interno: " + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
