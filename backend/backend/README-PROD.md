**Arquitetura**

```text
Nginx
 ├── /       -> frontend:4200
 └── /api/   -> backend:8080
                  └── PostgreSQL:5432

backend:8080
 └── /app/uploads -> volume Docker persistente

PostgreSQL
 └── volume trampo_postgres_data
```

O banco não fica exposto publicamente. As portas `4200` e `8080` ficam disponíveis apenas localmente na VPS, e o Nginx
faz o acesso externo.

**Na VPS**

1. Instale Docker Engine e Docker Compose.
2. Clone o projeto.
3. Configure as variáveis:

```bash
cp .env.example .env
nano .env
```

Altere obrigatoriamente:

```env
POSTGRES_PASSWORD=uma-senha-forte
JWT_SECRET=um-segredo-longo-e-aleatorio
CORS_ORIGIN=https://seu-dominio.com
```

4. Suba os containers:

```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d --build
```

5. Configure o Nginx usando `trampo.conf.example`.
6. Execute:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

7. Configure HTTPS com Certbot.

O script SQL será executado automaticamente apenas na primeira criação do volume do banco. Os arquivos enviados ficam
preservados no volume `trampo_uploads`.

Made changes.