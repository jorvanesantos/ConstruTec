// ======================================================
// CONFIGURAÇÕES GERAIS DOS CÁLCULOS
// ======================================================

// Perda padrão de materiais
const PERDA = 0.10;


// ======================================================
// CÁLCULO DE MURO
// ======================================================

function calcularMuro(dados) {

    const {
        comprimento,
        altura,
        espessura
    } = dados;


    // Área do muro
    const area = comprimento * altura;


    // Volume geométrico
    const volume = comprimento * altura * espessura;


    // Quantidade de tijolos
    // Estimativa: 25 tijolos por m²
    const tijolos = Math.ceil(
        area * 25 * (1 + PERDA)
    );


    // Argamassa de assentamento
    // Estimativa: 0,015 m³ por m²
    const argamassa = (
        area * 0.015
    ) * (1 + PERDA);


    // Traço aproximado 1:6
    const materiaisSecos =
        argamassa * 1.33;


    // Cimento
    const cimentoM3 =
        materiaisSecos * (1 / 7);

    const cimentoKg =
        cimentoM3 * 1440;

    const cimentoSacos =
        Math.ceil(cimentoKg / 50);


    // Areia
    const areia =
        materiaisSecos * (6 / 7);


    return {
        tipo: 'Muro',

        medidas: {
            comprimento,
            altura,
            espessura
        },

        calculos: {
            area: arredondar(area),
            volume: arredondar(volume),
            argamassa: arredondar(argamassa)
        },

        materiais: [
            {
                nome: 'Tijolo',
                quantidade: tijolos,
                unidade: 'un'
            },
            {
                nome: 'Cimento',
                quantidade: cimentoSacos,
                unidade: 'saco de 50 kg'
            },
            {
                nome: 'Areia',
                quantidade: arredondar(areia),
                unidade: 'm³'
            }
        ]
    };
}


// ======================================================
// CÁLCULO DE PAREDE
// ======================================================

function calcularParede(dados) {

    const {
        comprimento,
        altura,
        espessura
    } = dados;


    const area = comprimento * altura;

    const volume =
        comprimento *
        altura *
        espessura;


    // Estimativa de 25 tijolos por m²
    const tijolos = Math.ceil(
        area * 25 * (1 + PERDA)
    );


    // Argamassa
    const argamassa =
        area * 0.015 * (1 + PERDA);


    // Materiais secos
    const materiaisSecos =
        argamassa * 1.33;


    // Cimento
    const cimentoM3 =
        materiaisSecos * (1 / 7);

    const cimentoKg =
        cimentoM3 * 1440;

    const cimentoSacos =
        Math.ceil(cimentoKg / 50);


    // Areia
    const areia =
        materiaisSecos * (6 / 7);


    return {
        tipo: 'Parede',

        medidas: {
            comprimento,
            altura,
            espessura
        },

        calculos: {
            area: arredondar(area),
            volume: arredondar(volume),
            argamassa: arredondar(argamassa)
        },

        materiais: [
            {
                nome: 'Tijolo',
                quantidade: tijolos,
                unidade: 'un'
            },
            {
                nome: 'Cimento',
                quantidade: cimentoSacos,
                unidade: 'saco de 50 kg'
            },
            {
                nome: 'Areia',
                quantidade: arredondar(areia),
                unidade: 'm³'
            }
        ]
    };
}


// ======================================================
// CÁLCULO DE PISO
// ======================================================

function calcularPiso(dados) {

    const {
        comprimento,
        largura
    } = dados;


    // Área
    const area =
        comprimento * largura;


    // Argamassa
    // Estimativa: 5 kg por m²
    const argamassaKg =
        area * 5 * (1 + PERDA);


    // Quantidade de sacos de argamassa de 20 kg
    const sacosArgamassa =
        Math.ceil(argamassaKg / 20);


    // Rejunte
    // Estimativa simplificada
    const rejunteKg =
        area * 0.25 * (1 + PERDA);


    return {

        tipo: 'Piso',

        medidas: {
            comprimento,
            largura
        },

        calculos: {
            area: arredondar(area)
        },

        materiais: [
            {
                nome: 'Argamassa',
                quantidade: sacosArgamassa,
                unidade: 'saco de 20 kg'
            },
            {
                nome: 'Rejunte',
                quantidade: arredondar(rejunteKg),
                unidade: 'kg'
            }
        ]
    };
}


