# REQUISITOS DO SISTEMA DE TICKETS

---

## 1. TICKETS NORMAIS

### 1.1. Criação
- Cliente preenche: título, descrição, categoria, endereço, orçamento, pagamento, dias/horários.
- Status inicial: **"Aberto"**.
- Campo `isUrgent = false`.

### 1.2. Propostas
- Máximo de **5 propostas** por ticket.
- Cada proposta é feita por um prestador diferente.
- O sistema conta as propostas automaticamente.

Estados atuais

  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',

Transições possíveis e quem dispara cada uma
De	Para	Quem dispara	Gatilho
OPEN	IN_PROGRESS	Sistema (via ProposalService.accept)	Cliente aceita uma proposta
OPEN	CANCELLED	Cliente	Cliente desiste antes de fechar com alguém
IN_PROGRESS	COMPLETED	Cliente	Cliente marca serviço como concluído (seta serviceDate)
IN_PROGRESS	CANCELLED	Cliente	Cliente cancela mesmo já tendo prestador definido
COMPLETED	—	ninguém	estado final, sem saída
CANCELLED	—	ninguém	estado final, sem saída

### 1.4. Responsabilidades
- **Cliente:** Cria, altera status, contata prestadores via WhatsApp.
- **Prestador:** Faz propostas (até 5), **nunca** altera status.

---

## 2. TICKETS URGENTES

### 2.1. Criação
- Cliente preenche: título, descrição, categoria, endereço.
- Sistema busca **prestadores disponíveis** (com `isAvailableForUrgency = true`).
- Cliente escolhe um prestador e clica no WhatsApp.
- **O ticket é criado APENAS no clique do WhatsApp**, com `providerId` fixo.
- Status inicial: **"Aberto"**.

### 2.2. Disponibilidade do Prestador
- O prestador é listado nas buscas se **`isAvailableForUrgency = true`**.
- O prestador pode ativar/desativar essa flag a qualquer momento (pelo seu perfil).

### 2.3. Mudança de Status (Manual - Cliente)
- De **"Aberto"** (urgente) para:
  - **"Em Andamento"** (serviço começou)
  - **"Cancelado"** (não fechou negócio)
- De **"Em Andamento"** para:
  - **"Concluído"** (serviço terminou)
  - **"Cancelado"** (algo deu errado)
- **Não volta** para "Aberto" depois de "Em Andamento".

### 2.4. Caso não feche com o prestador
- Cliente **cancela** o ticket.
- Cliente **cria um novo ticket** (nova tentativa, novo prestador).
- Cada tentativa = um novo ticket (rastreável).

### 2.5. Detalhe do Ticket Urgente
- Mostra **sempre** o prestador escolhido na criação.
- **NUNCA** faz nova busca por prestadores.
- Prestador é **fixo e imutável**.

### 2.6. Responsabilidades
- **Cliente:** Cria, escolhe prestador, altera status, contata via WhatsApp.
- **Prestador:** É escolhido e associado; define sua própria disponibilidade (`isAvailableForUrgency`).
- **Sistema:** Lista apenas prestadores com `isAvailableForUrgency = true`.

---

## 5. REQUISITOS DE COMPROMISSO DO USUÁRIO

### 5.1. Incentivo e Lembrete (Educativo)
- **Notificação:** A cada 3 dias se o ticket estiver em "Aberto".
- **Destaque visual:** Tickets com +7 dias em "Aberto" aparecem com ⚠️ na lista.
- **Gamificação (futuro):** Selo de confiança para quem mantém status atualizado.

### 5.2. Restrição Leve (Organizacional)
- **Limite de abertos:** Máximo de **5 tickets** com status "Aberto" (normal ou urgente) simultaneamente.
- **Aviso ao criar:** Exibe mensagem se o cliente tiver tickets antigos (+7 dias).

### 5.3. Restrição Forte (Futuro)
- **Bloqueio temporário:** Cliente com +3 tickets abandonados por +15 dias fica bloqueado por 7 dias.
- **Cancelamento automático:** Tickets com +30 dias em "Aberto" são cancelados pelo sistema.

---
## 8. OBSERVAÇÕES FINAIS

- **Tickets cancelados não são deletados** (histórico e métricas).
- **Cada tentativa de urgente = novo ticket** (rastreabilidade).
- **Prestador nunca altera status** (controle é do cliente).
- **Disponibilidade** é controlada pelo prestador via `isAvailableForUrgency`.
- **Limites são flexíveis** (podem ser ajustados conforme necessidade).
- **Abordagem gradual:** incentivos → restrições leves → restrições fortes (apenas em casos extremos).


