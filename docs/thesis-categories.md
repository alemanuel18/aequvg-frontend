# Categorías de tesis (S6-07)

En `/administrador/tesis`, la junta con permiso `PAPERS_MANAGE` puede crear categorías, activar o desactivar las existentes y asignar varias a cada tesis. Las categorías son opcionales para no bloquear las tesis antiguas ni los registros que todavía no se hayan clasificado. Desactivar una categoría no la borra ni elimina sus asociaciones; una tesis editada puede conservar o retirar una asociación inactiva.

La lista inicial incluye Química analítica, Química ambiental, Química computacional, Síntesis y productos naturales, Química farmacéutica y Procesos industriales. Se revisaron la colección [Tesis - Química](https://repositorio.uvg.edu.gt/collections/2a6d7418-69a2-4176-a004-5e1bc5d98434) y registros del repositorio sobre [contaminantes en Atitlán](https://repositorio.uvg.edu.gt/handle/123456789/5978), [química computacional](https://repositorio.uvg.edu.gt/handle/123456789/2677), [procesos industriales](https://repositorio.uvg.edu.gt/handle/123456789/4712) y [química farmacéutica](https://repositorio.uvg.edu.gt/handle/123456789/4690). La junta puede ajustar el catálogo desde el panel conforme aparezcan nuevos temas.

En `/investigacion`, la vista pública muestra las categorías como etiquetas y permite filtrar por una categoría activa. Una tesis con varias categorías aparece al filtrar cualquiera de ellas. Sin filtro, también siguen accesibles las tesis antiguas aún no clasificadas.

El contrato HTTP, la persistencia, la validación y las pruebas PostgreSQL se documentan en [`thesis-categories.md`](../../aequvg-backend/docs/thesis-categories.md).

Verificación S6-07: E2E de tesis 2/2, unitarias frontend 68/68 y typecheck frontend correcto. Backend: integración PostgreSQL 7/7, unitarias 312 aprobadas (161 de otras integraciones omitidas) y typecheck correcto.
