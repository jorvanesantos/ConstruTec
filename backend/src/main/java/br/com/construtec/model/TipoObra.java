package br.com.construtec.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "tipos_obra")
public class TipoObra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal desperdicioPadrao = BigDecimal.valueOf(10.00);

    @Column(length = 50)
    private String icone;

    private Boolean ativo = true;

    public TipoObra() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public BigDecimal getDesperdicioPadrao() { return desperdicioPadrao; }
    public void setDesperdicioPadrao(BigDecimal desperdicioPadrao) { this.desperdicioPadrao = desperdicioPadrao; }
    public String getIcone() { return icone; }
    public void setIcone(String icone) { this.icone = icone; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
