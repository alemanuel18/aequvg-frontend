# AGENTS.md — Frontend AEQUVG

## Alcance

Estas reglas aplican a todo `Front/aequvg-frontend`. Antes de editar, revisa `README.md`, `package.json`, `nuxt.config.ts`, componentes cercanos y el contrato del backend. Si una decisión visual, de privacidad, contenido oficial o API no está definida, usa una abstracción/configuración y deja el pendiente explícito.

## Stack y estructura real

Usa Bun 1.4, Nuxt 4, Vue 3, TypeScript, CSS nativo, Vitest y Playwright. No hay Pinia ni framework visual instalado; no agregues dependencias para resolver problemas que caben en composables o componentes.

```text
src/
  app.vue                         # raíz Nuxt
  layouts/default.vue             # SiteHeader + contenido + SiteFooter
  views/                          # rutas por archivo configuradas por Nuxt
    index.vue                     # inicio/promoción
    junta-directiva.vue           # junta real desde API
    contacto.vue                  # medios y formulario
    eventos.vue, noticias.vue,
    recursos.vue, investigacion.vue # aviso reutilizable de desarrollo
  components/common/              # AppButton, AppIcon, AppSection, PageHero,
                                  # ContentCard, EyebrowBadge, StatePanel
  components/layout/              # SiteHeader y SiteFooter
  components/public/              # tarjetas, formulario, ilustración y estados
  components/admin/               # reservado; no inventar panel
  composables/contact-validation.ts
  services/api.ts                 # cliente HTTP y errores
  services/public-content.ts      # consultas públicas
  types/api.ts                    # contratos TypeScript
  router/navigation.ts            # enlaces del navbar
  assets/styles/main.css          # tokens, reset, tipografía y utilidades
  utils/logger.ts                 # logging seguro del navegador
  plugins/error-logger.ts         # errores Vue/Nuxt
server/plugins/request-logger.ts  # logging SSR/Nitro; va fuera de src
tests/unit/                       # Vitest
tests/e2e/public-site.spec.ts    # teclado, 320px y contacto
```

Los componentes `common`, `layout` y `public` deben ser reutilizables mediante props/emits. `PageHero`, `EyebrowBadge`, `StatePanel` y `UnderConstructionPage` son piezas compartidas para encabezados, cápsulas y estados. Las vistas componen estas piezas; no dupliques HTML o mensajes de carga/error.

## Estilos y diseño

- `src/assets/styles/main.css` contiene solo fundamentos: fuentes, variables de color, espaciado, reset, focus y utilidades globales.
- Cada componente mantiene su layout en `<style scoped>`; no agregues estilos de una tarjeta o página al CSS global.
- Conserva la identidad aprobada del prototipo de `https://aeq-uvg.blog/`: paleta, tipografía, jerarquía, tarjetas de junta y tono institucional.
- Funciona desde `320px`, sin desplazamiento horizontal. El navbar móvil debe tener menú accesible, estado abierto/cerrado y foco visible.
- Usa HTML semántico, labels asociados, `aria-live` para estados/validaciones y contraste WCAG mínimo 4.5:1.
- No comuniques errores solo con color y respeta `prefers-reduced-motion`.
- No inventes contenido institucional: sin datos usa `StatePanel`; para rutas pendientes usa `UnderConstructionPage`.

## Integración con backend

- `NUXT_PUBLIC_API_BASE_URL` se usa en navegador y `NUXT_API_BASE_URL` durante SSR. Nunca escribas URLs en una vista.
- Todas las consultas pasan por `services/api.ts` y `services/public-content.ts`, con tipos de `types/api.ts`.
- Representa carga, vacío, error y éxito. No uses mocks para ocultar una API vacía.
- La junta muestra integrantes activos devueltos por el backend. Contacto exige consentimiento y usa `NUXT_PUBLIC_PRIVACY_VERSION`.
- No calcules cupos ni permisos en el cliente; el backend es la autoridad.
- No registres cuerpos de formularios, correos, teléfonos, mensajes, tokens ni respuestas completas.

## Componentes y rutas

Antes de crear un componente, busca uno equivalente. Prefiere componentes atómicos con props tipadas; mantén en las vistas solo composición y estado de página. `router/navigation.ts` es la fuente del navbar. Una ruta no implementada conserva navegación y muestra el mensaje de desarrollo, no una página falsa.

El layout por defecto conserva `SiteHeader` y `SiteFooter`. Los enlaces del footer no deben aparecer subrayados permanentemente; usa hover/focus accesibles. Los iconos pasan por `AppIcon` y tienen texto alternativo o `aria-hidden` según corresponda.

## Logs y configuración

Usa `src/utils/logger.ts` para navegador, `src/plugins/error-logger.ts` para errores Vue/Nuxt y `server/plugins/request-logger.ts` para SSR. El plugin Nitro registra `requestId`, método, ruta sin query string, estado y duración. Niveles: `debug`, `info`, `warn`, `error`, `silent`. Desarrollo recomienda `NUXT_PUBLIC_LOG_LEVEL=debug`, `NUXT_LOG_LEVEL=debug`; producción `warn`, `info`. No uses `console.log` directamente en componentes.

Las variables deben documentarse en `.env.example` y `.env.production.example`. El frontend nunca ejecuta la seed; los datos se cargan únicamente desde el backend.

## Docker y comandos

```bash
bun install --frozen-lockfile
bun run dev --port 3001
bun run typecheck
bun run test
bun run test:e2e
bun run build
bun run start                    # sirve .output en producción
```

`docker-compose.yml` usa Nuxt en desarrollo con recarga; `docker-compose.prod.yml` sirve solo `.output`, sin código montado ni dependencias de desarrollo, con healthcheck y usuario sin privilegios. Valida ambos con `docker compose ... config --quiet`.

## Pruebas y entrega

Todo cambio de lógica requiere Vitest. Todo cambio de navegación, formulario, responsive o accesibilidad debe actualizar Playwright cuando corresponda. Verifica typecheck, pruebas, build, teclado, estados de API y viewport de `320px`. Al entregar, resume componentes/vistas modificados, variables nuevas, comandos, pruebas y pendientes reales; nunca subas secretos o contenido oficial no autorizado.
