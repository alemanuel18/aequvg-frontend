# Matriz de pruebas: tesis, extremo a extremo y permisos

Fecha de ejecución: 8 de noviembre de 2026. Las pruebas de navegador usan Chromium. Las pruebas de API con PostgreSQL se ejecutan contra el Docker local y limpian los registros temporales que crean.

## Resultados

| Caso | Rol o condición | Resultado | Evidencia |
| --- | --- | --- | --- |
| Consultar listado y detalle público | Visitante | Pasa | `thesis-flow.spec.ts`; `thesis.api.database.test.ts` devuelve listado y detalle publicados. |
| Leer como estudiante | Estudiante autenticado | Pasa | Playwright confirma que consulta el listado y detalle sin controles administrativos; integración PostgreSQL devuelve 200. |
| Crear, editar y retirar una publicación | Junta temporal con `PAPERS_MANAGE` | Pasa técnicamente | La integración crea, consulta, edita, vuelve a consultar y elimina el registro local; verifica que ya no existe en PostgreSQL. Playwright comprueba que cada cambio se refleja en la interfaz pública. |
| Escrituras directas sin sesión | Visitante | Pasa | GET administrativo y PUT/DELETE devuelven 401; POST devuelve 401. |
| Escrituras directas desde estudiante | Estudiante autenticado | Pasa | POST, PUT y DELETE administrativos devuelven 401; la lectura pública devuelve 200. |
| Escrituras directas sin permiso | Cuenta administrativa sin `PAPERS_MANAGE` | Pasa | GET, POST, PUT y DELETE devuelven 403; el registro original permanece sin cambios. |
| URL vacía, mal formada o insegura | Administrador autorizado | Pasa | API devuelve 422 para vacío, mal formado y `ftp://`; la interfaz exige URL y muestra el error para protocolo no permitido. |
| URL duplicada e identificador de origen duplicado | Administrador autorizado | Pasa | API devuelve 409 `THESIS_LINK_EXISTS`; Playwright confirma mensaje claro y que no aparece una segunda fila. |
| Fallo al guardar | Administrador | Pasa en interfaz | Playwright simula un 503 y confirma mensaje de error y ausencia de registro. La respuesta 503 es simulada; no se fuerza una caída real de PostgreSQL. |
| Listado sin resultados | Visitante | Pasa | API devuelve lista vacía para una búsqueda sin coincidencias; Playwright muestra el estado vacío. |
| Persistencia de cambios | Administrador autorizado | Pasa en PostgreSQL local | La prueba vuelve a consultar el detalle después de editar y verifica la fila directamente después de eliminar. Los datos temporales se limpian en `afterAll`. |
| Archivos de tesis | Visitante y administrador | Pasa en la aplicación | La pantalla administrativa no ofrece campo de archivo; el modelo y la API solo guardan URL y metadatos. La respuesta de creación no contiene `fileId`. |
| Vista móvil | Visitante y administrador | Pasa en Playwright | La vista pública y administrativa se revisan a 320 px; no hay desbordamiento horizontal. |
| Enlace externo | Visitante/estudiante | Pasa para el ítem probado | La colección `Tesis - Química` reporta 65 ítems archivados. El ítem [123456789/4914](https://repositorio.uvg.edu.gt/handle/123456789/4914) está dentro de esa colección; sus metadatos lo identifican como tesis de Licenciatura en Química y su acceso es `open.access`. La ficha y el PDF respondieron sin sesión. |
| Enlace universitario restringido | Repositorio UVG | No fue posible cubrirlo con un registro de Química | Consulté en modo de solo lectura el estado de acceso de los 65 registros de la colección; los 65 reportan `open.access`. No encontré un enlace restringido que se pueda usar como caso de prueba en esa colección. |
| Archivo universitario después de retirar el enlace | Repositorio UVG | Pasa para el ítem probado | Publiqué temporalmente el enlace al ítem 4914, lo retiré desde el panel y confirmé que la consulta pública local ya no lo lista. Inmediatamente después, una solicitud sin sesión al bitstream remoto respondió HTTP 200, `application/pdf`, 1,206,840 bytes. El PDF remoto siguió accesible. |
| Validación de una junta real | Junta Directiva | Pendiente | La suite usa un rol temporal con `PAPERS_MANAGE`; esto comprueba la autorización técnica, no registra aprobación de una persona real de la junta. |
| Intentar alta pegando únicamente la URL | Administrador | Probado; no permite publicar | El E2E deja solo la URL y confirma que el navegador bloquea el envío porque título y autor son obligatorios. Esto respeta la decisión previa de mantener ambos campos, pero no cumple una lectura literal de “solo el enlace”. |

## Evidencia reproducible

- Frontend: `PLAYWRIGHT_FRONTEND_PORT=3003 PLAYWRIGHT_API_PORT=3004 bun run test:e2e -- tests/e2e/thesis-flow.spec.ts` — repetición más reciente: 4 pruebas aprobadas, incluida alta con solo URL (bloqueada por campos requeridos).
- Backend: `docker compose exec -e THESIS_DATABASE_TEST=true backend bun run vitest run tests/integration/thesis.api.database.test.ts` — 3 pruebas aprobadas contra PostgreSQL local.
- Tipos del backend: `bun run typecheck` — aprobado.
- Consulta posterior de solo lectura en PostgreSQL: cero tesis, administradores, roles o estudiantes temporales con el prefijo `thesis-test-`.
- Prueba remota sin sesión: el ítem [123456789/4914](https://repositorio.uvg.edu.gt/handle/123456789/4914), “Validación de un kit de campo para la determinación de fosfatos en pisos hechos de estuco del sitio arqueológico La Corona utilizando el método de Murphy y Riley”, devuelve `open.access`. El bitstream `78d85cfa-c6ff-4e21-a28a-b8ff22042127` respondió HTTP 200 y 1,206,840 bytes después de retirar el enlace local. No se hizo ninguna petición de escritura al repositorio.
- Revisión de acceso restringido: la colección [Tesis - Química](https://repositorio.uvg.edu.gt/handle/123456789/3316) enumera 65 ítems. Las 65 consultas a `GET /server/api/core/items/{uuid}/accessStatus` respondieron `open.access`; no apareció un registro restringido para probar.
- La herramienta de lectura web inicialmente mostró 403 para la colección; la petición HTTPS directa desde el entorno local respondió HTTP 200. El 403 fue específico de ese lector y no se reprodujo como requisito de autenticación del usuario.
- La suite automatizada de navegador usa una API simulada y la integración usa PostgreSQL local. Los 65 estados de acceso consultados en la colección fueron `open.access`; la descarga del archivo se comprobó directamente para un ítem. No se pudo probar un caso restringido ni sustituye la revisión de la junta.

## Registro de defectos e incidencias de prueba

| ID | Hallazgo inicial | Clasificación y corrección | Repetición y resultado |
| --- | --- | --- | --- |
| QA-TH-01 | La primera comprobación del estado vacío encontró el filtro `Todas` activo después de navegar directamente a Investigación; el resultado podía depender de cuándo terminaba de cargar la página. | Incidencia de sincronización de la prueba, no defecto funcional confirmado. Se esperó la carga de la página y se verificó que el filtro `Tesis` estuviera activo antes de evaluar el listado. | Se repitió el flujo E2E completo, incluyendo lista vacía y error de consulta: aprobado. La repetición anterior pasó 3/3 y la más reciente 4/4. |
| QA-TH-02 | La comprobación del PDF esperaba HTTP 206 por solicitar un rango, pero el servidor respondió HTTP 200 con el documento completo (1,206,840 bytes). | Suposición incorrecta del guion de prueba, no defecto de la aplicación ni del repositorio. Se verificó la respuesta completa mediante una solicitud HTTPS directa. | Después de retirar la publicación local se volvió a solicitar el archivo sin sesión: HTTP 200, `application/pdf`, 1,206,840 bytes. El archivo remoto seguía accesible. |
| QA-TH-03 | Un guion manual de edición se interrumpió al intentar reasignar una variable declarada como constante. | Error del guion de prueba. Se limpió el registro temporal desde el panel y se corrigió el guion para permitir cambiar el título. | Se repitió alta, publicación, consulta, edición y retiro, incluida la vista móvil; el flujo terminó correctamente. La suite E2E actual pasó 4/4. |
| QA-TH-04 | El lector web mostró 403 al abrir la colección UVG. | Resultado específico del lector web; no se clasificó como defecto del repositorio porque el acceso directo desde el entorno local y la API de DSpace respondieron correctamente. | Consulta HTTPS directa repetida: HTTP 200. También se confirmó el acceso `open.access` al ítem 123456789/4914 y a su PDF sin sesión. |
| QA-TH-05 | La integración PostgreSQL no pudo ejecutarse con `docker compose exec` porque los servicios de ese proyecto estaban detenidos. Al intentar iniciarlos, el contenedor de base de datos no pudo enlazar el puerto 5432, ocupado por el stack local ya activo. | Incidencia de entorno, no defecto de la aplicación. Se ejecutó la misma prueba dentro del contenedor backend activo, conectado a la base local en uso. | Repetición completada: 1 archivo y 3/3 pruebas aprobadas contra PostgreSQL. El hook `afterAll` elimina las tesis y cuentas temporales. |
| QA-TH-06 | El criterio de publicar solo con URL no se podía verificar con la matriz existente. | Brecha de cobertura y discrepancia de aceptación, no defecto confirmado: el acuerdo previo mantiene título y autor obligatorios. | Se agregó una prueba E2E que llena solo la URL, intenta enviar y verifica las validaciones nativas. | Repetición: la suite pasó 4/4; el formulario bloqueó el alta por título y autor vacíos. Por tanto, el criterio literal no pasa bajo el formulario acordado. |
| QA-TH-07 | La matriz pedía un ejemplo universitario con acceso restringido, pero no había uno identificado. | Caso externo no disponible en la colección Química, no defecto del producto. | Se consultó el estado de acceso de los 65 ítems de la colección en modo de solo lectura. | Los 65 reportan `open.access`; no se pudo repetir como usuario restringido ni identificar una tesis embargada. |

No se encontraron defectos funcionales abiertos en los casos repetidos. La cobertura no demuestra autorización de una junta real ni acceso a documentos con embargo; esos pendientes siguen indicados arriba.

El registro independiente de cada hallazgo, clasificación, acción y repetición está en [thesis-defect-log.md](thesis-defect-log.md).

## Pendientes para cerrar aceptación

1. La junta debe confirmar el flujo y la matriz de permisos; la aprobación no se ha solicitado ni registrado.
2. El envío con solo URL fue probado y bloqueado porque título y autor son obligatorios. Para aceptar ese criterio literalmente, habría que cambiar el requisito previamente acordado y permitir que falten esos metadatos.
3. No se encontró tesis de Química restringida: los 65 ítems consultados reportan `open.access`. Para probar ese caso hace falta que UVG identifique un ejemplo restringido y provea una cuenta autorizada si requiere autenticación.
4. Validar con la junta la estimación propuesta de 2 puntos.
