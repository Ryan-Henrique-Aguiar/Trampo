-- ==========================================================
-- SCRIPT DDL ADAPTADO - PROJETO TRAMPO (v3)
-- Alinhado às interfaces TypeScript atuais do front-end.
-- v2 -> v3: padronizado "service" para "ticket" em todo o schema
-- (tabela, colunas de FK e tabelas multivaloradas).
-- ==========================================================

-- ==========================================================
-- TABELA: USERS
-- Antes: users (base) + client + professional (herança).
-- Agora: uma tabela só, com is_provider dizendo o "tipo".
-- Campos exclusivos de cliente e de profissional convivem aqui,
-- ficando NULL para quem não se aplica.
-- ==========================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    nickname VARCHAR(100),
    cpf CHAR(11) UNIQUE NOT NULL,
    rating NUMERIC(3,2),
    is_provider BOOLEAN NOT NULL DEFAULT FALSE,

    -- Específico de cliente (User.createdServicesCount)
    created_services_count INT DEFAULT 0,

    -- Específico de profissional (User.serviceStartDate / completedServicesCount)
    service_start_date DATE,
    completed_services_count INT DEFAULT 0,

    -- Disponibilidade para chamados urgentes (substitui a antiga tabela urgency)
    is_available_for_urgency BOOLEAN NOT NULL DEFAULT FALSE,

    -- Localização (User.city / User.state)
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL
);

-- ==========================================================
-- TABELA: URGENCY -> REMOVIDA
-- Substituída pela coluna users.is_available_for_urgency.
-- Motivo: era usada só como liga/desliga simples, sem
-- necessidade de histórico ou métricas próprias por enquanto.
-- Se no futuro precisar rastrear ativação/desativação ou
-- métricas específicas de urgência, reintroduzir como tabela.
-- ==========================================================

-- ==========================================================
-- TABELA: CATEGORY
-- ==========================================================
CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT NOT NULL
);

-- ==========================================================
-- TABELA: USER_CATEGORY (antiga professional_category)
-- Interface: User.categoryIds. Continua N:N, só trocou a FK
-- de professional(user_id) pra users(id) direto.
-- ==========================================================
CREATE TABLE IF NOT EXISTS user_category (
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (user_id, category_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES category(id)
);

-- ==========================================================
-- TABELA: ADDRESS
-- Endereço vinculado diretamente ao usuário.
-- ==========================================================
CREATE TABLE IF NOT EXISTS address (
    id SERIAL PRIMARY KEY,
    street VARCHAR(150) NOT NULL,
    number VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    complement VARCHAR(100),

    user_id INT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id)

);

-- ==========================================================
-- TABELA: TICKET (renomeada de "service" para padronizar com o
-- restante do sistema, que já chama tudo de "ticket")
-- Adicionei "code", que existe na interface Ticket mas não
-- existia no DDL original. A referência do cliente virou user_id porque
-- não existe mais tabela client separada.
-- ==========================================================
CREATE TABLE IF NOT EXISTS ticket (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price_max NUMERIC(10,2),
    service_date TIMESTAMP,                         
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    proposals_count INT DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    user_id INT NOT NULL,
    category_id INT NOT NULL,
    address_id INT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES category(id),
    FOREIGN KEY (address_id) REFERENCES address(id),
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- Multivalorados de ticket (Ticket.paymentMethods / availableDays / availableHours)
CREATE TABLE IF NOT EXISTS ticket_payment_method (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_available_day (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    available_day VARCHAR(20) NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_available_hour (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    available_hour TIME NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE
);

-- ==========================================================
-- TABELA: PROPOSAL
-- Interface: price_range é número único (não min/max como Ticket).
-- ==========================================================
CREATE TABLE IF NOT EXISTS proposal (
    id SERIAL PRIMARY KEY,
    price_range NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    professional_id INT NOT NULL,
    ticket_id INT NOT NULL,
    FOREIGN KEY (professional_id) REFERENCES users(id),
    FOREIGN KEY (ticket_id) REFERENCES ticket(id)
);

-- ==========================================================
-- TABELA: URGENT_TICKET (renomeada de "urgent_service")
-- ==========================================================
CREATE TABLE IF NOT EXISTS urgent_ticket (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS',
    service_date TIMESTAMP,                          -- nullable, só preenchido ao concluir
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    user_id INT NOT NULL,
    provider_id INT NOT NULL,
    category_id INT NOT NULL,
    address_id INT NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (provider_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES category(id),
    FOREIGN KEY (address_id) REFERENCES address(id),
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- ==========================================================
-- TABELA: NOTIFICATION
-- ticket_id em vez de service_id, seguindo a padronização.
-- ==========================================================
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ticket_id INT NOT NULL,
    FOREIGN KEY (ticket_id) REFERENCES ticket(id)
);

-- ==========================================================
-- TABELA: REVIEW
-- professional_id e user_id referenciam users(id) direto.
-- ==========================================================
CREATE TABLE IF NOT EXISTS review (
    id SERIAL PRIMARY KEY,
    score INT NOT NULL CHECK(score BETWEEN 0 AND 5),
    comment TEXT NOT NULL,
    professional_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (professional_id) REFERENCES users(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(professional_id, user_id)
);
