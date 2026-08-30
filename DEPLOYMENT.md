# Deployment and Operations Runbook

This document describes the deployment and operational workflow for the Clarity backend.

The production backend runs on an AWS EC2 instance using Docker Compose. The application consists of three containers:

- **API container (`clarity-api`)** – Runs the Express backend (`node dist/server.js`)
- **Worker container (`clarity-worker`)** – Processes RabbitMQ jobs (`node dist/workers/weeklyReportWorker.js`)
- **Alloy container (`clarity-alloy`)** – Ships API and worker stdout/stderr logs to Grafana Cloud Logs

The backend uses the following external services:

- **Neon** – PostgreSQL database
- **CloudAMQP** – RabbitMQ message broker
- **AWS Cognito** – Authentication
- **OpenAI** – Weekly report generation
- **Netlify** – Frontend hosting
- **Cloudflare** – DNS and HTTPS
- **Grafana Cloud Logs** – Centralized logs collected by Grafana Alloy

Nginx runs directly on the EC2 host and reverse proxies requests to the API container on `127.0.0.1:3000`.

---

# Deployment Pipeline

Production runs a **pinned SemVer image** (for example `v0.1.0`), not the mutable `latest` tag.

```
Developer
     │
     ▼
GitHub Pull Request → merge into main
     │
     ▼
Create & push Git tag  (e.g. v0.1.0)
     │
     ▼
GitHub Actions: Build and Push Backend Docker Image
     │  tags Docker Hub image as v0.1.0 (+ latest for convenience)
     ▼
GitHub Actions: Deploy Backend to EC2
     │  syncs /opt/clarity to origin/main
     │  sets BACKEND_IMAGE_TAG=v0.1.0 in /opt/clarity/.env
     │  docker compose pull → prisma migrate deploy → up -d
     ▼
clarity-api / clarity-worker run journalapp-backend:v0.1.0
```

---

# Production Architecture

```
                    Netlify Frontend
                           │
                           ▼
                     Cloudflare DNS
                           │
                           ▼
                    Nginx (EC2 Host)
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     API Container              Worker Container
(node dist/server.js)   (weeklyReportWorker.js)
              │                         │
              └────────────┬────────────┘
                           ▼
                  Grafana Alloy
                           │
                           ▼
                 Grafana Cloud Logs
              │                         │
              ▼                         ▼
        Neon PostgreSQL           CloudAMQP
                                        │
                                        ▼
                                  OpenAI API

Authentication
      │
      ▼
 AWS Cognito
```

---

# Prerequisites

Before deploying the application, ensure the following are available:

- AWS account
- EC2 instance
- Docker Engine
- Docker Compose plugin
- Docker Hub repository
- GitHub repository
- Docker image published by GitHub Actions
- Production `.env` file
- `docker-compose.prod.yml`
- Nginx configured to proxy requests to `127.0.0.1:3000`
- Grafana Cloud stack (Logs / Loki)
- `alloy/config.alloy` on the server next to Compose

The production `.env` should contain the environment variables from `backend/.env.example` as well as:

- `DATABASE_URL`
- `RABBITMQ_URL`
- Cognito configuration
- OpenAI API key
- `FRONTEND_URL`
- `DOCKERHUB_USERNAME`
- `BACKEND_IMAGE_TAG` (SemVer Docker tag, e.g. `v0.1.0` — required; do not use `latest`)
- `GRAFANA_CLOUD_LOGS_URL`
- `GRAFANA_CLOUD_LOGS_USERNAME`
- `GRAFANA_CLOUD_LOGS_TOKEN`

---

# Infrastructure Provisioning (Terraform)

AWS infrastructure is managed using Terraform.

Terraform manages:

- EC2 instance
- Security Group
- Elastic IP
- Cognito User Pool
- Cognito App Client

Because the production infrastructure already existed before Terraform was introduced, this project uses an **import-first** workflow.

Typical workflow:

```bash
cd terraform
terraform init
terraform import ...
terraform plan
```

The existing production resources must be imported before running `terraform apply`.

The Terraform plan should **not** contain:

- creation of a second EC2 instance
- creation of a second Cognito User Pool
- replacement of the production EC2 instance
- replacement of the Cognito User Pool
- replacement of the Cognito App Client

See `terraform/README.md` for the complete import procedure and required AWS resource IDs.

---

# Initial Deployment

The following steps assume that the production AWS infrastructure has already been provisioned (either manually or using the Terraform configuration described below) and that an EC2 instance is available.

1. Install Docker Engine and the Docker Compose plugin on the EC2 instance.
2. Copy the following files onto the server (typically `/opt/clarity`):

- `docker-compose.prod.yml`
- `alloy/config.alloy` (keep the `alloy/` directory next to the Compose file)
- production `.env`

