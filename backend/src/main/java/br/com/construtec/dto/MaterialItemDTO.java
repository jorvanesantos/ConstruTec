package br.com.construtec.dto;

import java.math.BigDecimal;

public class MaterialItemDTO {

    private String id;
    private String nome;
    private String categoria;
    private String unidade;
    private BigDecimal quantidadeTeorica;
    private BigDecimal quantidadeComercial;
    private BigDecimal precoUnitario;
    private BigDecimal precoTotal;
    private String finalidade;

    public MaterialItemDTO() {}

    public MaterialItemDTO(String id, String nome, String categoria, String unidade, 
                           BigDecimal quantidadeTeorica, BigDecimal quantidadeComercial, 
                           BigDecimal precoUnitario, BigDecimal precoTotal, String finalidade) {
        this.id = id;
        this.nome = nome;
        this.categoria = categoria;
        this.unidade = unidade;
        this.quantidadeTeorica = quantidadeTeorica;
        this.quantidadeComercial = quantidadeComercial;
        this.precoUnitario = precoUnitario;
        this.precoTotal = precoTotal;
        this.finalidade = finalidade;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getUnidade() { return unidade; }
    public void setUnidade(String unidade) { this.unidade = unidade; }
    public BigDecimal getQuantidadeTeorica() { return quantidadeTeorica; }
    public void setQuantidadeTeorica(BigDecimal quantidadeTeorica) { this.quantidadeTeorica = quantidadeTeorica; }
    public BigDecimal getQuantidadeComercial() { return quantidadeComercial; }
    public void setQuantidadeComercial(BigDecimal quantidadeComercial) { this.quantidadeComercial = quantidadeComercial; }
    public BigDecimal getPrecoUnitario() { return precoUnitario; }
    public void setPrecoUnitario(BigDecimal precoUnitario) { this.precoUnitario = precoUnitario; }
    public BigDecimal getPrecoTotal() { return precoTotal; }
    public void setPrecoTotal(BigDecimal precoTotal) { this.precoTotal = precoTotal; }
    public String getFinalidade() { return finalidade; }
    public void setFinalidade(String finalidade) { this.finalidade = finalidade; }
}
