import { RegionalLocation, PriceCatalogItem, AdminWorkType, AdminMaterial } from './types';

export const REGIONAL_LOCATIONS: RegionalLocation[] = [
  { uf: 'SP', stateName: 'São Paulo', city: 'São Paulo (Capital/Grande SP)', priceMultiplier: 1.0, source: 'SINAPI-SP / Mercado Paulista' },
  { uf: 'RJ', stateName: 'Rio de Janeiro', city: 'Rio de Janeiro', priceMultiplier: 1.05, source: 'SINAPI-RJ' },
  { uf: 'MG', stateName: 'Minas Gerais', city: 'Belo Horizonte', priceMultiplier: 0.96, source: 'SINAPI-MG' },
  { uf: 'ES', stateName: 'Espírito Santo', city: 'Vitória', priceMultiplier: 0.98, source: 'SINAPI-ES' },
  { uf: 'PR', stateName: 'Paraná', city: 'Curitiba', priceMultiplier: 0.98, source: 'SINAPI-PR' },
  { uf: 'RS', stateName: 'Rio Grande do Sul', city: 'Porto Alegre', priceMultiplier: 1.02, source: 'SINAPI-RS' },
  { uf: 'SC', stateName: 'Santa Catarina', city: 'Florianópolis', priceMultiplier: 1.03, source: 'SINAPI-SC' },
  { uf: 'BA', stateName: 'Bahia', city: 'Salvador', priceMultiplier: 0.94, source: 'SINAPI-BA' },
  { uf: 'PE', stateName: 'Pernambuco', city: 'Recife', priceMultiplier: 0.93, source: 'SINAPI-PE' },
  { uf: 'CE', stateName: 'Ceará', city: 'Fortaleza', priceMultiplier: 0.92, source: 'SINAPI-CE' },
  { uf: 'RN', stateName: 'Rio Grande do Norte', city: 'Natal', priceMultiplier: 0.93, source: 'SINAPI-RN' },
  { uf: 'PB', stateName: 'Paraíba', city: 'João Pessoa', priceMultiplier: 0.92, source: 'SINAPI-PB' },
  { uf: 'AL', stateName: 'Alagoas', city: 'Maceió', priceMultiplier: 0.93, source: 'SINAPI-AL' },
  { uf: 'SE', stateName: 'Sergipe', city: 'Aracaju', priceMultiplier: 0.93, source: 'SINAPI-SE' },
  { uf: 'PI', stateName: 'Piauí', city: 'Teresina', priceMultiplier: 0.94, source: 'SINAPI-PI' },
  { uf: 'MA', stateName: 'Maranhão', city: 'São Luís', priceMultiplier: 0.96, source: 'SINAPI-MA' },
  { uf: 'GO', stateName: 'Goiás', city: 'Goiânia', priceMultiplier: 0.95, source: 'SINAPI-GO' },
  { uf: 'DF', stateName: 'Distrito Federal', city: 'Brasília', priceMultiplier: 1.08, source: 'SINAPI-DF' },
  { uf: 'MT', stateName: 'Mato Grosso', city: 'Cuiabá', priceMultiplier: 1.04, source: 'SINAPI-MT' },
  { uf: 'MS', stateName: 'Mato Grosso do Sul', city: 'Campo Grande', priceMultiplier: 1.01, source: 'SINAPI-MS' },
  { uf: 'TO', stateName: 'Tocantins', city: 'Palmas', priceMultiplier: 1.02, source: 'SINAPI-TO' },
  { uf: 'AM', stateName: 'Amazonas', city: 'Manaus', priceMultiplier: 1.15, source: 'SINAPI-AM (Logística Fluvial)' },
  { uf: 'PA', stateName: 'Pará', city: 'Belém', priceMultiplier: 1.07, source: 'SINAPI-PA' },
  { uf: 'RO', stateName: 'Rondônia', city: 'Porto Velho', priceMultiplier: 1.09, source: 'SINAPI-RO' },
  { uf: 'AC', stateName: 'Acre', city: 'Rio Branco', priceMultiplier: 1.14, source: 'SINAPI-AC' },
  { uf: 'RR', stateName: 'Roraima', city: 'Boa Vista', priceMultiplier: 1.16, source: 'SINAPI-RR' },
  { uf: 'AP', stateName: 'Amapá', city: 'Macapá', priceMultiplier: 1.12, source: 'SINAPI-AP' }
];

