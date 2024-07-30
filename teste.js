const fs = require("fs");
const path = require("path");

const cartPath = path.join(__dirname, "cart.json");

const testData = [
  {
    id: 1,
    nome: "Sushi Especial",
    preco: 29.99,
    quantidadeCarrinho: 2,
    observacoes: "Sem cebola",
  },
];

fs.writeFileSync(cartPath, JSON.stringify(testData, null, 2), "utf-8");
console.log("Dados escritos com sucesso");