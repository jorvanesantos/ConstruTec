import { 
  WorkTypeKey, 
  CalculationResult, 
  MaterialItem, 
  RegionalLocation 
} from '../types';
import { BASE_MATERIALS_CATALOG, REGIONAL_LOCATIONS } from '../data/catalog';
import { DEFAULT_CALCULATION_SETTINGS, type CalculationSettings } from './calculationSettings';

function findCatalogItem(id: string) {
  const item = BASE_MATERIALS_CATALOG.find(m => m.id === id);
  if (!item) {
    throw new Error(`Material catálogo não encontrado: ${id}`);
  }
  return item;
}

let activeCalculationSettings: CalculationSettings = DEFAULT_CALCULATION_SETTINGS;

function buildMaterial(
  id: string,
  quantityRaw: number,
  quantityCommercial: number,
  location: RegionalLocation,
  overrideUnit?: string,
  purpose?: string
): MaterialItem {
  const catalog = findCatalogItem(id);
  const basePrice = activeCalculationSettings.materialPriceOverrides?.[id] ?? catalog.basePrice;
  const adjustedPrice = Math.round((basePrice * location.priceMultiplier) * 100) / 100;
  const totalPrice = Math.round((quantityCommercial * adjustedPrice) * 100) / 100;

  return {
    id: catalog.id,
    name: catalog.name,
    category: catalog.category,
    unit: overrideUnit || catalog.commercialUnit,
    quantityRaw: Math.round(quantityRaw * 100) / 100,
    quantityCommercial,
    unitPrice: adjustedPrice,
    totalPrice,
    commercialPackageDescription: catalog.baseUnit,
    purpose: purpose || catalog.description
  };
}

export class CalculationService {

