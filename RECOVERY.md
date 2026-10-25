# EVA Production Recovery Guide

This document describes how to recover the EVA production stack if the current VPS is lost.

## Source of truth

- Application source code: GitHub repository `EVAWeb-source/EVAProject`, branch `main`
- Production deployment files:
  - `eva-github-upload/docker-compose.production.yml`
  - `eva-github-upload/Caddyfile.production`
  - `eva-github-upload/Dockerfile.production`
- Production secrets are **not** stored in GitHub. They must be restored from the separately encrypted `.env.production` backup.

## Recovery assets to keep off-server

Keep all of these outside the VPS:

1. A clean source-code archive or Git clone of the repository.
2. Latest PostgreSQL custom-format dump: `db-YYYYMMDD-HHMMSS.dump`
3. Latest media archive: `media-YYYYMMDD-HHMMSS.tar.gz`
4. Encrypted production environment file: `production.env.enc`
5. The password required to decrypt `production.env.enc`, stored separately.

## Current production architecture

- Public site: `https://eva-gold.ir`
- Public API path: `https://eva-gold.ir/api/v1/*`
- Admin fallback: `https://eva-gold.ir:8443`
- Planned clean admin hostname: `https://admin.eva-gold.ir`
- PostgreSQL is internal-only.
- API is bound to localhost on the host.
- Admin is bound to localhost on the host.
- Caddy is the public reverse proxy.
- Media is stored in Docker volume `eva-github-upload_eva_media_data`.

## High-level bare-metal recovery

### 1. Provision server

Use an Ubuntu 24.04-class VPS and install:

- Docker Engine
- Docker Compose plugin
- Git
- OpenSSH server

Harden SSH and enable a firewall before exposing production.

### 2. Restore source code

Clone the repository and enter:

```bash
git clone <private-repository-url> EVAProject
cd EVAProject/eva-github-upload
git checkout main
```

Alternatively, extract the clean source-code archive kept in the offline recovery package.

### 3. Restore production environment

Decrypt `production.env.enc` only on a trusted machine. Transfer the resulting file to:

```text
EVAProject/eva-github-upload/.env.production
```

Set permissions immediately:

```bash
chmod 600 .env.production
```

Never commit this file to GitHub.

### 4. Create persistent media volume

The compose file expects this external Docker volume:

```bash
docker volume create eva-github-upload_eva_media_data
```

### 5. Start PostgreSQL

```bash
sudo docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up -d postgres
```

Wait for PostgreSQL to become healthy.

### 6. Restore PostgreSQL backup

For a custom-format `pg_dump` backup:

```bash
cat /path/to/db-YYYYMMDD-HHMMSS.dump | \
sudo docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  exec -T postgres \
  pg_restore \
    -U eva \
    -d eva \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges
```

If the production database/user names ever change, use the values in `.env.production` instead of the literal `eva` values above.

### 7. Restore media

Inspect the archive before extraction:

```bash
tar -tzf /path/to/media-YYYYMMDD-HHMMSS.tar.gz | head
```

Restore the archive into Docker volume `eva-github-upload_eva_media_data`, preserving its stored relative paths. Verify that the expected media files exist before starting the application stack.

### 8. Start the full stack

```bash
sudo docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  up -d --build
```

### 9. Health checks

Check containers:

```bash
sudo docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  ps
```

Check API:

```bash
curl -f https://eva-gold.ir/api/v1/health
```

Check public site and a real media object in a browser.

### 10. DNS

Point the required DNS records to the new VPS public IP:

- `eva-gold.ir`
- `www.eva-gold.ir`
- `admin.eva-gold.ir` when clean admin TLS is enabled

### 11. Final security checks

- PostgreSQL must not be publicly exposed.
- API and Admin host bindings should remain localhost-only.
- Only required firewall ports should be open.
- `.env.production` permissions should be `600`.
- Confirm HTTPS before closing any temporary fallback path.

## Backup validation

Database backup:

```bash
cat db-YYYYMMDD-HHMMSS.dump | \
sudo docker compose \
  --env-file .env.production \
  -f docker-compose.production.yml \
  exec -T postgres \
  pg_restore -l >/dev/null && echo DB_BACKUP_OK
```

Media backup:

```bash
tar -tzf media-YYYYMMDD-HHMMSS.tar.gz >/dev/null && echo MEDIA_BACKUP_OK
```

## Important notes

- GitHub contains code and deployment configuration, not production secrets or user-uploaded media.
- Database and media backups must therefore be kept independently from GitHub.
- The encrypted environment backup should never be stored next to its decryption password.
- Railway is no longer the primary production platform; do not rely on it as the only disaster-recovery copy.
