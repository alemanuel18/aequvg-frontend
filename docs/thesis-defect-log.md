# Registro de defectos y repetición de pruebas: tesis

Fecha de revisión: 8 de noviembre de 2026  
Rama: `test/thesis-e2e-permissions`

## Hallazgos

| ID | Hallazgo | Tipo / estado | Corrección o acción | Repetición y resultado |
| --- | --- | --- | --- | --- |
| QA-TH-01 | La comprobación inicial del listado vacío encontró activo el filtro `Todas` tras navegar directamente a Investigación. | Incidencia de sincronización de Playwright; no se confirmó defecto del producto. | Esperar la carga y verificar que el filtro `Tesis` está activo antes de comprobar el estado vacío. | Se repitió el E2E completo, incluidos estados vacío y error. Aprobado; ejecución más reciente: 3/3 pruebas. |
| QA-TH-02 | El guion esperaba HTTP 206 para el PDF, pero el repositorio devolvió HTTP 200 con el archivo completo (1,206,840 bytes). | Suposición incorrecta del guion; no es defecto de la aplicación ni del repositorio. | Verificar la descarga completa con una solicitud HTTPS directa. | Después de retirar el enlace local, la petición sin sesión volvió a responder HTTP 200, `application/pdf`, 1,206,840 bytes. El archivo remoto siguió accesible. |
| QA-TH-03 | El flujo manual de edición se interrumpió al reasignar una variable declarada como constante. | Error del guion de prueba; no es defecto del producto. | Retirar el registro temporal desde el panel y corregir el guion para usar una variable reasignable. | Se repitieron alta, publicación, consulta, edición, retiro y revisión móvil; flujo aprobado. La suite E2E actual pasó 3/3. |
| QA-TH-04 | El lector web devolvió 403 al consultar la colección UVG. | Falso positivo específico del lector web; no es un defecto de acceso confirmado. | Contrastar con una solicitud HTTPS directa y la API de DSpace. | La colección respondió HTTP 200 desde el entorno; el ítem [123456789/4914](https://repositorio.uvg.edu.gt/handle/123456789/4914) y su PDF fueron accesibles sin sesión (`open.access`). |
| QA-TH-05 | `docker compose exec` no encontró activo el servicio de backend; al intentar iniciar ese stack, PostgreSQL no pudo enlazar el puerto 5432 porque el stack local activo ya lo ocupaba. | Incidencia de entorno, no defecto del producto. | Ejecutar la integración dentro del backend activo conectado al PostgreSQL local. | `thesis.api.database.test.ts`: 3/3 pruebas aprobadas. El `afterAll` elimina los registros temporales. |

## Defectos del producto

No se encontraron defectos funcionales abiertos en los casos repetidos. La prueba de guardado fallido usa una respuesta 503 simulada; no representa una caída real de PostgreSQL. La suite automatizada de navegador usa API simulada y se complementa con la integración PostgreSQL local.

## Pendientes fuera de esta repetición

- La junta no ha validado personalmente los permisos ni el flujo.
- No se probó un documento con embargo o acceso restringido.
- El formulario conserva título y autor obligatorios; la validación de la junta sobre el criterio “solo el enlace” sigue pendiente.

La matriz completa de roles y criterios está en [thesis-e2e-permissions.md](thesis-e2e-permissions.md).
