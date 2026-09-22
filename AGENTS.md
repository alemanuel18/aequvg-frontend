# AGENTS.md — Frontend de AEQUVG

## Alcance de estas instrucciones

Estas instrucciones aplican a todo este repositorio. Están dirigidas tanto a agentes de desarrollo como a integrantes del equipo. La fuente funcional principal es `../../Sprint1-Planificacion.docx`; si el código, este archivo y la planificación se contradicen, no inventes una decisión: documenta la diferencia y solicita validación cuando afecte el contrato, la privacidad, la seguridad o el alcance.

El repositorio se encuentra inicialmente en fase de preparación. Antes de trabajar, inspecciona el árbol y `package.json`, porque la estructura descrita aquí es el objetivo acordado y puede haberse implementado parcialmente.

## Propósito del producto

AEQUVG es la plataforma institucional de la Asociación de Estudiantes de Química de la Universidad del Valle de Guatemala. Debe centralizar información de la carrera y la Asociación, divulgar papers derivados de tesis y proyectos de investigación aprobados, publicar noticias, eventos y recursos, presentar la junta directiva y facilitar el contacto.

Audiencias públicas principales:

- Aspirantes y estudiantes de secundaria que desean conocer la carrera.
- Estudiantes actuales que buscan noticias, eventos y recursos.
- Egresados, investigadores, empresas e instituciones interesadas en colaboración.
- Público general interesado en la química.

El idioma principal del producto y del contenido es español.

## Alcance del MVP

El frontend debe cubrir dos experiencias:

1. Sitio público: inicio y promoción de la carrera, información institucional, junta directiva, noticias, eventos, recursos, repositorio científico y contacto.
2. Panel administrativo: autenticación y mantenimiento del contenido, eventos, participantes, solicitudes y flujo de aprobación de publicaciones.

Reglas de alcance que no se deben reinterpretar:

- Los visitantes no necesitan cuenta para consultar contenido, descargar documentos publicados, inscribirse a eventos o enviar solicitudes de contacto.
- Las cuentas administrativas deben usar correo `@uvg.edu.gt`.
- Solo se publican papers derivados de tesis y proyectos terminados y aprobados; no tesis completas ni trabajos editables por estudiantes.
- Un trabajo publicado es inmutable. Una ampliación se registra como otra publicación relacionada.
- La lista de espera y la gestión avanzada de cancelaciones pertenecen a una fase posterior.
- También quedan fuera del MVP: marketplace, tutorías, chat, pagos, perfiles públicos completos, recomendaciones, multidioma, estadísticas avanzadas e integración automática con redes sociales o autenticación institucional.

## Tecnologías y convenciones arquitectónicas

- Nuxt, Vue 3 y TypeScript.
- Vite dentro del entorno de Nuxt.
- Vue Router mediante el enrutamiento de Nuxt.
- Pinia solo para estado global realmente compartido; conserva estado local en componentes o composables.
- Servicios separados para acceder a la API REST.
- Vitest para pruebas unitarias y de integración.
- Playwright para los recorridos E2E críticos.
- Lighthouse para accesibilidad y rendimiento.
- Bun como runtime y gestor de paquetes, salvo que el repositorio ya establezca explícitamente otra herramienta.

La estructura objetivo definida en Sprint 1 es:

```text
src/
  assets/       # estilos, fuentes e imágenes empaquetadas
  components/   # componentes reutilizables y presentacionales
  composables/  # lógica reactiva reutilizable
  router/       # configuración adicional, middleware de navegación
  services/     # clientes HTTP y adaptación de respuestas
  stores/       # estado global Pinia
  types/        # contratos TypeScript de UI y API
  views/        # vistas o páginas por ruta
```

Al inicializar Nuxt, configura `srcDir` o adapta esta estructura de forma coherente con las convenciones de Nuxt. No mantengas simultáneamente dos árboles alternativos (`pages/` en raíz y `src/views/`, por ejemplo) sin una razón documentada. Organiza las vistas administrativas separadas de las públicas, pero reutiliza componentes, tipos y servicios comunes.

## Integración con el backend

- URL base configurable mediante `NUXT_PUBLIC_API_BASE_URL`; el valor local esperado es `http://localhost:3000/api/v1`.
- Nunca dupliques la URL de la API dentro de componentes.
- Centraliza autenticación, serialización, manejo de errores y cabeceras en la capa de servicios.
- Define tipos explícitos para solicitudes y respuestas. No uses `any` para ocultar diferencias con el contrato.
- No asumas que los datos de entrada son confiables. Representa estados de carga, vacío, error, acceso denegado y éxito.
- Las páginas públicas solo deben mostrar entidades publicadas/autorizadas devueltas por el backend.
- No calcules ni reserves cupos únicamente en el cliente. El backend es la autoridad y puede rechazar una inscripción por concurrencia.

Contrato REST inicial bajo `/api/v1`:

```text
GET  /papers
GET  /papers/:id
GET  /projects
GET  /news
GET  /events
POST /events/:id/registrations
GET  /resources
GET  /board-members
POST /contact-requests

POST /admin/papers
PUT  /admin/papers/:id
POST /admin/papers/:id/approvals
POST /admin/papers/:id/publish
POST /admin/news
POST /admin/events
PUT  /admin/events/:id
GET  /admin/events/:id/registrations
POST /admin/resources
```

Este contrato es inicial, no exhaustivo. Antes de agregar o cambiar rutas, coordina el cambio con el backend, actualiza tipos y pruebas, y conserva consistencia con OpenAPI.

## Reglas de interfaz y experiencia

