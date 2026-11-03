package br.com.construtec.service;

import br.com.construtec.dto.MaterialItemDTO;
import br.com.construtec.dto.OrcamentoDTO;
import br.com.construtec.exception.BusinessException;
import br.com.construtec.model.Orcamento;
import br.com.construtec.model.OrcamentoMaterial;
import br.com.construtec.repository.OrcamentoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrcamentoService {

    private final OrcamentoRepository repository;

    public OrcamentoService(OrcamentoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<OrcamentoDTO> listarTodos() {
        return repository.findAllByOrderByCriadoEmDesc().stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrcamentoDTO buscarPorId(Long id) {
        Orcamento orcamento = repository.findById(id)
                .orElseThrow(() -> new BusinessException("Orçamento não encontrado com o ID: " + id));
        return converterParaDTO(orcamento);
    }

    @Transactional
    public OrcamentoDTO salvar(OrcamentoDTO dto) {
        if (dto.getTitulo() == null || dto.getTitulo().isBlank()) {
            throw new BusinessException("O título do orçamento é obrigatório.");
        }

        Orcamento entity = new Orcamento();
        entity.setTitulo(dto.getTitulo());
        entity.setNomeCliente(dto.getNomeCliente());
        entity.setTipoObra(dto.getTipoObra());
        entity.setAreaM2(dto.getAreaM2());
        entity.setVolumeM3(dto.getVolumeM3());
        entity.setPercentualDesperdicio(dto.getPercentualDesperdicio());
        entity.setSubtotalMateriais(dto.getSubtotalMateriais());
        entity.setCustoDesperdicio(dto.getCustoDesperdicio());
        entity.setValorTotalEstimado(dto.getValorTotalEstimado());
        entity.setUf(dto.getUf());
        entity.setCidade(dto.getCidade());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : "rascunho");

        if (dto.getMateriais() != null) {
            for (MaterialItemDTO itemDTO : dto.getMateriais()) {
                OrcamentoMaterial item = new OrcamentoMaterial();
                item.setOrcamento(entity);
                item.setNomeMaterial(itemDTO.getNome());
                item.setQuantidadeTeorica(itemDTO.getQuantidadeTeorica());
                item.setQuantidadeComercial(itemDTO.getQuantidadeComercial());
                item.setUnidadeMedida(itemDTO.getUnidade());
                item.setPrecoUnitario(itemDTO.getPrecoUnitario());
                item.setValorTotal(itemDTO.getPrecoTotal());
                item.setFinalidade(itemDTO.getFinalidade());
                entity.getMateriais().add(item);
            }
        }

        Orcamento salvo = repository.save(entity);
        return converterParaDTO(salvo);
    }

    @Transactional
    public void excluir(Long id) {
        if (!repository.existsById(id)) {
            throw new BusinessException("Orçamento não encontrado para exclusão com ID: " + id);
        }
        repository.deleteById(id);
    }

    private OrcamentoDTO converterParaDTO(Orcamento entity) {
        OrcamentoDTO dto = new OrcamentoDTO();
        dto.setId(entity.getId());
        dto.setTitulo(entity.getTitulo());
        dto.setNomeCliente(entity.getNomeCliente());
        dto.setTipoObra(entity.getTipoObra());
        dto.setAreaM2(entity.getAreaM2());
        dto.setVolumeM3(entity.getVolumeM3());
        dto.setPercentualDesperdicio(entity.getPercentualDesperdicio());
        dto.setSubtotalMateriais(entity.getSubtotalMateriais());
        dto.setCustoDesperdicio(entity.getCustoDesperdicio());
        dto.setValorTotalEstimado(entity.getValorTotalEstimado());
        dto.setUf(entity.getUf());
        dto.setCidade(entity.getCidade());
        dto.setStatus(entity.getStatus());
        dto.setCriadoEm(entity.getCriadoEm());

        if (entity.getMateriais() != null) {
            dto.setMateriais(entity.getMateriais().stream().map(m -> new MaterialItemDTO(
                    String.valueOf(m.getId()),
                    m.getNomeMaterial(),
                    "",
                    m.getUnidadeMedida(),
                    m.getQuantidadeTeorica(),
                    m.getQuantidadeComercial(),
                    m.getPrecoUnitario(),
                    m.getValorTotal(),
                    m.getFinalidade()
            )).collect(Collectors.toList()));
        }

        return dto;
    }
}
