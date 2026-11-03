-- ==========================================================
-- ConstruTec - Sistema Inteligente de Cálculo de Materiais
-- Arquivo: database/insert_data.sql
-- Objetivo: Carga inicial de dados técnicos e tabela regional de preços
-- ==========================================================

USE construtec_ia;

-- 1. Inserir Usuários Iniciais (Proprietário, Administrador e Usuários)
INSERT INTO usuarios (id, nome, email, perfil, tipo_usuario, ativo, uf_padrao, cidade_padrao) VALUES
(1, 'Jorvane Santos', 'jorvane@construtec.com.br', 'proprietario', 'PROPRIETARIO', TRUE, 'SP', 'São Paulo'),
(2, 'Carlos Silva (Engenheiro)', 'adm@construtec.com.br', 'engenheiro', 'ADM', TRUE, 'SP', 'São Paulo'),
(3, 'Maria Oliveira', 'maria@gmail.com', 'proprietario', 'USUARIO', TRUE, 'MG', 'Belo Horizonte'),
(4, 'Carlos Mendes', 'carlos@gmail.com', 'mestre_obras', 'USUARIO', TRUE, 'RJ', 'Rio de Janeiro')
ON DUPLICATE KEY UPDATE tipo_usuario = VALUES(tipo_usuario), ativo = VALUES(ativo);

-- 2. Inserir Localizações e Multiplicadores Regionais (SINAPI)
INSERT INTO localizacoes (id, uf, estado, cidade, multiplicador_preco, fonte_referencia) VALUES
(1, 'SP', 'São Paulo', 'São Paulo', 1.000, 'SINAPI-SP / Mercado Central'),
(2, 'RJ', 'Rio de Janeiro', 'Rio de Janeiro', 1.050, 'SINAPI-RJ'),
(3, 'MG', 'Minas Gerais', 'Belo Horizonte', 0.960, 'SINAPI-MG'),
(4, 'PR', 'Paraná', 'Curitiba', 0.980, 'SINAPI-PR'),
(5, 'RS', 'Rio Grande do Sul', 'Porto Alegre', 1.020, 'SINAPI-RS'),
(6, 'SC', 'Santa Catarina', 'Florianópolis', 1.030, 'SINAPI-SC'),
(7, 'BA', 'Bahia', 'Salvador', 0.940, 'SINAPI-BA'),
(8, 'PE', 'Pernambuco', 'Recife', 0.930, 'SINAPI-PE'),
(9, 'CE', 'Ceará', 'Fortaleza', 0.920, 'SINAPI-CE'),
(10, 'GO', 'Goiás', 'Goiânia', 0.950, 'SINAPI-GO'),
(11, 'DF', 'Distrito Federal', 'Brasília', 1.080, 'SINAPI-DF'),
(12, 'AM', 'Amazonas', 'Manaus', 1.150, 'SINAPI-AM (Custo Logístico)')
ON DUPLICATE KEY UPDATE multiplicador_preco = VALUES(multiplicador_preco);

