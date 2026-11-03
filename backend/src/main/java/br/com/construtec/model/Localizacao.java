package br.com.construtec.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "localizacoes")
public class Localizacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2)
    private String uf;

    @Column(nullable = false, length = 100)
    private String estado;

    @Column(nullable = false, length = 100)
    private String cidade;

    @Column(nullable = false, precision = 4, scale = 3)
    private BigDecimal multiplicadorPreco = BigDecimal.ONE;

    @Column(length = 150)
    private String fonteReferencia;

    private Boolean ativo = true;

    public Localizacao() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public BigDecimal getMultiplicadorPreco() { return multiplicadorPreco; }
    public void setMultiplicadorPreco(BigDecimal multiplicadorPreco) { this.multiplicadorPreco = multiplicadorPreco; }
    public String getFonteReferencia() { return fonteReferencia; }
    public void setFonteReferencia(String fonteReferencia) { this.fonteReferencia = fonteReferencia; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
