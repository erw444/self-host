# nginx

nginx runs on the host (not in a container) and reverse-proxies each domain to a service from the top-level [docker-compose.yml](../docker-compose.yml). Site configs live in `/etc/nginx/conf.d/<domain>.conf`, which the main `nginx.conf` includes.

## Add a site

[add-site.sh](./add-site.sh) writes a reverse-proxy server block, tests the config, and reloads nginx.

```bash
nginx/add-site.sh blog.erw444.com 8080        # upstream: port, host:port, or full URL
nginx/add-site.sh -n blog.erw444.com 8080     # dry run: print the config only
nginx/add-site.sh --tls -e you@example.com blog.erw444.com 8080   # also enable HTTPS
```

| Option | Description |
|--------|-------------|
| `-d, --conf-dir DIR` | Directory for the generated config (default `/etc/nginx/conf.d`) |
| `-f, --force` | Overwrite an existing config for the same domain |
| `-n, --dry-run` | Print the config instead of writing it |
| `-t, --tls` | Get a Let's Encrypt certificate with certbot and redirect HTTP to HTTPS |
| `-e, --email EMAIL` | Let's Encrypt contact email (makes certbot non-interactive) |
| `--no-reload` | Write and test the config without reloading nginx (not allowed with `--tls`) |

If `nginx -t` fails, the script restores the previous config (or removes the new one). It uses `sudo` when the config directory is not writable.

After adding a site:

- Add a DNS record for the domain (see [ddns/](../ddns)).
- Add an `access_control` rule in [authelia/authelia/configuration.yml](../authelia/authelia/configuration.yml) if needed.

### TLS prerequisites

```bash
sudo apt install certbot python3-certbot-nginx
```

Ports 80 and 443 must be forwarded to this machine, and the domain must resolve to your home IP, because Let's Encrypt validates over HTTP. Certbot installs a systemd timer for renewals. To check it:

```bash
sudo certbot renew --dry-run
systemctl list-timers | grep certbot
```

If certbot fails, the site stays up over HTTP. Fix the cause and re-run `sudo certbot --nginx -d <domain> --redirect`.

## Verify the setup

```bash
sudo nginx -t                                  # check config syntax
systemctl status nginx                         # is the service running?
sudo nginx -T | grep -E 'server_name|proxy_pass'   # dump the loaded config: domains and upstreams
ss -tlnp | grep -E ':(80|443)\b'               # is nginx listening on 80/443?
```

Test a site end to end. `--resolve` skips DNS so you can test before the record exists:

```bash
curl -I http://blog.erw444.com
curl -I --resolve blog.erw444.com:80:127.0.0.1 http://blog.erw444.com
curl -I https://blog.erw444.com                # after enabling TLS
curl -I http://localhost:8080                  # the upstream itself, bypassing nginx
```

A `502 Bad Gateway` means nginx is fine but the upstream container is not running or the port is wrong (`docker compose ps`).

Logs:

```bash
sudo tail -f /var/log/nginx/error.log /var/log/nginx/access.log
journalctl -u nginx -e
```

## Restart or reload nginx

Prefer a reload after config changes. It applies the new config without dropping connections, and keeps the old config if the new one is invalid.

```bash
sudo nginx -t && sudo systemctl reload nginx   # apply config changes
sudo systemctl restart nginx                   # full restart
sudo systemctl enable --now nginx              # start now and on boot
sudo systemctl stop nginx
```
