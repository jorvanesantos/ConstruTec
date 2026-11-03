package br.com.construtec.repository;

import br.com.construtec.model.Localizacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LocalizacaoRepository extends JpaRepository<Localizacao, Long> {
    Optional<Localizacao> findByUf(String uf);
}
