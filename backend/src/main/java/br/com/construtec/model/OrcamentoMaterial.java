package br.com.construtec.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "orcamento_materiais")
public class OrcamentoMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "orcamento_id", nullable = false)
    @JsonIgnore
    private Orcamento orcamento;

    @Column(nullable = false, length = 150)
    private String nomeMaterial;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantidadeTeorica;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantidadeComercial;

    @Column(nullable = false, length = 50)
    private String unidadeMedida;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @Column(length = 255)
    private String finalidade;

    public OrcamentoMaterial() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Orcamento getOrcamento() { return orcamento; }
    public void setOrcamento(Orcamento orcamento) { this.orcamento = orcamento; }
    public String getNomeMaterial() { return nomeMaterial; }
    public void setNomeMaterial(String nomeMaterial) { this.nomeMaterial = nomeMaterial; }
    public BigDecimal getQuantidadeTeorica() { return quantidadeTeorica; }
    public void setQuantidadeTeorica(BigDecimal quantidadeTeorica) { this.quantidadeTeorica = quantidadeTeorica; }
    public BigDecimal getQuantidadeComercial() { return quantidadeComercial; }
    public void setQuantidadeComercial(BigDecimal quantidadeComercial) { this.quantidadeComercial = quantidadeComercial; }
    public String getUnidadeMedida() { return unidadeMedida; }
    public void setUnidadeMedida(String unidadeMedida) { this.unidadeMedida = unidadeMedida; }
    public BigDecimal getPrecoUnitario() { return precoUnitario; }
    public void setPrecoUnitario(BigDecimal precoUnitario) { this.precoUnitario = precoUnitario; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }
    public String getFinalidade() { return finalidade; }
    public void setFinalidade(String finalidade) { this.finalidade = finalidade; }
}
