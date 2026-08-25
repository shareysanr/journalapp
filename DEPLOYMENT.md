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

```
Developer
     │
     ▼
GitHub Pull Request
     │
     ▼
Merge into main
     │
     ▼
GitHub Actions
     │
     ├──────────────► Backend Tests
     │
     ├──────────────► AI Code Review
     │
     ▼
Build Docker Image
     │
     ▼
Push Image to Docker Hub
     │
     ▼
SSH into EC2
     │
     ▼
docker compose pull
docker compose up -d
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

4. Pull the latest production image.

```bash
docker compose -f docker-compose.prod.yml pull
```

5. Start the application.

```bash
docker compose -f docker-compose.prod.yml up -d
```

6. Continue with the verification steps.

---

# Incremental Deployment

Application updates are deployed by merging a Pull Request into `main`. GitHub Actions automatically runs the backend test suite, performs an AI code review, builds a new Docker image, and publishes it to Docker Hub. The production EC2 instance is then updated by pulling the new image and restarting the containers.

Deployment workflow:

1. Developer opens a Pull Request.
2. GitHub Actions executes the CI pipeline.
3. Backend tests run.
4. AI Code Review comments on the Pull Request.
5. GitHub Actions builds the backend Docker image.
6. The image is pushed to Docker Hub.
7. SSH into the EC2 instance.
8. Pull the newest Docker image.

```bash
docker compose -f docker-compose.prod.yml pull
```

9. Restart the containers.

```bash
docker compose -f docker-compose.prod.yml up -d
```

No application rebuild occurs on the production server. The server simply downloads the already-built Docker image.

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

If a deployment introduces an issue, production can be rolled back by deploying a previous Docker image tag.

Set `IMAGE_TAG` inside the production `.env` to a previously published image tag.

Then run:

```bash
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
