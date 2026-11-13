-- =============================================================================
-- ConstruTec - Seed 001: Carga Inicial de Unidades, Tipos, Materiais e Contas
-- =============================================================================

USE construtec_ia;

-- 1. Unidades de Medida
INSERT INTO unidade_medida (id, sigla, nome, descricao) VALUES
(1, 'un', 'Unidade', 'Peça individual (bloco, tijolo, telha)'),
(2, 'saco 50kg', 'Saco 50 kg', 'Embalagem comercial padrão para cimento'),
(3, 'saco 20kg', 'Saco 20 kg', 'Embalagem comercial para cal e argamassa colante'),
(4, 'm³', 'Metro Cúbico', 'Unidade volumétrica para areia lavada e pedra brita'),
(5, 'm²', 'Metro Quadrado', 'Unidade de área para pisos, porcelanatos e revestimentos'),
(6, 'lata 18L', 'Lata 18 Litros', 'Embalagem comercial de tintas e seladores'),
(7, 'barrica 25kg', 'Barrica 25 kg', 'Embalagem comercial para massa corrida/acrílica'),
(8, 'barra 12m', 'Barra 12 Metros', 'Barra padrão de aço CA-50'),
(9, 'kg', 'Quilograma', 'Unidade de massa para rejuntes e arame recozido'),
(10, 'tábua 3m', 'Tábua 3 Metros', 'Madeira serrada para caixarias e formas')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- 2. Usuários Iniciais (ADM Master e ADM Técnico ConstruTec)
-- Senha inicial padrão dos seeds: 123456 (a API também valida/migra automaticamente para bcrypt)
INSERT INTO usuario (id, nome, email, perfil, tipo_usuario, ativo, uf_padrao, cidade_padrao) VALUES
(1, 'Jorvane Santos', 'jorvanesantos@gmail.com', 'ADM Master Geral', 'ADM_MASTER', TRUE, 'SP', 'São Paulo'),
(2, 'ConstruTec', 'adm@construtec.com.br', 'ADM Técnico / Obras', 'ADM', TRUE, 'SP', 'São Paulo')
ON DUPLICATE KEY UPDATE nome = VALUES(nome), tipo_usuario = VALUES(tipo_usuario), ativo = VALUES(ativo);

-- 3. Localizações Regionais (Coeficientes SINAPI)
INSERT INTO localizacoes (id, uf, estado, cidade, multiplicador_preco, fonte_referencia) VALUES
(1, 'SP', 'São Paulo', 'São Paulo (Capital/Grande SP)', 1.000, 'SINAPI-SP / Mercado Paulista'),
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
(12, 'AM', 'Amazonas', 'Manaus', 1.150, 'SINAPI-AM (Logística Fluvial)')
ON DUPLICATE KEY UPDATE multiplicador_preco = VALUES(multiplicador_preco);

-- 4. Tipos de Construção
INSERT INTO tipo_construcao (id, codigo, nome, tagline, descricao, categoria, desperdicio_padrao, icone) VALUES
(1, 'muro', 'Muro', 'Alvenaria de vedação e divisão', 'Calcule blocos/tijolos, cimento, areia, argamassa de assentamento e desconto de vãos.', 'alvenaria', 10.00, 'ShieldAlert'),
(2, 'parede', 'Parede', 'Alvenaria interna e externa com reboco', 'Calcule alvenaria, chapisco, emboço e reboco com base na área, espessura e acabamento.', 'alvenaria', 10.00, 'BrickWall'),
(3, 'piso', 'Piso', 'Revestimento cerâmico e porcelanato', 'Calcule placas de piso, argamassa colante AC-I/II/III, rejunte e margem de recortes.', 'acabamento', 12.00, 'Grid3X3'),
(4, 'pintura', 'Pintura', 'Paredes internas, externas e tetos', 'Calcule latas de tinta, selador preparador, massa corrida/acrílica, rolos e lixas.', 'acabamento', 8.00, 'Paintbrush'),
(5, 'concreto', 'Concreto', 'Lajes, vigas, pilares e pisos industriais', 'Calcule sacos de cimento, areia lavada, pedra britada e água conforme o traço técnico.', 'estrutural', 10.00, 'Box'),
(6, 'fundacao', 'Fundação', 'Sapatas, brocas e vigas baldrame', 'Calcule volume de concreto estrutural, barras de aço CA-50 e tábuas para formas.', 'estrutural', 12.00, 'Anchor'),
(7, 'telhado', 'Telhado', 'Coberturas cerâmicas, fibrocimento e metálicas', 'Calcule quantidade de telhas com fator de inclinação, cumeeiras e madeiramento.', 'cobertura', 10.00, 'Home'),
(8, 'revestimento', 'Revestimento', 'Azulejos e pastilhas de parede', 'Calcule azulejos de cozinha/banheiro, argamassa impermeável e rejunte fino.', 'acabamento', 10.00, 'Layers'),
(9, 'outro', 'Outro tipo de obra', 'Cálculo customizado e reformas rápidas', 'Cálculo modular por área para calçadas, reparos de contrapiso ou reformas mistas.', 'geral', 10.00, 'Wrench')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- 5. Materiais Iniciais
INSERT INTO material (id, codigo, nome, categoria, unidade_medida_id, unidade_base, unidade_comercial, preco, quantidade_minima, descricao, status) VALUES
(1, 'mat_cimento_50kg', 'Cimento Portland CP II (50 kg)', 'Aglomerantes', 2, 'saco 50kg', 'sacos 50kg', 42.00, 20, 'Cimento composto para alvenaria, reboco e concreto estrutural', 'ativo'),
(2, 'mat_areia_media', 'Areia Média Lavada', 'Agregados', 4, 'm³', 'm³', 110.00, 5, 'Areia lavada limpa para argamassas e traço de concreto', 'ativo'),
(3, 'mat_brita_1', 'Pedra Brita 1 (9,5 a 19mm)', 'Agregados', 4, 'm³', 'm³', 125.00, 5, 'Brita graduada para concreto de lajes, vigas, sapatas e calçadas', 'ativo'),
(4, 'mat_bloco_concreto_14', 'Bloco de Concreto 14x19x39 cm', 'Alvenaria', 1, 'unidade', 'unidades', 4.60, 200, 'Bloco padrão com rendimento de 12,5 blocos por m²', 'ativo'),
(5, 'mat_tijolo_ceramico_8f', 'Tijolo Cerâmico 8 Furos 9x19x19 cm', 'Alvenaria', 1, 'unidade', 'unidades', 1.45, 500, 'Tijolo vazado cerâmico com rendimento de 25 peças por m²', 'ativo'),
(6, 'mat_argamassa_ac1', 'Argamassa Colante AC-I (20 kg)', 'Argamassas', 3, 'saco 20kg', 'sacos 20kg', 17.50, 15, 'Argamassa para assentamento cerâmico interno', 'ativo'),
(7, 'mat_porcelanato', 'Porcelanato Retificado 80x80 cm', 'Pisos', 5, 'm²', 'm² (caixas)', 89.00, 25, 'Porcelanato polido ou acetinado com borda retificada', 'ativo'),
(8, 'mat_tinta_acrilica_18l', 'Tinta Acrílica Fosca Premium (18L)', 'Pintura', 6, 'lata 18L', 'latas 18L', 289.00, 10, 'Rendimento médio de 10 m²/L por demão', 'ativo')
ON DUPLICATE KEY UPDATE preco = VALUES(preco);
