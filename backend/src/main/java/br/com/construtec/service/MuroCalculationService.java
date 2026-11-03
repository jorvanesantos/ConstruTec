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
public class MuroCalculationService {

    public CalculoResponseDTO calcular(CalculoRequestDTO request) {
        if (request.getComprimento() == null || request.getComprimento() <= 0) {
            throw new BusinessException("Informe um comprimento válido para o muro (maior que zero).");
        }
        if (request.getAltura() == null || request.getAltura() <= 0) {
            throw new BusinessException("Informe uma altura válida para o muro (maior que zero).");
        }

        double comprimento = request.getComprimento();
        double altura = request.getAltura();
        double desperdicio = request.getPercentualDesperdicio() != null ? request.getPercentualDesperdicio() : 10.0;
        double multDesperdicio = 1.0 + (desperdicio / 100.0);

        double areaBruta = comprimento * altura;
        double deducaoPortas = (request.getPortasCount() != null ? request.getPortasCount() : 0) * 1.68; // 0.80x2.10
        double deducaoJanelas = (request.getJanelasCount() != null ? request.getJanelasCount() : 0) * 1.20; // 1.20x1.00
        double areaLiquida = Math.max(0.1, areaBruta - (deducaoPortas + deducaoJanelas));

        // Preço regional baseado no multiplicador de SP/UF
        double multiplicadorRegional = "RJ".equalsIgnoreCase(request.getUf()) ? 1.05 : 1.0;

        List<MaterialItemDTO> materiais = new ArrayList<>();

        // Bloco de concreto 14x19x39 padrão (12.5 un/m²)
        double qtdBlocosTeorica = areaLiquida * 12.5 * multDesperdicio;
        long qtdBlocosComercial = (long) Math.ceil(qtdBlocosTeorica);
        BigDecimal precoUnitBloco = BigDecimal.valueOf(4.60 * multiplicadorRegional).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalBlocos = precoUnitBloco.multiply(BigDecimal.valueOf(qtdBlocosComercial)).setScale(2, RoundingMode.HALF_UP);

        materiais.add(new MaterialItemDTO(
            "mat_bloco_concreto_14",
            "Bloco de Concreto 14x19x39 cm",
            "Alvenaria",
            "unidades",
            BigDecimal.valueOf(qtdBlocosTeorica).setScale(2, RoundingMode.HALF_UP),
            BigDecimal.valueOf(qtdBlocosComercial),
            precoUnitBloco,
            totalBlocos,
            "Alvenaria de vedação do muro perimetral"
        ));

        // Cimento para argamassa de assentamento (0.15 sacos/m²)
        double qtdCimentoTeorica = areaLiquida * 0.15 * multDesperdicio;
        long qtdCimentoComercial = (long) Math.ceil(qtdCimentoTeorica);
        BigDecimal precoUnitCimento = BigDecimal.valueOf(34.90 * multiplicadorRegional).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalCimento = precoUnitCimento.multiply(BigDecimal.valueOf(qtdCimentoComercial)).setScale(2, RoundingMode.HALF_UP);

        materiais.add(new MaterialItemDTO(
            "mat_cimento_50kg",
            "Cimento Portland CP II (50 kg)",
            "Aglomerantes",
            "sacos",
            BigDecimal.valueOf(qtdCimentoTeorica).setScale(2, RoundingMode.HALF_UP),
            BigDecimal.valueOf(qtdCimentoComercial),
            precoUnitCimento,
            totalCimento,
            "Argamassa de assentamento das fiadas"
        ));

        // Areia média (0.022 m³/m²)
        double qtdAreiaTeorica = areaLiquida * 0.022 * multDesperdicio;
        BigDecimal qtdAreiaComercial = BigDecimal.valueOf(Math.max(0.5, Math.round(qtdAreiaTeorica * 10.0) / 10.0)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal precoUnitAreia = BigDecimal.valueOf(110.00 * multiplicadorRegional).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAreia = precoUnitAreia.multiply(qtdAreiaComercial).setScale(2, RoundingMode.HALF_UP);

        materiais.add(new MaterialItemDTO(
            "mat_areia_media",
            "Areia Média Lavada",
            "Agregados",
            "m³",
            BigDecimal.valueOf(qtdAreiaTeorica).setScale(2, RoundingMode.HALF_UP),
            qtdAreiaComercial,
            precoUnitAreia,
            totalAreia,
            "Mistura de argamassa de assentamento"
        ));

        BigDecimal subtotal = totalBlocos.add(totalCimento).add(totalAreia);
        BigDecimal custoDesperdicio = subtotal.multiply(BigDecimal.valueOf(desperdicio / 100.0)).setScale(2, RoundingMode.HALF_UP);

        CalculoResponseDTO response = new CalculoResponseDTO();
        response.setTipoObra("muro");
        response.setNomeTipoObra("Muro de Vedação");
        response.setAreaM2(BigDecimal.valueOf(areaLiquida).setScale(2, RoundingMode.HALF_UP));
        response.setPercentualDesperdicio(BigDecimal.valueOf(desperdicio).setScale(2, RoundingMode.HALF_UP));
        response.setSubtotalMateriais(subtotal.subtract(custoDesperdicio));
        response.setCustoDesperdicio(custoDesperdicio);
        response.setTotalEstimado(subtotal);
        response.setMateriais(materiais);

        List<String> formulas = List.of(
            String.format("Área Líquida: (%.2fm x %.2fm) - %.2fm² (vãos) = %.2f m²", comprimento, altura, deducaoPortas + deducaoJanelas, areaLiquida),
            String.format("Blocos: %.2f m² x 12,5 un/m² x (1 + %.2f%%) = %d blocos", areaLiquida, desperdicio, qtdBlocosComercial),
            String.format("Argamassa: Cimento = %d sacos (50kg) | Areia = %.2f m³", qtdCimentoComercial, qtdAreiaComercial.doubleValue())
        );
        response.setFormulasUtilizadas(formulas);

        List<String> premissas = List.of(
            "Junta de assentamento considerada entre 10 mm e 15 mm.",
            "Não substitui cálculo estrutural de sapatas e brocas para contenção de terra.",
            "Valores arredondados para cima para evitar compras fracionadas."
        );
        response.setPremissasTecnicas(premissas);

        Map<String, Object> resumo = new HashMap<>();
        resumo.put("Comprimento", comprimento + " m");
        resumo.put("Altura", altura + " m");
        resumo.put("Desperdício", desperdicio + "%");
        resumo.put("Localidade", request.getCidade() + " - " + request.getUf());
        response.setResumoEntradas(resumo);

        return response;
    }
}
