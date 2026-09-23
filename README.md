# AEQUVG Frontend

Sitio público de la Asociación de Estudiantes de Química de la Universidad del Valle de Guatemala. Incluye inicio y promoción de la carrera, junta directiva, contacto, navegación responsive y estados para las secciones de próximos sprints.

## Tecnologías

- **Bun 1.4:** gestor de dependencias y ejecutor de scripts.
- **Nuxt 4:** framework Vue con SSR y rutas por archivos.
- **Vue 3:** componentes y estado reactivo.
- **Vue Router:** navegación integrada por Nuxt.
- **TypeScript:** contratos para componentes y API.
- **CSS nativo:** tokens globales y diseño responsive sin framework visual.
- **Vitest:** pruebas unitarias.
- **Playwright:** E2E de navegación, formulario y viewport de 320 px.
- **Docker Compose:** ejecución reproducible del frontend.

Las versiones exactas están en `package.json` y las dependencias en `bun.lock`.

## Arquitectura

Nuxt usa `src/` como raíz y `src/views/` como directorio de páginas, según `nuxt.config.ts`:

```text
src/
  app.vue                       # Raíz de la aplicación
  assets/styles/main.css        # Tokens y estilos globales
  components/
    common/                     # Botón, sección, tarjeta y estados
    layout/                     # Navbar y footer
    public/                     # Componentes del sitio público
  composables/                  # Lógica y validación reutilizable
  layouts/default.vue           # Estructura compartida
  router/navigation.ts          # Enlaces del navbar
  services/                     # Cliente HTTP y servicios
  types/api.ts                  # Contratos TypeScript
  views/                        # Páginas enrutadas
server/
  plugins/request-logger.ts     # Logs de solicitudes SSR de Nitro
tests/
  unit/                         # Vitest
  e2e/                          # Playwright
```

Las páginas consumen `src/services/api.ts`; no contienen URLs duplicadas. Ese servicio selecciona la URL correcta para navegador o SSR y normaliza errores. La identidad visual está centralizada en `src/assets/styles/main.css`.

## Variables de entorno

```bash
cp .env.example .env
```

| Variable | Uso |
| --- | --- |
| `FRONTEND_PORT` | Puerto publicado por Docker, normalmente `3001`. |
| `NUXT_PUBLIC_API_BASE_URL` | URL de API visible para el navegador. |
| `NUXT_API_BASE_URL` | URL usada por Nuxt durante SSR. |
| `NUXT_PUBLIC_PRIVACY_VERSION` | Versión oficial del aviso aceptado en el formulario. |
| `NUXT_PUBLIC_LOG_LEVEL` | Nivel mínimo de logs visibles en el navegador. |
| `NUXT_LOG_LEVEL` | Nivel mínimo de logs HTTP del servidor Nuxt/Nitro. |

`NUXT_PUBLIC_PRIVACY_VERSION` permanece como `pendiente-validacion` hasta que UVG confirme el identificador oficial. Actualízala antes de usar el formulario en producción.

## Ejecución con Docker

El Compose del frontend no levanta PostgreSQL ni el backend. Inícialos primero desde su repositorio.

### 1. Iniciar el backend

```bash
cd ../../Back/aequvg-backend
cp .env.example .env
docker compose up --build -d
docker compose exec backend bun run migrate:deploy
```

La seed no se ejecuta al arrancar. Si necesitas los datos iniciales, cárgalos manualmente:

```bash
docker compose exec backend bun run db:seed
```

### 2. Iniciar el frontend

Desde este directorio:

```bash
cp .env.example .env
docker compose up --build -d
```

El sitio queda en `http://localhost:3001` y consume `http://localhost:3000/api/v1`.

```bash
docker compose ps
docker compose logs -f frontend
docker compose stop
docker compose down
```

## Ejecución sin Docker

Requisitos: Bun `1.4.2` o compatible y el backend disponible en `http://localhost:3000/api/v1`.

```bash
bun install --frozen-lockfile
cp .env.example .env
```

Fuera de Docker, navegador y SSR deben acceder al backend mediante `localhost`:

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NUXT_API_BASE_URL=http://localhost:3000/api/v1
NUXT_PUBLIC_PRIVACY_VERSION=pendiente-validacion
```

Inicia Nuxt en el origen autorizado por CORS:

```bash
bun run dev --port 3001
```

Abre `http://localhost:3001`.

