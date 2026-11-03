import { RegionalLocation, PriceCatalogItem, WorkTypeInfo } from '../types';

export const WORK_TYPES: WorkTypeInfo[] = [
  {
    id: 'muro',
    key: 'muro',
    name: 'Muro',
    title: 'Muro',
    tagline: 'Alvenaria de vedação e divisão',
    description: 'Calcule blocos/tijolos, cimento, areia, argamassa de assentamento e desconto de vãos.',
    icon: 'ShieldAlert',
    defaultWaste: 10,
    defaultWastePercentage: 10,
    category: 'alvenaria'
  },
  {
    id: 'parede',
    key: 'parede',
    name: 'Parede',
    title: 'Parede',
    tagline: 'Alvenaria interna e externa com reboco',
    description: 'Calcule alvenaria, chapisco, emboço e reboco com base na área, espessura e acabamento.',
    icon: 'BrickWall',
    defaultWaste: 10,
    defaultWastePercentage: 10,
    category: 'alvenaria'
  },
  {
    id: 'piso',
    key: 'piso',
    name: 'Piso',
    title: 'Piso',
    tagline: 'Revestimento cerâmico e porcelanato',
    description: 'Calcule placas de piso, argamassa colante AC-I/II/III, rejunte e margem de recortes.',
    icon: 'Grid3X3',
    defaultWaste: 12,
    defaultWastePercentage: 12,
    category: 'acabamento'
  },
  {
    id: 'pintura',
    key: 'pintura',
    name: 'Pintura',
    title: 'Pintura',
    tagline: 'Paredes internas, externas e tetos',
    description: 'Calcule latas de tinta, selador preparador, massa corrida/acrílica, rolos e lixas.',
    icon: 'Paintbrush',
    defaultWaste: 8,
    defaultWastePercentage: 8,
    category: 'acabamento'
  },
  {
    id: 'concreto',
    key: 'concreto',
    name: 'Concreto',
    title: 'Concreto',
    tagline: 'Lajes, vigas, pilares e pisos industriais',
    description: 'Calcule sacos de cimento, areia lavada, pedra britada e água conforme o traço técnico.',
    icon: 'Box',
    defaultWaste: 10,
    defaultWastePercentage: 10,
    category: 'estrutural'
  },
  {
    id: 'fundacao',
    key: 'fundacao',
    name: 'Fundação',
    title: 'Fundação',
    tagline: 'Sapatas, brocas e vigas baldrame',
    description: 'Calcule volume de concreto estrutural, barras de aço CA-50 e tábuas para formas.',
    icon: 'Anchor',
    defaultWaste: 12,
    defaultWastePercentage: 12,
    category: 'estrutural'
  },
  {
    id: 'telhado',
    key: 'telhado',
    name: 'Telhado',
    title: 'Telhado',
    tagline: 'Coberturas cerâmicas, fibrocimento e metálicas',
    description: 'Calcule quantidade de telhas com fator de inclinação, cumeeiras e madeiramento.',
    icon: 'Home',
    defaultWaste: 10,
    defaultWastePercentage: 10,
    category: 'cobertura'
  },
  {
    id: 'revestimento',
    key: 'revestimento',
    name: 'Revestimento',
    title: 'Revestimento',
    tagline: 'Azulejos e pastilhas de parede',
    description: 'Calcule azulejos de cozinha/banheiro, argamassa impermeável e rejunte fino.',
    icon: 'Layers',
    defaultWaste: 10,
    defaultWastePercentage: 10,
    category: 'acabamento'
  },
  {
    id: 'outro',
    key: 'outro',
    name: 'Outro tipo de obra',
    title: 'Outro tipo de obra',
    tagline: 'Cálculo customizado e reformas rápidas',
    description: 'Cálculo modular por área para calçadas, reparos de contrapiso ou reformas mistas.',
    icon: 'Wrench',
    defaultWaste: 10,
    defaultWastePercentage: 10,
    category: 'geral'
  }
];

