package br.com.construtec.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrcamentoDTO {

    private Long id;

    @NotBlank(message = "O título do orçamento é obrigatório.")
    private String titulo;

    private String nomeCliente;

    @NotBlank(message = "O tipo de obra é obrigatório.")
    private String tipoObra;

    @NotNull(message = "A área é obrigatória.")
    private BigDecimal areaM2;

    private BigDecimal volumeM3;

    private BigDecimal percentualDesperdicio;

    private BigDecimal subtotalMateriais;

    private BigDecimal custoDesperdicio;

    private BigDecimal valorTotalEstimado;

    private String uf;

    private String cidade;

    private String status;

    private List<MaterialItemDTO> materiais;

    private LocalDateTime criadoEm;

    public OrcamentoDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getNomeCliente() { return nomeCliente; }
    public void setNomeCliente(String nomeCliente) { this.nomeCliente = nomeCliente; }
    public String getTipoObra() { return tipoObra; }
    public void setTipoObra(String tipoObra) { this.tipoObra = tipoObra; }
    public BigDecimal getAreaM2() { return areaM2; }
    public void setAreaM2(BigDecimal areaM2) { this.areaM2 = areaM2; }
    public BigDecimal getVolumeM3() { return volumeM3; }
    public void setVolumeM3(BigDecimal volumeM3) { this.volumeM3 = volumeM3; }
    public BigDecimal getPercentualDesperdicio() { return percentualDesperdicio; }
    public void setPercentualDesperdicio(BigDecimal percentualDesperdicio) { this.percentualDesperdicio = percentualDesperdicio; }
    public BigDecimal getSubtotalMateriais() { return subtotalMateriais; }
    public void setSubtotalMateriais(BigDecimal subtotalMateriais) { this.subtotalMateriais = subtotalMateriais; }
    public BigDecimal getCustoDesperdicio() { return custoDesperdicio; }
    public void setCustoDesperdicio(BigDecimal custoDesperdicio) { this.custoDesperdicio = custoDesperdicio; }
    public BigDecimal getValorTotalEstimado() { return valorTotalEstimado; }
    public void setValorTotalEstimado(BigDecimal valorTotalEstimado) { this.valorTotalEstimado = valorTotalEstimado; }
    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<MaterialItemDTO> getMateriais() { return materiais; }
    public void setMateriais(List<MaterialItemDTO> materiais) { this.materiais = materiais; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
}
