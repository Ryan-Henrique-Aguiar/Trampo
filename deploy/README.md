# Deploy em VPS

## Requisitos

- VPS Linux com Docker Engine e Docker Compose Plugin.
- DNS apontando o dominio para o IP da VPS.
- Nginx instalado no host.
- Portas 80 e 443 liberadas no firewall. As portas 4200 e 8080 ficam acessiveis apenas localmente na VPS.
- Pelo menos 2 GB de RAM recomendados para compilar o backend e frontend.

## Primeira instalacao

Na raiz do repositorio:

```bash
cp .env.example .env
nano .env
```

Preencha uma senha forte para `POSTGRES_PASSWORD`, um valor aleatorio longo para `JWT_SECRET` e o dominio real em `CORS_ORIGIN`.

Suba os containers:

```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

O frontend fica em `127.0.0.1:4200`, o backend em `127.0.0.1:8080` e o Postgres apenas na rede interna do Compose.

## Nginx

Copie `deploy/nginx/trampo.conf.example` para `/etc/nginx/sites-available/trampo`, troque `trampo.example.com` pelo dominio real e habilite o site:

```bash
sudo ln -s /etc/nginx/sites-available/trampo /etc/nginx/sites-enabled/trampo
sudo nginx -t
sudo systemctl reload nginx
```

Depois, ative HTTPS com Certbot. O arquivo ja encaminha `/api/` para o backend e o restante para o frontend.

## Atualizacao

```bash
git pull
docker compose --env-file .env -f docker-compose.prod.yml up -d --build
```

Os dados do Postgres ficam em `trampo_postgres_data` e os arquivos enviados ficam em `trampo_uploads`. Nao remova esses volumes sem backup.

O script SQL montado em `/docker-entrypoint-initdb.d` so e executado quando o volume do banco e criado pela primeira vez. Para bancos existentes, aplique alteracoes de schema manualmente.

## Diagnostico

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres -d trampo
```
