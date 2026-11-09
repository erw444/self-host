# self-host

Configuration for the services I self-host at home. Most projects run as containers from the top-level [docker-compose.yml](./docker-compose.yml); the DDNS updater runs as a host cron job.

## Quick start

```bash
docker compose up --build -d                  # start everything
docker compose up --build -d dragonsweeper    # start a single service (and its dependencies)
docker compose down                           # stop everything
docker compose down -v                        # stop and delete volumes (resets databases)
```

Podman users can substitute `podman compose`.

## Containers

| Service | Project | Host port | Function |
|---------|---------|-----------|----------|
| `authelia` | [authelia/](./authelia) | 9091 | Authentication and authorization portal (SSO / 2FA). Config and users live in `authelia/authelia/`. |
| `redis` | [authelia/](./authelia) | – | Session storage for Authelia. Data persisted in `authelia/redis/`. |
| `joplin-db` | [joplin-contained/](./joplin-contained) | – | PostgreSQL 13 database for Joplin Server. |
| `joplin` | [joplin-contained/](./joplin-contained) | 22300 | Joplin Server, which syncs notes between Joplin clients (`https://notes.erw444.com`). |
| `website-db` | [website/](./website) | – | PostgreSQL 16 database holding the blog data. |
| `backend` | [website/backend](./website/backend) | 8000 | Go REST API (`/hello`, `/health`, `/blog`) backed by `website-db`. |
| `frontend` | [website/frontend](./website/frontend) | 8080 | Go static file server for the public blog site. Talks to `backend`. |
| `frontend-admin` | [website/frontend-admin](./website/frontend-admin) | 8081 | Go static file server for the blog admin UI. Talks to `backend`. |
| `countdown` | [countdown/](./countdown) | 8082 | React/Vite event countdown page, built and served by nginx. |
| `dragonsweeper` | [dragonsweeper_1.1.18/](./dragonsweeper_1.1.18) | 8083 | Dragonsweeper, a JavaScript browser game, served as static files by nginx. |

Each group of services has its own Docker network (`authelia-net`, `joplin-net`, `website-net`), so they stay isolated from each other.

## Non-container projects

- **[ddns/](./ddns)**: Bash script that updates a Cloudflare DNS A record with this machine's external IP (dynamic DNS for the home connection). Set `zone`, `dnsrecord` and `cloudflare_api_token` in `ddns/config.cfg`, then run `ddns/create-cron-job.sh` to install a daily cron job (02:30). Requires `dig`, `host`, `curl` and `jq`.

## Per-project notes

- **dragonsweeper**: [dragonsweeper_1.1.18/docker-compose.yml](./dragonsweeper_1.1.18/docker-compose.yml) can also run the game on its own at <http://localhost:8000> with `docker compose up --build` from that folder. Port 8000 is used by the website `backend` in the top-level file, hence 8083 there.
- **website**: to reset the database, run `docker compose down -v` before starting again. See [website/readme.md](./website/readme.md).
- **authelia**: to generate a new password hash:
  ```bash
  docker run --rm authelia/authelia:latest authelia crypto hash generate argon2 --password 'YourNewPassword'
  ```
  See [authelia/README.md](./authelia/README.md).

## Port summary

| Port | Service |
|------|---------|
| 8000 | backend |
| 8080 | frontend |
| 8081 | frontend-admin |
| 8082 | countdown |
| 8083 | dragonsweeper |
| 9091 | authelia |
| 22300 | joplin |
