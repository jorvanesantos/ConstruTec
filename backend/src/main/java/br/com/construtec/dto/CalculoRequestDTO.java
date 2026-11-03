package br.com.construtec.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.Map;

public class CalculoRequestDTO {

    @NotBlank(message = "O tipo de obra é obrigatório.")
    private String tipoObra;

    @Positive(message = "O comprimento deve ser maior que zero.")
    private Double comprimento;

    private Double largura;

    private Double altura;

    private Double profundidade;

    private Double espessuraCm;

    private Integer portasCount;

    private Integer janelasCount;

    private Integer paredesCount;

    private Integer demaos;

    private String tipoBloco;

    private String tipoTelha;

    private String tracoConcreto;

    private String tipoRevestimento;

    @Min(value = 0, message = "O percentual de desperdício não pode ser negativo.")
    @Max(value = 100, message = "O percentual de desperdício não pode exceder 100%.")
    private Double percentualDesperdicio = 10.0;

    private String uf = "SP";

    private String cidade = "São Paulo";

    private Map<String, Object> parametrosAdicionais;

    public CalculoRequestDTO() {}

    public String getTipoObra() { return tipoObra; }
    public void setTipoObra(String tipoObra) { this.tipoObra = tipoObra; }
    public Double getComprimento() { return comprimento; }
    public void setComprimento(Double comprimento) { this.comprimento = comprimento; }
    public Double getLargura() { return largura; }
    public void setLargura(Double largura) { this.largura = largura; }
    public Double getAltura() { return altura; }
    public void setAltura(Double altura) { this.altura = altura; }
    public Double getProfundidade() { return profundidade; }
    public void setProfundidade(Double profundidade) { this.profundidade = profundidade; }
    public Double getEspessuraCm() { return espessuraCm; }
    public void setEspessuraCm(Double espessuraCm) { this.espessuraCm = espessuraCm; }
    public Integer getPortasCount() { return portasCount; }
    public void setPortasCount(Integer portasCount) { this.portasCount = portasCount; }
    public Integer getJanelasCount() { return janelasCount; }
    public void setJanelasCount(Integer janelasCount) { this.janelasCount = janelasCount; }
    public Integer getParedesCount() { return paredesCount; }
    public void setParedesCount(Integer paredesCount) { this.paredesCount = paredesCount; }
    public Integer getDemaos() { return demaos; }
    public void setDemaos(Integer demaos) { this.demaos = demaos; }
    public String getTipoBloco() { return tipoBloco; }
    public void setTipoBloco(String tipoBloco) { this.tipoBloco = tipoBloco; }
    public String getTipoTelha() { return tipoTelha; }
    public void setTipoTelha(String tipoTelha) { this.tipoTelha = tipoTelha; }
    public String getTracoConcreto() { return tracoConcreto; }
    public void setTracoConcreto(String tracoConcreto) { this.tracoConcreto = tracoConcreto; }
    public String getTipoRevestimento() { return tipoRevestimento; }
    public void setTipoRevestimento(String tipoRevestimento) { this.tipoRevestimento = tipoRevestimento; }
    public Double getPercentualDesperdicio() { return percentualDesperdicio; }
    public void setPercentualDesperdicio(Double percentualDesperdicio) { this.percentualDesperdicio = percentualDesperdicio; }
    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public Map<String, Object> getParametrosAdicionais() { return parametrosAdicionais; }
    public void setParametrosAdicionais(Map<String, Object> parametrosAdicionais) { this.parametrosAdicionais = parametrosAdicionais; }
}