- Diseña primero para contenido claro, institucional y fácil de encontrar. Un visitante debe localizar información importante en menos de dos minutos.
- El diseño debe funcionar desde `320px` sin desplazamiento horizontal.
- Todo flujo principal debe poder completarse con teclado, con foco visible y orden lógico.
- Mantén contraste mínimo WCAG de `4.5:1` para texto normal y `3:1` para texto grande.
- Usa HTML semántico, etiquetas asociadas a controles, nombres accesibles y mensajes de validación anunciables.
- No comuniques estado solo mediante color. Respeta reducción de movimiento cuando aplique.
- Mantén estructura consistente para títulos, fechas, categorías, autores e imágenes.
- Formatea fechas en español y conserva la zona/instante recibido; no conviertas silenciosamente fechas institucionales.
- Las páginas principales deben aspirar a cargar en menos de tres segundos: optimiza imágenes, carga diferida y tamaño de bundles sin degradar accesibilidad.
- Evita texto institucional inventado. Usa datos aprobados, contenido de prueba claramente identificado o estados vacíos.

## Formularios, privacidad y seguridad

- Inscripción a evento: nombre completo, correo, teléfono, consentimiento obligatorio y versión de la política de privacidad.
- Contacto: nombre, correo, teléfono, asunto, mensaje, consentimiento obligatorio y versión de la política.
- No exijas correo UVG en formularios públicos. Sí exígelo y comunícalo claramente en registro/acceso administrativo.
- Valida para ayudar al usuario, pero recuerda que la validación autoritativa ocurre en el backend.
- No guardes contraseñas, tokens, teléfonos, correos de participantes ni mensajes de contacto en logs, analytics, URLs o almacenamiento persistente del navegador.
- No expongas detalles internos en errores. Presenta un mensaje útil y conserva el código/identificador seguro de diagnóstico si la API lo entrega.
- La interfaz administrativa debe estar protegida por middleware de navegación, pero esa protección nunca sustituye la autorización del servidor.
- Una carga de archivo científico debe aceptar PDF según el contrato y explicar límites reportados por la API. No publiques una vista previa de un archivo restringido.

## Módulos y flujos prioritarios

### Repositorio científico

Permite buscar y filtrar por tipo, título, año, área, palabras clave y autor según soporte de la API. Presenta título, tipo (`PAPER_DERIVADO_TESIS` o `PROYECTO_INVESTIGACION`), autores ordenados, resumen, área, año, datos bibliográficos, enlace externo y descarga autorizada.

El panel debe hacer visible el estado (`PENDIENTE_APROBACION`, `APROBADO`, `PUBLICADO`, `RECHAZADO` o `ARCHIVADO`) y las aprobaciones de Asociación, Facultad y Dirección. Nunca habilites una acción de publicación como si fuera válida cuando falten PDF o aprobaciones.

### Eventos

Muestra información, fecha/hora, ubicación, capacidad y disponibilidad indicada por el servidor. El formulario público no requiere cuenta. Después de enviar, contempla confirmación, inscripción duplicada, evento lleno, evento no disponible y errores de red.

### Noticias, recursos, junta y contacto

El sitio público solo consume contenido publicado/activo. Los recursos pueden ser archivo o enlace externo. Los enlaces externos y descargas deben identificarse de manera accesible. Las solicitudes de contacto contienen datos personales y solo deben mostrarse a usuarios administrativos autorizados.

## Calidad y pruebas

Para cada cambio:

1. Ejecuta primero los scripts definidos en `package.json`; no inventes nombres si todavía no existen.
2. Ejecuta como mínimo comprobación de tipos, lint, pruebas relacionadas y build de producción cuando estén disponibles.
3. Agrega pruebas al cambiar lógica, estados o flujos. Evita pruebas que dependan innecesariamente de textos decorativos o detalles internos.
4. Usa Vitest para componentes, composables, stores y servicios; usa Playwright para autenticación, exploración/descarga de investigaciones, inscripción a eventos y contacto.
5. Prueba explícitamente teclado, `320px`, errores de API, estados vacíos y permisos del panel.
6. No marques una tarea terminada si solo funciona con mocks cuando la integración solicitada exige el backend real.

Objetivos globales verificables: contraste y navegación accesible, carga principal menor o igual a tres segundos bajo condiciones normales y comportamiento correcto con la concurrencia esperada del MVP (la prueba de carga autoritativa corresponde al backend).

## Forma de trabajar

- Antes de editar, lee archivos cercanos y reutiliza patrones existentes.
- Mantén cambios pequeños, enfocados y sin reformateos ajenos a la tarea.
- No modifiques `.env` ni confirmes secretos; actualiza `.env.example` cuando agregues configuración pública necesaria.
- No agregues dependencias sin justificar su necesidad y revisar compatibilidad con Bun/Nuxt.
- No cambies el contrato API, los roles, estados o campos de privacidad unilateralmente.
- Si una decisión pendiente del Sprint 1 bloquea el trabajo —identidad visual final, contenido oficial, política de privacidad, almacenamiento o infraestructura UVG— implementa una abstracción o un estado configurable y registra el supuesto; no presentes la decisión como definitiva.
- Usa ramas, commits descriptivos y pull requests. Incluye en el PR qué cambió, cómo probarlo, capturas para cambios visuales y cualquier efecto sobre API, accesibilidad o privacidad.
- Al entregar, resume archivos modificados, comandos ejecutados, resultados y pendientes reales.

## Criterio de terminado

Una tarea frontend está terminada cuando implementa el flujo solicitado, conserva el contrato con la API, maneja estados y errores, es responsive y accesible, incluye pruebas proporcionales al riesgo, supera las verificaciones disponibles y no introduce datos sensibles ni contenido institucional no aprobado.
