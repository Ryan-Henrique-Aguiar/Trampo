-- Categorias base
INSERT INTO category (id, name, icon_url) VALUES
                                              (1, 'Pedreiro', 'fa-trowel-bricks'),
                                              (2, 'Eletricista', 'fa-bolt'),
                                              (3, 'Encanador', 'fa-faucet')
    ON CONFLICT (id) DO NOTHING;

-- Cliente padrão para os testes E2E (senha: TrampoTest!2026 em BCrypt)
INSERT INTO users (name, password, email, phone, nickname, cpf, is_provider, is_available_for_urgency, city, state)
VALUES (
           'Cliente Teste E2E',
           '$2a$10$zRmyaOICUJfVzwSoUljOQ.5lFq9c8KVLuGWgvvEeKkEb7Dbwc58He',
           'trampo.e2e.client@example.com',
           '35999990001',
           'ClienteE2E',
           '11144477735',
           false,
           false,
           'Abadia dos Dourados',
           'MG'
       )
    ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- Prestador disponível para atendimento urgente em Abadia dos Dourados - MG
INSERT INTO users (name, password, email, phone, nickname, cpf, is_provider, is_available_for_urgency, city, state)
VALUES (
           'Valdeci Prestador Urgente',
           '$2a$10$zRmyaOICUJfVzwSoUljOQ.5lFq9c8KVLuGWgvvEeKkEb7Dbwc58He',
           'trampo.e2e.provider@example.com',
           '35999990002',
           'ValdeciUrgente',
           '52998224725',
           true,
           true,
           'Abadia dos Dourados',
           'MG'
       )
    ON CONFLICT (email) DO UPDATE SET
    is_provider = EXCLUDED.is_provider,
                               is_available_for_urgency = EXCLUDED.is_available_for_urgency,
                               city = EXCLUDED.city,
                               state = EXCLUDED.state;

-- Vincula o prestador urgente a todas as categorias cadastradas
INSERT INTO user_category (user_id, category_id)
SELECT u.id, c.id
FROM users u
         CROSS JOIN category c
WHERE u.email = 'trampo.e2e.provider@example.com'
    ON CONFLICT DO NOTHING;