const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("database.db");

// Mensagens de sucesso e erro
const SUCCESS_MESSAGE = "Operação realizada com sucesso";
const ERROR_MESSAGE = "Erro ao executar operação";

// Rota para fazer login
router.post("/logon", (req, res, next) => { // Rota corrigida para /logon
    const { email, senha } = req.body;

    db.get("SELECT * FROM usuario WHERE email = ? AND senha = ?", [email, senha], (error, row) => {
        if (error) {
            return res.status(500).send({ error: error.message });
        }

        if (row) {
            res.status(200).send({ mensagem: "Login bem-sucedido" });
        } else {
            res.status(401).send({ error: "Credenciais inválidas" });
        }
    });
});

// Restante do seu código de roteamento...


// Rota para obter um usuário pelo ID
router.get("/:id", (req, res, next) => {
    const { id } = req.params;

    db.get("SELECT * FROM usuario WHERE id=?", [id], (error, rows) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }

        res.status(200).send({
            mensagem: "Aqui está o usuário solicitado",
            usuario: rows
        });
    });
});


router.post("/login", (req, res, next) => {
    const {email,senha} =req.body;

    db.all("SELECT id, nome, email FROM usuario WHERE email=? and senha=? ",[email,senha], [id], (error, rows) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }

        if(rows.length>0){
            res.status(200).send({
                mensagem: "Dados de login corretos!",
                usuario: rows
            });
        }
    });
});

// Rota para listar todos os usuários
router.get("/", (req, res, next) => {
    db.all("SELECT * FROM usuario", (error, rows) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }
        res.status(200).send({
            mensagem: "Aqui estão todos os usuários",
            usuarios: rows
        });
    });
});

// Rota para listar apenas nomes e emails dos usuários
router.get("/nomes", (req, res, next) => {
    db.all("SELECT nome, email FROM usuario", (error, rows) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }
        res.status(200).send(rows);
    });
});

// Rota para criar um novo usuário
router.post("/", (req, res, next) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).send({ error: "Parâmetros inválidos" });
    }

    db.run("INSERT INTO usuario(nome, email, senha) VALUES (?, ?, ?)", [nome, email, senha], (error) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }
        res.status(200).send({ mensagem: SUCCESS_MESSAGE });
    });
});

// Rota para atualizar um usuário existente
router.put("/", (req, res, next) => {
    const { id, nome, email, senha } = req.body;

    if (!id || !nome || !email || !senha) {
        return res.status(400).send({ error: "Parâmetros inválidos" });
    }

    db.run("UPDATE usuario SET nome=?, email=?, senha=? WHERE id=?", [nome, email, senha, id], (error) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }
        res.status(200).send({ mensagem: SUCCESS_MESSAGE });
    });
});

// Rota para excluir um usuário pelo ID
router.delete("/:id", (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send({ error: "Parâmetros inválidos" });
    }

    db.run("DELETE FROM usuario WHERE id=?", id, (error) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }
        res.status(200).send({ mensagem: SUCCESS_MESSAGE });
    });
});

module.exports = router;
