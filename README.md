# AEQUVG Frontend

Base del sitio público y panel administrativo de AEQUVG. El proyecto se
inicializará con Bun, Nuxt, Vue 3 y TypeScript.

## Desarrollo con Docker

1. Copia `.env.example` como `.env`.
2. Asegúrate de que el backend esté disponible en `localhost:3000`.
3. Ejecuta `docker compose up --build`.

El frontend queda disponible en `http://localhost:3001`. Mientras todavía no
exista `package.json`, el contenedor permanece a la espera; al inicializar el
proyecto, instala las dependencias y ejecuta automáticamente el script `dev`.

`NUXT_PUBLIC_API_BASE_URL` es la URL visible para el navegador y
`NUXT_API_BASE_URL` es la URL que podrá usar Nuxt durante el renderizado del
lado del servidor dentro del contenedor.
