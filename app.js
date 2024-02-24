const bodyParser = require('body-parser');
const express = require('express')
const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());
const morgan = require("morgan");
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({extended:false}))

const rotaUsuarios = require("./routes/rotasUsuario");

app.use((req,res,next)=>{
    res.header("Access-Control-Allow-Origin","*")

    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept,Autorizaton"
        
    )
    if(req.method === "OPTIONS"){
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET")
        return res.status(200).send({})
    }
    next();
})


app.use("/usuario", rotaUsuarios);

app.use((req, res, next)=>{
    const erro = new Error("nao encontrado")
    erro.status(404);
})

app.use((error,req,res,next)=>{
    res.status(error.status || 500);
    return res.json({
        erro:{
            mensagem:error.message
        }
    })
})

module.exports = app