3. Authenticate with Docker Hub if the repository is private.

```bash
docker login
```

4. Set `BACKEND_IMAGE_TAG` in production `.env` to a published SemVer tag (for example `v0.1.0`).
5. Pull that versioned image.

```bash
docker compose -f docker-compose.prod.yml pull
```

6. Apply pending database migrations (uses `DATABASE_URL` from production `.env`):

```bash
docker compose -f docker-compose.prod.yml run --rm --no-deps api npx prisma migrate deploy
```

7. Start the application.

```bash
docker compose -f docker-compose.prod.yml up -d
```

8. Continue with the verification steps.

---

# SemVer Release Process (production)

Production should only run versioned images such as `v0.1.0`. Git tags are the source of truth.

1. Merge the release work into `main`.
2. From a clean checkout of `main`, create an annotated SemVer tag:

```bash
git checkout main
git pull origin main
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

3. GitHub Actions workflow **Build and Push Backend Docker Image** builds and pushes:
   - `${DOCKERHUB_USERNAME}/journalapp-backend:v0.1.0`
   - `${DOCKERHUB_USERNAME}/journalapp-backend:latest` (convenience only)
4. Workflow **Deploy Backend to EC2** runs after that build succeeds and:
   - syncs `/opt/clarity` with `origin/main` (`git fetch` / `checkout` / `reset --hard`)
   - writes `BACKEND_IMAGE_TAG=v0.1.0` into `/opt/clarity/.env`
   - runs `docker compose -f docker-compose.prod.yml pull`
   - runs `docker compose -f docker-compose.prod.yml run --rm --no-deps api npx prisma migrate deploy`
   - runs `docker compose -f docker-compose.prod.yml up -d`
   - verifies `clarity-api`, `clarity-worker`, `clarity-alloy`, and `http://127.0.0.1:3000/`

You can also deploy a specific tag manually from GitHub Actions → **Deploy Backend to EC2** → **Run workflow** and set `backend_image_tag` (for example `v0.1.0`).

`BACKEND_IMAGE_TAG` lives only in `/opt/clarity/.env` on the server (or is updated there by the deploy workflow). Do not commit secrets or production `.env` to Git.

---

# Database Migrations

Schema changes use Prisma migrations. The production Docker image includes the Prisma CLI, `prisma/schema.prisma`, `prisma/migrations/`, and `prisma.config.ts` so migrations can run on deploy.

## Local development

When you change the schema:

```bash
cd backend
npx prisma migrate dev --name describe_your_change
```

This updates `prisma/schema.prisma`, creates a folder under `prisma/migrations/`, and applies the migration to your local database.

Commit **both** `schema.prisma` and the new migration folder.

Do **not** use `npx prisma db push` for schema changes you intend to ship to production.

## Production deployment

Production uses **`npx prisma migrate deploy` only**. The deploy workflow runs it automatically after `docker compose pull` and before `docker compose up -d`:

```bash
docker compose -f docker-compose.prod.yml run --rm --no-deps api npx prisma migrate deploy
```

The command reads `DATABASE_URL` from `/opt/clarity/.env` via the `api` service `env_file`. It does not use GitHub secrets or committed env files.

Do **not** run `prisma migrate dev` or `prisma db push` against production.

## One-time baseline (existing production DB)

This project previously applied schema changes with `db push`. Production Neon may already have columns that exist in committed migrations but are not recorded in `_prisma_migrations`.

Before the **first** automated `migrate deploy` after enabling this flow, check whether `mood` and `motivation` already exist on the `entries` table (Neon SQL editor):

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'entries'
  AND column_name IN ('mood', 'motivation');
