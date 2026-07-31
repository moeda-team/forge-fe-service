## Forge frontend

Forge is a client-side product-workspace prototype: projects, a requirement assistant, Kanban, and a Figma-inspired design canvas.

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev          # local development
npm run build        # production build
npm run test:canvas  # canvas/store smoke checks
```

## Persistence

Workspace state is saved locally in the browser under `forge:workspace:v1`. This preserves projects, requirements, Kanban state, and canvas screens across reloads on the same browser. It is not shared between users or devices.

## Figma bridge

The `figma-plugin` folder exports a selected Figma layer as a Forge clipboard payload. In Forge, paste it on the Design Canvas with Cmd/Ctrl+V.

## Current limitations

- AI responses, model selection, and non-image attachments are demo-only local behavior.
- There is no authentication, collaboration, cloud synchronization, or backend API.
- Browser storage is appropriate for a prototype; production deployments should use authenticated server-side persistence and object storage for uploaded images.
