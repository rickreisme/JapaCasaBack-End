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

const loadCartData = (sessionId) => {
  if (fs.existsSync(cartPath)) {
    const cartContent = fs.readFileSync(cartPath, "utf-8");
    const cartData = JSON.parse(cartContent);
    return cartData[sessionId] || { carrinho: [] };
  }
  return { carrinho: [] };
};

const saveCartData = (sessionId, cartData) => {
  let allCartData = {};

  if (fs.existsSync(cartPath)) {
    const cartContent = fs.readFileSync(cartPath, "utf-8");
    allCartData = JSON.parse(cartContent);
  }
  allCartData[sessionId] = cartData;
  fs.writeFileSync(cartPath, JSON.stringify(allCartData, null, 2));
};

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
    const sessionId = req.headers["session-id"];
    const cartData = loadCartData(sessionId);

    const valorTotal = cartData.carrinho.reduce(
      (total, item) => total + item.preco,
      0
    );
    const valorTotalFrete = valorTotal + 5;

    res.json({ carrinho: cartData.carrinho, valorTotal, valorTotalFrete });
  } catch (err) {
    console.error("Erro ao ler o arquivo cart.json", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.post("/carrinho", (req, res) => {
  const sessionId = req.headers["session-id"];

  try {
    const { id, nome, imagem, preco, quantidadeCarrinho, observacoes } =
      req.body;

    if (
      !id ||
      !nome ||
      !imagem ||
      !preco ||
      quantidadeCarrinho == null ||
      quantidadeCarrinho <= 0
    ) {
      return res.status(400).json({ error: "Dados do produto inválidos" });
    }

    const cartData = loadCartData(sessionId);

    const itemIndex = cartData.carrinho.findIndex((item) => item.id === id);
    if (itemIndex > -1) {
      cartData.carrinho[itemIndex].quantidadeCarrinho += quantidadeCarrinho;
      cartData.carrinho[itemIndex].preco += preco;
      cartData.carrinho[itemIndex].observacoes = observacoes;
    } else {
      cartData.carrinho.push({
        id,
        nome,
        imagem,
        preco,
        quantidadeCarrinho,
        observacoes,
      });
    }

    const valorTotal = cartData.carrinho.reduce(
      (total, item) => total + item.preco,
      0
    );
    const valorTotalFrete = valorTotal + 5;

    saveCartData(sessionId, {
      carrinho: cartData.carrinho,
      valorTotal,
      valorTotalFrete,
    });
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
  const sessionId = req.headers["session-id"];
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
    const cartData = loadCartData(sessionId);

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

    saveCartData(sessionId, {
      carrinho: cartData.carrinho,
      valorTotal,
      valorTotalFrete,
    });

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
  const sessionId = req.headers["session-id"];

  try {
    const cartData = loadCartData(sessionId);

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

    saveCartData(sessionId, {
      carrinho: cartData.carrinho,
      valorTotal,
      valorTotalFrete,
    });

    res
      .status(200)
      .json({ message: "Produto removido do carrinho com sucesso!" });
  } catch (err) {
    console.error("Erro ao remover produto do carrinho", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.delete("/limpar", (req, res) => {
  const sessionId = req.headers["session-id"];

  try {
    let allCartData = {};

    if (fs.existsSync(cartPath)) {
      const cartContent = fs.readFileSync(cartPath, "utf-8");
      allCartData = JSON.parse(cartContent);
    }

    if (!allCartData[sessionId]) {
      return res.status(404).json({ error: "Carrinho não encontrado" });
    }

    allCartData[sessionId] = { carrinho: [] };

    fs.writeFileSync(cartPath, JSON.stringify(allCartData, null, 2));

    res.status(200).json({ message: "Carrinho limpo com sucesso!" });
  } catch (err) {
    console.error("Erro ao limpar o carrinho", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
