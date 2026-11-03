package br.com.construtec.controller;

import br.com.construtec.model.TipoObra;
import br.com.construtec.repository.TipoObraRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-obras")
@CrossOrigin(origins = "*")
public class TipoObraController {

    private final TipoObraRepository tipoObraRepository;

    public TipoObraController(TipoObraRepository tipoObraRepository) {
        this.tipoObraRepository = tipoObraRepository;
    }

    @GetMapping
    public ResponseEntity<List<TipoObra>> listarTodos() {
        return ResponseEntity.ok(tipoObraRepository.findAll());
    }
}
