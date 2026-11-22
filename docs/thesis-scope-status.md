# Estado de acuerdos y dependencias: apartado de tesis

Actualizado: 21 de noviembre de 2026.

## Acuerdos confirmados en el repositorio

Para S6-04 se cerró con la Asociación la matriz de campos y el criterio de URL única. La decisión de campos no define todavía una modalidad de publicación automática.

El flujo que sí está implementado es administración manual de enlaces por una cuenta con `PAPERS_MANAGE`. El estudiante y el público consultan tesis publicadas y abren el enlace UVG. Los archivos permanecen en UVG.

## Matriz aprobada para S6-04 (vinculada a SCRUM-300)

Título, autor principal, año, resumen y URL del repositorio son obligatorios tanto en la vista administrativa como en la API. El título requiere al menos 3 caracteres; cada nombre admite hasta 300 caracteres; el año debe estar entre 1900 y 9999; el resumen debe contener texto y no superar 12 000 caracteres. La URL debe usar HTTPS y ser única entre tesis después de recortar espacios externos y normalizar esquema y host, preservando la ruta. El identificador de repositorio se retiró del contrato y de la vista.

La gestión estructurada de autor principal y coautores está implementada en S6-06: cada tesis tiene una persona principal y una lista ordenada de coautores. El módulo no permite slug personalizado ni cargar archivos; conserva el enlace al repositorio UVG.

## Decisión de automatización

La investigación encontró consultas públicas de lectura para la colección de Química, pero no confirmó con UVG las condiciones institucionales de uso. No hay modalidad automática elegida ni implementada. La administración manual sigue siendo la única modalidad disponible en la aplicación. Ver el [informe de investigación 50309](https://github.com/alemanuel18/aequvg-backend/blob/docs/thesis-documentation/docs/thesis-repository-research.md).

## Estado de S6-04

S6-04 está implementado y sus criterios técnicos están verificados: el alta y la edición normalizan y comparan URLs; una integración PostgreSQL prueba duplicados secuenciales, edición hacia una URL ya usada y dos altas concurrentes con variantes equivalentes (una responde 201 y la otra 409). La matriz de campos, las guías, las pruebas y este estado de alcance están actualizados.

Evidencia reproducible: `docker compose exec -e THESIS_DATABASE_TEST=true backend bun run vitest run tests/integration/thesis.api.database.test.ts` — 1 archivo, 4/4 pruebas aprobadas. La matriz E2E y el registro detallado están en [thesis-e2e-permissions.md](./thesis-e2e-permissions.md) y [thesis-defect-log.md](./thesis-defect-log.md).

## Pendientes del módulo fuera de S6-04

- S6-06 implementa autoría estructurada en backend y frontend. Verificación en la rama `feature/thesis-authorship`: integración PostgreSQL 6/6 y E2E de tesis 2/2 aprobados; typecheck y suites generales también pasan. Se probó además el backfill en una base efímera con una tesis legado sintética: el texto quedó intacto y se vinculó como `PRINCIPAL`, orden 1. La base de desarrollo activa se auditó en solo lectura y no se modificó.

- Para probar acceso externo restringido, obtener un ejemplo de Química con esa restricción y las credenciales UVG apropiadas; los 65 registros consultados reportaron `open.access`.
- Registrar la revisión de una persona real de la junta. La integración usa cuentas temporales para comprobar permisos técnicos.
- Si el cliente pide automatización, confirmar condiciones con el responsable del repositorio y planificar por separado solo la alternativa aceptada.

Referencias: [guía de estudiantes](./guides/thesis-students.md), [guía de junta](./guides/thesis-board.md), [matriz E2E](./thesis-e2e-permissions.md) y [registro de defectos y re pruebas](./thesis-defect-log.md).
