import {
  CalculationResult,
  MaterialItem,
  RegionalLocation,
  WorkTypeKey
} from '../models/types';
import { BASE_MATERIALS_CATALOG, REGIONAL_LOCATIONS } from '../models/catalog.data';

const DEFAULT_TECHNICAL_WARNING =
  'Os quantitativos consideram traços e rendimentos técnicos convencionais. Em estruturas armadas ou obras de grande porte, consulte sempre um engenheiro civil ou arquiteto habilitado.';

const DEFAULT_PRICE_DISCLAIMER =
  'Preços médios regionais estimados com base na tabela de referência SINAPI/mercado local. Valores finais podem variar conforme fornecedor, frete e marca dos insumos.';

function findCatalogItem(id: string) {
  const item = BASE_MATERIALS_CATALOG.find(m => m.id === id);
  if (!item) {
    throw new Error(`Material catálogo não encontrado: ${id}`);
  }
  return item;
}

function buildMaterial(
  id: string,
  quantityRaw: number,
  quantityCommercial: number,
  location: RegionalLocation,
  overrideUnit?: string,
  purpose?: string
): MaterialItem {
  const catalog = findCatalogItem(id);
  const adjustedPrice = Math.round(catalog.basePrice * (location.priceMultiplier || 1) * 100) / 100;
  const totalPrice = Math.round(quantityCommercial * adjustedPrice * 100) / 100;
  const roundedRaw = Math.round(quantityRaw * 100) / 100;

  return {
    id: catalog.id,
    name: catalog.name,
    category: catalog.category,
    unit: overrideUnit || catalog.commercialUnit,
    quantityRaw: roundedRaw,
    theoreticalQuantity: roundedRaw,
    quantityCommercial,
    commercialQuantity: quantityCommercial,
    unitPrice: adjustedPrice,
    totalPrice,
    commercialPackageDescription: catalog.baseUnit,
    purpose: purpose || catalog.description
  };
}

function resolveLocation(location?: Partial<RegionalLocation> | string): RegionalLocation {
  if (typeof location === 'string') {
    const found = REGIONAL_LOCATIONS.find(l => l.uf.toUpperCase() === location.toUpperCase());
    if (found) return found;
  } else if (location && typeof location === 'object') {
    if (location.priceMultiplier && location.uf) {
      return {
        uf: location.uf,
        stateName: location.stateName || location.uf,
        city: location.city || location.stateName || location.uf,
        priceMultiplier: Number(location.priceMultiplier) || 1.0,
        source: location.source || `SINAPI-${location.uf}`
      };
    }
    if (location.uf) {
      const found = REGIONAL_LOCATIONS.find(l => l.uf.toUpperCase() === location.uf!.toUpperCase());
      if (found) return found;
    }
  }
  return REGIONAL_LOCATIONS[0];
}

function normalizeBlockType(raw?: string): 'bloco_14' | 'bloco_09' | 'tijolo_8f' {
  if (raw === 'bloco_9' || raw === 'bloco_09') return 'bloco_09';
  if (raw === 'tijolo_8f') return 'tijolo_8f';
  return 'bloco_14';
}

function normalizeRenderType(raw?: string): 'ambas_faces' | 'uma_face' | 'sem_reboco' {
  if (raw === 'uma' || raw === 'uma_face') return 'uma_face';
  if (raw === 'sem' || raw === 'sem_reboco') return 'sem_reboco';
  return 'ambas_faces';
}

function normalizeMixRatio(raw?: string): '1_2_3' | '1_2.5_3.5' | '1_3_4' {
  if (raw === '1:2.5:3.5' || raw === '1_2.5_3.5') return '1_2.5_3.5';
  if (raw === '1:3:4' || raw === '1_3_4') return '1_3_4';
  return '1_2_3';
}

function normalizeFoundationType(raw?: string): 'sapata_isolada' | 'baldrame' | 'estaca_broca' {
  if (raw === 'sapata' || raw === 'sapata_isolada') return 'sapata_isolada';
  if (raw === 'estaca' || raw === 'estaca_broca') return 'estaca_broca';
  return 'baldrame';
}

function normalizeRoofTileType(raw?: string): 'ceramica_romana' | 'fibrocimento_ondulada' {
  if (raw === 'fibrocimento' || raw === 'fibrocimento_ondulada') return 'fibrocimento_ondulada';
  return 'ceramica_romana';
}

