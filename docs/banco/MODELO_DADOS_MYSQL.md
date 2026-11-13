# Modelo de Dados MySQL — ConstruTec

Script de criação versionado em `database/migrations/001_initial_schema.sql` e carga inicial em `database/seeds/001_initial_data.sql`.

## Tabelas Principais
| Tabela | Função |
|---|---|
| `usuario` | Dados da conta, perfil, hash bcrypt (`senha_hash`) e status (`ativo`). |
| `tipo_construcao` | Tipos disponíveis para cálculo (`muro`, `parede`, `piso`, `pintura`, `concreto`, `fundacao`, `telhado`, `revestimento`, `outro`). |
| `unidade_medida` | Unidades padronizadas (`un`, `saco 50kg`, `saco 20kg`, `m³`, `m²`, `lata 18L`, `kg`, etc.). |
| `material` | Materiais, preços base e unidades relacionadas aos cálculos. |
| `localizacoes` | Coeficientes regionais SINAPI por UF. |
| `obra` | Obras/orçamentos salvos pelos usuários. |
| `medicao` | Medidas utilizadas em uma obra/cálculo (`comprimento`, `altura`, `largura`, `area_liquida_m2`, `volume_m3`, `desperdicio_percentual`). |
| `historico` | Auditoria de ações e logs de segurança. |