export const REGIONAL_LOCATIONS: RegionalLocation[] = [
  { uf: 'SP', stateName: 'São Paulo', city: 'São Paulo (Capital/Grande SP)', priceMultiplier: 1.0, source: 'SINAPI-SP / Mercado Paulista' },
  { uf: 'RJ', stateName: 'Rio de Janeiro', city: 'Rio de Janeiro', priceMultiplier: 1.05, source: 'SINAPI-RJ' },
  { uf: 'MG', stateName: 'Minas Gerais', city: 'Belo Horizonte', priceMultiplier: 0.96, source: 'SINAPI-MG' },
  { uf: 'PR', stateName: 'Paraná', city: 'Curitiba', priceMultiplier: 0.98, source: 'SINAPI-PR' },
  { uf: 'RS', stateName: 'Rio Grande do Sul', city: 'Porto Alegre', priceMultiplier: 1.02, source: 'SINAPI-RS' },
  { uf: 'SC', stateName: 'Santa Catarina', city: 'Florianópolis', priceMultiplier: 1.03, source: 'SINAPI-SC' },
  { uf: 'BA', stateName: 'Bahia', city: 'Salvador', priceMultiplier: 0.94, source: 'SINAPI-BA' },
  { uf: 'PE', stateName: 'Pernambuco', city: 'Recife', priceMultiplier: 0.93, source: 'SINAPI-PE' },
  { uf: 'CE', stateName: 'Ceará', city: 'Fortaleza', priceMultiplier: 0.92, source: 'SINAPI-CE' },
  { uf: 'GO', stateName: 'Goiás', city: 'Goiânia', priceMultiplier: 0.95, source: 'SINAPI-GO' },
  { uf: 'DF', stateName: 'Distrito Federal', city: 'Brasília', priceMultiplier: 1.08, source: 'SINAPI-DF' },
  { uf: 'AM', stateName: 'Amazonas', city: 'Manaus', priceMultiplier: 1.15, source: 'SINAPI-AM (Logística Fluvial)' },
  { uf: 'PA', stateName: 'Pará', city: 'Belém', priceMultiplier: 1.07, source: 'SINAPI-PA' },
  { uf: 'MT', stateName: 'Mato Grosso', city: 'Cuiabá', priceMultiplier: 1.04, source: 'SINAPI-MT' },
  { uf: 'MS', stateName: 'Mato Grosso do Sul', city: 'Campo Grande', priceMultiplier: 1.01, source: 'SINAPI-MS' }
];

