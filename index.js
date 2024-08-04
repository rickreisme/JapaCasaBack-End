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

    const valorTotal = carrinho.reduce((total, item) => total + item.preco, 0);

    const valorTotalFrete = valorTotal + 5;

    res.json({ carrinho, valorTotal, valorTotalFrete });
  } catch (err) {
    console.error("Erro ao ler o arquivo cart.json", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/carrinho", (req, res) => {
  try {
    const { id, nome, preco, quantidadeCarrinho, observacoes } = req.body;

    if (
      !id ||
      !nome ||
      !preco ||
      quantidadeCarrinho == null ||
      quantidadeCarrinho <= 0
    ) {
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
      cartData.carrinho[itemIndex].preco += preco;
      cartData.carrinho[itemIndex].observacoes = observacoes;
    } else {
      cartData.carrinho.push({
        id,
        nome,
        preco,
        quantidadeCarrinho,
        observacoes,
      });
      console.log(observacoes);
    }

    const valorTotal = cartData.carrinho.reduce(
      (total, item) => total + item.preco,
      0
    );

    const valorTotalFrete = valorTotal + 5;

    fs.writeFileSync(
      cartPath,
      JSON.stringify(
        { carrinho: cartData.carrinho, valorTotal, valorTotalFrete },
        null,
        2
      )
    );
    console.log("Produto adicionado ao carrinho:", cartData);

    res
      .status(200)
      .json({ message: "Produto adicionado ao carrinho com sucesso!" });
  } catch (err) {
    console.error("Erro ao adicionar produto ao carrinho", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.put("/carrinho/:id", (req, res) => {
  const { id } = req.params;
  const { quantidadeCarrinho, preco } = req.body;

  if (
    !id ||
    quantidadeCarrinho == null ||
    quantidadeCarrinho <= 0 ||
    preco == null
  ) {
    return res.status(400).json({ error: "Dados do produto inválidos" });
  }

  try {
    let cartData = { carrinho: [] };
    if (fs.existsSync(cartPath)) {
      const cartContent = fs.readFileSync(cartPath, "utf-8");
      cartData = JSON.parse(cartContent);
    }

    const itemIndex = cartData.carrinho.findIndex(
      (item) => item.id === Number(id)
    );
    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ error: "Produto não encontrado no carrinho" });
    }

    cartData.carrinho[itemIndex].quantidadeCarrinho = quantidadeCarrinho;
    cartData.carrinho[itemIndex].preco = preco;

    const valorTotal = cartData.carrinho.reduce(
      (total, item) => total + item.preco,
      0
    );

    const valorTotalFrete = valorTotal + 5;

    fs.writeFileSync(
      cartPath,
      JSON.stringify(
        { carrinho: cartData.carrinho, valorTotal, valorTotalFrete },
        null,
        2
      )
    );
    console.log(`Quantidade do produto com ID ${id} atualizada`);

    res
      .status(200)
      .json({ message: "Quantidade e preço atualizados com sucesso!" });
  } catch (err) {
    console.error("Erro ao atualizar quantidade do produto", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.delete("/carrinho/:id", (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "ID do produto não fornecido" });
  }

  try {
    let cartData = { carrinho: [] };
    if (fs.existsSync(cartPath)) {
      const cartContent = fs.readFileSync(cartPath, "utf-8");
      cartData = JSON.parse(cartContent);
    }

    const itemIndex = cartData.carrinho.findIndex(
      (item) => item.id === Number(id)
    );
    if (itemIndex === -1) {
      return res
        .status(404)
        .JSON({ error: "Produto não encontrado no carrinho" });
    }

    cartData.carrinho.splice(itemIndex, 1);

    const valorTotal = cartData.carrinho.reduce(
      (total, item) => total + item.preco,
      0
    );

    const valorTotalFrete = valorTotal + 5;

    fs.writeFileSync(
      cartPath,
      JSON.stringify(
        { carrinho: cartData.carrinho, valorTotal, valorTotalFrete },
        null,
        2
      )
    );
    console.log(`Produto com ID ${id} removido do carrinho`);

    res
      .status(200)
      .json({ message: "Produto removido do carrinho com sucesso!" });
  } catch (err) {
    console.error("Erro ao remover produto do carrinho", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
