const express = require("express");
const { exec } = require("child_process");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "db.json");

app.get("/produtos", (req, res) => {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    const produtos = JSON.parse(data).produtos;
    res.json(produtos);
  } catch (err) {
    console.error("Erro ao ler o arquivo db.json", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});