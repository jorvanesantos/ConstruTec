USE construtec_db;

ALTER TABLE usuario
    ADD COLUMN reset_token VARCHAR(255) NULL,
    ADD COLUMN reset_token_expira DATETIME NULL;