```

If **both columns exist**, mark the existing migration as already applied (run once on EC2, after pulling an image that includes the Prisma CLI):

```bash
cd /opt/clarity
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml run --rm --no-deps api npx prisma migrate resolve --applied 20260817155200_add_entry_mood_and_motivation
```

If the columns do **not** exist, skip `migrate resolve` and let the deploy workflow run `migrate deploy` normally.

After this one-time step, future deploys only apply **new** pending migrations.

---

# Incremental Deployment

Day-to-day CI still runs on pull requests and pushes to `main` (tests, AI review, optional `latest`/SHA image builds). **Production version bumps** happen when you push a SemVer Git tag as described above.

Config-only changes (`docker-compose.prod.yml`, `alloy/**`, or the deploy workflow) can still trigger deploy on push to `main`; those deploys keep the existing `BACKEND_IMAGE_TAG` already set in `/opt/clarity/.env`.

---

# Verification

Verify that the API, worker, and Alloy containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

View Alloy logs:

```bash
docker compose -f docker-compose.prod.yml logs --tail=50 alloy
```

View API logs:

```bash
docker compose -f docker-compose.prod.yml logs --tail=50 api
```

View worker logs:

```bash
docker compose -f docker-compose.prod.yml logs --tail=50 worker
```

Verify the backend:

```bash
curl http://127.0.0.1:3000/
```

Expected response:

```json
{"message":"Backend is running"}
```

Verify:

- API container is running
- Worker container is connected to CloudAMQP
- Alloy container is running
- Login works from the Netlify frontend
- Creating journal entries works
- Dashboard loads correctly
- Existing journal entries can still be viewed
- New log lines appear in Grafana Cloud (see below)

---

# Grafana Cloud Logs

Grafana Alloy reads stdout/stderr from `clarity-api` and `clarity-worker` and forwards them to Grafana Cloud Logs (Loki). Application code is unchanged.

## Credentials to create

In [Grafana Cloud Portal](https://grafana.com/auth/sign-in/):

1. Open your Grafana Cloud stack.
2. Open **Connections** → **Collector** / **Grafana Alloy**, or **Loki** → **Details**.
3. Copy:

   | Production `.env` variable | Where to get it |
   |----------------------------|-----------------|
   | `GRAFANA_CLOUD_LOGS_URL` | Loki push URL, e.g. `https://logs-prod-xxx.grafana.net/loki/api/v1/push` |
   | `GRAFANA_CLOUD_LOGS_USERNAME` | Loki / Grafana Cloud Logs **instance ID** (numeric username) |
   | `GRAFANA_CLOUD_LOGS_TOKEN` | Access token with **`logs:write`** |

4. Create the token under **Security** → **Access Policies**:
   - Create a policy scoped to this stack
   - Grant **`logs:write`**
   - Create a token and store it only in production `.env` (never in git)

The URL is not secret. The username is the Loki tenant ID. The token is the secret.

Do not expose Alloy’s UI publicly. It is bound to `127.0.0.1:12345` on the EC2 host.

## Verify logs reach Grafana Cloud

On the server:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50 alloy
curl -sS http://127.0.0.1:12345/-/ready
```

Generate traffic (login or `curl http://127.0.0.1:3000/`), then in Grafana Cloud:

1. Open **Explore** (or **Drilldown** → **Logs**).
2. Select the **Loki** / Grafana Cloud Logs data source.
3. Run:

```logql
{app="clarity"}
```

or:

```logql
{container="clarity-api"}
```

```logql
{container="clarity-worker"}
```

You should see Pino JSON lines from the API and worker. If nothing appears, check Alloy logs for 401/403 (bad token) or empty URL (missing env vars).

---

# Rollback

If a deployment introduces an issue, roll back to a previous SemVer image.

Option A — GitHub Actions (preferred):

1. Actions → **Deploy Backend to EC2** → **Run workflow**
2. Set `backend_image_tag` to a previous tag (for example `v0.1.0`)
3. Run the workflow

Option B — on the server:

```bash
cd /opt/clarity
# edit .env: BACKEND_IMAGE_TAG=v0.1.0
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

To stop the application completely:

```bash
docker compose -f docker-compose.prod.yml down
```

---

# Troubleshooting

| Problem | Resolution |
|----------|------------|
| Docker image cannot be pulled | Verify Docker Hub credentials and confirm the image exists on Docker Hub. |
| API container exits immediately | View the API logs and verify the production `.env` contains all required environment variables. |
| Worker cannot connect to RabbitMQ | Verify `RABBITMQ_URL` points to the CloudAMQP instance rather than `localhost`. |
| Backend unavailable | Verify the API and worker containers are running using `docker compose ps`. |
| `curl` to `127.0.0.1:3000` fails | Ensure the API container is running and listening on port `3000`. |
| Public website unavailable | Verify Nginx is proxying requests to `127.0.0.1:3000` and that Cloudflare DNS is configured correctly. |
| CORS errors | Verify `FRONTEND_URL` matches the deployed Netlify frontend URL. |
| Authentication failures | Verify the Cognito User Pool, App Client, and backend Cognito environment variables. |
| Weekly reports are not generated | Verify the worker container is running and connected to CloudAMQP, then inspect the worker logs. |
| Logs do not appear in Grafana Cloud | Confirm Grafana Cloud Logs env vars are set, `alloy/config.alloy` is on the server, and Alloy is running. Inspect `docker compose -f docker-compose.prod.yml logs alloy`. In Grafana Explore query `{app="clarity"}`. |
| Alloy container exits | Alloy needs `/var/run/docker.sock` and a valid `GRAFANA_CLOUD_LOGS_URL`. |
| `prisma migrate deploy` fails with "column already exists" | Production schema was applied via `db push` but `_prisma_migrations` is out of sync. Run the one-time `migrate resolve --applied` command in **Database Migrations** above, then redeploy. |
