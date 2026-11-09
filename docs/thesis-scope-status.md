# Estado de acuerdos y dependencias: apartado de tesis

Actualizado: 8 de noviembre de 2026.

## Acuerdos confirmados en el repositorio

No encontré en los repositorios una respuesta o aprobación del cliente que confirme la modalidad automática o los detalles finales del flujo. Las instrucciones de implementación recibidas en esta conversación mantienen título y autor obligatorios en la pantalla; eso se registra como instrucción de producto para la implementación, no como aprobación del cliente.

El flujo que sí está implementado es administración manual de enlaces por una cuenta con `PAPERS_MANAGE`. El estudiante y el público consultan tesis publicadas y abren el enlace UVG. Los archivos permanecen en UVG.

## Diferencia pendiente

La aceptación de la tarea de documentación dice que la guía debe describir URL como único campo obligatorio. El formulario real requiere título, URL y autor; la API requiere título y URL, con autor opcional. La prueba E2E comprobó que pegar solo URL no permite guardar. La documentación explica esta diferencia y no presenta como implementado un flujo que el formulario rechaza.

Resolver esta diferencia requiere una decisión de alcance y un cambio de producto o de criterio de aceptación. No se modificaron campos obligatorios como parte de la tarea documental.

## Decisión de automatización

La investigación encontró consultas públicas de lectura para la colección de Química, pero no confirmó con UVG las condiciones institucionales de uso. No hay modalidad automática elegida ni implementada. La administración manual sigue siendo la única modalidad disponible en la aplicación. Ver el [informe de investigación 50309](https://github.com/alemanuel18/aequvg-backend/blob/docs/thesis-documentation/docs/thesis-repository-research.md).

## Pendientes de aceptación

- Registrar la confirmación del cliente sobre campos, visibilidad, permisos y modalidad.
- Alinear el requisito de URL única con el formulario y la API antes de declarar ese criterio aprobado.
- Para probar acceso externo restringido, obtener un ejemplo de Química con esa restricción y las credenciales UVG apropiadas; los 65 registros consultados reportaron `open.access`.
- Registrar la revisión de una persona real de la junta. La integración usa cuentas temporales para comprobar permisos técnicos.
- Si el cliente pide automatización, confirmar condiciones con el responsable del repositorio y planificar por separado solo la alternativa aceptada.

Referencias: [guía de estudiantes](./guides/thesis-students.md), [guía de junta](./guides/thesis-board.md), [matriz E2E](./thesis-e2e-permissions.md) y [registro de defectos y re pruebas](./thesis-defect-log.md).
