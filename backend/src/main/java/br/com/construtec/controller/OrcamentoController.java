package br.com.construtec.controller;

import br.com.construtec.dto.OrcamentoDTO;
import br.com.construtec.service.OrcamentoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orcamentos")
@CrossOrigin(origins = "*")
public class OrcamentoController {

    private final OrcamentoService orcamentoService;

    public OrcamentoController(OrcamentoService orcamentoService) {
        this.orcamentoService = orcamentoService;
    }

    @GetMapping
    public ResponseEntity<List<OrcamentoDTO>> listarTodos() {
        return ResponseEntity.ok(orcamentoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrcamentoDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(orcamentoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<OrcamentoDTO> salvar(@Valid @RequestBody OrcamentoDTO dto) {
        OrcamentoDTO salvo = orcamentoService.salvar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        orcamentoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
