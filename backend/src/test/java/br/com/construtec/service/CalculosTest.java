package br.com.construtec.service;

import br.com.construtec.dto.CalculoRequestDTO;
import br.com.construtec.dto.CalculoResponseDTO;
import br.com.construtec.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class CalculosTest {

    private MuroCalculationService muroService;
    private PisoCalculationService pisoService;
    private PinturaCalculationService pinturaService;
    private ConcretoCalculationService concretoService;

    @BeforeEach
    public void setup() {
        muroService = new MuroCalculationService();
        pisoService = new PisoCalculationService();
        pinturaService = new PinturaCalculationService();
        concretoService = new ConcretoCalculationService();
    }

    @Test
    @DisplayName("Teste de cálculo de muro com medidas válidas e margem de 10% de desperdício")
    public void testCalculoMuroValido() {
        CalculoRequestDTO req = new CalculoRequestDTO();
        req.setTipoObra("muro");
        req.setComprimento(10.0);
        req.setAltura(2.5);
        req.setPercentualDesperdicio(10.0);
        req.setUf("SP");

        CalculoResponseDTO res = muroService.calcular(req);

        assertNotNull(res);
        assertEquals("muro", res.getTipoObra());
        assertEquals(25.0, res.getAreaM2().doubleValue(), 0.01);
        assertFalse(res.getMateriais().isEmpty());

        // 25 m² * 12.5 blocos/m² * 1.10 = 343.75 -> arredondamento para 344 blocos
        assertTrue(res.getMateriais().get(0).getQuantidadeComercial().longValue() >= 343);
        assertTrue(res.getTotalEstimado().doubleValue() > 0);
    }

    @Test
    @DisplayName("Teste de validação de valores negativos ou zero no cálculo de muro")
    public void testCalculoMuroValorInvalido() {
        CalculoRequestDTO req = new CalculoRequestDTO();
        req.setTipoObra("muro");
        req.setComprimento(-5.0);
        req.setAltura(2.0);

        assertThrows(BusinessException.class, () -> {
            muroService.calcular(req);
        });
    }

    @Test
    @DisplayName("Teste de cálculo de piso com porcelanato retificado")
    public void testCalculoPiso() {
        CalculoRequestDTO req = new CalculoRequestDTO();
        req.setComprimento(5.0);
        req.setLargura(4.0); // 20 m²
        req.setPercentualDesperdicio(12.0);

        CalculoResponseDTO res = pisoService.calcular(req);

        assertEquals(20.0, res.getAreaM2().doubleValue(), 0.01);
        assertTrue(res.getTotalEstimado().doubleValue() > 0);
        // Argamassa e rejunte devem estar presentes
        assertTrue(res.getMateriais().size() >= 3);
    }

    @Test
    @DisplayName("Teste de cálculo de pintura com 2 demãos")
    public void testCalculoPintura() {
        CalculoRequestDTO req = new CalculoRequestDTO();
        req.setComprimento(12.0);
        req.setAltura(2.8);
        req.setParedesCount(2);
        req.setDemaos(2);
        req.setPercentualDesperdicio(8.0);

        CalculoResponseDTO res = pinturaService.calcular(req);

        assertNotNull(res);
        assertTrue(res.getAreaM2().doubleValue() > 50.0);
        assertTrue(res.getMateriais().stream().anyMatch(m -> m.getNome().contains("Tinta")));
    }

    @Test
    @DisplayName("Teste de cálculo de volume de concreto traço 1:2:3")
    public void testCalculoConcretoVolumeEArredondamento() {
        CalculoRequestDTO req = new CalculoRequestDTO();
        req.setComprimento(4.0);
        req.setLargura(5.0);
        req.setProfundidade(0.12); // Laje de 12cm = 2.4 m³
        req.setPercentualDesperdicio(10.0);

        CalculoResponseDTO res = concretoService.calcular(req);

        assertEquals(2.4, res.getVolumeM3().doubleValue(), 0.01);
        // 2.4 * 1.10 = 2.64 m³ * 7 sacos = 18.48 -> 19 sacos de cimento
        assertTrue(res.getMateriais().get(0).getQuantidadeComercial().longValue() >= 18);
    }
}
