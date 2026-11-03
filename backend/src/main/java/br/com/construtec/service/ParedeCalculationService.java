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
public class ParedeCalculationService {

    public CalculoResponseDTO calcular(CalculoRequestDTO request) {
        if (request.getComprimento() == null || request.getComprimento() <= 0) {
            throw new BusinessException("Informe um comprimento válido para a parede.");
        }
        if (request.getAltura() == null || request.getAltura() <= 0) {
            throw new BusinessException("Informe uma altura válida para a parede.");
        }

        double comp = request.getComprimento();
        double alt = request.getAltura();
        double desperdicio = request.getPercentualDesperdicio() != null ? request.getPercentualDesperdicio() : 10.0;
        double mult = 1.0 + (desperdicio / 100.0);

        double areaLiquida = Math.max(0.1, (comp * alt) - ((request.getPortasCount() != null ? request.getPortasCount() : 0) * 1.68));

        List<MaterialItemDTO> materiais = new ArrayList<>();
        long blocos = (long) Math.ceil(areaLiquida * 12.5 * mult);
        long cimento = (long) Math.ceil(areaLiquida * 0.35 * mult); // com reboco
        double areia = Math.max(0.5, Math.round(areaLiquida * 0.045 * mult * 10.0) / 10.0);

        materiais.add(new MaterialItemDTO("mat_bloco_concreto_14", "Bloco de Concreto 14x19x39 cm", "Alvenaria", "unidades",
                BigDecimal.valueOf(areaLiquida * 12.5 * mult), BigDecimal.valueOf(blocos), BigDecimal.valueOf(4.60),
                BigDecimal.valueOf(blocos * 4.60).setScale(2, RoundingMode.HALF_UP), "Estrutura da parede"));

        materiais.add(new MaterialItemDTO("mat_cimento_50kg", "Cimento CP II 50kg", "Aglomerantes", "sacos",
                BigDecimal.valueOf(areaLiquida * 0.35 * mult), BigDecimal.valueOf(cimento), BigDecimal.valueOf(34.90),
                BigDecimal.valueOf(cimento * 34.90).setScale(2, RoundingMode.HALF_UP), "Alvenaria e reboco"));

        materiais.add(new MaterialItemDTO("mat_areia_media", "Areia Média Lavada", "Agregados", "m³",
                BigDecimal.valueOf(areaLiquida * 0.045 * mult), BigDecimal.valueOf(areia), BigDecimal.valueOf(110.00),
                BigDecimal.valueOf(areia * 110.00).setScale(2, RoundingMode.HALF_UP), "Argamassa"));

        BigDecimal subtotal = materiais.stream().map(MaterialItemDTO::getPrecoTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal custoDesp = subtotal.multiply(BigDecimal.valueOf(desperdicio / 100.0)).setScale(2, RoundingMode.HALF_UP);

        CalculoResponseDTO res = new CalculoResponseDTO();
        res.setTipoObra("parede");
        res.setNomeTipoObra("Parede de Alvenaria e Reboco");
        res.setAreaM2(BigDecimal.valueOf(areaLiquida).setScale(2, RoundingMode.HALF_UP));
        res.setPercentualDesperdicio(BigDecimal.valueOf(desperdicio));
        res.setSubtotalMateriais(subtotal.subtract(custoDesp));
        res.setCustoDesperdicio(custoDesp);
        res.setTotalEstimado(subtotal);
        res.setMateriais(materiais);
        res.setFormulasUtilizadas(List.of(
            "Área Parede: " + String.format("%.2f m²", areaLiquida),
            "Blocos: " + blocos + " un | Cimento: " + cimento + " sacos | Areia: " + areia + " m³"
        ));
        res.setPremissasTecnicas(List.of("Espessura média de reboco de 15 mm a 20 mm."));

        Map<String, Object> map = new HashMap<>();
        map.put("Comprimento", comp + " m");
        map.put("Altura", alt + " m");
        res.setResumoEntradas(map);
        return res;
    }
}