export const BASE_MATERIALS_CATALOG: PriceCatalogItem[] = [
  {
    id: 'mat_cimento_50kg',
    name: 'Cimento Portland CP II (50 kg)',
    category: 'Aglomerantes',
    baseUnit: 'saco 50kg',
    basePrice: 34.90,
    commercialUnit: 'sacos',
    updatedAt: '2026-03-01',
    description: 'Cimento para alvenaria, contrapiso, chapisco e concreto estrutural.'
  },
  {
    id: 'mat_areia_media',
    name: 'Areia Média Lavada',
    category: 'Agregados',
    baseUnit: 'm³',
    basePrice: 110.00,
    commercialUnit: 'm³',
    updatedAt: '2026-03-01',
    description: 'Areia lavada limpa para argamassas e traço de concreto.'
  },
  {
    id: 'mat_brita_1',
    name: 'Pedra Brita 1 (Granulometria 9,5 a 19mm)',
    category: 'Agregados',
    baseUnit: 'm³',
    basePrice: 125.00,
    commercialUnit: 'm³',
    updatedAt: '2026-03-01',
    description: 'Brita graduada para concreto de lajes, vigas, sapatas e calçadas.'
  },
  {
    id: 'mat_bloco_concreto_14',
    name: 'Bloco de Concreto Estrutural/Vedação 14x19x39 cm',
    category: 'Alvenaria',
    baseUnit: 'unidade',
    basePrice: 4.60,
    commercialUnit: 'unidades',
    updatedAt: '2026-03-01',
    description: 'Bloco padrão com rendimento de 12,5 blocos por m² de parede.'
  },
  {
    id: 'mat_bloco_concreto_09',
    name: 'Bloco de Concreto Vedação 09x19x39 cm',
    category: 'Alvenaria',
    baseUnit: 'unidade',
    basePrice: 3.80,
    commercialUnit: 'unidades',
    updatedAt: '2026-03-01',
    description: 'Bloco estreito para divisões internas com rendimento de 12,5 blocos/m².'
  },
  {
    id: 'mat_tijolo_ceramico_8f',
    name: 'Tijolo Cerâmico 8 Furos 9x19x19 cm',
    category: 'Alvenaria',
    baseUnit: 'milheiro / un',
    basePrice: 1.45,
    commercialUnit: 'unidades',
    updatedAt: '2026-03-01',
    description: 'Tijolo cerâmico vazado com rendimento de 25 peças por m².'
  },
  {
    id: 'mat_argamassa_ac1',
    name: 'Argamassa Colante AC-I (Saco 20 kg)',
    category: 'Argamassas e Adesivos',
    baseUnit: 'saco 20kg',
    basePrice: 17.50,
    commercialUnit: 'sacos',
    updatedAt: '2026-03-01',
    description: 'Argamassa para assentamento de placas cerâmicas em ambientes internos.'
  },
  {
    id: 'mat_argamassa_ac2',
    name: 'Argamassa Colante AC-II (Saco 20 kg)',
    category: 'Argamassas e Adesivos',
    baseUnit: 'saco 20kg',
    basePrice: 24.80,
    commercialUnit: 'sacos',
    updatedAt: '2026-03-01',
    description: 'Argamassa com maior flexibilidade para ambientes externos e áreas molhadas.'
  },
  {
    id: 'mat_argamassa_ac3',
    name: 'Argamassa Colante AC-III (Saco 20 kg)',
    category: 'Argamassas e Adesivos',
    baseUnit: 'saco 20kg',
    basePrice: 38.90,
    commercialUnit: 'sacos',
    updatedAt: '2026-03-01',
    description: 'Alta aderência para porcelanatos, grandes formatos e fachadas.'
  },
  {
    id: 'mat_rejunte_cimenticio',
    name: 'Rejunte Cimentício Flexível (Pacote 1 kg)',
    category: 'Argamassas e Adesivos',
    baseUnit: 'kg',
    basePrice: 8.50,
    commercialUnit: 'kg',
    updatedAt: '2026-03-01',
    description: 'Rejuntamento antimofo para juntas de 1 a 5 mm em pisos e paredes.'
  },
  {
    id: 'mat_piso_ceramico_padrao',
    name: 'Revestimento / Piso Cerâmico Esmaltado',
    category: 'Pisos e Acabamentos',
    baseUnit: 'm²',
    basePrice: 42.00,
    commercialUnit: 'm² (caixas)',
    updatedAt: '2026-03-01',
    description: 'Piso cerâmico padrão PEI 4 / 5 para tráfego residencial e comercial.'
  },
  {
    id: 'mat_porcelanato',
    name: 'Porcelanato Retificado 60x60 / 80x80 cm',
    category: 'Pisos e Acabamentos',
    baseUnit: 'm²',
    basePrice: 89.00,
    commercialUnit: 'm² (caixas)',
    updatedAt: '2026-03-01',
    description: 'Porcelanato polido ou acetinado com borda retificada (junta fina).'
  },
  {
    id: 'mat_tinta_acrilica_18l',
    name: 'Tinta Acrílica Fosca Premium (Lata 18 Litros)',
    category: 'Pintura',
    baseUnit: 'lata 18L',
    basePrice: 289.00,
    commercialUnit: 'latas 18L',
    updatedAt: '2026-03-01',
    description: 'Rendimento de 90 a 110 m² com 2 demãos completas.'
  },
  {
    id: 'mat_selador_acrilico_18l',
    name: 'Selador / Fundo Preparador Acrílico (Lata 18 Litros)',
    category: 'Pintura',
    baseUnit: 'lata 18L',
    basePrice: 145.00,
    commercialUnit: 'latas 18L',
    updatedAt: '2026-03-01',
    description: 'Uniformiza a absorção em reboco novo e alvenaria crua.'
  },
  {
    id: 'mat_massa_corrida_25kg',
    name: 'Massa Corrida / Acrílica (Barrica 25 kg)',
    category: 'Pintura',
    baseUnit: 'barrica 25kg',
    basePrice: 72.00,
    commercialUnit: 'barricas 25kg',
    updatedAt: '2026-03-01',
    description: 'Nivelamento e emassamento fino antes da aplicação da tinta.'
  },
  {
    id: 'mat_kit_pintura',
    name: 'Kit Pintor (Rolos antigota 23cm, trincha, bandeja e fita)',
    category: 'Pintura',
    baseUnit: 'kit',
    basePrice: 65.00,
    commercialUnit: 'kits',
    updatedAt: '2026-03-01',
    description: 'Ferramentas de aplicação para pintura de alta produtividade.'
  },
  {
    id: 'mat_telha_ceramica_romana',
    name: 'Telha Cerâmica Tipo Romana / Colonial',
    category: 'Cobertura',
    baseUnit: 'unidade',
    basePrice: 2.80,
    commercialUnit: 'unidades',
    updatedAt: '2026-03-01',
    description: 'Consumo médio de 16 peças por m² de telhado inclinado.'
  },
  {
    id: 'mat_telha_fibrocimento',
    name: 'Telha de Fibrocimento Ondulada 2,44 x 1,10 m (6mm)',
    category: 'Cobertura',
    baseUnit: 'placa',
    basePrice: 68.00,
    commercialUnit: 'placas',
    updatedAt: '2026-03-01',
    description: 'Área útil aproximada de 2,15 m² por telha considerando recobrimentos.'
  },
  {
    id: 'mat_madeiramento_telhado',
    name: 'Kit Madeiramento (Vigas, Caibros e Ripas)',
    category: 'Cobertura',
    baseUnit: 'm²',
    basePrice: 48.00,
    commercialUnit: 'm² coberto',
    updatedAt: '2026-03-01',
    description: 'Estrutura de madeira tratada para suporte do telhado cerâmico.'
  },
  {
    id: 'mat_aco_ca50_10mm',
    name: 'Aço CA-50 Nervurado Ø 10 mm (3/8") - Barra 12 m',
    category: 'Aço e Ferragem',
    baseUnit: 'barra 12m',
    basePrice: 48.50,
    commercialUnit: 'barras 12m',
    updatedAt: '2026-03-01',
    description: 'Aço para armaduras de vigas baldrame, sapatas e pilares.'
  },
  {
    id: 'mat_arame_recozido',
    name: 'Arame Recozido Queimado nº 18',
    category: 'Aço e Ferragem',
    baseUnit: 'kg',
    basePrice: 19.50,
    commercialUnit: 'kg',
    updatedAt: '2026-03-01',
    description: 'Arame maleável para amarração de estribos e ferragens estruturais.'
  },
  {
    id: 'mat_tabua_pinus_forma',
    name: 'Tábua de Madeira Pinus 30 cm x 3 m (Formas de concreto)',
    category: 'Madeira para Obra',
    baseUnit: 'peça 3m',
    basePrice: 32.00,
    commercialUnit: 'peças',
    updatedAt: '2026-03-01',
    description: 'Madeiramento auxiliar para caixarias de vigas e pilares.'
  },
  {
    id: 'mat_cal_hidratada',
    name: 'Cal Hidratada CH-I (Saco 20 kg)',
    category: 'Aglomerantes',
    baseUnit: 'saco 20kg',
    basePrice: 18.20,
    commercialUnit: 'sacos 20kg',
    updatedAt: '2026-03-01',
    description: 'Proporciona plasticidade e retenção de água no emboço e reboco.'
  }
];
