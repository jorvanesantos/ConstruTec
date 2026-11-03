package br.com.construtec.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orcamentos")
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(length = 150)
    private String nomeCliente;

    @Column(nullable = false, length = 50)
    private String tipoObra;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal areaM2;

    @Column(precision = 10, scale = 3)
    private BigDecimal volumeM3;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal percentualDesperdicio;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotalMateriais;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal custoDesperdicio;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotalEstimado;

    @Column(length = 2)
    private String uf;

    @Column(length = 100)
    private String cidade;

    @Column(nullable = false, length = 30)
    private String status = "rascunho";

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrcamentoMaterial> materiais = new ArrayList<>();

    private LocalDateTime criadoEm = LocalDateTime.now();
    private LocalDateTime atualizadoEm = LocalDateTime.now();

    public Orcamento() {}

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
    public List<OrcamentoMaterial> getMateriais() { return materiais; }
    public void setMateriais(List<OrcamentoMaterial> materiais) { this.materiais = materiais; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
