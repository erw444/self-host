#!/bin/bash
#
# Add a new website (reverse proxy server block) to the host nginx setup.
#
# Usage: nginx/add-site.sh [options] <server_name> <upstream>
#
#   server_name   Domain to serve, e.g. blog.erw444.com
#   upstream      Port (8080), host:port (localhost:8080) or full URL (http://localhost:8080)
#
# Options:
#   -d, --conf-dir DIR   Directory for the generated config (default: /etc/nginx/conf.d)
#   -f, --force          Overwrite an existing config for the same server_name
#   -n, --dry-run        Print the config instead of writing it
#   -t, --tls            Get a Let's Encrypt certificate with certbot and enable HTTPS
#                        (needs certbot + python3-certbot-nginx, and ports 80/443 reachable)
#   -e, --email EMAIL    Contact email for Let's Encrypt (makes certbot non-interactive)
#       --no-reload      Write and test the config but do not reload nginx
#   -h, --help           Show this help

set -euo pipefail

CONF_DIR="/etc/nginx/conf.d"
FORCE=0
DRY_RUN=0
RELOAD=1
TLS=0
EMAIL=""

usage() {
    sed -n '3,19p' "$0" | sed 's/^# \{0,1\}//'
}

die() {
    echo "Error: $*" >&2
    exit 1
}

POSITIONAL=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        -d|--conf-dir) [[ $# -ge 2 ]] || die "$1 requires a value"; CONF_DIR="$2"; shift 2 ;;
        -f|--force) FORCE=1; shift ;;
        -n|--dry-run) DRY_RUN=1; shift ;;
        -t|--tls) TLS=1; shift ;;
        -e|--email) [[ $# -ge 2 ]] || die "$1 requires a value"; EMAIL="$2"; shift 2 ;;
        --no-reload) RELOAD=0; shift ;;
        -h|--help) usage; exit 0 ;;
        -*) die "Unknown option: $1" ;;
        *) POSITIONAL+=("$1"); shift ;;
    esac
done

[[ ${#POSITIONAL[@]} -eq 2 ]] || { usage >&2; exit 1; }
SERVER_NAME="${POSITIONAL[0]}"
UPSTREAM="${POSITIONAL[1]}"

[[ "$SERVER_NAME" =~ ^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$ ]] \
    || die "Invalid server_name: $SERVER_NAME"

if [[ "$UPSTREAM" =~ ^[0-9]+$ ]]; then
    UPSTREAM="http://localhost:${UPSTREAM}"
elif [[ "$UPSTREAM" =~ ^[A-Za-z0-9.-]+:[0-9]+$ ]]; then
    UPSTREAM="http://${UPSTREAM}"
elif [[ ! "$UPSTREAM" =~ ^https?://[A-Za-z0-9.-]+(:[0-9]+)?(/[A-Za-z0-9._~/-]*)?$ ]]; then
    die "Invalid upstream: $UPSTREAM"
fi

[[ -z "$EMAIL" || "$EMAIL" =~ ^[^@[:space:]]+@[^@[:space:]]+$ ]] || die "Invalid email: $EMAIL"
if [[ $TLS -eq 1 ]]; then
    [[ $RELOAD -eq 1 ]] || die "--tls requires nginx to be reloaded; remove --no-reload"
    [[ "$CONF_DIR" == /etc/nginx/* ]] || die "--tls only works with the live nginx config directory"
fi

CONF_FILE="${CONF_DIR}/${SERVER_NAME}.conf"

CERTBOT_CMD=(certbot --nginx -d "$SERVER_NAME" --redirect)
if [[ -n "$EMAIL" ]]; then
    CERTBOT_CMD+=(--non-interactive --agree-tos -m "$EMAIL")
fi

CONFIG="server {
    listen 80;
    server_name ${SERVER_NAME};

    location / {
        proxy_pass ${UPSTREAM};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}"

if [[ $DRY_RUN -eq 1 ]]; then
    echo "# ${CONF_FILE}"
    echo "$CONFIG"
    [[ $TLS -ne 1 ]] || echo "# then: ${CERTBOT_CMD[*]}"
    exit 0
fi

if [[ $TLS -eq 1 ]]; then
    command -v certbot > /dev/null || die "certbot not found (install certbot and python3-certbot-nginx)"
fi
[[ -d "$CONF_DIR" ]] || die "Config directory does not exist: $CONF_DIR"
if [[ -e "$CONF_FILE" && $FORCE -ne 1 ]]; then
    die "$CONF_FILE already exists (use --force to overwrite)"
fi

# Use sudo only when the config directory is not writable by the current user.
SUDO=""
if [[ ! -w "$CONF_DIR" && $EUID -ne 0 ]]; then
    SUDO="sudo"
fi

BACKUP=""
if [[ -e "$CONF_FILE" ]]; then
    BACKUP="$(mktemp)"
    $SUDO cat "$CONF_FILE" > "$BACKUP"
fi

echo "$CONFIG" | $SUDO tee "$CONF_FILE" > /dev/null
echo "Wrote $CONF_FILE"

# Roll back if nginx rejects the new configuration.
if [[ "$CONF_DIR" == /etc/nginx/* ]] && ! $SUDO nginx -t; then
    if [[ -n "$BACKUP" ]]; then
        $SUDO tee "$CONF_FILE" < "$BACKUP" > /dev/null
        echo "nginx config test failed; restored previous $CONF_FILE" >&2
    else
        $SUDO rm -f "$CONF_FILE"
        echo "nginx config test failed; removed $CONF_FILE" >&2
    fi
    [[ -z "$BACKUP" ]] || rm -f "$BACKUP"
    exit 1
fi
[[ -z "$BACKUP" ]] || rm -f "$BACKUP"

if [[ $RELOAD -eq 1 && "$CONF_DIR" == /etc/nginx/* ]]; then
    $SUDO systemctl reload nginx
    echo "Reloaded nginx"
fi

if [[ $TLS -eq 1 ]]; then
    # certbot validates over HTTP, so the new server block must already be live.
    if ! $SUDO "${CERTBOT_CMD[@]}"; then
        echo "certbot failed; ${SERVER_NAME} is still served over HTTP at ${CONF_FILE}." >&2
        echo "Check that DNS points here and ports 80/443 are forwarded, then re-run: sudo ${CERTBOT_CMD[*]}" >&2
        exit 1
    fi
fi

echo "Added ${SERVER_NAME} -> ${UPSTREAM}"
echo "Remember to add a DNS record for ${SERVER_NAME} and an access_control rule in authelia/authelia/configuration.yml if needed."
