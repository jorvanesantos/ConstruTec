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
public class ConcretoCalculationService {

    public CalculoResponseDTO calcular(CalculoRequestDTO request) {
        if (request.getComprimento() == null || request.getComprimento() <= 0 ||
            request.getLargura() == null || request.getLargura() <= 0) {
            throw new BusinessException("Informe comprimento e largura válidos para o concreto.");
        }
        double profundidade = request.getProfundidade() != null ? request.getProfundidade() : 
                             (request.getEspessuraCm() != null ? request.getEspessuraCm() / 100.0 : 0.10);

        if (profundidade <= 0) {
            throw new BusinessException("A espessura ou profundidade deve ser maior que zero.");
        }

        double comp = request.getComprimento();
        double larg = request.getLargura();
        double volume = comp * larg * profundidade;
        double desp = request.getPercentualDesperdicio() != null ? request.getPercentualDesperdicio() : 10.0;
        double volumeComDesp = volume * (1.0 + (desp / 100.0));

        // Traço 1:2:3 -> 7 sacos cimento/m³, 0.55 m³ areia/m³, 0.83 m³ brita/m³
        long sacosCimento = (long) Math.ceil(volumeComDesp * 7.0);
        double m3Areia = Math.max(0.5, Math.round(volumeComDesp * 0.55 * 10.0) / 10.0);
        double m3Brita = Math.max(0.5, Math.round(volumeComDesp * 0.83 * 10.0) / 10.0);

        List<MaterialItemDTO> materiais = new ArrayList<>();
        materiais.add(new MaterialItemDTO("mat_cimento_50kg", "Cimento Portland CP II (50 kg)", "Aglomerantes", "sacos",
                BigDecimal.valueOf(volumeComDesp * 7.0), BigDecimal.valueOf(sacosCimento), BigDecimal.valueOf(34.90),
                BigDecimal.valueOf(sacosCimento * 34.90).setScale(2, RoundingMode.HALF_UP), "Cimento para traço estrutural 1:2:3 (~25 MPa)"));

        materiais.add(new MaterialItemDTO("mat_areia_media", "Areia Média Lavada", "Agregados", "m³",
                BigDecimal.valueOf(volumeComDesp * 0.55), BigDecimal.valueOf(m3Areia), BigDecimal.valueOf(110.00),
                BigDecimal.valueOf(m3Areia * 110.00).setScale(2, RoundingMode.HALF_UP), "Areia lavada para concreto"));

        materiais.add(new MaterialItemDTO("mat_brita_1", "Pedra Brita 1 (9,5 a 19mm)", "Agregados", "m³",
                BigDecimal.valueOf(volumeComDesp * 0.83), BigDecimal.valueOf(m3Brita), BigDecimal.valueOf(125.00),
                BigDecimal.valueOf(m3Brita * 125.00).setScale(2, RoundingMode.HALF_UP), "Pedra britada para concreto"));

        BigDecimal subtotal = materiais.stream().map(MaterialItemDTO::getPrecoTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal custoDesp = subtotal.multiply(BigDecimal.valueOf(desp / 100.0)).setScale(2, RoundingMode.HALF_UP);

        CalculoResponseDTO res = new CalculoResponseDTO();
        res.setTipoObra("concreto");
        res.setNomeTipoObra("Concreto Estrutural Traço 1:2:3");
        res.setAreaM2(BigDecimal.valueOf(comp * larg).setScale(2, RoundingMode.HALF_UP));
        res.setVolumeM3(BigDecimal.valueOf(volume).setScale(3, RoundingMode.HALF_UP));
        res.setPercentualDesperdicio(BigDecimal.valueOf(desp));
        res.setSubtotalMateriais(subtotal.subtract(custoDesp));
        res.setCustoDesperdicio(custoDesp);
        res.setTotalEstimado(subtotal);
        res.setMateriais(materiais);
        res.setFormulasUtilizadas(List.of(
            String.format("Volume: %.2fm x %.2fm x %.2fm = %.3f m³ (+%.0f%% = %.3f m³)", comp, larg, profundidade, volume, desp, volumeComDesp),
            String.format("Traço 1:2:3: %d sacos cimento (50kg), %.2f m³ areia, %.2f m³ brita 1", sacosCimento, m3Areia, m3Brita)
        ));
        res.setPremissasTecnicas(List.of("Relação água/cimento média recomendada de 0,55. Cura úmida por no mínimo 7 dias."));

        Map<String, Object> map = new HashMap<>();
        map.put("Volume Calculado", String.format("%.3f m³", volume));
        map.put("Traço", "1:2:3 (~25 MPa)");
        res.setResumoEntradas(map);
        return res;
    }
}
