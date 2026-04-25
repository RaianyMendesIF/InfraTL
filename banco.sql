CREATE DATABASE InfraTL;
USE InfraTL;

-- Criar tabelas
CREATE TABLE Usuario(
    cpf varchar(11) PRIMARY KEY NOT NULL,
    nome varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    senha varchar(255) NOT NULL
);

CREATE TABLE Funcionario(
    id int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    matricula varchar(100) NOT NULL,
    cargo varchar(100) NOT NULL
);

CREATE TABLE Cidadao(
    id int AUTO_INCREMENT PRIMARY KEY NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone varchar(20)
);

CREATE TABLE Bairro(
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome varchar(255)
);

CREATE TABLE Endereco(
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    rua varchar(255) NOT NULL,
    numero int NOT NULL,
    complemento varchar(255),
    id_bairro int NOT NULL,
    FOREIGN KEY (id_bairro) REFERENCES Bairro(id)
);

CREATE TABLE Servico(
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome varchar(100) NOT NULL,
    prazo_estimado DATETIME
);

CREATE TABLE Ocorrencia(
    id int NOT NULL PRIMARY KEY AUTO_INCREMENT,
    titulo varchar(100) NOT NULL,
    descricao varchar(300) NOT NULL,
    status ENUM('Em análise', 'Pendente', 'Em execução', 'Finalizado'),
    data_abertura DATETIME NOT NULL,
    data_fechamento DATETIME,
    urgencia ENUM('Baixa', 'Média', 'Alta', 'Crítica'),
    justificativa varchar(300) NOT NULL,
    foto_url VARCHAR(255) NOT NULL,
    id_endereco int NOT NULL,
    id_servico int NOT NULL,
    id_cidadao int NOT NULL,
    id_agente_triagem int,
    id_agente_execucao int,
    id_agente_finalizado int,
    FOREIGN KEY (id_endereco) REFERENCES Endereco(id),
    FOREIGN KEY (id_servico) REFERENCES Servico(id),
    FOREIGN KEY (id_cidadao) REFERENCES Cidadao(id),
    FOREIGN KEY (id_agente_triagem) REFERENCES Funcionario(id),
    FOREIGN KEY (id_agente_execucao) REFERENCES Funcionario(id),
    FOREIGN KEY (id_agente_finalizado) REFERENCES Funcionario(id)
);

SELECT * from BAIRRO;
SELECT * from cidadao;
SELECT * from endereco;
SELECT * from funcionario;
SELECT * from ocorrencia;
SELECT * from servico;
SELECT * from usuario;

