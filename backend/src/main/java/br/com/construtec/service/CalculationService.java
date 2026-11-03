package br.com.construtec.service;

import br.com.construtec.dto.CalculoRequestDTO;
import br.com.construtec.dto.CalculoResponseDTO;
import br.com.construtec.exception.BusinessException;
import org.springframework.stereotype.Service;

@Service
public class CalculationService {

    private final MuroCalculationService muroService;
    private final ParedeCalculationService paredeService;
    private final PisoCalculationService pisoService;
    private final PinturaCalculationService pinturaService;
    private final ConcretoCalculationService concretoService;

    public CalculationService(MuroCalculationService muroService,
                              ParedeCalculationService paredeService,
                              PisoCalculationService pisoService,
                              PinturaCalculationService pinturaService,
                              ConcretoCalculationService concretoService) {
        this.muroService = muroService;
        this.paredeService = paredeService;
        this.pisoService = pisoService;
        this.pinturaService = pinturaService;
        this.concretoService = concretoService;
    }

    public CalculoResponseDTO calcular(CalculoRequestDTO request) {
        if (request == null || request.getTipoObra() == null) {
            throw new BusinessException("Os dados da obra e o tipo de cálculo devem ser informados.");
        }

        switch (request.getTipoObra().toLowerCase()) {
            case "muro":
                return muroService.calcular(request);
            case "parede":
                return paredeService.calcular(request);
            case "piso":
                return pisoService.calcular(request);
            case "pintura":
                return pinturaService.calcular(request);
            case "concreto":
                return concretoService.calcular(request);
            default:
                throw new BusinessException("Tipo de obra ainda não suportado ou em desenvolvimento: " + request.getTipoObra());
        }
    }
}
