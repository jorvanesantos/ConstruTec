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
public class PisoCalculationService {

    public CalculoResponseDTO calcular(CalculoRequestDTO request) {
        if (request.getComprimento() == null || request.getComprimento() <= 0) {
            throw new BusinessException("Informe o comprimento do cômodo.");
        }
        if (request.getLargura() == null || request.getLargura() <= 0) {
            throw new BusinessException("Informe a largura do cômodo.");
        }

        double comp = request.getComprimento();
        double larg = request.getLargura();
        double area = comp * larg;
        double desp = request.getPercentualDesperdicio() != null ? request.getPercentualDesperdicio() : 12.0;
        double mult = 1.0 + (desp / 100.0);
        double areaComDesp = area * mult;

        List<MaterialItemDTO> materiais = new ArrayList<>();
        double m2Caixas = Math.ceil(areaComDesp / 1.8) * 1.8;
        long sacosArgamassa = (long) Math.ceil((areaComDesp * 6.0) / 20.0);
        long kgRejunte = (long) Math.max(1, Math.ceil(areaComDesp * 0.45));

        materiais.add(new MaterialItemDTO("mat_porcelanato", "Porcelanato Retificado", "Pisos", "m² (caixas)",
                BigDecimal.valueOf(areaComDesp), BigDecimal.valueOf(m2Caixas), BigDecimal.valueOf(89.00),
                BigDecimal.valueOf(m2Caixas * 89.00).setScale(2, RoundingMode.HALF_UP), "Revestimento de piso"));

        materiais.add(new MaterialItemDTO("mat_argamassa_ac3", "Argamassa AC-III (20kg)", "Argamassas", "sacos",
                BigDecimal.valueOf((areaComDesp * 6.0) / 20.0), BigDecimal.valueOf(sacosArgamassa), BigDecimal.valueOf(38.90),
                BigDecimal.valueOf(sacosArgamassa * 38.90).setScale(2, RoundingMode.HALF_UP), "Fixação de piso com alta aderência"));

        materiais.add(new MaterialItemDTO("mat_rejunte_cimenticio", "Rejunte Cimentício Flexível (1kg)", "Argamassas", "kg",
                BigDecimal.valueOf(areaComDesp * 0.45), BigDecimal.valueOf(kgRejunte), BigDecimal.valueOf(8.50),
                BigDecimal.valueOf(kgRejunte * 8.50).setScale(2, RoundingMode.HALF_UP), "Rejuntamento antimofo"));

        BigDecimal subtotal = materiais.stream().map(MaterialItemDTO::getPrecoTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal custoDesp = subtotal.multiply(BigDecimal.valueOf(desp / 100.0)).setScale(2, RoundingMode.HALF_UP);

        CalculoResponseDTO res = new CalculoResponseDTO();
        res.setTipoObra("piso");
        res.setNomeTipoObra("Piso e Porcelanato");
        res.setAreaM2(BigDecimal.valueOf(area).setScale(2, RoundingMode.HALF_UP));
        res.setPercentualDesperdicio(BigDecimal.valueOf(desp));
        res.setSubtotalMateriais(subtotal.subtract(custoDesp));
        res.setCustoDesperdicio(custoDesp);
        res.setTotalEstimado(subtotal);
        res.setMateriais(materiais);
        res.setFormulasUtilizadas(List.of(
            String.format("Área do Piso: %.2fm x %.2fm = %.2f m²", comp, larg, area),
            String.format("Piso Comercial (+%.0f%% recortes): %.2f m²", desp, m2Caixas),
            String.format("Argamassa Colante (6kg/m²): %d sacos (20kg)", sacosArgamassa),
            String.format("Rejunte Cimentício (0,45kg/m²): %d kg", kgRejunte)
        ));
        res.setPremissasTecnicas(List.of("Peças com borda retificada permitem juntas menores e menor consumo de rejunte."));

        Map<String, Object> map = new HashMap<>();
        map.put("Comprimento", comp + " m");
        map.put("Largura", larg + " m");
        res.setResumoEntradas(map);
        return res;
    }
}
