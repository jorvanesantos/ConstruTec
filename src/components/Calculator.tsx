import React, { useState, useEffect } from 'react';
import { 
  WorkTypeKey, 
  CalculationResult, 
  RegionalLocation, 
  UserProfile, 
  SavedBudget 
} from '../types';
import { CalculationService } from '../services/calculationEngine';
import { DEFAULT_CALCULATION_SETTINGS, type CalculationSettings } from '../services/calculationSettings';
import { WORK_TYPES } from '../data/catalog';
import { 
  Calculator as CalcIcon, 
  Save, 
  RotateCcw, 
  Printer, 
  Share2, 
  AlertTriangle, 
  Info, 
  Check, 
  ArrowLeft, 
  Coins, 
  FileText, 
  Sliders, 
  CheckCircle,
  HelpCircle,
  Pencil
} from 'lucide-react';

interface CalculatorProps {
  initialWorkType?: WorkTypeKey;
  location: RegionalLocation;
  user: UserProfile | null;
  onOpenAuth: (msg?: string) => void;
  onSaveBudgetSuccess: (budget: SavedBudget) => void;
  onPrintBudget: (result: CalculationResult, title: string, clientName?: string) => void;
}

export const Calculator: React.FC<CalculatorProps> = ({
  initialWorkType = 'muro',
  location,
  user,
  onOpenAuth,
  onSaveBudgetSuccess,
  onPrintBudget
}) => {
  const [selectedType, setSelectedType] = useState<WorkTypeKey>(initialWorkType);
  const [step, setStep] = useState<'form' | 'result'>('form');

  // Common Form States
  const [length, setLength] = useState<number>(10);
  const [height, setHeight] = useState<number>(2.2);
  const [width, setWidth] = useState<number>(4);
  const [depth, setDepth] = useState<number>(0.12);
  const [thicknessCm, setThicknessCm] = useState<number>(10);
  const [wastePercentage, setWastePercentage] = useState<number>(10);
  const [calculationSettings, setCalculationSettings] = useState<CalculationSettings>(DEFAULT_CALCULATION_SETTINGS);

  // Vãos (Openings)
  const [doorsCount, setDoorsCount] = useState<number>(0);
  const [doorWidth, setDoorWidth] = useState<number>(0.8);
  const [doorHeight, setDoorHeight] = useState<number>(2.1);
  const [windowsCount, setWindowsCount] = useState<number>(0);
  const [windowWidth, setWindowWidth] = useState<number>(1.2);
  const [windowHeight, setWindowHeight] = useState<number>(1.0);

  // Specific options
  const [blockType, setBlockType] = useState<'bloco_14' | 'bloco_9' | 'tijolo_8f'>('bloco_14');
  const [plasterType, setPlasterType] = useState<'ambas' | 'uma' | 'sem'>('ambas');
  const [tileType, setTileType] = useState<'porcelanato' | 'ceramica' | 'vinilico'>('porcelanato');
  const [tileSizeCm, setTileSizeCm] = useState<number>(60);
  const [concreteMix, setConcreteMix] = useState<'1:2:3' | '1:2.5:3.5' | '1:3:4'>('1:2:3');
  const [coats, setCoats] = useState<number>(2);
  const [includeCeiling, setIncludeCeiling] = useState<boolean>(false);
  const [wallsCount, setWallsCount] = useState<number>(1);
  const [paintYield, setPaintYield] = useState<number>(10); // m²/L
  const [needPrimer, setNeedPrimer] = useState<boolean>(true);
  const [roofSlope, setRoofSlope] = useState<number>(30);
  const [tileRoofType, setTileRoofType] = useState<'colonial' | 'fibrocimento'>('colonial');
  const [foundationType, setFoundationType] = useState<'baldrame' | 'sapata' | 'estaca'>('baldrame');
  const [customDescription, setCustomDescription] = useState<string>('');

  // Result state
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Save budget state
  const [budgetTitle, setBudgetTitle] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    fetch('/api/calculation-settings')
      .then(async (response) => {
        if (!response.ok) throw new Error('Não foi possível carregar as configurações de cálculo.');
        return response.json();
      })
      .then((settings: CalculationSettings) => setCalculationSettings(settings))
      .catch((error) => console.error('[Cálculo] Usando parâmetros locais padrão:', error));
  }, []);

  // Synchronize waste percentage when selected work type changes
  useEffect(() => {
    const wt = WORK_TYPES.find(w => w.id === selectedType);
    if (wt) {
      setWastePercentage(calculationSettings.defaultWasteByWorkType[selectedType] ?? wt.defaultWaste);
    }
  }, [selectedType, calculationSettings]);

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      const calculationParams: any = {
        length: Number(length) || 0,
        height: Number(height) || 0,
        width: Number(width) || 0,
        depth: Number(depth) || 0,
        thicknessCm: Number(thicknessCm) || 0,
        wastePercentage: Number(wastePercentage) || 0,
        doorsCount: Number(doorsCount) || 0,
        doorWidth: Number(doorWidth) || 0,
        doorHeight: Number(doorHeight) || 0,
        windowsCount: Number(windowsCount) || 0,
        windowWidth: Number(windowWidth) || 0,
        windowHeight: Number(windowHeight) || 0,
        blockType,
        plasterType,
        tileType,
        tileSizeCm: Number(tileSizeCm) || 60,
        concreteMix,
        coats: Number(coats) || 2,
        includeCeiling,
        wallsCount: Number(wallsCount) || 1,
        paintYield: Number(paintYield) || 10,
        needPrimer,
        roofSlope: Number(roofSlope) || 30,
        tileRoofType,
        foundationType,
        customDescription,
        location
      };

      const calcResult = CalculationService.calculate(selectedType, calculationParams, calculationSettings);
      setResult(calcResult);
      setBudgetTitle(`Orçamento de ${calcResult.workTypeName} - ${calcResult.area ? calcResult.area.toFixed(1) + ' m²' : calcResult.volume?.toFixed(2) + ' m³'}`);
      setStep('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar cálculo.');
    }
  };

  const handleSaveBudget = async () => {
    if (!result) return;

    if (!user || !user.isLoggedIn) {
      onOpenAuth('Para salvar e organizar seus orçamentos na nuvem, acesse sua conta.');
      return;
    }

    setIsSaving(true);
    try {
      const newBudget: SavedBudget = {
        id: 'orc_' + Date.now(),
        title: budgetTitle || `Orçamento de ${result.workTypeName}`,
        clientName: clientName || undefined,
        location,
        workType: selectedType,
        workTypeName: result.workTypeName,
        calculationResult: result,
        status: 'rascunho',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Call API or local state
      try {
        const response = await fetch('/api/orcamentos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token || localStorage.getItem('construtec_jwt_token') || ''}`
          },
          body: JSON.stringify(newBudget)
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || error.error || 'Não foi possível salvar o orçamento.');
        }
        const savedBudget = await response.json() as SavedBudget;
        onSaveBudgetSuccess(savedBudget);
        setSaveSuccessMessage('Orçamento salvo com sucesso na sua conta!');
        setTimeout(() => setSaveSuccessMessage(null), 4000);
        return;
      } catch (e) {
        console.error('Falha ao salvar orçamento:', e);
        throw e;
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar orçamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!result) return;
    const text = `*ConstruTec - Orçamento de ${result.workTypeName}*\n` +
      `Área: ${result.areaM2 ? result.areaM2.toFixed(2) + ' m²' : ''}\n` +
      `Total Estimado: R$ ${result.totalEstimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `Localidade: ${location.stateName} (${location.uf})\n` +
      `Itens: ${result.materials.map(m => `\n- ${m.name}: ${m.commercialQuantity} ${m.unit}`).join('')}\n\n` +
      `"Calcule com precisão, construa com economia."`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="calculator-section">
      
      {/* HEADER DA CALCULADORA */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
          <CalcIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>MOTOR DE CÁLCULO INTELIGENTE</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Calculadora de Materiais e Custos
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          Escolha o tipo de estrutura, informe as dimensões e receba instantaneamente a relação de compra e valor estimado.
        </p>
      </div>

      {step === 'form' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          
          {/* SELETOR DE CATEGORIA DE OBRA */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              1. Qual tipo de obra você deseja calcular?
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {WORK_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    id={`btn-select-calc-type-${type.id}`}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleCalculate} className="space-y-6">
            
            {/* ETAPA 2: MEDIDAS E CARACTERÍSTICAS DINÂMICAS */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <label className="text-sm font-bold text-slate-900">
                  2. Informe as medidas e características da obra
                </label>
                <span className="text-xs text-slate-500">
                  Medidas em metros (m)
                </span>
              </div>

              {/* CAMPOS ESPECÍFICOS POR TIPO DE OBRA */}
              
              {/* TIPO: MURO OU PAREDE */}
              {(selectedType === 'muro' || selectedType === 'parede') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Comprimento do {selectedType} (metros) *
                      </label>
                      <input
                        id="input-length"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={length}
                        onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 15.00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Extensão horizontal em metros</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Altura do {selectedType} (metros) *
                      </label>
                      <input
                        id="input-height"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={height}
                        onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 2.20"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Altura do piso ao topo</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tipo de Bloco / Tijolo
                      </label>
                      <select
                        id="select-block-type"
                        value={blockType}
                        onChange={(e) => setBlockType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm bg-white"
                      >
                        <option value="bloco_14">Bloco de Concreto 14x19x39 cm (Padrão 12,5 un/m²)</option>
                        <option value="bloco_9">Bloco de Concreto 9x19x39 cm (Mais estreito)</option>
                        <option value="tijolo_8f">Tijolo Cerâmico 8 Furos 9x19x19 cm (25 un/m²)</option>
                      </select>
                    </div>

                    {selectedType === 'parede' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Reboco / Emboço
                        </label>
                        <select
                          id="select-plaster-type"
                          value={plasterType}
                          onChange={(e) => setPlasterType(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm bg-white"
                        >
                          <option value="ambas">Reboco em ambas as faces (interno e externo)</option>
                          <option value="uma">Reboco em apenas uma face</option>
                          <option value="sem">Sem reboco (bloco aparente / rústico)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* VÃOS (PORTAS E JANELAS) */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <span className="text-xs font-bold text-slate-800 block">
                      Descontar Vãos de Aberturas (Portas e Janelas)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Portas (Qtd)</label>
                        <input
                          id="input-doors-count"
                          type="number"
                          min="0"
                          value={doorsCount}
                          onChange={(e) => setDoorsCount(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dimensões Porta</label>
                        <span className="text-xs font-mono text-slate-700 py-2 block">0,80 x 2,10 m</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Janelas (Qtd)</label>
                        <input
                          id="input-windows-count"
                          type="number"
                          min="0"
                          value={windowsCount}
                          onChange={(e) => setWindowsCount(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dimensões Janela</label>
                        <span className="text-xs font-mono text-slate-700 py-2 block">1,20 x 1,00 m</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TIPO: PISO */}
              {selectedType === 'piso' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Comprimento do Cômodo (metros) *
                      </label>
                      <input
                        id="input-piso-length"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={length}
                        onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 5.00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Largura do Cômodo (metros) *
                      </label>
                      <input
                        id="input-piso-width"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={width}
                        onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 4.00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tipo de Acabamento
                      </label>
                      <select
                        id="select-tile-type"
                        value={tileType}
                        onChange={(e) => setTileType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm bg-white"
                      >
                        <option value="porcelanato">Porcelanato Retificado (Argamassa AC-III)</option>
                        <option value="ceramica">Cerâmica Esmaltada Padrão (Argamassa AC-I / AC-II)</option>
                        <option value="vinilico">Piso Vinílico / LVT (Cola específica)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Tamanho Médio da Peça
                      </label>
                      <select
                        id="select-tile-size"
                        value={tileSizeCm}
                        onChange={(e) => setTileSizeCm(parseInt(e.target.value) || 60)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm bg-white"
                      >
                        <option value="60">60x60 cm</option>
                        <option value="80">80x80 cm</option>
                        <option value="90">90x90 cm</option>
                        <option value="120">120x60 cm</option>
                        <option value="45">45x45 cm</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TIPO: PINTURA */}
              {selectedType === 'pintura' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Extensão das Paredes (metros) *
                      </label>
                      <input
                        id="input-paint-length"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={length}
                        onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 16.00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Altura do Pé Direito (metros) *
                      </label>
                      <input
                        id="input-paint-height"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={height}
                        onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 2.80"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Número de Demãos *
                      </label>
                      <select
                        id="select-paint-coats"
                        value={coats}
                        onChange={(e) => setCoats(parseInt(e.target.value) || 2)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden text-sm bg-white"
                      >
                        <option value="1">1 demão (retoque leve)</option>
                        <option value="2">2 demãos (cobertura recomendada)</option>
                        <option value="3">3 demãos (cores escuras ou troca drástica)</option>
                      </select>
                    </div>
                  </div>

                  {/* RENDIMENTO DA TINTA EXPLICADO */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <label className="block text-xs font-bold text-amber-900 mb-1">
                          Rendimento da tinta (m² por litro por demão)
                        </label>
                        <p className="text-xs text-amber-800 leading-relaxed mb-2">
                          Informe quantos m² a tinta cobre por litro, conforme indicado na embalagem pelo fabricante (tintas acrílicas standard/premium cobrem em média 10 m²/L).
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            id="input-paint-yield"
                            type="number"
                            step="0.5"
                            min="4"
                            max="20"
                            value={paintYield}
                            onChange={(e) => setPaintYield(parseFloat(e.target.value) || 10)}
                            className="w-32 px-3 py-1.5 rounded-lg border border-amber-300 text-sm font-semibold bg-white"
                          />
                          <span className="text-xs font-mono font-medium text-amber-900">m² / Litro</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        id="checkbox-primer"
                        type="checkbox"
                        checked={needPrimer}
                        onChange={(e) => setNeedPrimer(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Incluir Selador Acrílico (fundo preparador)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        id="checkbox-ceiling"
                        type="checkbox"
                        checked={includeCeiling}
                        onChange={(e) => setIncludeCeiling(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Incluir Pintura do Teto</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TIPO: CONCRETO */}
              {selectedType === 'concreto' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Comprimento (m) *
                      </label>
                      <input
                        id="input-concrete-length"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={length}
                        onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 6.00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Largura (m) *
                      </label>
                      <input
                        id="input-concrete-width"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={width}
                        onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 4.00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Espessura / Profundidade (m) *
                      </label>
                      <input
                        id="input-concrete-depth"
                        type="number"
                        step="0.01"
                        min="0.03"
                        required
                        value={depth}
                        onChange={(e) => setDepth(parseFloat(e.target.value) || 0.1)}
                        placeholder="Ex: 0.12 (12 cm)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Traço do Concreto
                    </label>
                    <select
                      id="select-concrete-mix"
                      value={concreteMix}
                      onChange={(e) => setConcreteMix(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      <option value="1:2:3">1:2:3 (Estrutural ~25 MPa - Lajes, vigas e pilares)</option>
                      <option value="1:2.5:3.5">1:2.5:3.5 (Uso Geral ~20 MPa - Calçadas e contrapisos)</option>
                      <option value="1:3:4">1:3:4 (Concreto Magro ~15 MPa - Regularização e lastro)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TIPO: FUNDAÇÃO */}
              {selectedType === 'fundacao' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Elemento de Fundação
                      </label>
                      <select
                        id="select-foundation-type"
                        value={foundationType}
                        onChange={(e) => setFoundationType(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="baldrame">Viga Baldrame (Metros Lineares)</option>
                        <option value="sapata">Sapatas Isoladas</option>
                        <option value="estaca">Estacas Broca Perfuradas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Extensão Total / Metros Lineares *
                      </label>
                      <input
                        id="input-foundation-length"
                        type="number"
                        step="0.1"
                        min="1"
                        required
                        value={length}
                        onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 30.00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TIPO: TELHADO */}
              {selectedType === 'telhado' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Comprimento do Vão (m) *
                      </label>
                      <input
                        id="input-roof-length"
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={length}
                        onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 10.00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Largura Projetada (m) *
                      </label>
                      <input
                        id="input-roof-width"
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={width}
                        onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                        placeholder="Ex: 6.00"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Inclinação (%) *
                      </label>
                      <select
                        id="select-roof-slope"
                        value={roofSlope}
                        onChange={(e) => setRoofSlope(parseInt(e.target.value) || 30)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="30">30% (Padrão telha cerâmica)</option>
                        <option value="35">35% (Mais inclinado p/ regiões chuvosas)</option>
                        <option value="15">15% (Fibrocimento / metálica)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Modelo da Telha
                    </label>
                    <select
                      id="select-roof-tile"
                      value={tileRoofType}
                      onChange={(e) => setTileRoofType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      <option value="colonial">Telha Cerâmica Romana / Colonial (~16 un/m²)</option>
                      <option value="fibrocimento">Telha de Fibrocimento Ondulada (2,44 x 1,10 m)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TIPO: REVESTIMENTO OU OUTRO */}
              {(selectedType === 'revestimento' || selectedType === 'outro') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Extensão / Comprimento (m) *
                      </label>
                      <input
                        id="input-other-length"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={length}
                        onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Altura ou Largura (m) *
                      </label>
                      <input
                        id="input-other-height"
                        type="number"
                        step="0.01"
                        min="0.1"
                        required
                        value={height}
                        onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  {selectedType === 'outro' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Descrição do serviço / estrutura
                      </label>
                      <input
                        id="input-other-desc"
                        type="text"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Ex: Bancada de alvenaria para churrasqueira"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MARGEM DE DESPERDÍCIO INTELIGENTE */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Margem de Desperdício e Recortes
                  </label>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono font-bold text-xs">
                  {wastePercentage}%
                </span>
              </div>
              
              <input
                id="slider-waste-percentage"
                type="range"
                min="0"
                max="30"
                step="1"
                value={wastePercentage}
                onChange={(e) => setWastePercentage(parseInt(e.target.value) || 0)}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Recomendamos entre <strong>8% e 15%</strong> para cobrir perdas por transporte, recortes de cantos, quebras acidentais e espessuras de juntas.
              </p>
            </div>

            {/* ETAPA 3: RESUMO ANTES DE EXECUTAR */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  Região Selecionada: {location.stateName} ({location.uf})
                </span>
                <span className="text-xs text-slate-500">
                  Preços ajustados pelo fator {location.priceMultiplier}x (Mediana SINAPI)
                </span>
              </div>

              <button
                id="btn-execute-calc"
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CalcIcon className="w-4 h-4" />
                <span>Calcular Materiais e Custos</span>
              </button>
            </div>

          </form>
        </div>
      ) : (
        /* ETAPA 4 & 5: RESULTADO COMPLETO DO CÁLCULO */
        result && (
          <div className="space-y-6">
            
            {/* TOPO DE AÇÕES DO RESULTADO */}
            <div className="flex flex-wrap items-center justify-between gap-3 no-print">
              <button
                id="btn-back-to-edit"
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                <span>Editar medidas</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="btn-share-result"
                  type="button"
                  onClick={handleShare}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Copiar resumo para WhatsApp ou e-mail"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedNotification ? 'Copiado!' : 'Compartilhar'}</span>
                </button>

                <button
                  id="btn-print-result"
                  type="button"
                  onClick={() => {
                    if (!user || !user.isLoggedIn) {
                      onOpenAuth('Como regra de negócio, faça login para visualizar e emitir o relatório completo em PDF.');
                      return;
                    }
                    onPrintBudget(result, budgetTitle, clientName);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  id="btn-save-budget-action"
                  type="button"
                  onClick={handleSaveBudget}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Orçamento'}</span>
                </button>
              </div>
            </div>

            {/* NOTIFICAÇÃO DE SUCESSO AO SALVAR */}
            {saveSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            {/* CARD PRINCIPAL DO RESULTADO */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden card-print">
              
              {/* CABEÇALHO DO RESULTADO */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
                      Relatório de Quantitativos & Orçamento
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight mt-1">
                      {result.workTypeName}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Tabela de Preços: {location.stateName} ({location.uf}) • Margem considerada: {result.wastePercentage}%
                    </p>
                  </div>

                  {/* CUSTO TOTAL DESTACADO */}
                  <div className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-4 text-right">
                    <span className="text-[11px] text-slate-300 block font-medium">Estimativa Total da Obra:</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
                      R$ {result.totalEstimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* MÉTRICAS DE ÁREA / VOLUME */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-700/80 text-xs font-mono">
                  {result.areaM2 !== undefined && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">ÁREA LÍQUIDA:</span>
                      <span className="text-base font-bold text-white">{result.areaM2.toFixed(2)} m²</span>
                    </div>
                  )}
                  {result.volumeM3 !== undefined && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">VOLUME ESTIMADO:</span>
                      <span className="text-base font-bold text-white">{result.volumeM3.toFixed(3)} m³</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block text-[10px]">SUBTOTAL MATERIAIS:</span>
                    <span className="text-base font-bold text-white">
                      R$ {result.subtotalMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CUSTO DESPERDÍCIO ({result.wastePercentage}%):</span>
                    <span className="text-base font-bold text-amber-300">
                      R$ {result.wasteCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* TABELA DETALHADA DE MATERIAIS */}
              <div className="p-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Lista de Materiais Recomendados para Compra</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Material</th>
                        <th className="py-3 px-3">Finalidade / Aplicação</th>
                        <th className="py-3 px-3 text-right">Qtd. Teórica</th>
                        <th className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">Qtd. Comercial</th>
                        <th className="py-3 px-3">Unidade</th>
                        <th className="py-3 px-3 text-right">Preço Unit.</th>
                        <th className="py-3 px-3 text-right">Total (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {result.materials.map((mat, index) => (
                        <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                            {mat.name}
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-[200px]">
                            {mat.purpose}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                            {mat.theoreticalQuantity.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30">
                            {typeof mat.commercialQuantity === 'number' ? mat.commercialQuantity.toLocaleString('pt-BR') : mat.commercialQuantity}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono">
                            {mat.unit}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                            R$ {mat.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            R$ {mat.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* BLOCO DE FÓRMULAS E PREMISSAS TÉCNICAS */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Fórmulas Utilizadas */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Fórmulas Matemáticas Utilizadas</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono">
                      {result.formulasUsed.map((formula, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500">•</span>
                          <span>{formula}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Premissas Técnicas */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Premissas de Engenharia e Normas</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {result.technicalPremises.map((premise, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500">•</span>
                          <span>{premise}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* AVISO TÉCNICO OBRIGATÓRIO & DISCLAIMER */}
                <div className="mt-6 space-y-2">
                  <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{result.technicalWarning}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                    {result.priceDisclaimer}
                  </p>
                </div>

                {/* FORMULÁRIO RÁPIDO PARA SALVAR ORÇAMENTO */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 no-print">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3">
                    Salvar este orçamento no seu projeto
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Título do Orçamento</label>
                      <input
                        id="input-save-budget-title"
                        type="text"
                        value={budgetTitle}
                        onChange={(e) => setBudgetTitle(e.target.value)}
                        placeholder="Ex: Reforma Muro Lateral - Lote 14"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Nome do Cliente (opcional)</label>
                      <input
                        id="input-save-budget-client"
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ex: Maria Santos"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      id="btn-confirm-save-budget"
                      type="button"
                      onClick={handleSaveBudget}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Salvando...' : 'Gravar Orçamento'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )
      )}

    </div>
  );
};
