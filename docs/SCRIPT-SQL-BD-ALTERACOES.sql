-- ==========================================================
-- SCRIPT SQL - APENAS AS INTERFACES ENVIADAS NESTA CONVERSA
-- User, Category, Address, Urgency, Ticket, UrgentTicket, Proposal
-- Sem tabelas auxiliares (notification, review) que não têm
-- interface TS correspondente ainda.
-- ==========================================================

-- Interface: User
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    nickname VARCHAR(100),
    cpf CHAR(11) UNIQUE NOT NULL,
    rating NUMERIC(3,2),
    is_provider BOOLEAN NOT NULL DEFAULT FALSE,
    created_services_count INT,
    service_start_date DATE,
    completed_services_count INT,
    urgency_id INT,       -- FK adicionada abaixo, depois de "urgency" existir
    category_ids INT[],   -- User.categoryIds -- array direto, pra espelhar a interface 1:1
    city VARCHAR(100),
    state VARCHAR(2)
);

-- Interface: Category
CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT NOT NULL
);

-- Interface: Address
CREATE TABLE IF NOT EXISTS address (
    id SERIAL PRIMARY KEY,
    street VARCHAR(150) NOT NULL,
    number VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10),
    complement VARCHAR(100)
);

-- Interface: Urgency
-- OBS: a interface já carrega professionalId dentro dela mesma,
-- então a FK fica aqui (e não em users.urgency_id, que é só um espelho).
CREATE TABLE IF NOT EXISTS urgency (
    id SERIAL PRIMARY KEY,
    status VARCHAR(30) NOT NULL,          -- liga/desliga o modo urgente (UrgencyStatus)
    completed_services_count INT DEFAULT 0,
    professional_id INT NOT NULL UNIQUE,  -- UNIQUE garante o 1:1 profissional <-> urgency
    FOREIGN KEY (professional_id) REFERENCES users(id)
);
-- price_range e minimum_rate foram removidos: preço é negociado direto
-- entre cliente e profissional (via WhatsApp), não configurado antecipadamente.

ALTER TABLE users
ADD CONSTRAINT fk_users_urgency
FOREIGN KEY (urgency_id) REFERENCES urgency(id);

-- Interface: Ticket
CREATE TABLE IF NOT EXISTS ticket (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    price_min NUMERIC(10,2),
    price_max NUMERIC(10,2),
    service_date TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    address_id INT NOT NULL,
    proposals_count INT DEFAULT 0,
    payment_methods TEXT[],   -- Ticket.paymentMethods
    available_days TEXT[],   -- Ticket.availableDays
    available_hours TEXT[],   -- Ticket.availableHours
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES category(id),
    FOREIGN KEY (address_id) REFERENCES address(id)
);

-- Interface: UrgentTicket
-- Reflete a interface EXATAMENTE como está hoje: sem title e sem address.
-- Isso bate com o payload mínimo, mas diverge do que seu front realmente
-- envia (title + address) pro POST /urgentTickets. Se for pra manter esse
-- schema fiel à interface, o back vai precisar aceitar/persistir title e
-- address por fora do tipo UrgentTicket, ou você atualiza a interface.
CREATE TABLE IF NOT EXISTS urgent_ticket (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES category(id)
);

-- Interface: Proposal
CREATE TABLE IF NOT EXISTS proposal (
    id SERIAL PRIMARY KEY,
    price_range NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    professional_id INT NOT NULL,
    ticket_id INT NOT NULL,
    FOREIGN KEY (professional_id) REFERENCES users(id),
    FOREIGN KEY (ticket_id) REFERENCES ticket(id)
);