const express = require('express');

const router = express.Router();

const {
    listarTiposConstrucao
} = require('../controllers/tipoConstrucaoController');


router.get('/', listarTiposConstrucao);


module.exports = router;