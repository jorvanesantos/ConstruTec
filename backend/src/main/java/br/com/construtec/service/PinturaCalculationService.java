package br.com.construtec.service;

import br.com.construtec.dto.CalculoRequestDTO;
import br.com.construtec.dto.CalculoResponseDTO;
import br.com.construtec.dto.MaterialItemDTO;
import br.com.construtec.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PinturaCalculationService {

    public CalculoResponseDTO calcular(CalculoRequestDTO request) {
        if (request.getComprimento() == null || request.getComprimento() <= 0) {
            throw new BusinessException("Informe a extensão das paredes para pintura.");
        }
        if (request.getAltura() == null || request.getAltura() <= 0) {
            throw new BusinessException("Informe a altura das paredes para pintura.");
        }

        double extensao = request.getComprimento();
        double altura = request.getAltura();
        int paredes = request.getParedesCount() != null ? request.getParedesCount() : 1;
        int demaos = request.getDemaos() != null ? request.getDemaos() : 2;
        double desp = request.getPercentualDesperdicio() != null ? request.getPercentualDesperdicio() : 8.0;
        double mult = 1.0 + (desp / 100.0);

        double areaTotalParedes = extensao * altura * paredes;
        double deducao = ((request.getPortasCount() != null ? request.getPortasCount() : 0) * 1.68)
                + ((request.getJanelasCount() != null ? request.getJanelasCount() : 0) * 1.20);
        double areaLiquida = Math.max(0.1, areaTotalParedes - deducao);

        double rendimentoLitro = 10.0; // 10 m²/L por demão
        double litrosNecessarios = (areaLiquida * demaos * mult) / rendimentoLitro;
        long latas18L = (long) Math.ceil(litrosNecessarios / 18.0);

        List<MaterialItemDTO> materiais = new ArrayList<>();
        materiais.add(new MaterialItemDTO("mat_tinta_acrilica_18l", "Tinta Acrílica Premium (18 Litros)", "Pintura", "latas 18L",
                BigDecimal.valueOf(litrosNecessarios / 18.0), BigDecimal.valueOf(latas18L), BigDecimal.valueOf(289.00),
                BigDecimal.valueOf(latas18L * 289.00).setScale(2, RoundingMode.HALF_UP),
                String.format("Pintura para %d demãos (%.1f L necessários)", demaos, litrosNecessarios)));

        materiais.add(new MaterialItemDTO("mat_selador_acrilico_18l", "Selador Acrílico (18 Litros)", "Pintura", "latas 18L",
                BigDecimal.valueOf(areaLiquida / (12.0 * 18.0)), BigDecimal.valueOf(1), BigDecimal.valueOf(145.00),
                BigDecimal.valueOf(145.00), "Fundo preparador de alvenaria"));

        materiais.add(new MaterialItemDTO("mat_kit_pintura", "Kit de Pintura Completo", "Pintura", "kit",
                BigDecimal.ONE, BigDecimal.ONE, BigDecimal.valueOf(65.00),
                BigDecimal.valueOf(65.00), "Rolos, trinchas, fita crepe e lixas"));

        BigDecimal subtotal = materiais.stream().map(MaterialItemDTO::getPrecoTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal custoDesp = subtotal.multiply(BigDecimal.valueOf(desp / 100.0)).setScale(2, RoundingMode.HALF_UP);

        CalculoResponseDTO res = new CalculoResponseDTO();
        res.setTipoObra("pintura");
        res.setNomeTipoObra("Pintura Residencial");
        res.setAreaM2(BigDecimal.valueOf(areaLiquida).setScale(2, RoundingMode.HALF_UP));
        res.setPercentualDesperdicio(BigDecimal.valueOf(desp));
        res.setSubtotalMateriais(subtotal.subtract(custoDesp));
        res.setCustoDesperdicio(custoDesp);
        res.setTotalEstimado(subtotal);
        res.setMateriais(materiais);
        res.setFormulasUtilizadas(List.of(
            String.format("Área Líquida: %.2f m² (%d paredes descontando vãos)", areaLiquida, paredes),
            String.format("Consumo: (%.2f m² x %d demãos) ÷ 10 m²/L = %.1f L → %d lata(s) de 18L", areaLiquida, demaos, litrosNecessarios, latas18L)
        ));
        res.setPremissasTecnicas(List.of("Rendimento padrão de 10 m²/L por demão. Superfície requer aplicação de selador prévio."));

        Map<String, Object> map = new HashMap<>();
        map.put("Área Pintada", String.format("%.2f m²", areaLiquida));
        map.put("Demãos", demaos);
        res.setResumoEntradas(map);
        return res;
    }
}
