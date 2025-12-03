# FitPlanner Backend

[![CI](https://github.com/freshmint22/FitPlanner-BackEnd/actions/workflows/ci.yml/badge.svg)](https://github.com/freshmint22/FitPlanner-BackEnd/actions/workflows/ci.yml)
[![CD](https://github.com/freshmint22/FitPlanner-BackEnd/actions/workflows/cd.yml/badge.svg)](https://github.com/freshmint22/FitPlanner-BackEnd/actions/workflows/cd.yml)
[![codecov](https://codecov.io/gh/freshmint22/FitPlanner-BackEnd/branch/main/graph/badge.svg)](https://codecov.io/gh/freshmint22/FitPlanner-BackEnd)

## Descripción
Backend de FitPlanner, construido con Node.js, Express y Mongoose (MongoDB).

## Instalación
1. Clona el repo: `git clone https://github.com/freshmint22/FitPlanner-BackEnd.git`
2. Instala dependencias: `npm install`
3. Configura variables de entorno (ver `.env.example`)
	- Copia `Backend/.env.example` a `Backend/.env` y completa `MONGODB_URI`. No comitees el `.env`.
4. (Opcional) Usa el script helper para instalar, seed y levantar en dev:
	- En PowerShell: `./run-local.ps1` (desde la carpeta `Backend`).
4. Corre en desarrollo: `npm run dev`

## Scripts
- `npm start`: Inicia el servidor en producción
- `npm run dev`: Inicia en modo desarrollo
- `npm run build`: Compila TypeScript
- `npm test`: Ejecuta tests con cobertura
- `npm run lint`: Linta el código

## Variables de entorno
- `MONGODB_URI`: Connection string para MongoDB (Atlas o local).
- `JWT_SECRET`: Secret para firmar tokens JWT.
- `PORT`: Puerto donde escucha la app (default: `4000`).

## CI/CD
- **CI**: Se ejecuta en push/PR a `main`/`develop`. Incluye lint, tests y build.
- **CD**: Se ejecuta en push a `main` o releases. Despliega automáticamente.

## Contribución
1. Crea una rama `feature/nombre`
2. Haz commits convencionales
3. Abre PR con code review
