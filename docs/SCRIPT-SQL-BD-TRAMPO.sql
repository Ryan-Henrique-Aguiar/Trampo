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
    created_tickets_count INT DEFAULT 0,

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
    price_min NUMERIC(10,2) NOT NULL,
    price_max NUMERIC(10,2) NOT NULL,
    minimum_rate NUMERIC(10,2) NOT NULL,
    completed_services_count INT DEFAULT 0
);


/* ==========================================================
   TABELA: CATEGORY
   Catálogo de categorias existentes no sistema.
   ========================================================== */
CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL
);


/* ==========================================================
   TABELA: PROFESSIONAL_CATEGORY
   Relacionamento N:N entre Professional e Category.
   ========================================================== */
CREATE TABLE IF NOT EXISTS professional_category (
    professional_id INT NOT NULL,
    category_id INT NOT NULL,

    PRIMARY KEY (professional_id, category_id),

    FOREIGN KEY (professional_id)
        REFERENCES professional(user_id),

    FOREIGN KEY (category_id)
        REFERENCES category(id)
);


/* ==========================================================
   TABELA: ADDRESS
   Endereço associado aos tickets.
   ========================================================== */
CREATE TABLE IF NOT EXISTS address (
    id SERIAL PRIMARY KEY,
    street VARCHAR(150) NOT NULL,
    number VARCHAR(20) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    complement VARCHAR(150),

    UNIQUE(street, number, neighborhood, city, state)
);


/* ==========================================================
   TABELA: TICKET
   Ticket criado por um cliente.
   ========================================================== */
CREATE TABLE IF NOT EXISTS ticket (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    price_min NUMERIC(10,2),
    price_max NUMERIC(10,2),

    created_at TIMESTAMP NOT NULL,
    service_date TIMESTAMP,

    status VARCHAR(30) NOT NULL,

    client_id INT NOT NULL,
    address_id INT NOT NULL,
    category_id INT NOT NULL,

    FOREIGN KEY (client_id)
        REFERENCES client(user_id),

    FOREIGN KEY (address_id)
        REFERENCES address(id),

    FOREIGN KEY (category_id)
        REFERENCES category(id),

    UNIQUE(title, description, created_at)
);


/* ==========================================================
   TABELA: PROPOSAL
   Proposta enviada por um profissional para um ticket.
   ========================================================== */
CREATE TABLE IF NOT EXISTS proposal (
    id SERIAL PRIMARY KEY,

    price_min NUMERIC(10,2) NOT NULL,
    price_max NUMERIC(10,2) NOT NULL,

    status VARCHAR(30) NOT NULL,

    professional_id INT NOT NULL,
    ticket_id INT NOT NULL,

    FOREIGN KEY (professional_id)
        REFERENCES professional(user_id),

    FOREIGN KEY (ticket_id)
        REFERENCES ticket(id)
);


/* ==========================================================
   TABELA: NOTIFICATION
   Notificações geradas para um ticket.
   ========================================================== */
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,

    ticket_id INT NOT NULL,

    FOREIGN KEY (ticket_id)
        REFERENCES ticket(id)
);


/* ==========================================================
   TABELA: REVIEW
   Relacionamento N:N entre Cliente e Profissional.
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
   TABELA: URGENT_TICKET
   Tickets urgentes criados por clientes.
   ========================================================== */
CREATE TABLE IF NOT EXISTS urgent_ticket (
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
   TABELA: URGENT_TICKET_CATEGORY
   Categorias necessárias para um ticket urgente.
   ========================================================== */
CREATE TABLE IF NOT EXISTS urgent_ticket_category (
    id SERIAL PRIMARY KEY,
    urgent_ticket_id INT NOT NULL,
    category_id INT NOT NULL,

    FOREIGN KEY (urgent_ticket_id)
        REFERENCES urgent_ticket(id),

    FOREIGN KEY (category_id)
        REFERENCES category(id)
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
   ========================================================== */


/* ==========================================================
   Categorias adicionais necessárias para um ticket.
   ========================================================== */
CREATE TABLE IF NOT EXISTS ticket_category (
    id SERIAL PRIMARY KEY,

    ticket_id INT NOT NULL,
    category_id INT NOT NULL,

    FOREIGN KEY (ticket_id)
        REFERENCES ticket(id),

    FOREIGN KEY (category_id)
        REFERENCES category(id)
);


/* ==========================================================
   Formas de pagamento.
   ========================================================== */
CREATE TABLE IF NOT EXISTS payment_method (
    id SERIAL PRIMARY KEY,

    ticket_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,

    FOREIGN KEY (ticket_id)
        REFERENCES ticket(id)
);


/* ==========================================================
   Dias disponíveis.
   ========================================================== */
CREATE TABLE IF NOT EXISTS available_day (
    id SERIAL PRIMARY KEY,

    ticket_id INT NOT NULL,
    available_day VARCHAR(20) NOT NULL,

    FOREIGN KEY (ticket_id)
        REFERENCES ticket(id)
);


/* ==========================================================
   Horários disponíveis.
   ========================================================== */
CREATE TABLE IF NOT EXISTS available_hour (
    id SERIAL PRIMARY KEY,

    ticket_id INT NOT NULL,
    available_hour TIME NOT NULL,

    FOREIGN KEY (ticket_id)
        REFERENCES ticket(id)
);