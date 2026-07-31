## Forge frontend

Forge is an authenticated product workspace: projects, a deterministic requirement assistant, Kanban, and a Figma-inspired design canvas.

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To use the backend, start [`forge-be-service`](../forge-be-service/README.md) and add this to `.env.local`:

```bash
NEXT_PUBLIC_FORGE_API_URL=http://localhost:4000
```

The app starts at register/sign-in. A successful login hydrates projects, requirements, Kanban, chat, and canvas screens from the API. If the old `forge:workspace:v1` browser snapshot exists and the account has no projects, Forge imports it once into the personal workspace.

## Commands

```bash
npm run dev          # local development
npm run build        # production build
npm run test:canvas  # canvas/store smoke checks
```

## Persistence

The API is authoritative after login. Workspace state is retained locally under `forge:workspace:v1` as a recovery cache until hydration completes, and as the one-time legacy import source. Canvas edits are also periodically saved to the API.

## Figma bridge

The `figma-plugin` folder exports a selected Figma layer as a Forge clipboard payload. In Forge, paste it on the Design Canvas with Cmd/Ctrl+V.

## Current limitations

- The assistant is deterministic/demo behavior; model selection and non-image attachments do not call a real provider.
- Collaboration, realtime updates, password reset, email verification, and external integrations are deferred MVP work.
