# Sprint 5 · Sistema visual y QA

## Fundaciones

- Los tokens globales viven en `src/assets/styles/main.css`.
- `src/config/theme.ts` expone `APP_THEME` para desarrollo: `public-green`,
  `admin-teal` o `unified`.
- Los contenedores disponibles son `container`, `container--wide`,
  `container--reading` y `container--form`.
- El panel administrativo usa `--container-dashboard` para tablas, listados y
  módulos.
- Los campos comparten altura mínima, borde, focus visible, ayuda y error.

## Paletas

- `public-green`: conserva el verde institucional como primario público.
- `admin-teal`: usa el teal administrativo como identidad principal.
- `unified`: recomienda verde oscuro como primario, teal como acento y estados
  semánticos independientes para éxito, advertencia y error.

El selector no se muestra como opción de producción; se cambia editando la
constante `APP_THEME`.

## Responsive verificado

La inspección manual con Chromium cubrió `/`, `/eventos`, `/junta-directiva`,
`/administrador` (login) y rutas de contenido en 390, 1366 y 1920 px. También se
generaron capturas de temas alternativos para home y eventos. La prueba E2E
formal cubre ausencia de overflow público en 390 px, navegación táctil en 320
px, login/panel/eventos administrativos en 1366 px y menú administrativo en
390 px.

Correcciones incluidas: containers más útiles en desktop, grillas fluidas,
sidebar administrativa colapsable en móvil, navegación pública con targets de
48 px y controles de formulario consistentes.

La matriz completa solicitada de 320, 360, 390, 430, 768, 1024, 1366 y 1920
px queda automatizada parcialmente; no se pudo ejecutar la suite local por la
instalación incompleta de dependencias.

## Formularios

Se conservaron las reglas de required, validación, payloads y estados de carga.
Se alinearon alturas, bordes, radios, focus visible, superficies y mensajes en
contacto, inscripción de eventos, autenticación estudiantil y Mi cuenta.

## Evidencia y comandos

- Auditoría inicial: capturas Chromium en `/tmp/aequvg-audit/`, incluyendo
  `refactored-mobile-home.png`, `refactored-desktop-home.png`,
  `public-board.png`, `public-events.png`, y variantes `theme-*-home.png` y
  `theme-*-events.png`.
- QA E2E: `bun run test:e2e`.
- Unitarias: `eco bun run test`.
- Typecheck: `bun run typecheck`.
- Build: `bun run build`.

## Resultado de comandos

- `git diff --check`: PASS en cada rama.
- Chromium del sistema: PASS para capturas manuales.
- `bun run typecheck`: NO EJECUTADO; `nuxt` no está disponible.
- `eco bun run test`: NO EJECUTADO; `vitest` no está disponible.
- `eco bun run test:e2e`: NO EJECUTADO; `playwright` no está disponible.
- `bun run build`: NO EJECUTADO; `nuxt` no está disponible.

La restauración de dependencias tampoco fue posible: `node_modules` está
instalado con propietario `root` y `bun install --frozen-lockfile` falla por
permisos. No se cambiaron ownership global, lockfiles ni dependencias.