export const BASE_MATERIALS_CATALOG: PriceCatalogItem[] = [
  { id: 'mat_cimento_50kg', name: 'Cimento Portland CP II (50 kg)', category: 'Aglomerantes', baseUnit: 'saco 50kg', basePrice: 34.9, commercialUnit: 'sacos', updatedAt: '2026-03-01', description: 'Cimento para alvenaria, contrapiso, chapisco e concreto estrutural.' },
  { id: 'mat_areia_media', name: 'Areia Média Lavada', category: 'Agregados', baseUnit: 'm³', basePrice: 110.0, commercialUnit: 'm³', updatedAt: '2026-03-01', description: 'Areia lavada limpa para argamassas e traço de concreto.' },
  { id: 'mat_brita_1', name: 'Pedra Brita 1 (Granulometria 9,5 a 19mm)', category: 'Agregados', baseUnit: 'm³', basePrice: 125.0, commercialUnit: 'm³', updatedAt: '2026-03-01', description: 'Brita graduada para concreto de lajes, vigas, sapatas e calçadas.' },
  { id: 'mat_bloco_concreto_14', name: 'Bloco de Concreto Estrutural/Vedação 14x19x39 cm', category: 'Alvenaria', baseUnit: 'unidade', basePrice: 4.6, commercialUnit: 'unidades', updatedAt: '2026-03-01', description: 'Bloco padrão com rendimento de 12,5 blocos por m² de parede.' },
  { id: 'mat_bloco_concreto_09', name: 'Bloco de Concreto Vedação 09x19x39 cm', category: 'Alvenaria', baseUnit: 'unidade', basePrice: 3.8, commercialUnit: 'unidades', updatedAt: '2026-03-01', description: 'Bloco estreito para divisões internas com rendimento de 12,5 blocos/m².' },
  { id: 'mat_tijolo_ceramico_8f', name: 'Tijolo Cerâmico 8 Furos 9x19x19 cm', category: 'Alvenaria', baseUnit: 'milheiro / un', basePrice: 1.45, commercialUnit: 'unidades', updatedAt: '2026-03-01', description: 'Tijolo cerâmico vazado com rendimento de 25 peças por m².' },
  { id: 'mat_argamassa_ac1', name: 'Argamassa Colante AC-I (Saco 20 kg)', category: 'Argamassas e Adesivos', baseUnit: 'saco 20kg', basePrice: 17.5, commercialUnit: 'sacos', updatedAt: '2026-03-01', description: 'Argamassa para assentamento de placas cerâmicas em ambientes internos.' },
  { id: 'mat_argamassa_ac2', name: 'Argamassa Colante AC-II (Saco 20 kg)', category: 'Argamassas e Adesivos', baseUnit: 'saco 20kg', basePrice: 24.8, commercialUnit: 'sacos', updatedAt: '2026-03-01', description: 'Argamassa com maior flexibilidade para ambientes externos e áreas molhadas.' },
  { id: 'mat_argamassa_ac3', name: 'Argamassa Colante AC-III (Saco 20 kg)', category: 'Argamassas e Adesivos', baseUnit: 'saco 20kg', basePrice: 38.9, commercialUnit: 'sacos', updatedAt: '2026-03-01', description: 'Alta aderência para porcelanatos, grandes formatos e fachadas.' },
  { id: 'mat_rejunte_cimenticio', name: 'Rejunte Cimentício Flexível (Pacote 1 kg)', category: 'Argamassas e Adesivos', baseUnit: 'kg', basePrice: 8.5, commercialUnit: 'kg', updatedAt: '2026-03-01', description: 'Rejuntamento antimofo para juntas de 1 a 5 mm em pisos e paredes.' },
  { id: 'mat_piso_ceramico_padrao', name: 'Revestimento / Piso Cerâmico Esmaltado', category: 'Pisos e Acabamentos', baseUnit: 'm²', basePrice: 42.0, commercialUnit: 'm² (caixas)', updatedAt: '2026-03-01', description: 'Piso cerâmico padrão PEI 4 / 5 para tráfego residencial e comercial.' },
  { id: 'mat_porcelanato', name: 'Porcelanato Retificado 60x60 / 80x80 cm', category: 'Pisos e Acabamentos', baseUnit: 'm²', basePrice: 89.0, commercialUnit: 'm² (caixas)', updatedAt: '2026-03-01', description: 'Porcelanato polido ou acetinado com borda retificada (junta fina).' },
  { id: 'mat_tinta_acrilica_18l', name: 'Tinta Acrílica Fosca Premium (Lata 18 Litros)', category: 'Pintura', baseUnit: 'lata 18L', basePrice: 289.0, commercialUnit: 'latas 18L', updatedAt: '2026-03-01', description: 'Rendimento de 90 a 110 m² com 2 demãos completas.' },
  { id: 'mat_selador_acrilico_18l', name: 'Selador / Fundo Preparador Acrílico (Lata 18 Litros)', category: 'Pintura', baseUnit: 'lata 18L', basePrice: 145.0, commercialUnit: 'latas 18L', updatedAt: '2026-03-01', description: 'Uniformiza a absorção em reboco novo e alvenaria crua.' },
  { id: 'mat_massa_corrida_25kg', name: 'Massa Corrida / Acrílica (Barrica 25 kg)', category: 'Pintura', baseUnit: 'barrica 25kg', basePrice: 72.0, commercialUnit: 'barricas 25kg', updatedAt: '2026-03-01', description: 'Nivelamento e emassamento fino antes da aplicação da tinta.' },
  { id: 'mat_kit_pintura', name: 'Kit Pintor (Rolos antigota 23cm, trincha, bandeja e fita)', category: 'Pintura', baseUnit: 'kit', basePrice: 65.0, commercialUnit: 'kits', updatedAt: '2026-03-01', description: 'Ferramentas de aplicação para pintura de alta produtividade.' },
  { id: 'mat_telha_ceramica_romana', name: 'Telha Cerâmica Tipo Romana / Colonial', category: 'Cobertura', baseUnit: 'unidade', basePrice: 2.8, commercialUnit: 'unidades', updatedAt: '2026-03-01', description: 'Consumo médio de 16 peças por m² de telhado inclinado.' },
  { id: 'mat_telha_fibrocimento', name: 'Telha de Fibrocimento Ondulada 2,44 x 1,10 m (6mm)', category: 'Cobertura', baseUnit: 'placa', basePrice: 68.0, commercialUnit: 'placas', updatedAt: '2026-03-01', description: 'Área útil aproximada de 2,15 m² por telha considerando recobrimentos.' },
  { id: 'mat_madeiramento_telhado', name: 'Kit Madeiramento (Vigas, Caibros e Ripas)', category: 'Cobertura', baseUnit: 'm²', basePrice: 48.0, commercialUnit: 'm² coberto', updatedAt: '2026-03-01', description: 'Estrutura de madeira tratada para suporte do telhado cerâmico.' },
  { id: 'mat_aco_ca50_10mm', name: 'Aço CA-50 Nervurado Ø 10 mm (3/8") - Barra 12 m', category: 'Aço e Ferragem', baseUnit: 'barra 12m', basePrice: 48.5, commercialUnit: 'barras 12m', updatedAt: '2026-03-01', description: 'Aço para armaduras de vigas baldrame, sapatas e pilares.' },
  { id: 'mat_arame_recozido', name: 'Arame Recozido Queimado nº 18', category: 'Aço e Ferragem', baseUnit: 'kg', basePrice: 19.5, commercialUnit: 'kg', updatedAt: '2026-03-01', description: 'Arame maleável para amarração de estribos e ferragens estruturais.' },
  { id: 'mat_tabua_pinus_forma', name: 'Tábua de Madeira Pinus 30 cm x 3 m (Formas de concreto)', category: 'Madeira para Obra', baseUnit: 'peça 3m', basePrice: 32.0, commercialUnit: 'peças', updatedAt: '2026-03-01', description: 'Madeiramento auxiliar para caixarias de vigas e pilares.' },
  { id: 'mat_cal_hidratada', name: 'Cal Hidratada CH-I (Saco 20 kg)', category: 'Aglomerantes', baseUnit: 'saco 20kg', basePrice: 18.2, commercialUnit: 'sacos 20kg', updatedAt: '2026-03-01', description: 'Proporciona plasticidade e retenção de água no emboço e reboco.' }
];

