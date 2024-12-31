const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conexão com o banco de dados SQLite estabelecida.");
    }
});

// Endpoint de login
router.post("/login", (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).send({ mensagem: "Email e senha são obrigatórios." });
    }

    db.get("SELECT * FROM usuario WHERE email = ?", [email], (err, usuario) => {
        if (err) {
            console.error("Erro ao buscar usuário no banco de dados:", err.message);
            return res.status(500).send({ error: "Erro interno do servidor." });
        }

        if (!usuario) {
            console.log("Usuário não encontrado.");
            return res.status(401).send({ mensagem: "Usuário ou senha inválidos." });
        }

        bcrypt.compare(senha, usuario.senha, (bcryptErr, result) => {
            if (bcryptErr) {
                console.error("Erro ao comparar senhas:", bcryptErr.message);
                return res.status(500).send({ error: "Erro interno do servidor." });
            }

            if (!result) {
                console.log("Senha incorreta.");
                return res.status(401).send({ mensagem: "Usuário ou senha inválidos." });
            }

            console.log("Login bem-sucedido.");
            const token = jwt.sign(
                { id: usuario.id, email: usuario.email },
                'secreto',
                { expiresIn: '1h' }
            );

            res.status(200).send({
                mensagem: "Login bem-sucedido.",
                token: token
            });
        });
    });
});

// Endpoint para obter um usuário por ID
router.get("/:id", (req, res) => {
    const { id } = req.params;

    db.get("SELECT * FROM usuario WHERE id = ?", [id], (err, usuario) => {
        if (err) {
            console.error("Erro ao buscar usuário por ID:", err.message);
            return res.status(500).send({ error: "Erro interno do servidor." });
        }

        if (!usuario) {
            return res.status(404).send({ mensagem: "Usuário não encontrado." });
        }

        res.status(200).send({
            mensagem: "Usuário encontrado.",
            usuario: usuario
        });
    });
});

// Endpoint para listar todos os usuários
router.get("/", (req, res) => {
    db.all("SELECT * FROM usuario", (err, usuarios) => {
        if (err) {
            console.error("Erro ao buscar usuários:", err.message);
            return res.status(500).send({ error: "Erro interno do servidor." });
        }

        res.status(200).send({
            mensagem: "Usuários encontrados.",
            usuarios: usuarios
        });
    });
});

// Endpoint para criar um novo usuário
router.post("/", (req, res) => {
    const { nome, email, senha } = req.body;

    let msg = [];
    if (!nome || nome.length < 3) {
        msg.push({ mensagem: "Nome inválido! Deve ter pelo menos 3 caracteres." });
    }
    if (!email || !validateEmail(email)) {
        msg.push({ mensagem: "E-mail inválido!" });
    }
    if (!senha || senha.length < 6) {
        msg.push({ mensagem: "Senha inválida! Deve ter pelo menos 6 caracteres." });
    }
    if (msg.length > 0) {
        return res.status(400).send({ mensagem: "Falha ao cadastrar usuário.", erros: msg });
    }

    db.get("SELECT * FROM usuario WHERE email = ?", [email], (err, usuario) => {
        if (err) {
            console.error("Erro ao verificar e-mail:", err.message);
            return res.status(500).send({ error: "Erro interno do servidor." });
        }

        if (usuario) {
            return res.status(400).send({ mensagem: "E-mail já cadastrado." });
        }

        bcrypt.hash(senha, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error("Erro ao hashear senha:", hashErr.message);
                return res.status(500).send({ error: "Erro interno do servidor." });
            }

            db.run(
                "INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)",
                [nome, email, hashedPassword],
                function (insertErr) {
                    if (insertErr) {
                        console.error("Erro ao inserir usuário:", insertErr.message);
                        return res.status(500).send({ error: "Erro interno do servidor." });
                    }

                    res.status(201).send({
                        mensagem: "Usuário cadastrado com sucesso.",
                        usuario: { id: this.lastID, nome: nome, email: email }
                    });
                }
            );
        });
    });
});

// Função para validar formato de e-mail
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// Endpoint para atualizar um usuário
router.put("/", (req, res) => {
    const { id, nome, email, senha } = req.body;

    if (!id || !nome || !email || !senha) {
        return res.status(400).send({ error: "Parâmetros inválidos." });
    }

    bcrypt.hash(senha, 10, (hashErr, hashedPassword) => {
        if (hashErr) {
            console.error("Erro ao hashear senha:", hashErr.message);
            return res.status(500).send({ error: "Erro interno do servidor." });
        }

        db.run(
            "UPDATE usuario SET nome = ?, email = ?, senha = ? WHERE id = ?",
            [nome, email, hashedPassword, id],
            function (updateErr) {
                if (updateErr) {
                    console.error("Erro ao atualizar usuário:", updateErr.message);
                    return res.status(500).send({ error: "Erro interno do servidor." });
                }

                res.status(200).send({ mensagem: "Usuário atualizado com sucesso." });
            }
        );
    });
});

// Endpoint para deletar um usuário
router.delete("/:id", (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send({ error: "Parâmetros inválidos." });
    }

    db.run("DELETE FROM usuario WHERE id = ?", [id], function (err) {
        if (err) {
            console.error("Erro ao excluir usuário:", err.message);
            return res.status(500).send({ error: "Erro interno do servidor." });
        }

        if (this.changes === 0) {
            return res.status(404).send({ mensagem: "Usuário não encontrado." });
        }

        res.status(200).send({ mensagem: "Usuário excluído com sucesso." });
    });
});

module.exports = router;