## Build de producción

```bash
bun run build
bun run start
```

El artefacto se genera en `.output/`.

## Logs

El frontend registra de forma controlada:

- Fallos al consultar la API, sin registrar cuerpos ni datos enviados.
- Errores de Vue/Nuxt usando únicamente el tipo y contexto técnico seguro.
- Solicitudes SSR con `requestId`, método, ruta sin query string, estado y duración.

Desarrollo recomendado:

```env
NUXT_PUBLIC_LOG_LEVEL=debug
NUXT_LOG_LEVEL=debug
```

Producción recomendada:

```env
NUXT_PUBLIC_LOG_LEVEL=warn
NUXT_LOG_LEVEL=info
```

Los niveles válidos son `debug`, `info`, `warn`, `error` y `silent`. No deben añadirse formularios, correos, teléfonos, tokens ni respuestas completas al contexto de un log.

Con Docker:

```bash
docker compose logs -f frontend
```

## Preparación de producción con Docker

- `docker-compose.yml` ejecuta Nuxt en desarrollo con recarga automática.
- `docker-compose.prod.yml` ejecuta únicamente el artefacto `.output`, sin montar el código ni incluir dependencias de desarrollo.
- `.env.production.example` documenta las variables requeridas sin contener secretos reales.

Prepara y revisa la configuración:

```bash
cp .env.production.example .env.production
# Sustituye example.org y la versión de privacidad antes de desplegar.
```

Construye e inicia:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

La imagen utiliza un usuario sin privilegios, healthcheck y rotación local de logs. Antes de publicar todavía deben definirse dominio, TLS/proxy inverso, observabilidad centralizada y la infraestructura definitiva del backend.

## Seed y datos mostrados

El frontend no guarda datos ni posee un seed independiente. Inicio, junta y contacto consultan la API. Los datos iniciales se administran en:

```text
Back/aequvg-backend/prisma/seed.ts
```

Con Docker:

```bash
cd ../../Back/aequvg-backend
docker compose exec backend bun run db:seed
```

Sin Docker:

```bash
cd ../../Back/aequvg-backend
bun run db:seed
```

PostgreSQL debe estar disponible y las migraciones aplicadas. El README del backend explica cómo agregar integrantes, medios y bloques institucionales de forma repetible.

La ejecución del frontend o backend nunca dispara este comando automáticamente.

Cuando no hay datos publicados, la interfaz muestra un estado vacío; no sustituye información oficial con mocks. Noticias, eventos, recursos e investigación mantienen navegación y un aviso de contenido en desarrollo.

## Pruebas y calidad

```bash
bun run typecheck   # TypeScript y componentes Vue
bun run test        # Vitest
bun run test:e2e    # Playwright
bun run build       # Build SSR
bun audit --production
```

La primera vez puede ser necesario instalar Chromium:

```bash
bunx playwright install chromium
```

Los E2E verifican navegación por teclado, ausencia de desplazamiento horizontal a `320px` y consentimiento obligatorio del formulario.

## Rutas actuales

| Ruta | Estado |
| --- | --- |
| `/` | Inicio y contenido institucional conectado a la API. |
| `/junta-directiva` | Integrantes activos conectados a la API. |
| `/contacto` | Medios y formulario conectados a la API. |
| `/noticias` | Navegación lista; contenido en desarrollo. |
| `/eventos` | Navegación lista; contenido en desarrollo. |
| `/recursos` | Navegación lista; contenido en desarrollo. |
| `/investigacion` | Navegación lista; contenido en desarrollo. |

## Solución de problemas

- **Error de carga:** verifica `/health` del backend y las URLs configuradas.
- **Bloqueo CORS:** `CORS_ORIGIN` debe coincidir con `http://localhost:3001`.
- **SSR no alcanza Docker:** usa `host.docker.internal` en `NUXT_API_BASE_URL`; el navegador debe usar `localhost`.
- **No aparecen datos:** aplica migraciones, ejecuta el seed y confirma que los registros estén activos o publicados.