  // 1. Muro
  static calculateMuro(params: {
    length: number;
    height: number;
    blockType: 'bloco_14' | 'bloco_09' | 'tijolo_8f';
    doorsCount?: number;
    doorWidth?: number;
    doorHeight?: number;
    windowsCount?: number;
    windowWidth?: number;
    windowHeight?: number;
    wastePercentage: number;
    location: RegionalLocation;
    calculationSettings?: CalculationSettings;
  }): CalculationResult {
    const length = Math.max(0.1, Number(params.length) || 0);
    const height = Math.max(0.1, Number(params.height) || 0);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage) || 10));

    const grossArea = length * height;
    const doorsArea = (params.doorsCount || 0) * (params.doorWidth || 0) * (params.doorHeight || 0);
    const windowsArea = (params.windowsCount || 0) * (params.windowWidth || 0) * (params.windowHeight || 0);
    const netArea = Math.max(0.1, grossArea - (doorsArea + windowsArea));

    const wasteMultiplier = 1 + (waste / 100);
    const materials: MaterialItem[] = [];

    const calculationSettings = params.calculationSettings || DEFAULT_CALCULATION_SETTINGS;
    let blockConsumptionPerM2 = calculationSettings.masonryUnitsPerM2.concreteBlock;
    let blockId = 'mat_bloco_concreto_14';
    let blockName = 'Bloco de Concreto 14x19x39';

    if (params.blockType === 'bloco_09') {
      blockConsumptionPerM2 = calculationSettings.masonryUnitsPerM2.concreteBlock;
      blockId = 'mat_bloco_concreto_09';
      blockName = 'Bloco de Concreto 09x19x39';
    } else if (params.blockType === 'tijolo_8f') {
      blockConsumptionPerM2 = calculationSettings.masonryUnitsPerM2.ceramicBrick;
      blockId = 'mat_tijolo_ceramico_8f';
      blockName = 'Tijolo Cerâmico 8 Furos 9x19x19';
    }

    // Quantidade de blocos com perda
    const rawBlocks = netArea * blockConsumptionPerM2 * wasteMultiplier;
    const commercialBlocks = Math.ceil(rawBlocks);
    materials.push(buildMaterial(blockId, rawBlocks, commercialBlocks, params.location, 'unidades', 'Alvenaria do muro'));

    // Argamassa de assentamento: ~0.02 m³ de argamassa por m² de parede
    // Traço 1:3 -> ~0.15 sacos de cimento por m² e ~0.022 m³ de areia média por m²
    const rawCimento = netArea * 0.15 * wasteMultiplier;
    const commCimento = Math.ceil(rawCimento);
    materials.push(buildMaterial('mat_cimento_50kg', rawCimento, commCimento, params.location, 'sacos 50kg', 'Argamassa de assentamento das fiadas'));

    const rawAreia = netArea * 0.022 * wasteMultiplier;
    const commAreia = Math.round(rawAreia * 10) / 10;
    materials.push(buildMaterial('mat_areia_media', rawAreia, Math.max(0.5, commAreia), params.location, 'm³', 'Areia lavada para mistura da argamassa'));

    const subtotal = materials.reduce((acc, m) => acc + m.totalPrice, 0);
    const wasteCost = Math.round((subtotal * (waste / 100)) * 100) / 100;
    const totalEstimated = subtotal;

    return {
      workType: 'muro',
      workTypeName: 'Muro de Vedação',
      area: Math.round(netArea * 100) / 100,
      perimeter: Math.round(length * 100) / 100,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((totalEstimated - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: totalEstimated,
      formulasUsed: [
        `Área Líquida = (Comprimento ${length}m × Altura ${height}m) - Vãos deduzidos (${(doorsArea + windowsArea).toFixed(2)}m²) = ${netArea.toFixed(2)} m²`,
        `Consumo ${blockName}: ${blockConsumptionPerM2} un/m² × ${netArea.toFixed(2)} m² × ${(wasteMultiplier).toFixed(2)} (perda) = ${commercialBlocks} un`,
        `Cimento para assentamento: 0,15 sacos/m² × ${netArea.toFixed(2)} m² = ${commCimento} sacos de 50 kg`,
        `Areia lavada média: 0,022 m³/m² × ${netArea.toFixed(2)} m² = ${commAreia.toFixed(2)} m³`
      ],
      technicalPremises: [
        'Junta de assentamento considerada entre 10 mm e 15 mm.',
        'Não inclui vigas baldrame ou pilares de amarração (calcule no módulo Fundação/Concreto caso necessário).',
        'Quantidades comerciais arredondadas para cima evitando falta de material.'
      ],
      inputSummary: {
        'Comprimento': `${length} m`,
        'Altura': `${height} m`,
        'Tipo de Bloco': blockName,
        'Desperdício': `${waste}%`,
        'Região/UF': `${params.location.city} (${params.location.uf})`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 2. Parede
  static calculateParede(params: {
    length: number;
    height: number;
    blockType: 'bloco_14' | 'bloco_09' | 'tijolo_8f';
    renderType: 'ambas_faces' | 'uma_face' | 'sem_reboco';
    doorsCount?: number;
    doorWidth?: number;
    doorHeight?: number;
    windowsCount?: number;
    windowWidth?: number;
    windowHeight?: number;
    wastePercentage: number;
    location: RegionalLocation;
    calculationSettings?: CalculationSettings;
  }): CalculationResult {
    const length = Math.max(0.1, Number(params.length) || 0);
    const height = Math.max(0.1, Number(params.height) || 0);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage) || 10));

    const grossArea = length * height;
    const doorsArea = (params.doorsCount || 0) * (params.doorWidth || 0) * (params.doorHeight || 0);
    const windowsArea = (params.windowsCount || 0) * (params.windowWidth || 0) * (params.windowHeight || 0);
    const netArea = Math.max(0.1, grossArea - (doorsArea + windowsArea));

    const wasteMultiplier = 1 + (waste / 100);
    const materials: MaterialItem[] = [];

    const calculationSettings = params.calculationSettings || DEFAULT_CALCULATION_SETTINGS;
    let blockConsumptionPerM2 = calculationSettings.masonryUnitsPerM2.concreteBlock;
    let blockId = 'mat_bloco_concreto_14';
    if (params.blockType === 'bloco_09') {
      blockId = 'mat_bloco_concreto_09';
    } else if (params.blockType === 'tijolo_8f') {
      blockConsumptionPerM2 = calculationSettings.masonryUnitsPerM2.ceramicBrick;
      blockId = 'mat_tijolo_ceramico_8f';
    }

    const rawBlocks = netArea * blockConsumptionPerM2 * wasteMultiplier;
    materials.push(buildMaterial(blockId, rawBlocks, Math.ceil(rawBlocks), params.location, 'unidades', 'Alvenaria de vedação'));

    // Cimento assentamento
    let rawCimento = netArea * 0.14 * wasteMultiplier;
    let rawAreia = netArea * 0.022 * wasteMultiplier;
    let rawCal = 0;

    // Reboco / Chapisco / Emboço
    const renderMultiplier = params.renderType === 'ambas_faces' ? 2 : (params.renderType === 'uma_face' ? 1 : 0);
    if (renderMultiplier > 0) {
      const renderArea = netArea * renderMultiplier;
      // Chapisco: 0.04 sacos/m², Reboco 15mm: 0.16 sacos cimento/m², 0.15 sacos cal/m², 0.025 m³ areia/m²
      rawCimento += (renderArea * 0.20 * wasteMultiplier);
      rawCal += (renderArea * 0.16 * wasteMultiplier);
      rawAreia += (renderArea * 0.03 * wasteMultiplier);

      materials.push(buildMaterial('mat_cal_hidratada', rawCal, Math.ceil(rawCal), params.location, 'sacos 20kg', 'Cal para emboço e reboco'));
    }

    materials.push(buildMaterial('mat_cimento_50kg', rawCimento, Math.ceil(rawCimento), params.location, 'sacos 50kg', 'Cimento para alvenaria e revestimento'));
    materials.push(buildMaterial('mat_areia_media', rawAreia, Math.max(0.5, Math.round(rawAreia * 10) / 10), params.location, 'm³', 'Areia para alvenaria e reboco'));

    const subtotal = materials.reduce((acc, m) => acc + m.totalPrice, 0);
    const wasteCost = Math.round((subtotal * (waste / 100)) * 100) / 100;

    return {
      workType: 'parede',
      workTypeName: 'Parede de Alvenaria',
      area: Math.round(netArea * 100) / 100,
      perimeter: Math.round(length * 100) / 100,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área Parede: ${netArea.toFixed(2)} m² (descontados ${(doorsArea + windowsArea).toFixed(2)} m² de aberturas)`,
        `Alvenaria: ${blockConsumptionPerM2} blocos/m² × ${netArea.toFixed(2)} m² = ${Math.ceil(rawBlocks)} un`,
        renderMultiplier > 0 ? `Reboco (${params.renderType}): ${renderMultiplier} face(s) = ${(netArea * renderMultiplier).toFixed(2)} m² de revestimento` : 'Alvenaria sem aplicação de reboco'
      ],
      technicalPremises: [
        'Espessura média de revestimento considerada de 15 mm a 20 mm.',
        'Proporção do traço de emboço: 1:2:8 (cimento, cal e areia).',
        'Consumo de cal calculado para promover plasticidade e evitar fissuras.'
      ],
      inputSummary: {
        'Comprimento': `${length} m`,
        'Altura': `${height} m`,
        'Reboco': params.renderType,
        'Desperdício': `${waste}%`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 3. Piso
  static calculatePiso(params: {
    length: number;
    width: number;
    tileType: 'porcelanato' | 'ceramica_padrao';
    tileSizeCm: number; // e.g. 60 (for 60x60)
    wastePercentage: number;
    location: RegionalLocation;
  }): CalculationResult {
    const length = Math.max(0.1, Number(params.length) || 0);
    const width = Math.max(0.1, Number(params.width) || 0);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage) || 10));

    const area = length * width;
    const wasteMultiplier = 1 + (waste / 100);
    const totalAreaWithWaste = area * wasteMultiplier;

    const materials: MaterialItem[] = [];

    // Pisos
    const pisoId = params.tileType === 'porcelanato' ? 'mat_porcelanato' : 'mat_piso_ceramico_padrao';
    // Arredondar para caixas inteiras (média 2 m² por caixa)
    const rawBoxesArea = totalAreaWithWaste;
    const commercialArea = Math.ceil(rawBoxesArea / 1.8) * 1.8;
    materials.push(buildMaterial(pisoId, rawBoxesArea, Math.round(commercialArea * 100) / 100, params.location, 'm² (caixas)', 'Placas de piso com sobra para recortes'));

    // Argamassa colante: ~5 kg/m² para peças até 40cm, ~8 kg/m² para peças > 40cm (dupla colagem)
    const isBigFormat = (params.tileSizeCm || 60) >= 60;
    const mortarKgPerM2 = isBigFormat ? 7.5 : 5.0;
    const mortarId = params.tileType === 'porcelanato' ? 'mat_argamassa_ac3' : 'mat_argamassa_ac1';
    const totalMortarKg = totalAreaWithWaste * mortarKgPerM2;
    const mortarSacks = Math.ceil(totalMortarKg / 20);
    materials.push(buildMaterial(mortarId, totalMortarKg / 20, mortarSacks, params.location, 'sacos 20kg', isBigFormat ? 'Argamassa colante (dupla colagem recomendada)' : 'Argamassa colante'));

    // Rejunte cimentício: ~(0.35 a 0.50 kg/m²)
    const groutKgPerM2 = isBigFormat ? 0.35 : 0.55;
    const totalGroutKg = Math.ceil(totalAreaWithWaste * groutKgPerM2);
    materials.push(buildMaterial('mat_rejunte_cimenticio', totalAreaWithWaste * groutKgPerM2, Math.max(1, totalGroutKg), params.location, 'kg', 'Rejunte flexível antimofo'));

    const subtotal = materials.reduce((acc, m) => acc + m.totalPrice, 0);
    const wasteCost = Math.round((subtotal * (waste / 100)) * 100) / 100;

    return {
      workType: 'piso',
      workTypeName: 'Piso e Porcelanato',
      area: Math.round(area * 100) / 100,
      perimeter: Math.round(2 * (length + width) * 100) / 100,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área do Cômodo: ${length} m × ${width} m = ${area.toFixed(2)} m²`,
        `Área com Recortes (+${waste}%): ${totalAreaWithWaste.toFixed(2)} m²`,
        `Argamassa (${mortarKgPerM2} kg/m²): ${(totalMortarKg).toFixed(1)} kg → ${mortarSacks} sacos de 20 kg`,
        `Rejunte: ${groutKgPerM2} kg/m² × ${totalAreaWithWaste.toFixed(2)} m² = ${totalGroutKg} kg`
      ],
      technicalPremises: [
        isBigFormat ? 'Peças a partir de 60x60cm exigem dupla colagem (chão e verso da placa com AC-III).' : 'Peças padrão utilizam colagem simples.',
        'Assentamento sobre contrapiso curado e limpo com juntas conforme instrução do fabricante.',
        'Margem de recortes inclui rodapés simples.'
      ],
      inputSummary: {
        'Comprimento': `${length} m`,
        'Largura': `${width} m`,
        'Tamanho da Peça': `${params.tileSizeCm || 60} cm`,
        'Tipo': params.tileType === 'porcelanato' ? 'Porcelanato Retificado' : 'Cerâmica Esmaltada',
        'Desperdício': `${waste}%`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 4. Pintura
  static calculatePintura(params: {
    wallLength: number;
    height: number;
    wallsCount?: number;
    includeCeiling?: boolean;
    ceilingArea?: number;
    coats: number; // demãos: 2 ou 3
    paintYieldM2PerLiter?: number; // padrão 10
    needsSealer: boolean;
    needsPutty: boolean; // massa corrida
    doorsCount?: number;
    doorWidth?: number;
    doorHeight?: number;
    windowsCount?: number;
    windowWidth?: number;
    windowHeight?: number;
    wastePercentage: number;
    location: RegionalLocation;
  }): CalculationResult {
    const wallLength = Math.max(0.1, Number(params.wallLength) || 0);
    const height = Math.max(0.1, Number(params.height) || 0);
    const wallsCount = Math.max(1, Number(params.wallsCount) || 1);
    const coats = Math.max(1, Number(params.coats) || 2);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage) || 8));

    const grossWallsArea = wallLength * height * wallsCount;
    const doorsArea = (params.doorsCount || 0) * (params.doorWidth || 0.8) * (params.doorHeight || 2.1);
    const windowsArea = (params.windowsCount || 0) * (params.windowWidth || 1.2) * (params.windowHeight || 1.0);
    let netArea = Math.max(0.1, grossWallsArea - (doorsArea + windowsArea));

    if (params.includeCeiling && params.ceilingArea) {
      netArea += Number(params.ceilingArea) || 0;
    }

    const wasteMultiplier = 1 + (waste / 100);
    const materials: MaterialItem[] = [];

    // Rendimento da tinta (litros necessários)
    // 1L cobre ~10 m² por demão
    const yieldPerLiter = params.paintYieldM2PerLiter || 10;
    const totalPaintedArea = netArea * coats * wasteMultiplier;
    const litersRequired = totalPaintedArea / yieldPerLiter;

    // Latas de 18L
    const cans18L = Math.ceil(litersRequired / 18);
    materials.push(buildMaterial(
      'mat_tinta_acrilica_18l',
      litersRequired / 18,
      cans18L,
      params.location,
      'latas 18L',
      `Tinta acrílica para ${coats} demãos (${litersRequired.toFixed(1)} L necessários)`
    ));

    // Selador / Fundo Preparador (1 demão, 1L cobre 12m²)
    if (params.needsSealer) {
      const sealerLiters = (netArea * wasteMultiplier) / 12;
      const sealerCans = Math.ceil(sealerLiters / 18);
      materials.push(buildMaterial(
        'mat_selador_acrilico_18l',
        sealerLiters / 18,
        Math.max(1, sealerCans),
        params.location,
        'latas 18L',
        'Fundo preparador para selar alvenaria e uniformizar absorção'
      ));
    }

    // Massa corrida (25kg cobre ~25 a 30m² com 2 demãos finas)
    if (params.needsPutty) {
      const puttyKg = netArea * 1.1 * wasteMultiplier;
      const puttyBuckets = Math.ceil(puttyKg / 25);
      materials.push(buildMaterial(
        'mat_massa_corrida_25kg',
        puttyKg / 25,
        Math.max(1, puttyBuckets),
        params.location,
        'barricas 25kg',
        'Emassamento fino para nivelamento das paredes'
      ));
    }

    // Kit Pintor
    materials.push(buildMaterial(
      'mat_kit_pintura',
      1,
      1,
      params.location,
      'kit completo',
      'Rolos antigota, pincel, bandeja, fita crepe e lixas'
    ));

    const subtotal = materials.reduce((acc, m) => acc + m.totalPrice, 0);
    const wasteCost = Math.round((subtotal * (waste / 100)) * 100) / 100;

    return {
      workType: 'pintura',
      workTypeName: 'Pintura Residencial/Comercial',
      area: Math.round(netArea * 100) / 100,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área Líquida: ${netArea.toFixed(2)} m² (${wallsCount} parede(s) - aberturas)`,
        `Área Total com ${coats} Demãos (+${waste}% perda): ${totalPaintedArea.toFixed(2)} m²`,
        `Volume de Tinta: ${totalPaintedArea.toFixed(2)} m² ÷ ${yieldPerLiter} m²/L = ${litersRequired.toFixed(1)} L → ${cans18L} lata(s) de 18L`,
        params.needsPutty ? `Massa Corrida: ${Math.ceil(netArea * 1.1 * wasteMultiplier / 25)} barrica(s) de 25 kg` : 'Sem massa corrida inclusa'
      ],
      technicalPremises: [
        'Rendimento padrão de 10 m²/L por demão conforme média dos fabricantes de tintas premium.',
        'Recomenda-se lixar e limpar a poeira entre as demãos.',
        'Para reboco virgem, a aplicação de selador é indispensável para economizar tinta.'
      ],
      inputSummary: {
        'Extensão Total': `${wallLength} m`,
        'Altura': `${height} m`,
        'Qtd Paredes': `${wallsCount}`,
        'Demãos': `${coats}`,
        'Selador': params.needsSealer ? 'Sim' : 'Não',
        'Massa Corrida': params.needsPutty ? 'Sim' : 'Não'
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 5. Concreto
  static calculateConcreto(params: {
    length: number;
    width: number;
    heightOrDepth: number;
    mixRatio: '1_2_3' | '1_2.5_3.5' | '1_3_4';
    wastePercentage: number;
    location: RegionalLocation;
  }): CalculationResult {
    const length = Math.max(0.1, Number(params.length) || 0);
    const width = Math.max(0.1, Number(params.width) || 0);
    const depth = Math.max(0.05, Number(params.heightOrDepth) || 0);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage) || 10));

    const volume = length * width * depth;
    const wasteMultiplier = 1 + (waste / 100);
    const volumeWithWaste = volume * wasteMultiplier;

    let cimentoSacosPerM3 = 7.0; // 1:2:3 (~25 MPa)
    let areiaM3PerM3 = 0.55;
    let britaM3PerM3 = 0.83;
    let mixName = '1:2:3 (Estrutural ~25 MPa - Lajes, vigas e sapatas)';

    if (params.mixRatio === '1_2.5_3.5') {
      cimentoSacosPerM3 = 6.0;
      areiaM3PerM3 = 0.58;
      britaM3PerM3 = 0.85;
      mixName = '1:2.5:3.5 (Uso geral / Contrapiso ~20 MPa)';
    } else if (params.mixRatio === '1_3_4') {
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
      buildMaterial('mat_cimento_50kg', rawCimento, commCimento, params.location, 'sacos 50kg', 'Cimento Portland CP II'),
      buildMaterial('mat_areia_media', rawAreia, commAreia, params.location, 'm³', 'Areia lavada média'),
      buildMaterial('mat_brita_1', rawBrita, commBrita, params.location, 'm³', 'Pedra britada nº 1')
    ];

    const subtotal = materials.reduce((acc, m) => acc + m.totalPrice, 0);
    const wasteCost = Math.round((subtotal * (waste / 100)) * 100) / 100;

    return {
      workType: 'concreto',
      workTypeName: 'Concreto Estrutural',
      area: Math.round((length * width) * 100) / 100,
      volume: Math.round(volume * 1000) / 1000,
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
  static calculateFundacao(params: {
    foundationType: 'sapata_isolada' | 'baldrame' | 'estaca_broca';
    linearMetersOrUnits: number; // metros lineares para baldrame ou qtd de sapatas
    widthOrDiameter: number;
    depthOrHeight: number;
    wastePercentage: number;
    location: RegionalLocation;
  }): CalculationResult {
    const qty = Math.max(1, Number(params.linearMetersOrUnits) || 1);
    const width = Math.max(0.15, Number(params.widthOrDiameter) || 0.20);
    const depth = Math.max(0.20, Number(params.depthOrHeight) || 0.40);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage) || 12));

    let volumeM3 = 0;
    let typeName = 'Viga Baldrame';

    if (params.foundationType === 'baldrame') {
      volumeM3 = qty * width * depth; // qty = metros lineares
      typeName = `Viga Baldrame (${qty} m lineares)`;
    } else if (params.foundationType === 'sapata_isolada') {
      // Sapata tronco-piramidal média ou prismática: lado x lado x altura * qty
      volumeM3 = qty * (width * width * depth);
      typeName = `${qty} Sapatas Isoladas (${width}x${width}x${depth}m)`;
    } else {
      // Broca cilíndrica: pi * r^2 * h * qty
      const radius = width / 2;
      volumeM3 = qty * (Math.PI * radius * radius * depth);
      typeName = `${qty} Estacas Broca (Ø ${width}m x ${depth}m)`;
    }

    const wasteMultiplier = 1 + (waste / 100);
    const volumeWithWaste = volumeM3 * wasteMultiplier;

    // Concreto traço estrutural (7 sacos/m³)
    const rawCimento = volumeWithWaste * 7.0;
    const commCimento = Math.ceil(rawCimento);

    const rawAreia = volumeWithWaste * 0.55;
    const commAreia = Math.max(0.5, Math.round(rawAreia * 10) / 10);

    const rawBrita = volumeWithWaste * 0.83;
    const commBrita = Math.max(0.5, Math.round(rawBrita * 10) / 10);

    // Aço estrutural CA-50: taxa média de armação de 75 kg de aço por m³ de concreto
    // Barra de 10mm (3/8") de 12m pesa ~7.4 kg
    const totalSteelKg = volumeWithWaste * 75;
    const steelBars = Math.ceil(totalSteelKg / 7.4);

    // Arame recozido (~1.5 kg por 100 kg de aço)
    const wireKg = Math.max(1, Math.ceil(totalSteelKg * 0.015));

    // Formas de madeira (tábuas de 3m)
    const boardsCount = params.foundationType === 'baldrame' 
      ? Math.ceil((qty * 2) / 3 * 1.1) 
      : Math.max(2, Math.ceil(qty * 1.5));

    const materials: MaterialItem[] = [
      buildMaterial('mat_cimento_50kg', rawCimento, commCimento, params.location, 'sacos 50kg', 'Cimento estrutural para fundação'),
      buildMaterial('mat_areia_media', rawAreia, commAreia, params.location, 'm³', 'Areia lavada para concreto'),
      buildMaterial('mat_brita_1', rawBrita, commBrita, params.location, 'm³', 'Brita 1 para fundações'),
      buildMaterial('mat_aco_ca50_10mm', totalSteelKg / 7.4, steelBars, params.location, 'barras 12m', `Aço CA-50 Ø 10mm (${Math.round(totalSteelKg)} kg de armação)`),
      buildMaterial('mat_arame_recozido', totalSteelKg * 0.015, wireKg, params.location, 'kg', 'Arame recozido nº 18 para amarração de ferragem'),
      buildMaterial('mat_tabua_pinus_forma', boardsCount, boardsCount, params.location, 'tábuas 3m', 'Caixaria e formas laterais')
    ];

    const subtotal = materials.reduce((acc, m) => acc + m.totalPrice, 0);
    const wasteCost = Math.round((subtotal * (waste / 100)) * 100) / 100;

    return {
      workType: 'fundacao',
      workTypeName: 'Fundação Estrutural',
      area: Math.round(qty * width * 100) / 100,
      volume: Math.round(volumeM3 * 1000) / 1000,
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
      inputSummary: {
        'Elemento': typeName,
        'Volume Concreto': `${volumeM3.toFixed(2)} m³`,
        'Aço Estimado': `${steelBars} barras (12m)`
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 7. Telhado
  static calculateTelhado(params: {
    length: number; // comprimento do telhado
    width: number; // largura projetada
    slopePercentage: number; // inclinação: 30% a 35%
    tileType: 'ceramica_romana' | 'fibrocimento_ondulada';
    includeWoodwork: boolean;
    wastePercentage: number;
    location: RegionalLocation;
  }): CalculationResult {
    const length = Math.max(0.1, Number(params.length) || 0);
    const width = Math.max(0.1, Number(params.width) || 0);
    const slope = Math.max(10, Math.min(80, Number(params.slopePercentage) || 30));
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage) || 10));

    const projectedArea = length * width;
    // Fator de inclinação real = sqrt(1 + (slope/100)^2)
    const slopeFactor = Math.sqrt(1 + Math.pow(slope / 100, 2));
    const realRoofArea = projectedArea * slopeFactor;
    const wasteMultiplier = 1 + (waste / 100);
    const areaWithWaste = realRoofArea * wasteMultiplier;

    const materials: MaterialItem[] = [];

    if (params.tileType === 'ceramica_romana') {
      // 16 telhas por m² de telhado inclinado
      const rawTiles = areaWithWaste * 16;
      const commTiles = Math.ceil(rawTiles);
      materials.push(buildMaterial('mat_telha_ceramica_romana', rawTiles, commTiles, params.location, 'unidades', 'Telhas cerâmicas tipo Romana/Colonial'));
    } else {
      // Fibrocimento: placa 2.44x1.10m tem área útil ~2.15 m² com recobrimentos
      const rawSheets = areaWithWaste / 2.15;
      const commSheets = Math.ceil(rawSheets);
      materials.push(buildMaterial('mat_telha_fibrocimento', rawSheets, commSheets, params.location, 'placas', 'Telhas onduladas de fibrocimento 2,44 x 1,10 m'));
    }

    if (params.includeWoodwork) {
      const woodworkArea = Math.ceil(areaWithWaste);
      materials.push(buildMaterial('mat_madeiramento_telhado', areaWithWaste, woodworkArea, params.location, 'm² coberto', 'Estrutura completa de madeira (caibros, ripas e vigas)'));
    }

    const subtotal = materials.reduce((acc, m) => acc + m.totalPrice, 0);
    const wasteCost = Math.round((subtotal * (waste / 100)) * 100) / 100;

    return {
      workType: 'telhado',
      workTypeName: 'Telhado e Cobertura',
      area: Math.round(realRoofArea * 100) / 100,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área Projetada em Planta: ${length} m × ${width} m = ${projectedArea.toFixed(2)} m²`,
        `Fator de Correção de Inclinação (${slope}%): ${slopeFactor.toFixed(3)}`,
        `Área Real da Cobertura: ${projectedArea.toFixed(2)} m² × ${slopeFactor.toFixed(3)} = ${realRoofArea.toFixed(2)} m²`,
        params.tileType === 'ceramica_romana' ? `Telhas Cerâmicas: 16 un/m² × ${areaWithWaste.toFixed(2)} m² = ${Math.ceil(areaWithWaste * 16)} unidades` : `Telhas Fibrocimento: ${Math.ceil(areaWithWaste / 2.15)} placas de 2,44x1,10m`
      ],
      technicalPremises: [
        'Inclinação mínima recomendada: 30% a 35% para telhas cerâmicas e 15% a 20% para fibrocimento.',
        'Não inclui rufos, calhas e condutores pluviais.',
        'Madeiramento dimensionado para resistir à sobrecarga de vento conforme NBR 6123.'
      ],
      inputSummary: {
        'Comprimento': `${length} m`,
        'Largura': `${width} m`,
        'Inclinação': `${slope}%`,
        'Área Real': `${realRoofArea.toFixed(2)} m²`,
        'Tipo de Telha': params.tileType === 'ceramica_romana' ? 'Cerâmica Romana' : 'Fibrocimento Ondulada'
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // 8. Revestimento
  static calculateRevestimento(params: {
    length: number;
    height: number;
    doorsCount?: number;
    windowsCount?: number;
    wastePercentage: number;
    location: RegionalLocation;
  }): CalculationResult {
    const length = Math.max(0.1, Number(params.length) || 0);
    const height = Math.max(0.1, Number(params.height) || 0);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage) || 10));

    const grossArea = length * height;
    const openings = (params.doorsCount || 0) * 1.6 + (params.windowsCount || 0) * 1.2;
    const netArea = Math.max(0.1, grossArea - openings);
    const wasteMultiplier = 1 + (waste / 100);
    const areaWithWaste = netArea * wasteMultiplier;

    const materials: MaterialItem[] = [];

    // Revestimento Cerâmico de Parede
    const commercialArea = Math.ceil(areaWithWaste / 1.8) * 1.8;
    materials.push(buildMaterial('mat_piso_ceramico_padrao', areaWithWaste, Math.round(commercialArea * 100) / 100, params.location, 'm² (caixas)', 'Revestimento cerâmico para paredes'));

    // Argamassa colante AC-II: 4.5 kg/m²
    const rawMortarKg = areaWithWaste * 4.5;
    const commMortarSacks = Math.ceil(rawMortarKg / 20);
    materials.push(buildMaterial('mat_argamassa_ac2', rawMortarKg / 20, commMortarSacks, params.location, 'sacos 20kg', 'Argamassa AC-II flexível para áreas úmidas'));

    // Rejunte: 0.40 kg/m²
    const rawGroutKg = areaWithWaste * 0.40;
    const commGroutKg = Math.max(1, Math.ceil(rawGroutKg));
    materials.push(buildMaterial('mat_rejunte_cimenticio', rawGroutKg, commGroutKg, params.location, 'kg', 'Rejunte cimentício antimofo'));

    const subtotal = materials.reduce((acc, m) => acc + m.totalPrice, 0);
    const wasteCost = Math.round((subtotal * (waste / 100)) * 100) / 100;

    return {
      workType: 'revestimento',
      workTypeName: 'Revestimento de Parede',
      area: Math.round(netArea * 100) / 100,
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
  static calculateOutro(params: {
    area: number;
    thicknessCm: number;
    description: string;
    includeMasonry: boolean;
    includePainting: boolean;
    wastePercentage: number;
    location: RegionalLocation;
  }): CalculationResult {
    const area = Math.max(0.5, Number(params.area) || 10);
    const thicknessM = Math.max(0.02, (Number(params.thicknessCm) || 5) / 100);
    const waste = Math.max(0, Math.min(100, Number(params.wastePercentage) || 10));
    const wasteMultiplier = 1 + (waste / 100);

    const volumeM3 = area * thicknessM;
    const volumeWithWaste = volumeM3 * wasteMultiplier;

    const materials: MaterialItem[] = [];

    // Cimento
    const rawCimento = volumeWithWaste * 6.0;
    materials.push(buildMaterial('mat_cimento_50kg', rawCimento, Math.ceil(rawCimento), params.location, 'sacos 50kg', 'Cimento para contrapiso/reparos'));

    // Areia lavada
    const rawAreia = volumeWithWaste * 0.6;
    materials.push(buildMaterial('mat_areia_media', rawAreia, Math.max(0.5, Math.round(rawAreia * 10) / 10), params.location, 'm³', 'Areia lavada'));

    // Brita
    const rawBrita = volumeWithWaste * 0.8;
    materials.push(buildMaterial('mat_brita_1', rawBrita, Math.max(0.5, Math.round(rawBrita * 10) / 10), params.location, 'm³', 'Pedra britada'));

    if (params.includeMasonry) {
      const blocks = Math.ceil(area * 12.5 * wasteMultiplier);
      materials.push(buildMaterial('mat_bloco_concreto_14', area * 12.5 * wasteMultiplier, blocks, params.location, 'unidades', 'Blocos de concreto auxiliares'));
    }

    if (params.includePainting) {
      const cans = Math.max(1, Math.ceil((area * 2 * wasteMultiplier) / (10 * 18)));
      materials.push(buildMaterial('mat_tinta_acrilica_18l', (area * 2 * wasteMultiplier) / (10 * 18), cans, params.location, 'latas 18L', 'Tinta acrílica para acabamento'));
    }

    const subtotal = materials.reduce((acc, m) => acc + m.totalPrice, 0);
    const wasteCost = Math.round((subtotal * (waste / 100)) * 100) / 100;

    return {
      workType: 'outro',
      workTypeName: params.description || 'Obra Personalizada',
      area: Math.round(area * 100) / 100,
      volume: Math.round(volumeM3 * 1000) / 1000,
      materials,
      wastePercentage: waste,
      subtotalMaterials: Math.round((subtotal - wasteCost) * 100) / 100,
      wasteCost,
      totalEstimatedCost: subtotal,
      formulasUsed: [
        `Área informada: ${area} m² com espessura de ${(thicknessM * 100).toFixed(0)} cm = ${volumeM3.toFixed(3)} m³`,
        `Composição base de aglomerantes e agregados com ${waste}% de margem de segurança`
      ],
      technicalPremises: [
        'Valores médios para reparos, contrapisos e obras mistas.',
        'Verifique com seu profissional de obra os traços específicos do serviço.'
      ],
      inputSummary: {
        'Área': `${area} m²`,
        'Espessura': `${(thicknessM * 100).toFixed(0)} cm`,
        'Descrição': params.description || 'Reforma geral'
      },
      calculatedAt: new Date().toISOString()
    };
  }

  // Master dispatcher
  static calculate(workType: WorkTypeKey, params: any, calculationSettings: CalculationSettings = DEFAULT_CALCULATION_SETTINGS): CalculationResult {
    const previousSettings = activeCalculationSettings;
    activeCalculationSettings = calculationSettings;
    const calculationParams = { ...params, calculationSettings };
    try {
      switch (workType) {
        case 'muro':
          return this.calculateMuro(calculationParams);
        case 'parede':
          return this.calculateParede(calculationParams);
        case 'piso':
          return this.calculatePiso(calculationParams);
        case 'pintura':
          return this.calculatePintura(calculationParams);
        case 'concreto':
          return this.calculateConcreto(calculationParams);
        case 'fundacao':
          return this.calculateFundacao(calculationParams);
        case 'telhado':
          return this.calculateTelhado(calculationParams);
        case 'revestimento':
          return this.calculateRevestimento(calculationParams);
        case 'outro':
          return this.calculateOutro(calculationParams);
        default:
          throw new Error(`Tipo de obra não suportado: ${workType}`);
      }
    } finally {
      activeCalculationSettings = previousSettings;
    }
  }
}
