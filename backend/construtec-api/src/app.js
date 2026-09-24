const express = require('express');
const cors = require('cors');

const tipoConstrucaoRoutes =
    require('./routes/tipoConstrucaoRoutes');

const calculoRoutes =
    require('./routes/calculoRoutes');


const app = express();


app.use(cors());

app.use(express.json());


// ======================================================
// ROTA PRINCIPAL
// ======================================================

app.get('/', (req, res) => {

    res.json({
        mensagem: 'API ConstruTec funcionando!'
    });

});


// ======================================================
// TIPOS DE CONSTRUÇÃO
// ======================================================

app.use(
    '/tipos-construcao',
    tipoConstrucaoRoutes
);


// ======================================================
// CÁLCULOS
// ======================================================

app.use(
    '/calculos',
    calculoRoutes
);


module.exports = app;