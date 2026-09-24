const calculos = require('../services/calculoService');


// ======================================================
// FUNÇÃO AUXILIAR PARA VALIDAR NÚMEROS
// ======================================================

function validarNumeros(dados, campos) {

    for (const campo of campos) {

        if (
            dados[campo] === undefined ||
            dados[campo] === null ||
            Number(dados[campo]) <= 0
        ) {

            return false;
        }
    }

    return true;
}


// ======================================================
// MURO
// ======================================================

function calcularMuroController(req, res) {

    try {

        const {
            comprimento,
            altura,
            espessura
        } = req.body;


        if (
            !validarNumeros(
                req.body,
                [
                    'comprimento',
                    'altura',
                    'espessura'
                ]
            )
        ) {

            return res.status(400).json({
                mensagem:
                    'Informe comprimento, altura e espessura com valores maiores que zero.'
            });
        }


        const resultado =
            calculos.calcularMuro({
                comprimento: Number(comprimento),
                altura: Number(altura),
                espessura: Number(espessura)
            });


        res.json(resultado);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao calcular muro.'
        });
    }
}


// ======================================================
// PAREDE
// ======================================================

function calcularParedeController(req, res) {

    try {

        const {
            comprimento,
            altura,
            espessura
        } = req.body;


        if (
            !validarNumeros(
                req.body,
                [
                    'comprimento',
                    'altura',
                    'espessura'
                ]
            )
        ) {

            return res.status(400).json({
                mensagem:
                    'Informe comprimento, altura e espessura.'
            });
        }


        const resultado =
            calculos.calcularParede({
                comprimento: Number(comprimento),
                altura: Number(altura),
                espessura: Number(espessura)
            });


        res.json(resultado);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao calcular parede.'
        });
    }
}


// ======================================================
// PISO
// ======================================================

function calcularPisoController(req, res) {

    try {

        const {
            comprimento,
            largura
        } = req.body;


        if (
            !validarNumeros(
                req.body,
                [
                    'comprimento',
                    'largura'
                ]
            )
        ) {

            return res.status(400).json({
                mensagem:
                    'Informe comprimento e largura.'
            });
        }


        const resultado =
            calculos.calcularPiso({
                comprimento: Number(comprimento),
                largura: Number(largura)
            });


        res.json(resultado);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao calcular piso.'
        });
    }
}


// ======================================================
// PINTURA
// ======================================================

function calcularPinturaController(req, res) {

    try {

        const {
            comprimento,
            altura,
            quantidadeParedes = 4,
            numeroDeDemaos = 2
        } = req.body;


        if (
            !validarNumeros(
                req.body,
                [
                    'comprimento',
                    'altura'
                ]
            )
        ) {

            return res.status(400).json({
                mensagem:
                    'Informe comprimento e altura.'
            });
        }


        const resultado =
            calculos.calcularPintura({

                comprimento:
                    Number(comprimento),

                altura:
                    Number(altura),

                quantidadeParedes:
                    Number(quantidadeParedes),

                numeroDeDemaos:
                    Number(numeroDeDemaos)
            });


        res.json(resultado);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao calcular pintura.'
        });
    }
}


// ======================================================
// TELHADO
// ======================================================

function calcularTelhadoController(req, res) {

    try {

        const {
            comprimento,
            largura,
            percentualInclinacao = 30
        } = req.body;


        if (
            !validarNumeros(
                req.body,
                [
                    'comprimento',
                    'largura'
                ]
            )
        ) {

            return res.status(400).json({
                mensagem:
                    'Informe comprimento e largura.'
            });
        }


        const resultado =
            calculos.calcularTelhado({

                comprimento:
                    Number(comprimento),

                largura:
                    Number(largura),

                percentualInclinacao:
                    Number(percentualInclinacao)
            });


        res.json(resultado);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao calcular telhado.'
        });
    }
}


// ======================================================
// REVESTIMENTO
// ======================================================

function calcularRevestimentoController(req, res) {

    try {

        const {
            comprimento,
            altura
        } = req.body;


        if (
            !validarNumeros(
                req.body,
                [
                    'comprimento',
                    'altura'
                ]
            )
        ) {

            return res.status(400).json({
                mensagem:
                    'Informe comprimento e altura.'
            });
        }


        const resultado =
            calculos.calcularRevestimento({

                comprimento:
                    Number(comprimento),

                altura:
                    Number(altura)
            });


        res.json(resultado);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao calcular revestimento.'
        });
    }
}


// ======================================================
// OUTRA OBRA
// ======================================================

function calcularOutraObraController(req, res) {

    try {

        const {
            area,
            material,
            consumoPorM2,
            unidade
        } = req.body;


        if (
            !area ||
            !material ||
            !consumoPorM2 ||
            !unidade
        ) {

            return res.status(400).json({
                mensagem:
                    'Informe área, material, consumo por m² e unidade.'
            });
        }


        const resultado =
            calculos.calcularOutraObra({

                area:
                    Number(area),

                material,

                consumoPorM2:
                    Number(consumoPorM2),

                unidade
            });


        res.json(resultado);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao calcular outra obra.'
        });
    }
}


// ======================================================
// EXPORTAÇÃO
// ======================================================

module.exports = {

    calcularMuroController,
    calcularParedeController,
    calcularPisoController,
    calcularPinturaController,
    calcularTelhadoController,
    calcularRevestimentoController,
    calcularOutraObraController

};