const conexao = require('../config/database');

async function listarTiposConstrucao(req, res) {

    try {

        const [tipos] = await conexao.query(
            'SELECT * FROM tipo_construcao WHERE ativo = TRUE'
        );

        res.json(tipos);

    } catch (erro) {

        console.error('Erro ao buscar tipos de construção:', erro);

        res.status(500).json({
            mensagem: 'Erro ao buscar tipos de construção.',
            erro: erro.message
        });

    }

}

module.exports = {
    listarTiposConstrucao
};