// ======================================================
// CÁLCULO DE PINTURA
// ======================================================

function calcularPintura(dados) {

    const {
        comprimento,
        altura,
        quantidadeParedes = 4,
        numeroDeDemaos = 2
    } = dados;


    // Área das paredes
    const area =
        comprimento *
        altura *
        quantidadeParedes;


    // Área considerando as demãos
    const areaPintura =
        area * numeroDeDemaos;


    // Tinta
    // Estimativa: 10 m² por litro por demão
    const tintaLitros =
        areaPintura / 10;


    const tintaComPerda =
        tintaLitros * (1 + PERDA);


    // Massa corrida
    // Estimativa: 1 kg por m²
    const massaKg =
        area * 1 * (1 + PERDA);


    return {

        tipo: 'Pintura',

        medidas: {
            comprimento,
            altura,
            quantidadeParedes,
            numeroDeDemaos
        },

        calculos: {
            area: arredondar(area),
            areaPintura: arredondar(areaPintura)
        },

        materiais: [
            {
                nome: 'Tinta',
                quantidade: arredondar(tintaComPerda),
                unidade: 'litros'
            },
            {
                nome: 'Massa corrida',
                quantidade: arredondar(massaKg),
                unidade: 'kg'
            }
        ]
    };
}


// ======================================================
// CÁLCULO DE TELHADO
// ======================================================

function calcularTelhado(dados) {

    const {
        comprimento,
        largura,
        percentualInclinacao = 30
    } = dados;


    // Área horizontal
    const areaBase =
        comprimento * largura;


    // Estimativa simplificada da inclinação
    const fatorInclinacao =
        Math.sqrt(
            1 +
            Math.pow(percentualInclinacao / 100, 2)
        );


    // Área aproximada do telhado
    const areaTelhado =
        areaBase * fatorInclinacao;


    // Estimativa de 16 telhas por m²
    const telhas =
        Math.ceil(
            areaTelhado * 16 * (1 + PERDA)
        );


    return {

        tipo: 'Telhado',

        medidas: {
            comprimento,
            largura,
            percentualInclinacao
        },

        calculos: {
            areaBase: arredondar(areaBase),
            areaTelhado: arredondar(areaTelhado)
        },

        materiais: [
            {
                nome: 'Telha',
                quantidade: telhas,
                unidade: 'un'
            }
        ]
    };
}


// ======================================================
// CÁLCULO DE REVESTIMENTO
// ======================================================

function calcularRevestimento(dados) {

    const {
        comprimento,
        altura
    } = dados;


    const area =
        comprimento * altura;


    // Argamassa
    // Estimativa: 5 kg por m²
    const argamassaKg =
        area * 5 * (1 + PERDA);


    const sacosArgamassa =
        Math.ceil(argamassaKg / 20);


    // Rejunte
    const rejunteKg =
        area * 0.25 * (1 + PERDA);


    return {

        tipo: 'Revestimento',

        medidas: {
            comprimento,
            altura
        },

        calculos: {
            area: arredondar(area)
        },

        materiais: [
            {
                nome: 'Argamassa',
                quantidade: sacosArgamassa,
                unidade: 'saco de 20 kg'
            },
            {
                nome: 'Rejunte',
                quantidade: arredondar(rejunteKg),
                unidade: 'kg'
            }
        ]
    };
}


// ======================================================
// OUTRA OBRA
// ======================================================

function calcularOutraObra(dados) {

    const {
        area,
        material,
        consumoPorM2,
        unidade
    } = dados;


    const quantidade =
        area *
        consumoPorM2 *
        (1 + PERDA);


    return {

        tipo: 'Outra obra',

        calculos: {
            area: arredondar(area)
        },

        materiais: [
            {
                nome: material,
                quantidade: arredondar(quantidade),
                unidade: unidade
            }
        ]
    };
}


// ======================================================
// FUNÇÃO AUXILIAR
// ======================================================

function arredondar(valor) {

    return Number(
        valor.toFixed(2)
    );
}


// ======================================================
// EXPORTAÇÃO
// ======================================================

module.exports = {

    calcularMuro,
    calcularParede,
    calcularPiso,
    calcularPintura,
    calcularTelhado,
    calcularRevestimento,
    calcularOutraObra

};