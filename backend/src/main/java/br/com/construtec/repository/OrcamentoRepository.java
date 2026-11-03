package br.com.construtec.repository;

import br.com.construtec.model.Orcamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {
    List<Orcamento> findAllByOrderByCriadoEmDesc();
    List<Orcamento> findByTipoObra(String tipoObra);
}
