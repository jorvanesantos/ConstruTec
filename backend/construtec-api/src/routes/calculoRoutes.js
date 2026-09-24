const express = require('express');

const router = express.Router();


const {

    calcularMuroController,

    calcularParedeController,

    calcularPisoController,

    calcularPinturaController,

    calcularTelhadoController,

    calcularRevestimentoController,

    calcularOutraObraController

} = require('../controllers/calculoController');


// ======================================================
// MURO
// ======================================================

router.post(
    '/muro',
    calcularMuroController
);


// ======================================================
// PAREDE
// ======================================================

router.post(
    '/parede',
    calcularParedeController
);


// ======================================================
// PISO
// ======================================================

router.post(
    '/piso',
    calcularPisoController
);


// ======================================================
// PINTURA
// ======================================================

router.post(
    '/pintura',
    calcularPinturaController
);


// ======================================================
// TELHADO
// ======================================================

router.post(
    '/telhado',
    calcularTelhadoController
);


// ======================================================
// REVESTIMENTO
// ======================================================

router.post(
    '/revestimento',
    calcularRevestimentoController
);


// ======================================================
// OUTRA OBRA
// ======================================================

router.post(
    '/outra-obra',
    calcularOutraObraController
);


module.exports = router;