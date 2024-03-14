const express = require('express');
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require('body-parser');

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));

// Rotas
const rotaUsuario = require("./routes/rotasUsuario");
const rotaProduto = require("./routes/rotasProduto");
const rotaEntrada= require("./routes/rotasEntrada"); // Importe as rotas de entrada de produto

// Configuração de headers para CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).send({});
    }
    next();
});

// Rotas de Usuário, Produto e Entrada de Produto
app.use("/usuario", rotaUsuario);
app.use("/produto", rotaProduto);
app.use("/entrada", rotaEntrada); // Adicione as rotas de entrada de produto

// Tratamento de erros para rotas não encontradas
app.use((req, res, next) => {
    const erro = new Error("Não encontrado!");
    erro.status = 404;
    next(erro);
});

// Tratamento de erros globais
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    return res.json({
        erro: {
            mensagem: error.message
        }
    });
});

module.exports = app;
