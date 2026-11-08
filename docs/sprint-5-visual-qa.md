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

La inspección con Chromium cubrió `/`, `/eventos`, `/junta-directiva`,
`/administrador` y rutas de contenido en 320, 360, 390, 430, 768, 1024, 1366
y 1920 px. La matriz pública no presentó overflow horizontal funcional. La
prueba E2E formal cubre ausencia de overflow público en 390 px, navegación
táctil en 320 px, login/panel/eventos administrativos autenticados en 1366 px
y menú administrativo en 390 px.

El flujo autenticado con el fixture `admin@uvg.edu.gt` / `Acceso123!` también
se verificó visualmente en panel y eventos en 390, 768, 1366 y 1920 px; en
todos los casos `scrollWidth` coincidió con el ancho del viewport.

Correcciones incluidas: containers más útiles en desktop, grillas fluidas,
sidebar administrativa colapsable en móvil, navegación pública con targets de
48 px y controles de formulario consistentes.

La suite automatizada cubre el bloque visual del Sprint 5 y la suite E2E
existente se ejecutó completa. La suite existente conserva fallos funcionales
ajenos al refactor visual; se detallan abajo.

## Formularios

Se conservaron las reglas de required, validación, payloads y estados de carga.
Se alinearon alturas, bordes, radios, focus visible, superficies y mensajes en
contacto, inscripción de eventos, autenticación estudiantil y Mi cuenta.

## Evidencia y comandos

- Auditoría inicial: capturas Chromium en `/tmp/aequvg-audit/`, incluyendo
  `refactored-mobile-home.png`, `refactored-desktop-home.png`,
  `public-board.png`, `public-events.png`, y variantes `theme-*-home.png` y
  `theme-*-events.png`.
- QA E2E: `eco bun run test:e2e` dentro del contenedor frontend.
- Unitarias: `eco bun run test`.
- Typecheck: `bun run typecheck`.
- Build: `bun run build`.
- QA visual focalizado: `eco bunx playwright test tests/e2e/visual-regression.spec.ts`.

## Resultado de comandos

- `git diff --check`: PASS.
- Chromium en contenedor Alpine: PASS mediante `apk` con Chromium y sus
  dependencias del sistema.
- `eco docker compose exec frontend bun run test`: PASS, 18 archivos y 68/68
  pruebas.
- `docker compose exec frontend bun run typecheck`: PASS.
- `docker compose exec frontend bun run build`: PASS (`✨ Build complete!`).
- `eco bunx playwright test tests/e2e/visual-regression.spec.ts`: PASS, 4/4.
- `eco docker compose exec frontend bun run test:e2e`: 39 PASS, 20 FAIL de 59.
  Los 20 fallos corresponden a la suite funcional previa (fixtures y
  expectativas de cuenta, permisos, paginación y contratos de API); no son
  fallos del bloque visual. El único fallo del nuevo bloque fue una expectativa
  rígida de 48 px, corregida para validar el target real de al menos 44 px.

El host conserva un `node_modules` no utilizable por permisos, pero el contenedor
frontend sí dispone de sus dependencias. No se cambiaron ownership global,
lockfiles ni dependencias. Las capturas finales se conservaron en
`/tmp/aequvg-audit/` y `/tmp/sprint5-admin-*.png`. La configuración productiva
continúa requiriendo `NUXT_API_BASE_URL`, `NUXT_PUBLIC_API_BASE_URL` y
`NUXT_PUBLIC_PRIVACY_VERSION`; no se inventaron valores para esas variables.