-- 3. Inserir Tipos de Obra
INSERT INTO tipos_obra (id, codigo, nome, descricao, categoria, desperdicio_padrao, icone) VALUES
(1, 'muro', 'Muro', 'Alvenaria de vedação perimetral, blocos e argamassa', 'alvenaria', 10.00, 'ShieldAlert'),
(2, 'parede', 'Parede', 'Alvenaria interna e externa com opções de reboco', 'alvenaria', 10.00, 'BrickWall'),
(3, 'piso', 'Piso', 'Revestimento cerâmico, porcelanato e argamassa colante', 'acabamento', 12.00, 'Grid3X3'),
(4, 'pintura', 'Pintura', 'Pintura interna/externa, demãos, selador e massa corrida', 'acabamento', 8.00, 'Paintbrush'),
(5, 'concreto', 'Concreto', 'Concreto usinado ou virado em obra por traço volumétrico', 'estrutural', 10.00, 'Box'),
(6, 'fundacao', 'Fundação', 'Sapatas, brocas e vigas baldrame com ferragem', 'estrutural', 12.00, 'Anchor'),
(7, 'telhado', 'Telhado', 'Coberturas cerâmicas, fibrocimento e madeiramento', 'cobertura', 10.00, 'Home'),
(8, 'revestimento', 'Revestimento', 'Azulejos e placas de parede para áreas molhadas', 'acabamento', 10.00, 'Layers'),
(9, 'outro', 'Outro tipo de obra', 'Cálculos paramétricos para reformas e contrapisos', 'geral', 10.00, 'Wrench')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- 4. Inserir Materiais Básicos
INSERT INTO materiais (id, codigo, nome, categoria, unidade_base, unidade_comercial, descricao) VALUES
(1, 'mat_cimento_50kg', 'Cimento Portland CP II (50 kg)', 'Aglomerantes', 'saco 50kg', 'sacos', 'Cimento composto para alvenaria, reboco e concreto'),
(2, 'mat_areia_media', 'Areia Média Lavada', 'Agregados', 'm³', 'm³', 'Areia limpa para argamassas e concreto'),
(3, 'mat_brita_1', 'Pedra Brita 1 (9,5 a 19mm)', 'Agregados', 'm³', 'm³', 'Pedra britada para concreto estrutural'),
(4, 'mat_bloco_concreto_14', 'Bloco de Concreto 14x19x39 cm', 'Alvenaria', 'unidade', 'unidades', 'Bloco de concreto vedação e estrutural'),
(5, 'mat_tijolo_ceramico_8f', 'Tijolo Cerâmico 8 Furos 9x19x19 cm', 'Alvenaria', 'unidade', 'unidades', 'Tijolo vazado cerâmico'),
(6, 'mat_argamassa_ac1', 'Argamassa Colante AC-I (20 kg)', 'Argamassas', 'saco 20kg', 'sacos', 'Argamassa interna para pisos cerâmicos'),
(7, 'mat_argamassa_ac3', 'Argamassa Colante AC-III (20 kg)', 'Argamassas', 'saco 20kg', 'sacos', 'Alta aderência para porcelanatos'),
(8, 'mat_rejunte_cimenticio', 'Rejunte Cimentício Flexível (1 kg)', 'Argamassas', 'kg', 'kg', 'Rejuntamento antimofo'),
(9, 'mat_piso_ceramico_padrao', 'Revestimento / Piso Cerâmico Esmaltado', 'Pisos', 'm²', 'm² (caixas)', 'Piso cerâmico padrão PEI 4'),
(10, 'mat_porcelanato', 'Porcelanato Retificado 60x60 / 80x80 cm', 'Pisos', 'm²', 'm² (caixas)', 'Porcelanato borda reta retificada'),
(11, 'mat_tinta_acrilica_18l', 'Tinta Acrílica Fosca Premium (18 Litros)', 'Pintura', 'lata 18L', 'latas 18L', 'Tinta acrílica lavável alta cobertura'),
(12, 'mat_selador_acrilico_18l', 'Selador Acrílico (18 Litros)', 'Pintura', 'lata 18L', 'latas 18L', 'Fundo preparador para reboco novo'),
(13, 'mat_massa_corrida_25kg', 'Massa Corrida (Barrica 25 kg)', 'Pintura', 'barrica 25kg', 'barricas 25kg', 'Nivelamento de superfícies internas'),
(14, 'mat_telha_ceramica_romana', 'Telha Cerâmica Tipo Romana', 'Cobertura', 'unidade', 'unidades', 'Telha cerâmica colonial/romana'),
(15, 'mat_aco_ca50_10mm', 'Aço CA-50 Ø 10 mm (3/8") - Barra 12 m', 'Aço e Ferragem', 'barra 12m', 'barras 12m', 'Aço estrutural nervurado para vigas e sapatas')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- 5. Inserir Preços Base para São Paulo (Região 1)
INSERT INTO precos_materiais (material_id, localizacao_id, preco_base, data_atualizacao) VALUES
(1, 1, 34.90, '2026-03-01'),
(2, 1, 110.00, '2026-03-01'),
(3, 1, 125.00, '2026-03-01'),
(4, 1, 4.60, '2026-03-01'),
(5, 1, 1.45, '2026-03-01'),
(6, 1, 17.50, '2026-03-01'),
(7, 1, 38.90, '2026-03-01'),
(8, 1, 8.50, '2026-03-01'),
(9, 1, 42.00, '2026-03-01'),
(10, 1, 89.00, '2026-03-01'),
(11, 1, 289.00, '2026-03-01'),
(12, 1, 145.00, '2026-03-01'),
(13, 1, 72.00, '2026-03-01'),
(14, 1, 2.80, '2026-03-01'),
(15, 1, 48.50, '2026-03-01')
ON DUPLICATE KEY UPDATE preco_base = VALUES(preco_base);
