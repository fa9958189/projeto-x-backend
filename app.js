const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
app.use(cors());
const bodyParser = require('body-parser');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use('/uploads', express.static('./uploads'));
app.use('/assets', express.static('./assets'));


// Rotas
const rotaUsuario = require("./routes/rotasUsuario");

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
app.use("/entrada", rotaEntrada); 
app.use("/saida", rotaSaida); 
app.use("/estoque", rotaEstoque); 


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
