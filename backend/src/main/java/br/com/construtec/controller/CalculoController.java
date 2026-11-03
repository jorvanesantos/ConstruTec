package br.com.construtec.controller;

import br.com.construtec.dto.CalculoRequestDTO;
import br.com.construtec.dto.CalculoResponseDTO;
import br.com.construtec.service.CalculationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calculos")
@CrossOrigin(origins = "*")
public class CalculoController {

    private final CalculationService calculationService;

    public CalculoController(CalculationService calculationService) {
        this.calculationService = calculationService;
    }

    @PostMapping
    public ResponseEntity<CalculoResponseDTO> calcularGenerico(@Valid @RequestBody CalculoRequestDTO request) {
        CalculoResponseDTO response = calculationService.calcular(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/muro")
    public ResponseEntity<CalculoResponseDTO> calcularMuro(@Valid @RequestBody CalculoRequestDTO request) {
        request.setTipoObra("muro");
        return ResponseEntity.ok(calculationService.calcular(request));
    }

    @PostMapping("/parede")
    public ResponseEntity<CalculoResponseDTO> calcularParede(@Valid @RequestBody CalculoRequestDTO request) {
        request.setTipoObra("parede");
        return ResponseEntity.ok(calculationService.calcular(request));
    }

    @PostMapping("/piso")
    public ResponseEntity<CalculoResponseDTO> calcularPiso(@Valid @RequestBody CalculoRequestDTO request) {
        request.setTipoObra("piso");
        return ResponseEntity.ok(calculationService.calcular(request));
    }

    @PostMapping("/pintura")
    public ResponseEntity<CalculoResponseDTO> calcularPintura(@Valid @RequestBody CalculoRequestDTO request) {
        request.setTipoObra("pintura");
        return ResponseEntity.ok(calculationService.calcular(request));
    }

    @PostMapping("/concreto")
    public ResponseEntity<CalculoResponseDTO> calcularConcreto(@Valid @RequestBody CalculoRequestDTO request) {
        request.setTipoObra("concreto");
        return ResponseEntity.ok(calculationService.calcular(request));
    }
}