export const INITIAL_ADMIN_MATERIALS: AdminMaterial[] = [
  { id: 'mat_1', name: 'Cimento Portland CP-II', description: 'Cimento composto de alta resistência para fundações, alvenaria e reboco.', unit: 'saco', price: 42.0, minQuantity: 20, status: 'ativo', category: 'Aglomerantes', updatedAt: '2026-03-01T10:00:00.000Z' },
  { id: 'mat_2', name: 'Tinta Acrílica Premium Fosca', description: 'Tinta lavável e antimofo de altíssima cobertura para acabamento interno e externo.', unit: 'litro', price: 35.0, minQuantity: 10, status: 'ativo', category: 'Pintura', updatedAt: '2026-03-01T10:00:00.000Z' },
  { id: 'mat_3', name: 'Tijolo Cerâmico 8 Furos (9x19x19 cm)', description: 'Tijolo vazado cerâmico de vedação padrão com excelente isolamento termoacústico.', unit: 'unidade', price: 1.2, minQuantity: 500, status: 'ativo', category: 'Alvenaria', updatedAt: '2026-03-01T10:00:00.000Z' },
  { id: 'mat_4', name: 'Areia Média Lavada', description: 'Areia natural lavada e isenta de matéria orgânica para preparo de argamassas e concreto.', unit: 'm³', price: 110.0, minQuantity: 5, status: 'ativo', category: 'Agregados', updatedAt: '2026-03-01T10:00:00.000Z' },
  { id: 'mat_5', name: 'Pedra Brita 1 (9,5 a 19mm)', description: 'Brita de gnaisse/basalto calibrada para concreto estrutural e vigas.', unit: 'm³', price: 125.0, minQuantity: 5, status: 'ativo', category: 'Agregados', updatedAt: '2026-03-01T10:00:00.000Z' },
  { id: 'mat_6', name: 'Bloco de Concreto 14x19x39 cm', description: 'Bloco de concreto vibro-prensado para alvenaria de vedação e estrutural leve.', unit: 'unidade', price: 4.6, minQuantity: 200, status: 'ativo', category: 'Alvenaria', updatedAt: '2026-03-01T10:00:00.000Z' },
  { id: 'mat_7', name: 'Argamassa Colante AC-I', description: 'Argamassa para assentamento de pisos e azulejos em áreas internas secas.', unit: 'saco 20kg', price: 17.5, minQuantity: 15, status: 'ativo', category: 'Argamassas', updatedAt: '2026-03-01T10:00:00.000Z' },
  { id: 'mat_8', name: 'Porcelanato Polido 80x80 cm', description: 'Porcelanato retificado extra com absorção menor que 0,5% e acabamento espelhado.', unit: 'm²', price: 89.0, minQuantity: 25, status: 'ativo', category: 'Pisos', updatedAt: '2026-03-01T10:00:00.000Z' }
];

