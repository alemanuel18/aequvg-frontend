# Registro de defectos y repetición de pruebas: tesis

Actualizado: 22 de noviembre de 2026
Rama de verificación S6-10: `test/thesis-s6-10-manual-flow`

## Hallazgos

| ID | Hallazgo | Tipo / estado | Corrección o acción | Repetición y resultado |
| --- | --- | --- | --- | --- |
| QA-TH-01 | La comprobación inicial del listado vacío encontró activo el filtro `Todas` tras navegar directamente a Investigación. | Incidencia de sincronización de Playwright; no se confirmó defecto del producto. | Esperar la carga y verificar que el filtro `Tesis` está activo antes de comprobar el estado vacío. | Se repitió el E2E completo, incluidos estados vacío y error. Aprobado; repetición anterior: 3/3, más reciente: 4/4 pruebas. |
| QA-TH-02 | El guion esperaba HTTP 206 para el PDF, pero el repositorio devolvió HTTP 200 con el archivo completo (1,206,840 bytes). | Suposición incorrecta del guion; no es defecto de la aplicación ni del repositorio. | Verificar la descarga completa con una solicitud HTTPS directa. | Después de retirar el enlace local, la petición sin sesión volvió a responder HTTP 200, `application/pdf`, 1,206,840 bytes. El archivo remoto siguió accesible. |
| QA-TH-03 | El flujo manual de edición se interrumpió al reasignar una variable declarada como constante. | Error del guion de prueba; no es defecto del producto. | Retirar el registro temporal desde el panel y corregir el guion para usar una variable reasignable. | Se repitieron alta, publicación, consulta, edición, retiro y revisión móvil; flujo aprobado. La suite E2E actual pasó 4/4. |
| QA-TH-04 | El lector web devolvió 403 al consultar la colección UVG. | Falso positivo específico del lector web; no es un defecto de acceso confirmado. | Contrastar con una solicitud HTTPS directa y la API de DSpace. | La colección respondió HTTP 200 desde el entorno; el ítem [123456789/4914](https://repositorio.uvg.edu.gt/handle/123456789/4914) y su PDF fueron accesibles sin sesión (`open.access`). |
| QA-TH-05 | `docker compose exec` no encontró activo el servicio de backend; al intentar iniciar ese stack, PostgreSQL no pudo enlazar el puerto 5432 porque el stack local activo ya lo ocupaba. | Incidencia de entorno, no defecto del producto. | Ejecutar la integración dentro del backend activo conectado al PostgreSQL local. | `thesis.api.database.test.ts`: 3/3 pruebas aprobadas. El `afterAll` elimina los registros temporales. |
| QA-TH-06 | La vista exigía autor y la API lo aceptaba vacío; además, la unicidad literal no cubría variantes normalizables de una URL. | Discrepancia de contrato de S6-04, vinculado a SCRUM-300. | Se sincronizó la obligatoriedad del autor y se normaliza la URL. La comprobación y el alta se serializan en una transacción PostgreSQL para evitar carreras entre variantes equivalentes. | Una corrida anterior omitió la integración por no activar `THESIS_DATABASE_TEST`. Repetición posterior: `docker compose exec -e THESIS_DATABASE_TEST=true backend bun run vitest run tests/integration/thesis.api.database.test.ts` — 1 archivo, 4/4 aprobadas; incluye dos altas concurrentes con resultados 201 y 409. Backend typecheck y suite aprobaron. |
| QA-TH-07 | Se pidió cubrir un enlace UVG restringido, pero no se encontró uno en la colección de Química. | Caso externo no disponible; no es defecto del producto. | Consulta de solo lectura del estado de acceso de los 65 ítems de la colección. | Los 65 reportaron `open.access`. No se pudo probar acceso restringido o con embargo sin un ejemplo que UVG identifique. |
| QA-TH-08 | La repetición S6-10 de Playwright falló porque `getByLabel('Autor')` encontró tanto el checkbox «Crear autor nuevo» como el nombre de autor principal. | Selector de prueba obsoleto tras el cambio del formulario, no defecto funcional. | Se apuntó al control específico `Nombre de Autor principal`. | Repetición de `tests/e2e/thesis-flow.spec.ts`: 5/5 aprobadas. |
| QA-TH-09 | La primera integración PostgreSQL de S6-10 devolvió errores Prisma al usar el cliente generado previamente en el contenedor. | Deriva entre Prisma Client generado y el esquema actual montado; las migraciones de la base estaban al día. | Se ejecutó `bun run prisma:generate` en el contenedor backend y se repitió la integración. | `thesis.api.database.test.ts`: 7/7 aprobadas. No quedan datos de prueba; `afterAll` limpia registros temporales. |

## Defectos del producto

No se encontraron defectos funcionales abiertos en los casos repetidos. La prueba de guardado fallido usa una respuesta 503 simulada; no representa una caída real de PostgreSQL. La suite automatizada de navegador usa API simulada y se complementa con la integración PostgreSQL local.

Para S6-10, el registro manual es el flujo de publicación vigente. No se ejecutó ni se reporta como aprobada una prueba de sincronización UVG, importación automática o reintentos: esos comportamientos no fueron autorizados por la decisión atribuida a la Asociación en S6-08. La matriz actualizada está en [thesis-e2e-permissions.md](thesis-e2e-permissions.md) y el contrato de API está en [thesis-manual-flow-api.md](https://github.com/alemanuel18/aequvg-backend/blob/test/thesis-s6-10-manual-flow/docs/thesis-manual-flow-api.md).

## Pendientes fuera de esta repetición

- La junta no ha validado personalmente los permisos ni el flujo.
- No se encontró un documento con embargo o acceso restringido entre los 65 registros de Química consultados.
- S6-04 aplica título, autor principal, año, resumen y URL HTTPS del repositorio como obligatorios; retiró el identificador del contrato. El motor de unicidad conserva la ruta y normaliza espacios externos, esquema y host.
- S6-06 agrega autoría principal y coautores alfabéticos, selección explícita de registros reutilizables, migración de legado como autor principal y visualización en administración y catálogo público. El orden lo deriva la aplicación; no se puede editar manualmente. La integración PostgreSQL (6/6), E2E (2/2), typecheck y suite frontend (68/68) aprobaron.
- Falta registrar la validación de una persona real de la junta; el rol temporal solo prueba la autorización técnica.

La matriz completa de roles y criterios está en [thesis-e2e-permissions.md](thesis-e2e-permissions.md).