export class CalculationService {
  // 1. Muro
  static calculateMuro(params: any): CalculationResult {
    const location = resolveLocation(params.location);
    const length = Math.max(0.1, Number(params.length) || 0);
    const height = Math.max(0.1, Number(params.height) || 0);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage ?? 10)));
    const blockType = normalizeBlockType(params.blockType);

    const grossArea = length * height;
    const doorsArea = (Number(params.doorsCount) || 0) * (Number(params.doorWidth) || 0) * (Number(params.doorHeight) || 0);
    const windowsArea = (Number(params.windowsCount) || 0) * (Number(params.windowWidth) || 0) * (Number(params.windowHeight) || 0);
    const netArea = Math.max(0.1, grossArea - (doorsArea + windowsArea));

    const wasteMultiplier = 1 + waste / 100;
    const materials: MaterialItem[] = [];

    let blockConsumptionPerM2 = 12.5;
    let blockId = 'mat_bloco_concreto_14';
    let blockName = 'Bloco de Concreto 14x19x39';

    if (blockType === 'bloco_09') {
      blockId = 'mat_bloco_concreto_09';
      blockName = 'Bloco de Concreto 09x19x39';
    } else if (blockType === 'tijolo_8f') {
      blockConsumptionPerM2 = 25.0;
      blockId = 'mat_tijolo_ceramico_8f';
      blockName = 'Tijolo Cerâmico 8 Furos 9x19x19';
    }

    const rawBlocks = netArea * blockConsumptionPerM2 * wasteMultiplier;
    const commercialBlocks = Math.ceil(rawBlocks);
    materials.push(buildMaterial(blockId, rawBlocks, commercialBlocks, location, 'unidades', 'Alvenaria do muro'));

    const rawCimento = netArea * 0.15 * wasteMultiplier;
    const commCimento = Math.ceil(rawCimento);
    materials.push(buildMaterial('mat_cimento_50kg', rawCimento, commCimento, location, 'sacos 50kg', 'Argamassa de assentamento das fiadas'));

    const rawAreia = netArea * 0.022 * wasteMultiplier;
    const commAreia = Math.max(0.5, Math.round(rawAreia * 10) / 10);
    materials.push(buildMaterial('mat_areia_media', rawAreia, commAreia, location, 'm³', 'Areia lavada para mistura da argamassa'));

    const subtotal = Math.round(materials.reduce((acc, m) => acc + m.totalPrice, 0) * 100) / 100;
    const wasteCost = Math.round(subtotal * (waste / 100) * 100) / 100;
    const roundedArea = Math.round(netArea * 100) / 100;

    return {
      workType: 'muro',
      workTypeName: 'Muro de Vedação',
      area: roundedArea,
      areaM2: roundedArea,
      perimeter: Math.round(length * 100) / 100,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área Líquida = (Comprimento ${length}m × Altura ${height}m) - Vãos (${(doorsArea + windowsArea).toFixed(2)}m²) = ${netArea.toFixed(2)} m²`,
        `Consumo ${blockName}: ${blockConsumptionPerM2} un/m² × ${netArea.toFixed(2)} m² × ${wasteMultiplier.toFixed(2)} = ${commercialBlocks} un`,
        `Cimento para assentamento: 0,15 sacos/m² × ${netArea.toFixed(2)} m² = ${commCimento} sacos de 50 kg`,
        `Areia lavada média: 0,022 m³/m² × ${netArea.toFixed(2)} m² = ${commAreia.toFixed(2)} m³`
      ],
      technicalPremises: [
        'Junta de assentamento considerada entre 10 mm e 15 mm.',
        'Não inclui vigas baldrame ou pilares de amarração (calcule no módulo Fundação/Concreto caso necessário).',
        'Quantidades comerciais arredondadas para cima evitando falta de material.'
      ],
      technicalWarning: DEFAULT_TECHNICAL_WARNING,
      priceDisclaimer: DEFAULT_PRICE_DISCLAIMER,
      inputSummary: {
        'Comprimento': `${length} m`,
        'Altura': `${height} m`,
        'Tipo de Bloco': blockName,
        'Desperdício': `${waste}%`,
        'Região/UF': `${location.city} (${location.uf})`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 2. Parede
  static calculateParede(params: any): CalculationResult {
    const location = resolveLocation(params.location);
    const length = Math.max(0.1, Number(params.length) || 0);
    const height = Math.max(0.1, Number(params.height) || 0);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage ?? 10)));
    const blockType = normalizeBlockType(params.blockType);
    const renderType = normalizeRenderType(params.renderType ?? params.plasterType);

    const grossArea = length * height;
    const doorsArea = (Number(params.doorsCount) || 0) * (Number(params.doorWidth) || 0) * (Number(params.doorHeight) || 0);
    const windowsArea = (Number(params.windowsCount) || 0) * (Number(params.windowWidth) || 0) * (Number(params.windowHeight) || 0);
    const netArea = Math.max(0.1, grossArea - (doorsArea + windowsArea));

    const wasteMultiplier = 1 + waste / 100;
    const materials: MaterialItem[] = [];

    let blockConsumptionPerM2 = 12.5;
    let blockId = 'mat_bloco_concreto_14';
    if (blockType === 'bloco_09') {
      blockId = 'mat_bloco_concreto_09';
    } else if (blockType === 'tijolo_8f') {
      blockConsumptionPerM2 = 25.0;
      blockId = 'mat_tijolo_ceramico_8f';
    }

    const rawBlocks = netArea * blockConsumptionPerM2 * wasteMultiplier;
    materials.push(buildMaterial(blockId, rawBlocks, Math.ceil(rawBlocks), location, 'unidades', 'Alvenaria de vedação'));

    let rawCimento = netArea * 0.14 * wasteMultiplier;
    let rawAreia = netArea * 0.022 * wasteMultiplier;
    let rawCal = 0;

    const renderMultiplier = renderType === 'ambas_faces' ? 2 : renderType === 'uma_face' ? 1 : 0;
    if (renderMultiplier > 0) {
      const renderArea = netArea * renderMultiplier;
      rawCimento += renderArea * 0.20 * wasteMultiplier;
      rawCal += renderArea * 0.16 * wasteMultiplier;
      rawAreia += renderArea * 0.03 * wasteMultiplier;
      materials.push(buildMaterial('mat_cal_hidratada', rawCal, Math.ceil(rawCal), location, 'sacos 20kg', 'Cal para emboço e reboco'));
    }

    materials.push(buildMaterial('mat_cimento_50kg', rawCimento, Math.ceil(rawCimento), location, 'sacos 50kg', 'Cimento para alvenaria e revestimento'));
    materials.push(buildMaterial('mat_areia_media', rawAreia, Math.max(0.5, Math.round(rawAreia * 10) / 10), location, 'm³', 'Areia para alvenaria e reboco'));

    const subtotal = Math.round(materials.reduce((acc, m) => acc + m.totalPrice, 0) * 100) / 100;
    const wasteCost = Math.round(subtotal * (waste / 100) * 100) / 100;
    const roundedArea = Math.round(netArea * 100) / 100;

    return {
      workType: 'parede',
      workTypeName: 'Parede de Alvenaria',
      area: roundedArea,
      areaM2: roundedArea,
      perimeter: Math.round(length * 100) / 100,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área Parede: ${netArea.toFixed(2)} m² (descontados ${(doorsArea + windowsArea).toFixed(2)} m² de aberturas)`,
        `Alvenaria: ${blockConsumptionPerM2} blocos/m² × ${netArea.toFixed(2)} m² = ${Math.ceil(rawBlocks)} un`,
        renderMultiplier > 0
          ? `Reboco (${renderType}): ${renderMultiplier} face(s) = ${(netArea * renderMultiplier).toFixed(2)} m² de revestimento`
          : 'Alvenaria sem aplicação de reboco'
      ],
      technicalPremises: [
        'Espessura média de revestimento considerada de 15 mm a 20 mm.',
        'Proporção do traço de emboço: 1:2:8 (cimento, cal e areia).',
        'Consumo de cal calculado para promover plasticidade e evitar fissuras.'
      ],
      technicalWarning: DEFAULT_TECHNICAL_WARNING,
      priceDisclaimer: DEFAULT_PRICE_DISCLAIMER,
      inputSummary: {
        'Comprimento': `${length} m`,
        'Altura': `${height} m`,
        'Reboco': renderType,
        'Desperdício': `${waste}%`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 3. Piso
  static calculatePiso(params: any): CalculationResult {
    const location = resolveLocation(params.location);
    const length = Math.max(0.1, Number(params.length) || 0);
    const width = Math.max(0.1, Number(params.width) || 0);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage ?? 12)));
    const tileType = params.tileType === 'porcelanato' ? 'porcelanato' : 'ceramica_padrao';
    const tileSizeCm = Number(params.tileSizeCm) || 60;

    const area = length * width;
    const wasteMultiplier = 1 + waste / 100;
    const totalAreaWithWaste = area * wasteMultiplier;

    const materials: MaterialItem[] = [];
    const pisoId = tileType === 'porcelanato' ? 'mat_porcelanato' : 'mat_piso_ceramico_padrao';
    const commercialArea = Math.ceil(totalAreaWithWaste / 1.8) * 1.8;
    materials.push(
      buildMaterial(pisoId, totalAreaWithWaste, Math.round(commercialArea * 100) / 100, location, 'm² (caixas)', 'Placas de piso com sobra para recortes')
    );

    const isBigFormat = tileSizeCm >= 60;
    const mortarKgPerM2 = isBigFormat ? 7.5 : 5.0;
    const mortarId = tileType === 'porcelanato' ? 'mat_argamassa_ac3' : 'mat_argamassa_ac1';
    const totalMortarKg = totalAreaWithWaste * mortarKgPerM2;
    const mortarSacks = Math.ceil(totalMortarKg / 20);
    materials.push(
      buildMaterial(mortarId, totalMortarKg / 20, mortarSacks, location, 'sacos 20kg', isBigFormat ? 'Argamassa colante (dupla colagem recomendada)' : 'Argamassa colante')
    );

    const groutKgPerM2 = isBigFormat ? 0.35 : 0.55;
    const totalGroutKg = Math.max(1, Math.ceil(totalAreaWithWaste * groutKgPerM2));
    materials.push(buildMaterial('mat_rejunte_cimenticio', totalAreaWithWaste * groutKgPerM2, totalGroutKg, location, 'kg', 'Rejunte flexível antimofo'));

    const subtotal = Math.round(materials.reduce((acc, m) => acc + m.totalPrice, 0) * 100) / 100;
    const wasteCost = Math.round(subtotal * (waste / 100) * 100) / 100;
    const roundedArea = Math.round(area * 100) / 100;

    return {
      workType: 'piso',
      workTypeName: 'Piso e Porcelanato',
      area: roundedArea,
      areaM2: roundedArea,
      perimeter: Math.round(2 * (length + width) * 100) / 100,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área do Cômodo: ${length} m × ${width} m = ${area.toFixed(2)} m²`,
        `Área com Recortes (+${waste}%): ${totalAreaWithWaste.toFixed(2)} m²`,
        `Argamassa (${mortarKgPerM2} kg/m²): ${totalMortarKg.toFixed(1)} kg → ${mortarSacks} sacos de 20 kg`,
        `Rejunte: ${groutKgPerM2} kg/m² × ${totalAreaWithWaste.toFixed(2)} m² = ${totalGroutKg} kg`
      ],
      technicalPremises: [
        isBigFormat ? 'Peças a partir de 60x60cm exigem dupla colagem (chão e verso da placa com AC-III).' : 'Peças padrão utilizam colagem simples.',
        'Assentamento sobre contrapiso curado e limpo com juntas conforme instrução do fabricante.',
        'Margem de recortes inclui rodapés simples.'
      ],
      technicalWarning: DEFAULT_TECHNICAL_WARNING,
      priceDisclaimer: DEFAULT_PRICE_DISCLAIMER,
      inputSummary: {
        'Comprimento': `${length} m`,
        'Largura': `${width} m`,
        'Tamanho da Peça': `${tileSizeCm} cm`,
        'Tipo': tileType === 'porcelanato' ? 'Porcelanato Retificado' : 'Cerâmica Esmaltada',
        'Desperdício': `${waste}%`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 4. Pintura
  static calculatePintura(params: any): CalculationResult {
    const location = resolveLocation(params.location);
    const wallLength = Math.max(0.1, Number(params.wallLength ?? params.length) || 0);
    const height = Math.max(0.1, Number(params.height) || 0);
    const wallsCount = Math.max(1, Number(params.wallsCount) || 1);
    const coats = Math.max(1, Number(params.coats) || 2);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage ?? 8)));
    const needsSealer = Boolean(params.needsSealer ?? params.needPrimer ?? false);
    const needsPutty = Boolean(params.needsPutty ?? false);
    const yieldPerLiter = Math.max(1, Number(params.paintYieldM2PerLiter ?? params.paintYield) || 10);

    const grossWallsArea = wallLength * height * wallsCount;
    const doorsArea = (Number(params.doorsCount) || 0) * (Number(params.doorWidth) || 0.8) * (Number(params.doorHeight) || 2.1);
    const windowsArea = (Number(params.windowsCount) || 0) * (Number(params.windowWidth) || 1.2) * (Number(params.windowHeight) || 1.0);
    let netArea = Math.max(0.1, grossWallsArea - (doorsArea + windowsArea));

    if (params.includeCeiling && params.ceilingArea) {
      netArea += Number(params.ceilingArea) || 0;
    }

    const wasteMultiplier = 1 + waste / 100;
    const materials: MaterialItem[] = [];

    const totalPaintedArea = netArea * coats * wasteMultiplier;
    const litersRequired = totalPaintedArea / yieldPerLiter;
    const cans18L = Math.ceil(litersRequired / 18);

    materials.push(
      buildMaterial(
        'mat_tinta_acrilica_18l',
        litersRequired / 18,
        cans18L,
        location,
        'latas 18L',
        `Tinta acrílica para ${coats} demãos (${litersRequired.toFixed(1)} L necessários)`
      )
    );

    if (needsSealer) {
      const sealerLiters = (netArea * wasteMultiplier) / 12;
      const sealerCans = Math.max(1, Math.ceil(sealerLiters / 18));
      materials.push(
        buildMaterial('mat_selador_acrilico_18l', sealerLiters / 18, sealerCans, location, 'latas 18L', 'Fundo preparador para selar alvenaria e uniformizar absorção')
      );
    }

    if (needsPutty) {
      const puttyKg = netArea * 1.1 * wasteMultiplier;
      const puttyBuckets = Math.max(1, Math.ceil(puttyKg / 25));
      materials.push(
        buildMaterial('mat_massa_corrida_25kg', puttyKg / 25, puttyBuckets, location, 'barricas 25kg', 'Emassamento fino para nivelamento das paredes')
      );
    }

    materials.push(
      buildMaterial('mat_kit_pintura', 1, 1, location, 'kit completo', 'Rolos antigota, pincel, bandeja, fita crepe e lixas')
    );

    const subtotal = Math.round(materials.reduce((acc, m) => acc + m.totalPrice, 0) * 100) / 100;
    const wasteCost = Math.round(subtotal * (waste / 100) * 100) / 100;
    const roundedArea = Math.round(netArea * 100) / 100;

    return {
      workType: 'pintura',
      workTypeName: 'Pintura Residencial/Comercial',
      area: roundedArea,
      areaM2: roundedArea,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área Líquida: ${netArea.toFixed(2)} m² (${wallsCount} parede(s) - aberturas)`,
        `Área Total com ${coats} Demãos (+${waste}% perda): ${totalPaintedArea.toFixed(2)} m²`,
        `Volume de Tinta: ${totalPaintedArea.toFixed(2)} m² ÷ ${yieldPerLiter} m²/L = ${litersRequired.toFixed(1)} L → ${cans18L} lata(s) de 18L`,
        needsPutty ? `Massa Corrida: ${Math.max(1, Math.ceil(netArea * 1.1 * wasteMultiplier / 25))} barrica(s) de 25 kg` : 'Sem massa corrida inclusa'
      ],
      technicalPremises: [
        `Rendimento considerado de ${yieldPerLiter} m²/L por demão conforme especificação técnica.`,
        'Recomenda-se lixar e limpar a poeira entre as demãos.',
        'Para reboco virgem, a aplicação de selador é indispensável para economizar tinta.'
      ],
      technicalWarning: DEFAULT_TECHNICAL_WARNING,
      priceDisclaimer: DEFAULT_PRICE_DISCLAIMER,
      inputSummary: {
        'Extensão Total': `${wallLength} m`,
        'Altura': `${height} m`,
        'Qtd Paredes': `${wallsCount}`,
        'Demãos': `${coats}`,
        'Selador': needsSealer ? 'Sim' : 'Não',
        'Massa Corrida': needsPutty ? 'Sim' : 'Não'
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 5. Concreto
  static calculateConcreto(params: any): CalculationResult {
    const location = resolveLocation(params.location);
    const length = Math.max(0.1, Number(params.length) || 0);
    const width = Math.max(0.1, Number(params.width) || 0);
    const depth = Math.max(0.05, Number(params.heightOrDepth ?? params.depth ?? params.height) || 0.1);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage ?? 10)));
    const mixRatio = normalizeMixRatio(params.mixRatio ?? params.concreteMix);

    const volume = length * width * depth;
    const wasteMultiplier = 1 + waste / 100;
    const volumeWithWaste = volume * wasteMultiplier;

    let cimentoSacosPerM3 = 7.0;
    let areiaM3PerM3 = 0.55;
    let britaM3PerM3 = 0.83;
    let mixName = '1:2:3 (Estrutural ~25 MPa - Lajes, vigas e sapatas)';

    if (mixRatio === '1_2.5_3.5') {
      cimentoSacosPerM3 = 6.0;
      areiaM3PerM3 = 0.58;
      britaM3PerM3 = 0.85;
      mixName = '1:2.5:3.5 (Uso geral / Contrapiso ~20 MPa)';
    } else if (mixRatio === '1_3_4') {
      cimentoSacosPerM3 = 4.8;
      areiaM3PerM3 = 0.60;
      britaM3PerM3 = 0.88;
      mixName = '1:3:4 (Concreto magro / Lastro)';
    }

    const rawCimento = volumeWithWaste * cimentoSacosPerM3;
    const commCimento = Math.ceil(rawCimento);

    const rawAreia = volumeWithWaste * areiaM3PerM3;
    const commAreia = Math.max(0.5, Math.round(rawAreia * 10) / 10);

    const rawBrita = volumeWithWaste * britaM3PerM3;
    const commBrita = Math.max(0.5, Math.round(rawBrita * 10) / 10);

    const materials: MaterialItem[] = [
      buildMaterial('mat_cimento_50kg', rawCimento, commCimento, location, 'sacos 50kg', 'Cimento Portland CP II'),
      buildMaterial('mat_areia_media', rawAreia, commAreia, location, 'm³', 'Areia lavada média'),
      buildMaterial('mat_brita_1', rawBrita, commBrita, location, 'm³', 'Pedra britada nº 1')
    ];

    const subtotal = Math.round(materials.reduce((acc, m) => acc + m.totalPrice, 0) * 100) / 100;
    const wasteCost = Math.round(subtotal * (waste / 100) * 100) / 100;
    const roundedArea = Math.round(length * width * 100) / 100;
    const roundedVol = Math.round(volume * 1000) / 1000;

    return {
      workType: 'concreto',
      workTypeName: 'Concreto Estrutural',
      area: roundedArea,
      areaM2: roundedArea,
      volume: roundedVol,
      volumeM3: roundedVol,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Volume Geométrico: ${length}m × ${width}m × ${depth}m = ${volume.toFixed(3)} m³`,
        `Volume com Perda (+${waste}%): ${volumeWithWaste.toFixed(3)} m³`,
        `Consumo Traço ${mixName}:`,
        `• Cimento: ${cimentoSacosPerM3} sacos/m³ × ${volumeWithWaste.toFixed(2)} m³ = ${commCimento} sacos de 50 kg`,
        `• Areia Lavada: ${areiaM3PerM3} m³/m³ × ${volumeWithWaste.toFixed(2)} m³ = ${commAreia.toFixed(2)} m³`,
        `• Pedra Brita 1: ${britaM3PerM3} m³/m³ × ${volumeWithWaste.toFixed(2)} m³ = ${commBrita.toFixed(2)} m³`
      ],
      technicalPremises: [
        'Relação água/cimento média recomendada de 0,55 (cerca de 28 a 30 litros de água por saco de cimento).',
        'Cura úmida obrigatória por no mínimo 7 dias após a concretagem.',
        'Em volumes superiores a 4 m³, consulte a viabilidade de concreto usinado bombeado.'
      ],
      technicalWarning: DEFAULT_TECHNICAL_WARNING,
      priceDisclaimer: DEFAULT_PRICE_DISCLAIMER,
      inputSummary: {
        'Comprimento': `${length} m`,
        'Largura': `${width} m`,
        'Espessura/Profundidade': `${depth} m`,
        'Traço Escolhido': mixName,
        'Volume Total': `${volume.toFixed(2)} m³`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 6. Fundação
  static calculateFundacao(params: any): CalculationResult {
    const location = resolveLocation(params.location);
    const foundationType = normalizeFoundationType(params.foundationType);
    const qty = Math.max(1, Number(params.linearMetersOrUnits ?? params.length) || 1);
    const width = Math.max(0.15, Number(params.widthOrDiameter ?? params.width) || 0.2);
    const depth = Math.max(0.2, Number(params.depthOrHeight ?? params.depth ?? params.height) || 0.4);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage ?? 12)));

    let volumeM3 = 0;
    let typeName = 'Viga Baldrame';

    if (foundationType === 'baldrame') {
      volumeM3 = qty * width * depth;
      typeName = `Viga Baldrame (${qty} m lineares)`;
    } else if (foundationType === 'sapata_isolada') {
      volumeM3 = qty * (width * width * depth);
      typeName = `${qty} Sapatas Isoladas (${width}x${width}x${depth}m)`;
    } else {
      const radius = width / 2;
      volumeM3 = qty * (Math.PI * radius * radius * depth);
      typeName = `${qty} Estacas Broca (Ø ${width}m x ${depth}m)`;
    }

    const wasteMultiplier = 1 + waste / 100;
    const volumeWithWaste = volumeM3 * wasteMultiplier;

    const rawCimento = volumeWithWaste * 7.0;
    const commCimento = Math.ceil(rawCimento);

    const rawAreia = volumeWithWaste * 0.55;
    const commAreia = Math.max(0.5, Math.round(rawAreia * 10) / 10);

    const rawBrita = volumeWithWaste * 0.83;
    const commBrita = Math.max(0.5, Math.round(rawBrita * 10) / 10);

    const totalSteelKg = volumeWithWaste * 75;
    const steelBars = Math.ceil(totalSteelKg / 7.4);
    const wireKg = Math.max(1, Math.ceil(totalSteelKg * 0.015));

    const boardsCount =
      foundationType === 'baldrame' ? Math.ceil(((qty * 2) / 3) * 1.1) : Math.max(2, Math.ceil(qty * 1.5));

    const materials: MaterialItem[] = [
      buildMaterial('mat_cimento_50kg', rawCimento, commCimento, location, 'sacos 50kg', 'Cimento estrutural para fundação'),
      buildMaterial('mat_areia_media', rawAreia, commAreia, location, 'm³', 'Areia lavada para concreto'),
      buildMaterial('mat_brita_1', rawBrita, commBrita, location, 'm³', 'Brita 1 para fundações'),
      buildMaterial('mat_aco_ca50_10mm', totalSteelKg / 7.4, steelBars, location, 'barras 12m', `Aço CA-50 Ø 10mm (${Math.round(totalSteelKg)} kg de armação)`),
      buildMaterial('mat_arame_recozido', totalSteelKg * 0.015, wireKg, location, 'kg', 'Arame recozido nº 18 para amarração de ferragem'),
      buildMaterial('mat_tabua_pinus_forma', boardsCount, boardsCount, location, 'tábuas 3m', 'Caixaria e formas laterais')
    ];

    const subtotal = Math.round(materials.reduce((acc, m) => acc + m.totalPrice, 0) * 100) / 100;
    const wasteCost = Math.round(subtotal * (waste / 100) * 100) / 100;
    const roundedArea = Math.round(qty * width * 100) / 100;
    const roundedVol = Math.round(volumeM3 * 1000) / 1000;

    return {
      workType: 'fundacao',
      workTypeName: 'Fundação Estrutural',
      area: roundedArea,
      areaM2: roundedArea,
      volume: roundedVol,
      volumeM3: roundedVol,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Volume Efetivo: ${volumeM3.toFixed(3)} m³ (+${waste}% perda = ${volumeWithWaste.toFixed(3)} m³)`,
        `Taxa de Aço Média: 75 kg/m³ de concreto estrutural = ${totalSteelKg.toFixed(1)} kg → ${steelBars} barras de 12 m (Ø 10 mm)`,
        `Formas de Madeira: ${boardsCount} tábuas de 3 metros para contenção lateral`
      ],
      technicalPremises: [
        'Aço calculado com base em taxa média estrutural convencional para obras residenciais de até 2 pavimentos.',
        'OBRIGATÓRIO: Fundações dependem do laudo de sondagem do solo (SPT). Consulte um engenheiro calculista habilitado.',
        'Inclui impermeabilização básica na viga baldrame para prevenir umidade ascendente.'
      ],
      technicalWarning: DEFAULT_TECHNICAL_WARNING,
      priceDisclaimer: DEFAULT_PRICE_DISCLAIMER,
      inputSummary: {
        'Elemento': typeName,
        'Volume Concreto': `${volumeM3.toFixed(2)} m³`,
        'Aço Estimado': `${steelBars} barras (12m)`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 7. Telhado
  static calculateTelhado(params: any): CalculationResult {
    const location = resolveLocation(params.location);
    const length = Math.max(0.1, Number(params.length) || 0);
    const width = Math.max(0.1, Number(params.width) || 0);
    const slope = Math.max(10, Math.min(80, Number(params.slopePercentage ?? params.roofSlope ?? 30)));
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage ?? 10)));
    const tileType = normalizeRoofTileType(params.tileType ?? params.tileRoofType);
    const includeWoodwork = params.includeWoodwork !== undefined ? Boolean(params.includeWoodwork) : true;

    const projectedArea = length * width;
    const slopeFactor = Math.sqrt(1 + Math.pow(slope / 100, 2));
    const realRoofArea = projectedArea * slopeFactor;
    const wasteMultiplier = 1 + waste / 100;
    const areaWithWaste = realRoofArea * wasteMultiplier;

    const materials: MaterialItem[] = [];

    if (tileType === 'ceramica_romana') {
      const rawTiles = areaWithWaste * 16;
      materials.push(buildMaterial('mat_telha_ceramica_romana', rawTiles, Math.ceil(rawTiles), location, 'unidades', 'Telhas cerâmicas tipo Romana/Colonial'));
    } else {
      const rawSheets = areaWithWaste / 2.15;
      materials.push(buildMaterial('mat_telha_fibrocimento', rawSheets, Math.ceil(rawSheets), location, 'placas', 'Telhas onduladas de fibrocimento 2,44 x 1,10 m'));
    }

    if (includeWoodwork) {
      materials.push(buildMaterial('mat_madeiramento_telhado', areaWithWaste, Math.ceil(areaWithWaste), location, 'm² coberto', 'Estrutura completa de madeira (caibros, ripas e vigas)'));
    }

    const subtotal = Math.round(materials.reduce((acc, m) => acc + m.totalPrice, 0) * 100) / 100;
    const wasteCost = Math.round(subtotal * (waste / 100) * 100) / 100;
    const roundedArea = Math.round(realRoofArea * 100) / 100;

    return {
      workType: 'telhado',
      workTypeName: 'Telhado e Cobertura',
      area: roundedArea,
      areaM2: roundedArea,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área Projetada em Planta: ${length} m × ${width} m = ${projectedArea.toFixed(2)} m²`,
        `Fator de Correção de Inclinação (${slope}%): ${slopeFactor.toFixed(3)}`,
        `Área Real da Cobertura: ${projectedArea.toFixed(2)} m² × ${slopeFactor.toFixed(3)} = ${realRoofArea.toFixed(2)} m²`,
        tileType === 'ceramica_romana'
          ? `Telhas Cerâmicas: 16 un/m² × ${areaWithWaste.toFixed(2)} m² = ${Math.ceil(areaWithWaste * 16)} unidades`
          : `Telhas Fibrocimento: ${Math.ceil(areaWithWaste / 2.15)} placas de 2,44x1,10m`
      ],
      technicalPremises: [
        'Inclinação mínima recomendada: 30% a 35% para telhas cerâmicas e 15% a 20% para fibrocimento.',
        'Não inclui rufos, calhas e condutores pluviais.',
        'Madeiramento dimensionado para resistir à sobrecarga de vento conforme NBR 6123.'
      ],
      technicalWarning: DEFAULT_TECHNICAL_WARNING,
      priceDisclaimer: DEFAULT_PRICE_DISCLAIMER,
      inputSummary: {
        'Comprimento': `${length} m`,
        'Largura': `${width} m`,
        'Inclinação': `${slope}%`,
        'Área Real': `${realRoofArea.toFixed(2)} m²`,
        'Tipo de Telha': tileType === 'ceramica_romana' ? 'Cerâmica Romana' : 'Fibrocimento Ondulada'
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 8. Revestimento
  static calculateRevestimento(params: any): CalculationResult {
    const location = resolveLocation(params.location);
    const length = Math.max(0.1, Number(params.length) || 0);
    const height = Math.max(0.1, Number(params.height) || 0);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage ?? 10)));

    const grossArea = length * height;
    const openings = (Number(params.doorsCount) || 0) * 1.6 + (Number(params.windowsCount) || 0) * 1.2;
    const netArea = Math.max(0.1, grossArea - openings);
    const wasteMultiplier = 1 + waste / 100;
    const areaWithWaste = netArea * wasteMultiplier;

    const materials: MaterialItem[] = [];
    const commercialArea = Math.ceil(areaWithWaste / 1.8) * 1.8;
    materials.push(buildMaterial('mat_piso_ceramico_padrao', areaWithWaste, Math.round(commercialArea * 100) / 100, location, 'm² (caixas)', 'Revestimento cerâmico para paredes'));

    const rawMortarKg = areaWithWaste * 4.5;
    const commMortarSacks = Math.ceil(rawMortarKg / 20);
    materials.push(buildMaterial('mat_argamassa_ac2', rawMortarKg / 20, commMortarSacks, location, 'sacos 20kg', 'Argamassa AC-II flexível para áreas úmidas'));

    const rawGroutKg = areaWithWaste * 0.4;
    const commGroutKg = Math.max(1, Math.ceil(rawGroutKg));
    materials.push(buildMaterial('mat_rejunte_cimenticio', rawGroutKg, commGroutKg, location, 'kg', 'Rejunte cimentício antimofo'));

    const subtotal = Math.round(materials.reduce((acc, m) => acc + m.totalPrice, 0) * 100) / 100;
    const wasteCost = Math.round(subtotal * (waste / 100) * 100) / 100;
    const roundedArea = Math.round(netArea * 100) / 100;

    return {
      workType: 'revestimento',
      workTypeName: 'Revestimento de Parede',
      area: roundedArea,
      areaM2: roundedArea,
      perimeter: Math.round(length * 100) / 100,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área Líquida: ${netArea.toFixed(2)} m² (descontados ${openings.toFixed(2)} m² de vãos)`,
        `Área com Recortes (+${waste}%): ${areaWithWaste.toFixed(2)} m²`,
        `Argamassa AC-II: 4,5 kg/m² × ${areaWithWaste.toFixed(2)} m² = ${rawMortarKg.toFixed(1)} kg → ${commMortarSacks} sacos de 20 kg`,
        `Rejunte: 0,40 kg/m² = ${commGroutKg} kg`
      ],
      technicalPremises: [
        'Aderência ideal sobre emboço curado há no mínimo 14 dias.',
        'Aplicação com desempenadeira denteada de 8 mm.'
      ],
      technicalWarning: DEFAULT_TECHNICAL_WARNING,
      priceDisclaimer: DEFAULT_PRICE_DISCLAIMER,
      inputSummary: {
        'Comprimento': `${length} m`,
        'Altura': `${height} m`,
        'Área': `${netArea.toFixed(2)} m²`,
        'Desperdício': `${waste}%`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 9. Outro tipo de obra
  static calculateOutro(params: any): CalculationResult {
    const location = resolveLocation(params.location);
    const derivedArea = Number(params.area) || (Number(params.length || 1) * Number(params.height || params.width || 1));
    const area = Math.max(0.5, derivedArea || 10);
    const thicknessM = Math.max(0.02, (Number(params.thicknessCm) || 5) / 100);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage ?? 10)));
    const description = String(params.description ?? params.customDescription ?? '').trim() || 'Obra Personalizada';
    const wasteMultiplier = 1 + waste / 100;

    const volumeM3 = area * thicknessM;
    const volumeWithWaste = volumeM3 * wasteMultiplier;

    const materials: MaterialItem[] = [];

    const rawCimento = volumeWithWaste * 6.0;
    materials.push(buildMaterial('mat_cimento_50kg', rawCimento, Math.ceil(rawCimento), location, 'sacos 50kg', 'Cimento para contrapiso/reparos'));

    const rawAreia = volumeWithWaste * 0.6;
    materials.push(buildMaterial('mat_areia_media', rawAreia, Math.max(0.5, Math.round(rawAreia * 10) / 10), location, 'm³', 'Areia lavada'));

    const rawBrita = volumeWithWaste * 0.8;
    materials.push(buildMaterial('mat_brita_1', rawBrita, Math.max(0.5, Math.round(rawBrita * 10) / 10), location, 'm³', 'Pedra britada'));

    if (params.includeMasonry) {
      const blocks = Math.ceil(area * 12.5 * wasteMultiplier);
      materials.push(buildMaterial('mat_bloco_concreto_14', area * 12.5 * wasteMultiplier, blocks, location, 'unidades', 'Blocos de concreto auxiliares'));
    }

    if (params.includePainting) {
      const cans = Math.max(1, Math.ceil((area * 2 * wasteMultiplier) / (10 * 18)));
      materials.push(buildMaterial('mat_tinta_acrilica_18l', (area * 2 * wasteMultiplier) / (10 * 18), cans, location, 'latas 18L', 'Tinta acrílica para acabamento'));
    }

    const subtotal = Math.round(materials.reduce((acc, m) => acc + m.totalPrice, 0) * 100) / 100;
    const wasteCost = Math.round(subtotal * (waste / 100) * 100) / 100;
    const roundedArea = Math.round(area * 100) / 100;
    const roundedVol = Math.round(volumeM3 * 1000) / 1000;

    return {
      workType: 'outro',
      workTypeName: description,
      area: roundedArea,
      areaM2: roundedArea,
      volume: roundedVol,
      volumeM3: roundedVol,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área informada: ${area.toFixed(2)} m² com espessura de ${(thicknessM * 100).toFixed(0)} cm = ${volumeM3.toFixed(3)} m³`,
        `Composição base de aglomerantes e agregados com ${waste}% de margem de segurança`
      ],
      technicalPremises: [
        'Valores médios para reparos, contrapisos e obras mistas.',
        'Verifique com seu profissional de obra os traços específicos do serviço.'
      ],
      technicalWarning: DEFAULT_TECHNICAL_WARNING,
      priceDisclaimer: DEFAULT_PRICE_DISCLAIMER,
      inputSummary: {
        'Área': `${area.toFixed(2)} m²`,
        'Espessura': `${(thicknessM * 100).toFixed(0)} cm`,
        'Descrição': description
      },
      calculatedAt: new Date().toISOString()
    };
  }

  static calculate(workType: WorkTypeKey, params: any): CalculationResult {
    switch (workType) {
      case 'muro':
        return this.calculateMuro(params);
      case 'parede':
        return this.calculateParede(params);
      case 'piso':
        return this.calculatePiso(params);
      case 'pintura':
        return this.calculatePintura(params);
      case 'concreto':
        return this.calculateConcreto(params);
      case 'fundacao':
        return this.calculateFundacao(params);
      case 'telhado':
        return this.calculateTelhado(params);
      case 'revestimento':
        return this.calculateRevestimento(params);
      case 'outro':
        return this.calculateOutro(params);
      default:
        throw new Error(`Tipo de obra não suportado: ${workType}`);
    }
  }
}