export const INITIAL_WORK_TYPES: AdminWorkType[] = [
  { id: 'wt_1', code: 'muro', name: 'Muro', description: 'Alvenaria de fechamento perimetral em blocos de concreto ou cerâmicos com vigamento.', category: 'alvenaria', defaultWaste: 10, icon: 'ShieldAlert', active: true, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'wt_2', code: 'parede', name: 'Parede', description: 'Paredes internas e externas com opções de chapisco, emboço e reboco.', category: 'alvenaria', defaultWaste: 10, icon: 'BrickWall', active: true, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'wt_3', code: 'piso', name: 'Piso', description: 'Assentamento de cerâmicas, porcelanatos e contrapiso nivelador.', category: 'acabamento', defaultWaste: 12, icon: 'Grid3X3', active: true, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'wt_4', code: 'pintura', name: 'Pintura', description: 'Preparação com selador, emassamento e aplicação de demãos de tinta acrílica.', category: 'acabamento', defaultWaste: 8, icon: 'Paintbrush', active: true, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'wt_5', code: 'concreto', name: 'Concreto', description: 'Concreto virado ou usinado com traço estrutural, fck e dosagem por volume.', category: 'estrutural', defaultWaste: 10, icon: 'Box', active: true, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'wt_6', code: 'fundacao', name: 'Fundação', description: 'Sapatas isoladas, estacas, brocas e vigas baldrame com armadura de aço.', category: 'estrutural', defaultWaste: 12, icon: 'Anchor', active: true, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'wt_7', code: 'telhado', name: 'Telhado', description: 'Estrutura de madeira ou metálica com telhas cerâmicas ou fibrocimento.', category: 'cobertura', defaultWaste: 10, icon: 'Home', active: true, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'wt_8', code: 'revestimento', name: 'Revestimento', description: 'Azulejos e pastilhas para banheiros, cozinhas e fachadas prediais.', category: 'acabamento', defaultWaste: 10, icon: 'Layers', active: true, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'wt_9', code: 'outro', name: 'Outra obra', description: 'Reformas pontuais, contrapisos, demolições e reparos civis diversos.', category: 'geral', defaultWaste: 10, icon: 'Wrench', active: true, createdAt: '2026-01-10T00:00:00.000Z' }
];
