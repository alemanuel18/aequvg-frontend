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
| Enlace externo | Visitante/estudiante | Parcial | El detalle abre el URL de origen en otra pestaña e informa que el acceso depende del repositorio. La consulta web a la colección indicada devolvió 403; eso no permite distinguir un control anti-bot de un requisito de autorización para personas. La comunidad de Química muestra una URI permanente [123456789/3276](https://repositorio.uvg.edu.gt/handle/123456789/3276). |
| Archivo universitario después de retirar el enlace | Repositorio UVG | No verificable desde la aplicación | DELETE solo elimina la fila `ThesisLink`; la ruta no hace una solicitud al repositorio. La prueba confirma el borrado local, pero no inspecciona el archivo remoto. |
| Validación de una junta real | Junta Directiva | Pendiente | La suite usa un rol temporal con `PAPERS_MANAGE`; esto comprueba la autorización técnica, no registra aprobación de una persona real de la junta. |
| Publicar pegando únicamente el URL | Administrador | Pendiente de aclarar | La interfaz mantiene como obligatorios título y autor, conforme a la decisión previa. No requiere subir archivos. Si el criterio significa que el URL debe bastar sin esos metadatos, hace falta confirmar el cambio de alcance antes de modificar el formulario. |

## Evidencia reproducible

- Frontend: `PLAYWRIGHT_FRONTEND_PORT=3003 PLAYWRIGHT_API_PORT=3004 bun run test:e2e -- tests/e2e/thesis-flow.spec.ts` — 3 pruebas aprobadas.
- Backend: `docker compose exec -e THESIS_DATABASE_TEST=true backend bun run vitest run tests/integration/thesis.api.database.test.ts` — 3 pruebas aprobadas contra PostgreSQL local.
- Tipos del backend: `bun run typecheck` — aprobado.
- La suite de navegador usa una API simulada; la suite de integración usa PostgreSQL local. Ninguna verifica las reglas de acceso a documentos individuales en UVG ni sustituye la revisión de la junta.

## Pendientes para cerrar aceptación

1. La junta debe confirmar el flujo y la matriz de permisos; la aprobación no se ha solicitado ni registrado.
2. Confirmar si “solo el enlace” significa “sin archivos” o si también elimina la obligatoriedad de título y autor.
3. Probar un enlace individual de tesis con acceso público o con las credenciales que correspondan. La consulta de la colección retornó 403 desde el lector web y no demuestra por sí sola una restricción para usuarios.
4. Validar con la junta la estimación propuesta de 2 puntos.
