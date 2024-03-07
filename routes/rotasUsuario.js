const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require('bcrypt'); // Para hash de senha
const jwt = require('jsonwebtoken'); // Para geração de token JWT

const db = new sqlite3.Database("database.db");

// Rota para fazer login
router.post("/login", (req, res, next) => {
    const { email, senha } = req.body;

    console.log("Email recebido:", email); // Adiciona mensagem de log para depuração
    console.log("Senha recebida:", senha); // Adiciona mensagem de log para depuração

    db.get("SELECT * FROM usuario WHERE email = ?", [email], (error, usuario) => {
        if (error) {
            console.error("Erro ao buscar usuário:", error.message); // Adiciona mensagem de log para depuração
            return res.status(500).send({
                error: error.message
            });
        }

        console.log("Usuário encontrado:", usuario); // Adiciona mensagem de log para depuração

        if (!usuario) {
            console.log("Usuário não encontrado"); // Adiciona mensagem de log para depuração
            return res.status(401).send({
                mensagem: "Usuário não encontrado."
            });
        }

        bcrypt.compare(senha, usuario.senha, (bcryptError, result) => {
            if (bcryptError) {
                console.error("Erro ao comparar senhas:", bcryptError.message); // Adiciona mensagem de log para depuração
                return res.status(500).send({
                    error: bcryptError.message
                });
            }

            if (!result) {
                console.log("Senha incorreta"); // Adiciona mensagem de log para depuração
                return res.status(401).send({
                    mensagem: "Senha incorreta."
                });
            }

            console.log("Login bem sucedido"); // Adiciona mensagem de log para depuração

            // Gerar token JWT
            const token = jwt.sign({ id: usuario.id, email: usuario.email }, 'secreto', { expiresIn: '1h' });

            res.status(200).send({
                mensagem: "Login bem sucedido.",
                token: token
            });
        });
    });
});

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
router.post('/', (req, res, next) => {
    const { nome, email, senha } = req.body;

    // Validação dos campos
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
        return res.status(400).send({
            mensagem: "Falha ao cadastrar usuário.",
            erros: msg
        });
    }

    // Verifica se o email já está cadastrado
    db.get(`SELECT * FROM usuario WHERE email = ?`, [email], (error, usuarioExistente) => {
        if (error) {
            return res.status(500).send({
                error: error.message,
                response: null
            });
        }

        if (usuarioExistente) {
            return res.status(400).send({
                mensagem: "E-mail já cadastrado."
            });
        }

        // Hash da senha antes de salvar no banco de dados
        bcrypt.hash(senha, 10, (hashError, hashedPassword) => {
            if (hashError) {
                return res.status(500).send({
                    error: hashError.message,
                    response: null
                });
            }

            // Insere o novo usuário no banco de dados
            db.run(`INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)`, [nome, email, hashedPassword], function (insertError) {
                if (insertError) {
                    return res.status(500).send({
                        error: insertError.message,
                        response: null
                    });
                }
                res.status(201).send({
                    mensagem: "Cadastro criado com sucesso!",
                    usuario: {
                        id: this.lastID,
                        nome: nome,
                        email: email
                    }
                });
            });
        });
    });
});

// Função para validar formato de e-mail
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

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
        res.status(200).send({ mensagem: "Usuário atualizado com sucesso!" });
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
        res.status(200).send({ mensagem: "Usuário excluído com sucesso!" });
    });
});

module.exports = router;
