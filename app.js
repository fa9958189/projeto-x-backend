// app.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const rotaUsuarios = require('./routes/rotasUsuario');


const app = express();

// Middlewares
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

// Rotas
app.use('/usuario', rotaUsuarios);

// Middleware para lidar com rotas inexistentes
app.use((req, res, next) => {
    const erro = new Error('Não encontrado');
    erro.status = 404;
    next(erro);
});

// Middleware para lidar com erros
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    return res.json({
        erro: {
            mensagem: error.message
        }
    });
});


// Configuração do servidor


module.exports = app;
