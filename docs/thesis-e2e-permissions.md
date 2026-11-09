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
| Archivo universitario después de retirar el enlace | Repositorio UVG | Pasa para el ítem probado | Publiqué temporalmente el enlace al ítem 4914, lo retiré desde el panel y confirmé que la consulta pública local ya no lo lista. Inmediatamente después, una solicitud sin sesión al bitstream remoto respondió HTTP 200, `application/pdf`, 1,206,840 bytes. El PDF remoto siguió accesible. |
| Validación de una junta real | Junta Directiva | Pendiente | La suite usa un rol temporal con `PAPERS_MANAGE`; esto comprueba la autorización técnica, no registra aprobación de una persona real de la junta. |
| Publicar pegando únicamente el URL | Administrador | Pendiente de aclarar | La interfaz mantiene como obligatorios título y autor, conforme a la decisión previa. No requiere subir archivos. Si el criterio significa que el URL debe bastar sin esos metadatos, hace falta confirmar el cambio de alcance antes de modificar el formulario. |

## Evidencia reproducible

- Frontend: `PLAYWRIGHT_FRONTEND_PORT=3003 PLAYWRIGHT_API_PORT=3004 bun run test:e2e -- tests/e2e/thesis-flow.spec.ts` — 3 pruebas aprobadas.
- Backend: `docker compose exec -e THESIS_DATABASE_TEST=true backend bun run vitest run tests/integration/thesis.api.database.test.ts` — 3 pruebas aprobadas contra PostgreSQL local.
- Tipos del backend: `bun run typecheck` — aprobado.
- Consulta posterior de solo lectura en PostgreSQL: cero tesis, administradores, roles o estudiantes temporales con el prefijo `thesis-test-`.
- Prueba remota sin sesión: el ítem [123456789/4914](https://repositorio.uvg.edu.gt/handle/123456789/4914), “Validación de un kit de campo para la determinación de fosfatos en pisos hechos de estuco del sitio arqueológico La Corona utilizando el método de Murphy y Riley”, devuelve `open.access`. El bitstream `78d85cfa-c6ff-4e21-a28a-b8ff22042127` respondió HTTP 200 y 1,206,840 bytes después de retirar el enlace local. No se hizo ninguna petición de escritura al repositorio.
- La herramienta de lectura web inicialmente mostró 403 para la colección; la petición HTTPS directa desde el entorno local respondió HTTP 200. El 403 fue específico de ese lector y no se reprodujo como requisito de autenticación del usuario.
- La suite automatizada de navegador usa una API simulada y la integración usa PostgreSQL local. La comprobación manual del repositorio confirma acceso abierto para un ítem concreto; no caracteriza ítems restringidos ni sustituye la revisión de la junta.

## Pendientes para cerrar aceptación

1. La junta debe confirmar el flujo y la matriz de permisos; la aprobación no se ha solicitado ni registrado.
2. Confirmar si “solo el enlace” significa “sin archivos” o si también elimina la obligatoriedad de título y autor.
3. El acceso se comprobó con un ítem público; no se probó una tesis con embargo o permiso restringido. Si se requiere cubrir ese caso, hace falta un enlace de ejemplo restringido y una cuenta autorizada de UVG.
4. Validar con la junta la estimación propuesta de 2 puntos.
