/* ==========================================================
   TABELA: USERS
   Superclasse do sistema.
   Representa qualquer usuário cadastrado, seja Cliente
   ou Profissional.
   ========================================================== */
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    nickname VARCHAR(100),
    cpf CHAR(11) UNIQUE NOT NULL,
    rating NUMERIC(3,2)
);


/* ==========================================================
   TABELA: CLIENT
   Especialização da entidade Users.
   Armazena informações específicas de clientes.
   ========================================================== */
CREATE TABLE IF NOT EXISTS client (
    user_id INT PRIMARY KEY,
    created_services_count INT DEFAULT 0,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);


/* ==========================================================
   TABELA: PROFESSIONAL
   Especialização da entidade Users.
   Armazena informações específicas de profissionais.
   ========================================================== */
CREATE TABLE IF NOT EXISTS professional (
    user_id INT PRIMARY KEY,
    service_start_date DATE NOT NULL,
    completed_services_count INT DEFAULT 0,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);


/* ==========================================================
   TABELA: URGENCY
   Configurações de atendimento urgente utilizadas
   pelos profissionais.
   ========================================================== */
CREATE TABLE IF NOT EXISTS urgency (
    id SERIAL PRIMARY KEY,
    status VARCHAR(30) NOT NULL,
    price_range NUMERIC(10,2) NOT NULL,
    minimum_rate NUMERIC(10,2) NOT NULL,
    completed_services_count INT DEFAULT 0
);


/* ==========================================================
   TABELA: PROFESSION
   Catálogo de profissões existentes no sistema.
   ========================================================== */
CREATE TABLE IF NOT EXISTS profession (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL
);


/* ==========================================================
   TABELA: PROFESSIONAL_PROFESSION
   Relacionamento N:N entre Professional e Profession.
   Um profissional pode possuir várias profissões e
   uma profissão pode pertencer a vários profissionais.
   ========================================================== */
CREATE TABLE IF NOT EXISTS professional_profession (
    professional_id INT NOT NULL,
    profession_id INT NOT NULL,

    PRIMARY KEY (professional_id, profession_id),

    FOREIGN KEY (professional_id)
        REFERENCES professional(user_id),

    FOREIGN KEY (profession_id)
        REFERENCES profession(id)
);


/* ==========================================================
   TABELA: ADDRESS
   Endereço associado a serviços e serviços urgentes.
   ========================================================== */
CREATE TABLE IF NOT EXISTS address (
    id SERIAL PRIMARY KEY,
    street VARCHAR(150) NOT NULL,
    number VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,

    UNIQUE(street, number, neighborhood)
);


/* ==========================================================
   TABELA: SERVICE
   Serviço criado por um cliente.
   ========================================================== */
CREATE TABLE IF NOT EXISTS service (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price_range NUMERIC(10,2),
    service_date TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL,

    client_id INT NOT NULL,
    address_id INT NOT NULL,

    FOREIGN KEY (client_id)
        REFERENCES client(user_id),

    FOREIGN KEY (address_id)
        REFERENCES address(id),

    UNIQUE(name, description, service_date)
);


/* ==========================================================
   TABELA: PROPOSAL
   Proposta enviada por um profissional para um serviço.
   ========================================================== */
CREATE TABLE IF NOT EXISTS proposal (
    id SERIAL PRIMARY KEY,
    price_range NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL,

    professional_id INT NOT NULL,
    service_id INT NOT NULL,

    FOREIGN KEY (professional_id)
        REFERENCES professional(user_id),

    FOREIGN KEY (service_id)
        REFERENCES service(id)
);


/* ==========================================================
   TABELA: NOTIFICATION
   Notificações geradas para um serviço.
   ========================================================== */
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,

    service_id INT NOT NULL,

    FOREIGN KEY (service_id)
        REFERENCES service(id)
);


/* ==========================================================
   TABELA: REVIEW
   Relacionamento N:N entre Cliente e Profissional.
   Armazena avaliações realizadas pelos clientes.
   ========================================================== */
CREATE TABLE IF NOT EXISTS review (
    id SERIAL PRIMARY KEY,
    score INT NOT NULL CHECK(score BETWEEN 0 AND 5),
    comment TEXT NOT NULL,

    professional_id INT NOT NULL,
    client_id INT NOT NULL,

    FOREIGN KEY (professional_id)
        REFERENCES professional(user_id),

    FOREIGN KEY (client_id)
        REFERENCES client(user_id),

    UNIQUE(professional_id, client_id)
);


/* ==========================================================
   TABELA: URGENT_SERVICE
   Serviços urgentes criados por clientes.
   ========================================================== */
CREATE TABLE IF NOT EXISTS urgent_service (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,

    client_id INT NOT NULL,
    address_id INT NOT NULL,

    FOREIGN KEY (client_id)
        REFERENCES client(user_id),

    FOREIGN KEY (address_id)
        REFERENCES address(id)
);


/* ==========================================================
   TABELA: URGENT_SERVICE_PROFESSIONAL_TYPE
   Armazena os tipos de profissionais necessários
   para um serviço urgente.
   ========================================================== */
CREATE TABLE IF NOT EXISTS urgent_service_professional_type (
    id SERIAL PRIMARY KEY,
    urgent_service_id INT NOT NULL,
    professional_type VARCHAR(100) NOT NULL,

    FOREIGN KEY (urgent_service_id)
        REFERENCES urgent_service(id)
);


/* ==========================================================
   RELACIONAMENTO 1:1
   Um profissional pode possuir uma configuração
   de urgência exclusiva.
   ========================================================== */
ALTER TABLE professional
ADD COLUMN urgency_id INT UNIQUE;

ALTER TABLE professional
ADD CONSTRAINT fk_professional_urgency
FOREIGN KEY (urgency_id)
REFERENCES urgency(id);


/* ==========================================================
   TABELAS DE ATRIBUTOS MULTIVALORADOS
   Representam listas presentes no DER.
   ========================================================== */


/* ==========================================================
   Tipos de profissionais .
   ========================================================== */
CREATE TABLE IF NOT EXISTS professional_type (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL,
    professional_type VARCHAR(100) NOT NULL,

    FOREIGN KEY (service_id)
        REFERENCES service(id)
);


/* ==========================================================
   Formas de pagamento .
   ========================================================== */
CREATE TABLE IF NOT EXISTS payment_method (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,

    FOREIGN KEY (service_id)
        REFERENCES service(id)
);


/* ==========================================================
   Dias disponíveis .
   ========================================================== */
CREATE TABLE IF NOT EXISTS available_day (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL,
    available_day VARCHAR(20) NOT NULL,

    FOREIGN KEY (service_id)
        REFERENCES service(id)
);


/* ==========================================================
   Horários disponíveis .
   ========================================================== */
CREATE TABLE IF NOT EXISTS available_hour (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL,
    available_hour TIME NOT NULL,

    FOREIGN KEY (service_id)
        REFERENCES service(id)
);