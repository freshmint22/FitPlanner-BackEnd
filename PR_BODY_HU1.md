feat(FIT-9): HU 1 – ADM-001 | Gestionar Miembros (CRUD)

Resumen
- Implementación del backend para la Historia de Usuario FIT‑9 (ADM‑001) — Gestión de Miembros (CRUD) usando Node.js + TypeScript + Express + Mongoose.

Incluye
- `src/models/member.model.ts` — esquema Mongoose (email único, timestamps, rol, estado).
- `src/services/*`, `src/controllers/*`, `src/routes/members.routes.ts` — lógica CRUD y validaciones.
- `src/seed.ts` — seeder con 5 miembros (upsert).
- `__tests__/members.integration.test.ts` — integración con `mongodb-memory-server`.
- `Backend/.github/workflows/ci.yml` — CI que levanta Mongo como servicio y ejecuta `npm ci`, `npm run seed`, `npm test`.
- Eliminados/limpiados los artefactos de Prisma.
- `run-local.ps1` y README actualizado con instrucciones para probar localmente.

Checklist
- [ ] Lint pasa: `npm run lint`
- [ ] Tests pasan: `npm test`
- [ ] Seed y dev server funcionan: `npm run seed`, `npm run dev`
- [ ] `.env` no incluido en el commit

Notas de despliegue/CI
- CI usa un contenedor `mongo:6` y no requiere secretos.
- Para integración con Atlas en entornos reales, configurar el secret `MONGODB_URI`.

Instrucciones para reviewers
- Clonar el repo del backend y ejecutar:
  - `npm install`
  - `npm test` (usa mongodb-memory-server para integración)
  - `npm run seed` y `npm run dev` para probar la API
