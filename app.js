const express = require('express')
const app = express();

app.use((req,res,next)=>{
    res.json({
        mensagem:"Hello Word!"
    })
})

module.exports = app