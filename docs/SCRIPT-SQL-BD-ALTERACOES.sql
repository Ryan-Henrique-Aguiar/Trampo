-- ==========================================================
-- SCRIPT DDL ADAPTADO PARA O PROJETO TRAMPO
-- BASEADO NO db.json E NOVOS REQUISITOS
-- ==========================================================

-- ==========================================================
-- TABELA: USERS (Superclasse)
-- Representa qualquer usuário cadastrado (Cliente ou Profissional)
-- ==========================================================
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

-- ==========================================================
-- TABELA: CLIENT (Especialização de Users)
-- ==========================================================
CREATE TABLE IF NOT EXISTS client (
    user_id INT PRIMARY KEY,
    created_services_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==========================================================
-- TABELA: PROFESSIONAL (Especialização de Users)
-- ==========================================================
CREATE TABLE IF NOT EXISTS professional (
    user_id INT PRIMARY KEY,
    service_start_date DATE NOT NULL,
    completed_services_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==========================================================
-- TABELA: URGENCY (Configuração de urgência para profissionais)
-- ==========================================================
CREATE TABLE IF NOT EXISTS urgency (
    id SERIAL PRIMARY KEY,
    status VARCHAR(30) NOT NULL,
    price_range NUMERIC(10,2) NOT NULL,
    minimum_rate NUMERIC(10,2) NOT NULL,
    completed_services_count INT DEFAULT 0
);

-- Relacionamento 1:1 entre Professional e Urgency
ALTER TABLE professional
ADD COLUMN urgency_id INT UNIQUE;

ALTER TABLE professional
ADD CONSTRAINT fk_professional_urgency
FOREIGN KEY (urgency_id) REFERENCES urgency(id);

-- ==========================================================
-- TABELA: CATEGORY (ANTIGA PROFESSION)
-- Adaptado do db.json: "categories"
-- ==========================================================
CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT NOT NULL -- Novo campo para armazenar o ícone
);

-- ==========================================================
-- TABELA: PROFESSIONAL_CATEGORY (ANTIGA PROFESSIONAL_PROFESSION)
-- Relacionamento N:N entre Professional e Category.
-- Um profissional pode se interessar por várias categorias.
-- ==========================================================
CREATE TABLE IF NOT EXISTS professional_category (
    professional_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (professional_id, category_id),
    FOREIGN KEY (professional_id) REFERENCES professional(user_id),
    FOREIGN KEY (category_id) REFERENCES category(id)
);

-- ==========================================================
-- TABELA: ADDRESS (Endereço associado a serviços)
-- ==========================================================
CREATE TABLE IF NOT EXISTS address (
    id SERIAL PRIMARY KEY,
    street VARCHAR(150) NOT NULL,
    number VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL, -- Adicionado do db.json
    state VARCHAR(2) NOT NULL,  -- Adicionado do db.json
    zip_code VARCHAR(10),       -- Adicionado do db.json
    complement VARCHAR(100),    -- Adicionado do db.json
    UNIQUE(street, number, neighborhood, city, state)
);

-- ==========================================================
-- TABELA: SERVICE (ANTIGA "SERVICE" E "TICKETS" NO db.json)
-- Representa um serviço/ticket criado por um cliente.
-- ==========================================================
CREATE TABLE IF NOT EXISTS service (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,          -- Do db.json: "title"
    description TEXT NOT NULL,            -- Do db.json: "description"
    price_min NUMERIC(10,2),              -- Do db.json: priceRange.min
    price_max NUMERIC(10,2),              -- Do db.json: priceRange.max
    service_date TIMESTAMP NOT NULL,      -- Data/Hora de execução (pode ser substituído por available_days/hours)
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO', -- Status do serviço (ABERTO, EM_ANDAMENTO, FINALIZADO, CANCELADO)

    client_id INT NOT NULL,               -- Usuário que criou o serviço (cliente)
    category_id INT NOT NULL,             -- Relacionamento com a categoria do serviço
    address_id INT NOT NULL,              -- Endereço onde o serviço será realizado

    FOREIGN KEY (client_id) REFERENCES client(user_id),
    FOREIGN KEY (category_id) REFERENCES category(id),
    FOREIGN KEY (address_id) REFERENCES address(id)
);

-- ==========================================================
-- TABELAS DE ATRIBUTOS MULTIVALORADOS PARA SERVICE
-- (Adaptados do db.json: paymentMethods, availableDays, availableHours)
-- ==========================================================

-- Formas de pagamento aceitas para o serviço
CREATE TABLE IF NOT EXISTS service_payment_method (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE
);

-- Dias disponíveis para o serviço
CREATE TABLE IF NOT EXISTS service_available_day (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL,
    available_day VARCHAR(20) NOT NULL,
    FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE
);

-- Horários disponíveis para o serviço
CREATE TABLE IF NOT EXISTS service_available_hour (
    id SERIAL PRIMARY KEY,
    service_id INT NOT NULL,
    available_hour TIME NOT NULL,
    FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE
);

-- ==========================================================
-- TABELA: PROPOSAL (Proposta enviada por um profissional)
-- ==========================================================
CREATE TABLE IF NOT EXISTS proposal (
    id SERIAL PRIMARY KEY,
    price_range NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, ACEITA, RECUSADA
    professional_id INT NOT NULL,
    service_id INT NOT NULL,
    FOREIGN KEY (professional_id) REFERENCES professional(user_id),
    FOREIGN KEY (service_id) REFERENCES service(id)
);

-- ==========================================================
-- TABELA: NOTIFICATION (Notificações para usuários)
-- ==========================================================
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    service_id INT NOT NULL,
    FOREIGN KEY (service_id) REFERENCES service(id)
);

-- ==========================================================
-- TABELA: REVIEW (Avaliação entre cliente e profissional)
-- ==========================================================
CREATE TABLE IF NOT EXISTS review (
    id SERIAL PRIMARY KEY,
    score INT NOT NULL CHECK(score BETWEEN 0 AND 5),
    comment TEXT NOT NULL,
    professional_id INT NOT NULL,
    client_id INT NOT NULL,
    FOREIGN KEY (professional_id) REFERENCES professional(user_id),
    FOREIGN KEY (client_id) REFERENCES client(user_id),
    UNIQUE(professional_id, client_id)
);

-- ==========================================================
-- TABELA: URGENT_SERVICE (Serviços urgentes criados por clientes)
-- ==========================================================
CREATE TABLE IF NOT EXISTS urgent_service (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_id INT NOT NULL,
    address_id INT NOT NULL,
    category_id INT NOT NULL, -- Adicionado para compatibilidade com o db.json
    FOREIGN KEY (client_id) REFERENCES client(user_id),
    FOREIGN KEY (address_id) REFERENCES address(id),
    FOREIGN KEY (category_id) REFERENCES category(id)
);

-- ==========================================================
-- TABELA: URGENT_SERVICE_PROFESSIONAL_TYPE (Tipo de profissional necessário)
-- ==========================================================
CREATE TABLE IF NOT EXISTS urgent_service_professional_type (
    id SERIAL PRIMARY KEY,
    urgent_service_id INT NOT NULL,
    professional_type VARCHAR(100) NOT NULL,
    FOREIGN KEY (urgent_service_id) REFERENCES urgent_service(id)
);