package br.com.construtec.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class CalculoResponseDTO {

    private String tipoObra;
    private String nomeTipoObra;
    private BigDecimal areaM2;
    private BigDecimal volumeM3;
    private BigDecimal percentualDesperdicio;
    private BigDecimal subtotalMateriais;
    private BigDecimal custoDesperdicio;
    private BigDecimal totalEstimado;
    private List<MaterialItemDTO> materiais = new ArrayList<>();
    private List<String> formulasUtilizadas = new ArrayList<>();
    private List<String> premissasTecnicas = new ArrayList<>();
    private Map<String, Object> resumoEntradas;
    private String avisoLegal = "Os cálculos apresentados pela ConstruTec são estimativas. Para obras estruturais ou projetos que envolvam segurança, consulte um profissional habilitado.";

    public CalculoResponseDTO() {}

    public String getTipoObra() { return tipoObra; }
    public void setTipoObra(String tipoObra) { this.tipoObra = tipoObra; }
    public String getNomeTipoObra() { return nomeTipoObra; }
    public void setNomeTipoObra(String nomeTipoObra) { this.nomeTipoObra = nomeTipoObra; }
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
    public BigDecimal getTotalEstimado() { return totalEstimado; }
    public void setTotalEstimado(BigDecimal totalEstimado) { this.totalEstimado = totalEstimado; }
    public List<MaterialItemDTO> getMateriais() { return materiais; }
    public void setMateriais(List<MaterialItemDTO> materiais) { this.materiais = materiais; }
    public List<String> getFormasUtilizadas() { return formulasUtilizadas; }
    public void setFormulasUtilizadas(List<String> formulasUtilizadas) { this.formulasUtilizadas = formulasUtilizadas; }
    public List<String> getPremissasTecnicas() { return premissasTecnicas; }
    public void setPremissasTecnicas(List<String> premissasTecnicas) { this.premissasTecnicas = premissasTecnicas; }
    public Map<String, Object> getResumoEntradas() { return resumoEntradas; }
    public void setResumoEntradas(Map<String, Object> resumoEntradas) { this.resumoEntradas = resumoEntradas; }
    public String getAvisoLegal() { return avisoLegal; }
}
