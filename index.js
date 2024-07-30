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
const cartPath = path.join(__dirname, "cart.json");

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

app.get("/carrinho", (req, res) => {
  try {
    const data = fs.readFileSync(cartPath, "utf-8");
    const carrinho = JSON.parse(data).carrinho;
    res.json(carrinho);
  } catch (err) {
    console.error("Erro ao ler o arquivo cart.json", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/carrinho", (req, res) => {
  try {
    const { id, nome, preco, quantidadeCarrinho, observacoes } = req.body;

    if (!id || !nome || !preco || quantidadeCarrinho == null || quantidadeCarrinho <= 0) {
      return res.status(400).json({ error: "Dados do produto inválidos" });
    }

    let cartData = { carrinho: [] };
    if (fs.existsSync(cartPath)) {
      const cartContent = fs.readFileSync(cartPath, "utf-8");
      cartData = JSON.parse(cartContent);
    }

    const itemIndex = cartData.carrinho.findIndex((item) => item.id === id);
    if (itemIndex > -1) {
      cartData.carrinho[itemIndex].quantidadeCarrinho += quantidadeCarrinho;
      cartData.carrinho[itemIndex].observacoes = observacoes;
    } else {
      cartData.carrinho.push({
        id,
        nome,
        preco,
        quantidadeCarrinho,
        observacoes,
      });
    }

    fs.writeFileSync(cartPath, JSON.stringify(cartData, null, 2));
    console.log("Produto adicionado ao carrinho:", cartData);

    res
      .status(200)
      .json({ message: "Produto adicionado ao carrinho com sucesso!" });
  } catch (err) {
    console.error("Erro ao adicionar produto ao carrinho", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
