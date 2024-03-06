// app.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('database.db');

app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

// Rota para fazer login
app.post('/usuario/login', (req, res) => {
    const { email, senha } = req.body;

    db.get("SELECT * FROM usuario WHERE email = ?", [email], (error, usuario) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }

        if (!usuario) {
            return res.status(401).send({
                mensagem: "Usuário não encontrado."
            });
        }

        bcrypt.compare(senha, usuario.senha, (bcryptError, result) => {
            if (bcryptError) {
                return res.status(500).send({
                    error: bcryptError.message
                });
            }

            if (!result) {
                return res.status(401).send({
                    mensagem: "Senha incorreta."
                });
            }

            // Gerar token JWT
            const token = jwt.sign({ id: usuario.id, email: usuario.email }, 'secreto', { expiresIn: '1h' });

            res.status(200).send({
                mensagem: "Login bem sucedido.",
                token: token
            });
        });
    });
});

// Rota para cadastrar um novo usuário
app.post('/usuario/cadastro', (req, res) => {
    const { nome, email, senha } = req.body;

    // Verificar se o e-mail já está em uso
    db.get("SELECT * FROM usuario WHERE email=?", [email], (error, existingUser) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }

        if (existingUser) {
            return res.status(400).send({
                mensagem: "E-mail já está em uso."
            });
        }

        // Hash da senha antes de salvar no banco de dados
        bcrypt.hash(senha, 10, (hashError, hashedPassword) => {
            if (hashError) {
                return res.status(500).send({
                    error: hashError.message
                });
            }

            // Inserir novo usuário no banco de dados
            db.run("INSERT INTO usuario(nome, email, senha) VALUES (?, ?, ?)", [nome, email, hashedPassword], (insertError) => {
                if (insertError) {
                    return res.status(500).send({
                        error: insertError.message
                    });
                }
                res.status(201).send({ mensagem: "Cadastro criado com sucesso!" });
            });
        });
    });
});

// Rota para outras operações CRUD...

app.listen(5000, () => {
    console.log('Servidor está rodando na porta 5000');
});
