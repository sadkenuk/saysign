<p align="center">
  <img src="public/favicon.svg" width="80" alt="Say &amp; Sign logo" />
</p>

# Say & Sign

A Makaton-style phrase helper for families. Type or speak a phrase and
it picks out the key words and shows a strip of sign prompt cards — where
on the body each sign happens and how it moves — in signing order. A
fullscreen follow-along view shows the whole phrase as a grid or steps
through one big card at a time.

> **A note on Makaton.** Makaton belongs to
> [The Makaton Charity](https://makaton.org). The graphics here are
> simplified memory prompts, not official Makaton illustrations. Check
> signs against official resources or your speech and language
> therapist, and always speak as you sign.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

Vite + React + Tailwind. The whole app lives in
[src/say-and-sign.jsx](src/say-and-sign.jsx), including the sign
vocabulary (`SIGNS`), synonym table, and tokeniser.

## Run with Docker

```bash
docker compose up -d --build   # http://localhost:8080
```

Multi-stage build: `node:22-alpine` compiles the Vite bundle,
`nginx:1.27-alpine` serves it. The `8080:80` port map is for local dev
only; behind a reverse proxy the container is reached on port 80 over
the proxy network, so it doesn't need to publish a port.

Serve it over HTTPS if you can. Browser speech recognition (the mic
button) only works in a secure context, so on a plain-HTTP origin voice
input is disabled — typing still works. Putting the container behind a
TLS-terminating reverse proxy (Traefik, Caddy, nginx-proxy, etc.)
enables the mic.

## Deploy via CI (optional)

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) is an
example push-to-deploy workflow: on every push to `main` it copies the
build context to a server over SSH and runs a `deploy.sh` there that
builds the image and starts the container behind a reverse proxy. It
expects three repo secrets — `SERVER_HOST`, `SERVER_USER`,
`SERVER_SSH_KEY` — and a matching server-side deploy script. Adapt or
delete it for your own hosting; [app.yml](app.yml) just carries the
container name and desired subdomain that script reads.

## Deploying with Portainer

Two routes, depending on whether the Docker host can see the code:

**Repository build (if the repo is pushed to a Git remote):**
Portainer → *Stacks* → *Add stack* → *Repository*, point it at the repo
URL with compose path `docker-compose.yml`. Portainer clones and builds
on the host.

**Pre-built image (no Git remote needed):** build here, ship the image,
then create the stack from [portainer-stack.yml](portainer-stack.yml):

```bash
docker compose build
docker save say-and-sign:latest | gzip > say-and-sign.tar.gz
scp say-and-sign.tar.gz <docker-host>:
ssh <docker-host> 'gunzip -c say-and-sign.tar.gz | docker load'
```

Then in Portainer: *Stacks* → *Add stack* → *Web editor*, paste the
contents of `portainer-stack.yml`, deploy. The app appears at
`http://<docker-host>:8080` (adjust the port mapping if 8080 is taken).

**Microphone note:** browsers only allow speech recognition in a secure
context, so voice input is disabled over plain `http://<ip>:8080`.
Typing works fine regardless. To get the mic on your network, put the
container behind a reverse proxy that terminates TLS.
