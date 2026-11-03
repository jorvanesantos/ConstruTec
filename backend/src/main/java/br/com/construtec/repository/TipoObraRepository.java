package br.com.construtec.repository;

import br.com.construtec.model.TipoObra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TipoObraRepository extends JpaRepository<TipoObra, Long> {
    Optional<TipoObra> findByCodigo(String codigo);
}
