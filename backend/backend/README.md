## 🚀 Trampo Backend

Backend da plataforma **Trampo**, desenvolvido com **Java + Spring Boot**, responsável pela autenticação de usuários,
gerenciamento de categorias, tickets e propostas de serviços.

``By Ryan Henrique Aguiar``

> 🚧 **Status:** Em desenvolvimento

---

## 📋 Como rodar o projeto localmente

### 1. ⚙ Configurar o `application.properties`

Configure as informações do banco de dados no arquivo:

```properties
spring.application.name=backend
spring.datasource.url=jdbc:postgresql://localhost:5432/trampo
spring.datasource.username=SEU_USUARIO
spring.datasource.password=SUA_SENHA
spring.datasource.driver-class-name=org.postgresql.Driver
db.url=jdbc:postgresql://localhost:5432/trampo
db.User=SEU_USUARIO
db.password=SUA_SENHA
api.security.token.secret=${JWT_SECRET:ambiente-dev-secret}
```

> ⚠️ **Importante:** não versionar senhas ou outras credenciais reais no repositório.

Para ambientes de produção, recomenda-se utilizar variáveis de ambiente.

---

## 🐘 Banco de Dados

### 1. Criar o banco

No PostgreSQL, crie um banco chamado:

```sql
CREATE
DATABASE trampo;
```

### 2. Executar o script SQL

Após criar o banco, execute o arquivo:

```text
SCRIPT-SQL-BD-ALTERACOES.sql
```

Esse script contém as alterações necessárias para estruturar o banco de dados utilizado pela aplicação.

---


---

# 📡 Endpoints

## 👤 Autenticação

### Registrar usuário

**POST**

```text
/api/v1/auth/register
```

Exemplo:

```json
{
  "email": "ryan.dev@email.com",
  "password": "123456",
  "name": "Ryan",
  "cpf": "14685645650",
  "phone": "35998245845",
  "state": "MG",
  "city": "Santa Rita do Sapucaí",
  "provider": false,
  "category": [
    1
  ]
}
```

---

### Login

**POST**

```text
/api/v1/auth/login
```

Exemplo:

```json
{
  "email": "ryan.dev@email.com",
  "password": "123456"
}
```

O login retorna o token JWT utilizado para acessar os endpoints protegidos.

---

## 👤 Usuário

> 🔐 Necessário enviar o **Bearer Token**.

### Buscar usuário

**GET**

```text
/api/v1/user
```

---

## 📂 Categorias

> 🔐 Necessário enviar o **Bearer Token**.

### Listar categorias

**GET**

```text
/api/v1/categories
```

---

## 🎫 Tickets

> 🔐 Necessário enviar o **Bearer Token**.

### Criar ticket

**POST**

```text
/api/v1/ticket/create
```

Exemplo:

```json
{
  "title": "Teste123",
  "description": "saasda",
  "categoryId": 1,
  "address": {
    "street": "Capitao Vicente Ribeiro",
    "number": "545",
    "neighborhood": "Fernandes",
    "city": "Santa Rita do Sapucaí",
    "state": "MG",
    "zipCode": "37540000",
    "complement": "Casa"
  },
  "priceMax": 50,
  "paymentMethods": [
    "PIX"
  ],
  "availableDays": [
    "TUESDAY",
    "WEDNESDAY"
  ],
  "availableHours": [
    "08:00",
    "09:00",
    "10:00",
    "11:00"
  ],
  "createdAt": "2026-08-16T21:03:00.753Z",
  "status": "OPEN",
  "userId": "1",
  "proposalsCount": 0
}
```

