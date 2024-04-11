const express = require("express");
const router = express.Router();
const mysql = require("../mysql").pool; // Importa o pool de conexões MySQL
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post("/login", (req, res, next) => {
    const { email, senha } = req.body;

    mysql.query("SELECT * FROM usuario WHERE email = ?", [email], (error, results, fields) => {
        if (error) {
            console.error("Erro ao buscar usuário:", error.message);
            return res.status(500).send({
                error: error.message
            });
        }

        if (results.length === 0) {
            console.log("Usuário não encontrado");
            return res.status(401).send({
                mensagem: "Usuário não encontrado."
            });
        }

        const usuario = results[0];

        bcrypt.compare(senha, usuario.senha, (bcryptError, result) => {
            if (bcryptError) {
                console.error("Erro ao comparar senhas:", bcryptError.message);
                return res.status(500).send({
                    error: bcryptError.message
                });
            }

            if (!result) {
                console.log("Senha incorreta");
                return res.status(401).send({
                    mensagem: "Senha incorreta."
                });
            }

            console.log("Login bem sucedido");

            const token = jwt.sign({ id: usuario.id, email: usuario.email }, 'secreto', { expiresIn: '1h' });

            res.status(200).send({
                mensagem: "Login bem sucedido.",
                token: token
            });
        });
    });
});

router.get("/:id", (req, res, next) => {
    const { id } = req.params;

    mysql.query("SELECT * FROM usuario WHERE id=?", [id], (error, results, fields) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).send({
                mensagem: "Usuário não encontrado."
            });
        }

        res.status(200).send({
            mensagem: "Aqui está o usuário solicitado",
            usuario: results[0]
        });
    });
});
router.get("/", (req, res, next) => {
    const { id } = req.params;

    mysql.query("SELECT * FROM usuario ", (error, results, fields) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).send({
                mensagem: "Usuário não encontrado."
            });
        }

        res.status(200).send({
            mensagem: "Aqui está o usuário solicitado",
            usuario: results
        });
    });
});

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
    mysql.query('SELECT * FROM usuario WHERE email = ?', [email], (error, results, fields) => {
        if (error) {
            return res.status(500).send({
                error: error.message,
                response: null
            });
        }

        if (results.length > 0) {
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
            mysql.query('INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)', [nome, email, hashedPassword], (insertError, results, fields) => {
                if (insertError) {
                    return res.status(500).send({
                        error: insertError.message,
                        response: null
                    });
                }
                res.status(201).send({
                    mensagem: "Cadastro criado com sucesso!",
                    usuario: {
                        id: results.insertId,
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

router.put("/", (req, res, next) => {
    const { id, nome, email, senha } = req.body;

    if (!id || !nome || !email || !senha) {
        return res.status(400).send({ error: "Parâmetros inválidos" });
    }

    // Verifica se o usuário existe antes de atualizá-lo
    mysql.query('SELECT * FROM usuario WHERE id = ?', [id], (error, results, fields) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).send({
                mensagem: "Usuário não encontrado."
            });
        }

        // Atualiza o usuário no banco de dados
        mysql.query("UPDATE usuario SET nome=?, email=?, senha=? WHERE id=?", [nome, email, senha, id], (updateError, results, fields) => {
            if (updateError) {
                return res.status(500).send({
                    error: updateError.message
                });
            }
            res.status(200).send({ mensagem: "Usuário atualizado com sucesso!" });
        });
    });
});

router.delete("/:id", (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).send({ error: "Parâmetros inválidos" });
    }

    // Verifica se o usuário existe antes de excluí-lo
    mysql.query('SELECT * FROM usuario WHERE id = ?', [id], (error, results, fields) => {
        if (error) {
            return res.status(500).send({
                error: error.message
            });
        }

        if (results.length === 0) {
            return res.status(404).send({
                mensagem: "Usuário não encontrado."
            });
        }

        // Exclui o usuário do banco de dados
        mysql.query("DELETE FROM usuario WHERE id=?", [id], (deleteError, results, fields) => {
            if (deleteError) {
                return res.status(500).send({
                    error: deleteError.message
                });
            }
            res.status(200).send({ mensagem: "Usuário excluído com sucesso!" });
        });
    });
});


module.exports = router;
