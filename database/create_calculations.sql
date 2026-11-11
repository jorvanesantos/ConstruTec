CREATE DATABASE IF NOT EXISTS construtec
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE construtec;

CREATE TABLE IF NOT EXISTS calculos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_user_id VARCHAR(80) NULL,
    tipo_obra VARCHAR(50) NOT NULL,
    parametros_json JSON NOT NULL,
    resultado_json JSON NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_calculos_tipo_data (tipo_obra, criado_em)
) ENGINE=InnoDB;
