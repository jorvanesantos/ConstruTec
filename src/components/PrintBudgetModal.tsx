import React from 'react';
import { CalculationResult, RegionalLocation, SavedBudget } from '../types';
import { Printer, X, HardHat, FileText, CheckCircle2 } from 'lucide-react';

interface PrintBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult;
  title: string;
  clientName?: string;
  location: RegionalLocation;
}

export const PrintBudgetModal: React.FC<PrintBudgetModalProps> = ({
  isOpen,
  onClose,
  result,
  title,
  clientName,
  location
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 sm:p-10 my-auto text-slate-900 card-print">
        
        {/* BARRA DE AÇÕES (NÃO IMPRIME) */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 no-print">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Visualização para Impressão e PDF
            </span>
            <h3 className="text-lg font-bold text-slate-950">Folha de Orçamento da Obra</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DOCUMENTO IMPRESSO */}
        <div className="space-y-6 text-sm" id="printable-area">
          
          {/* CABEÇALHO OFICIAL */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-extrabold text-xl">
                <HardHat className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Constru<span className="text-amber-500">Tec</span>
                </h1>
                <p className="text-xs font-medium text-slate-500 italic">
                  "Calcule com precisão, construa com economia."
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-600 font-mono">
              <p className="font-bold text-slate-900 text-sm">RELATÓRIO DE QUANTITATIVOS</p>
              <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
              <p>Tabela: {location.stateName} - {location.uf} ({location.priceMultiplier}x)</p>
            </div>
          </div>

          {/* DADOS DA OBRA / CLIENTE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Obra / Estrutura:</span>
              <strong className="text-slate-900 text-sm">{title || result.workTypeName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Cliente / Solicitante:</span>
              <strong className="text-slate-900 text-sm">{clientName || 'Não especificado'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Dimensão Calculada:</span>
              <strong className="text-slate-900 text-sm">
                {result.areaM2 ? `${result.areaM2.toFixed(2)} m²` : `${result.volumeM3?.toFixed(3)} m³`}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Margem de Desperdício:</span>
              <strong className="text-slate-900 text-sm">{result.wastePercentage}%</strong>
            </div>
          </div>

          {/* TABELA DE MATERIAIS */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Relação Detalhada de Materiais & Insumos
            </h4>

            <table className="w-full text-left text-xs border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <th className="p-2.5">Item / Insumo</th>
                  <th className="p-2.5">Aplicação</th>
                  <th className="p-2.5 text-right">Qtd. Teórica</th>
                  <th className="p-2.5 text-right font-extrabold text-slate-950">Qtd. Comercial</th>
                  <th className="p-2.5">Unidade</th>
                  <th className="p-2.5 text-right">Preço Unit.</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {result.materials.map((m, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-bold text-slate-900">{m.name}</td>
                    <td className="p-2.5 text-slate-600 text-[11px]">{m.purpose}</td>
                    <td className="p-2.5 text-right font-mono text-slate-500">{m.theoreticalQuantity.toFixed(2)}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-950 bg-slate-50">
                      {typeof m.commercialQuantity === 'number' ? m.commercialQuantity.toLocaleString('pt-BR') : m.commercialQuantity}
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">{m.unit}</td>
                    <td className="p-2.5 text-right font-mono text-slate-600">
                      R$ {m.unitPrice.toFixed(2)}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      R$ {m.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALIZAÇÃO */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Materiais:</span>
                <span className="font-mono">R$ {result.subtotalMaterials.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Margem de Desperdício ({result.wastePercentage}%):</span>
                <span className="font-mono">R$ {result.wasteCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-950">
                <span>TOTAL ESTIMADO:</span>
                <span className="font-mono text-base text-amber-700">
                  R$ {result.totalEstimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* OBSERVAÇÕES E NOTAS TÉCNICAS */}
          <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">Premissas e Observações Técnicas:</p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
              {result.technicalPremises.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
              <li>{result.technicalWarning}</li>
              <li>{result.priceDisclaimer}</li>
            </ul>
          </div>

          {/* CAMPO PARA ASSINATURAS */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 mx-6 pt-1"></div>
              <span className="font-bold text-slate-800 block">Responsável pela Estimativa</span>
              <span className="text-[10px] text-slate-500">ConstruTec Engenharia & Sistemas</span>
            </div>
            <div>
              <div className="border-t border-slate-400 mx-6 pt-1"></div>
              <span className="font-bold text-slate-800 block">{clientName || 'Cliente / Contratante'}</span>
              <span className="text-[10px] text-slate-500">De acordo com o quantitativo</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
