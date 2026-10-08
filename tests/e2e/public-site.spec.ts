import { expect, test } from '@playwright/test'

test('la navegación principal funciona con teclado', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByText('Saltar al contenido')).toBeFocused()
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Contacto' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/contacto$/)
  await expect(page.getByRole('heading', { name: 'Contacto', level: 1 })).toBeVisible()
})

test('no genera desplazamiento horizontal a 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')
  const menuButton = page.getByRole('button', { name: 'Abrir menú de navegación' })
  await expect(menuButton).toBeEnabled()
  await menuButton.click()
  await expect(page.getByRole('button', { name: 'Cerrar menú de navegación' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Contacto' })).toBeVisible()
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Abrir menú de navegación' })).toBeVisible()
})

test('protege el panel y valida el inicio de sesión administrativo', async ({ page }) => {
  await page.goto('/administrador/panel')
  await expect(page).toHaveURL(/\/administrador\?returnTo=/)
  await expect(page.getByRole('heading', { name: 'Panel administrativo', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByText('Escribe tu correo institucional.')).toBeVisible()
  await expect(page.getByLabel('Correo institucional')).toBeFocused()

  await page.getByLabel('Correo institucional').fill('persona@example.com')
  await page.getByLabel('Contraseña').fill('incorrecta')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByText('Usa tu correo institucional de UVG.')).toBeVisible()

  await page.getByLabel('Correo institucional').fill('admin@uvg.edu.gt')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page.getByRole('alert')).toContainText('El correo o la contraseña no son válidos.')

  await page.getByLabel('Contraseña').fill('Acceso123!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/administrador\/panel$/)
  await expect(page.getByRole('heading', { name: 'Módulos disponibles', level: 2 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Abrir módulo: Noticias' })).toBeVisible()
  await expect(page.getByText('Tesis aún no está disponible')).toBeVisible()
  await expect(page.getByRole('link', { name: /Tesis/ })).toHaveCount(0)

  await page.route('**/api/v1/auth/me', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    await route.continue()
  })
  await page.reload()
  await expect(page.getByRole('link', { name: 'Abrir módulo: Noticias' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cargando panel', level: 2 })).not.toBeVisible()
})

test('el panel administrativo funciona con teclado y a 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/administrador')
  await page.getByLabel('Correo institucional').fill('admin@uvg.edu.gt')
  await page.getByLabel('Contraseña').fill('Acceso123!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/administrador\/panel$/)

  const menuButton = page.getByRole('button', { name: 'Abrir menú administrativo' })
  await menuButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('navigation', { name: 'Navegación administrativa' })).toBeVisible()
  await expect(page.locator('#admin-sidebar').getByRole('button', { name: 'Cerrar menú administrativo' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Abrir menú administrativo' })).toBeVisible()

  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client)
})

test('administra noticias con filtros, previsualización y confirmación', async ({ page }) => {
  await page.goto('/administrador')
  await page.getByLabel('Correo institucional').fill('admin@uvg.edu.gt')
  await page.getByLabel('Contraseña').fill('Acceso123!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/administrador\/panel$/)
  await page.goto('/administrador/noticias')

  await expect(page.getByRole('heading', { name: 'Gestión de Noticias y Comunicados', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Convocatoria de laboratorio', level: 3 })).toBeVisible()
  await page.getByRole('button', { name: 'Previsualizar' }).click()
  await expect(page.getByRole('heading', { name: 'Título de la noticia', level: 3 })).toBeVisible()

  await page.locator('#news-title').fill('Nueva noticia de prueba')
  await page.getByLabel('Resumen').fill('Resumen suficientemente descriptivo.')
  await page.getByLabel('Contenido').fill('Contenido suficientemente extenso para publicar una noticia.')
  await page.locator('#news-category').selectOption('2')
  await page.getByRole('button', { name: 'Guardar noticia' }).click()
  await expect(page.getByRole('heading', { name: '¿Crear noticia?' })).toBeVisible()
  await page.getByRole('button', { name: 'Crear noticia' }).click()
  await expect(page.getByText('La noticia se creó correctamente.')).toBeVisible()

  await page.goto('/noticias?q=Nueva%20noticia%20de%20prueba')
  await expect(page.getByRole('link', { name: /Leer noticia: Nueva noticia de prueba/ })).toBeVisible()
  await page.goto('/administrador/noticias')

  await page.getByRole('button', { name: 'Eliminar' }).first().click()
  await expect(page.getByRole('heading', { name: '¿Eliminar noticia permanentemente?' })).toBeVisible()
  await page.getByRole('button', { name: 'Eliminar permanentemente' }).click()
})

test('cerrar sesión invalida acciones posteriores y protege el acceso directo', async ({ page }) => {
  await page.goto('/administrador')
  await page.getByLabel('Correo institucional').fill('admin@uvg.edu.gt')
  await page.getByLabel('Contraseña').fill('Acceso123!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/administrador\/panel$/)

  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/administrador$/)
  await page.goto('/administrador/panel')
  await expect(page).toHaveURL(/\/administrador\?returnTo=/)
})

test('el formulario anuncia validaciones y exige consentimiento', async ({ page }) => {
  await page.goto('/contacto')
  await page.getByLabel('Nombre completo').fill('Persona de prueba')
  await page.getByLabel('Correo electrónico').fill('persona@example.com')
  await page.getByLabel('Teléfono').fill('+502 5555-5555')
  await page.getByLabel('Asunto').fill('Información')
  await page.getByRole('textbox', { name: 'Mensaje', exact: true }).fill('Quisiera conocer más sobre la carrera.')
  await page.getByRole('button', { name: 'Enviar solicitud' }).click()
  await expect(page.getByText('El consentimiento es obligatorio.')).toBeVisible()
  await expect(page.getByRole('checkbox')).not.toBeChecked()
})

test('lista, busca, pagina y muestra estados de noticias', async ({ page }) => {
  await page.goto('/noticias')
  await expect(page.getByRole('heading', { name: 'Noticias', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: /Leer noticia: Convocatoria de laboratorio/ })).toBeVisible()
  await page.goto('/noticias?page=2')
  await expect(page.getByRole('link', { name: /Leer noticia: Anuncio de segunda página/ })).toBeVisible()
  await page.goto('/noticias?q=sin-resultados')
  await expect(page.getByRole('heading', { name: 'No hay publicaciones para esta búsqueda', level: 2 })).toBeVisible()
  await page.goto('/noticias?q=error-prueba')
  await expect(page.getByRole('heading', { name: 'No pudimos cargar las noticias', level: 2 })).toBeVisible()
})

test('muestra el detalle público y el estado de publicación no encontrada', async ({ page }) => {
  await page.goto('/noticias/7')
  await expect(page.getByRole('heading', { name: 'Convocatoria de laboratorio', level: 1 })).toBeVisible()
  await expect(page.getByText('La actividad se realizará en el laboratorio central.')).toBeVisible()
  await page.goto('/noticias/999')
  await expect(page.getByRole('heading', { name: 'No encontramos esta publicación', level: 2 })).toBeVisible()
})

test('lista y muestra el detalle de investigaciones publicadas', async ({ page }) => {
  await page.goto('/investigacion')
  await expect(page.getByRole('heading', { name: 'Investigación', level: 1 })).toBeVisible()
  const projectLink = page.getByRole('link', { name: /Ver investigación: Análisis de microplásticos/ })
  await expect(projectLink).toBeVisible()
  await projectLink.click()
  await expect(page).toHaveURL(/\/investigacion\/20$/)
  await expect(page.getByRole('heading', { name: 'Análisis de microplásticos en fuentes hídricas urbanas', level: 1 })).toBeVisible()
  await expect(page.getByText('Desarrollado por Contenido de desarrollo')).toBeVisible()
})

test('muestra el estado de investigación no encontrada', async ({ page }) => {
  await page.goto('/investigacion/999')
  await expect(page.getByRole('heading', { name: 'No encontramos esta investigación', level: 2 })).toBeVisible()
})

test('lista, busca, pagina y protege las acciones de recursos', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/recursos')
  await expect(page.getByRole('heading', { name: 'Recursos para estudiantes', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Explora las áreas principales', level: 2 })).toBeVisible()
  await expect(page.getByRole('link', { name: /Investigación estudiantil/ })).toHaveAttribute('href', '/investigacion')
  await expect(page.getByRole('link', { name: /Contacto directo/ })).toHaveAttribute('href', '/contacto')
  const externalLink = page.getByRole('link', { name: 'Referencia UVG: se abre en una nueva pestaña' })
  await expect(externalLink).toHaveAttribute('target', '_blank')
  await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(page.getByRole('link', { name: 'Descargar guia-seguridad.pdf' })).toHaveAttribute('download', 'guia-seguridad.pdf')
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client)
  await page.goto('/recursos?page=2')
  await expect(page.getByRole('heading', { name: 'Manual de segunda página', level: 3 })).toBeVisible()
  await page.goto('/recursos?q=sin-resultados')
  await expect(page.getByRole('heading', { name: 'No hay recursos para esta búsqueda', level: 2 })).toBeVisible()
  await page.goto('/recursos?q=error-prueba')
  await expect(page.getByRole('heading', { name: 'No pudimos cargar los recursos', level: 2 })).toBeVisible()
})

test('navega desde /eventos al detalle público de evento', async ({ page }) => {
  await page.goto('/eventos')
  await expect(page.getByRole('heading', { name: 'Eventos', level: 1 })).toBeVisible()
  const eventLink = page.getByRole('link', { name: /Ver evento: Taller de Espectrometría UV-Vis/ })
  await expect(eventLink).toBeVisible()
  await eventLink.click()
  await expect(page).toHaveURL(/\/eventos\/10$/)
  await expect(page.getByRole('heading', { name: 'Taller de Espectrometría UV-Vis', level: 1 })).toBeVisible()
  await expect(page.getByText('Capacidad máxima:')).toBeVisible()
  await expect(page.getByText('30 asistentes')).toBeVisible()
  await expect(page.getByText('12 cupos disponibles')).toBeVisible()
})

test('muestra error 404 al consultar un evento inexistente', async ({ page }) => {
  const response = await page.goto('/eventos/999')
  expect(response?.status()).toBe(404)
  await expect(page.getByText('404')).toBeVisible()
  await expect(page.getByText('Evento no encontrado')).toBeVisible()
})

test('permite inscribirse a un evento público y muestra confirmación', async ({ page }) => {
  await page.goto('/eventos/10')
  await expect(page.getByRole('heading', { name: 'Taller de Espectrometría UV-Vis', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Inscribirme a este evento ↓' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Inscripción al evento' })).toBeVisible()

  await page.getByLabel('Nombre completo').fill('Sofía Morales')
  await page.getByLabel('Correo electrónico').fill('sofia@uvg.edu.gt')
  await page.getByLabel('Teléfono').fill('+502 4444-4444')
  await page.getByLabel(/Autorizo el tratamiento de mis datos/i).check()

  await page.getByRole('button', { name: 'Inscribirme al evento' }).click()

  await expect(page.getByRole('heading', { name: '¡Inscripción confirmada!' })).toBeVisible()
  await expect(page.getByText('Has quedado inscrito exitosamente en Taller de Espectrometría UV-Vis.')).toBeVisible()
  await expect(page.getByRole('link', { name: '← Ver todos los eventos' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Inscribirme al evento' })).not.toBeVisible()
})

test('valida campos obligatorios y consentimiento en la inscripción', async ({ page }) => {
  await page.goto('/eventos/10')
  await page.getByRole('button', { name: 'Inscribirme al evento' }).click()

  await expect(page.getByText('Escribe tu nombre completo.')).toBeVisible()
  await expect(page.getByText('Escribe un correo válido.')).toBeVisible()
  await expect(page.getByText('Escribe un número de teléfono válido.')).toBeVisible()
  await expect(page.getByText('Debes aceptar la política de privacidad.')).toBeVisible()
})

test('maneja error cuando el usuario ya está registrado en el evento', async ({ page }) => {
  await page.goto('/eventos/10')
  await page.getByLabel('Nombre completo').fill('Estudiante Registrado')
  await page.getByLabel('Correo electrónico').fill('duplicado@uvg.edu.gt')
  await page.getByLabel('Teléfono').fill('+502 5555-5555')
  await page.getByLabel(/Autorizo el tratamiento de mis datos/i).check()

  await page.getByRole('button', { name: 'Inscribirme al evento' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText('Ya existe una inscripción registrada con este correo electrónico para este evento.')).toBeVisible()
  await expect(page.getByLabel('Correo electrónico')).toBeEnabled()
})

test('maneja error cuando el evento ha alcanzado el cupo máximo', async ({ page }) => {
  await page.goto('/eventos/10')
  await page.getByLabel('Nombre completo').fill('Estudiante Sin Cupo')
  await page.getByLabel('Correo electrónico').fill('lleno@uvg.edu.gt')
  await page.getByLabel('Teléfono').fill('+502 5555-5555')
  await page.getByLabel(/Autorizo el tratamiento de mis datos/i).check()

  await page.getByRole('button', { name: 'Inscribirme al evento' }).click()

  await expect(page.getByRole('heading', { name: 'Inscripciones no disponibles' })).toBeVisible()
  await expect(page.getByText('Este evento ha alcanzado su capacidad máxima.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Inscribirme al evento' })).not.toBeVisible()
  await expect(page.getByText('Cupo lleno')).toBeVisible()
})

test('muestra preventivamente estado de cupo lleno en eventos con availableCapacity === 0', async ({ page }) => {
  await page.goto('/eventos/12')
  await expect(page.getByRole('heading', { name: 'Taller Agotado', level: 1 })).toBeVisible()
  await expect(page.getByText('Cupo lleno')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Inscribirme a este evento ↓' })).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Inscripciones no disponibles' })).toBeVisible()
  await expect(page.getByText('Este evento ha alcanzado su capacidad máxima.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Inscribirme al evento' })).not.toBeVisible()
})

test('la página de inicio muestra el Hero dinámico, la sección Conocer la Licenciatura con hasta 3 anuncios y destacados', async ({ page }) => {
  await page.goto('/')
  // Valida el Hero dinámico
  await expect(page.getByRole('heading', { name: 'Licenciatura en Química Farmacéutica y Pura', level: 1 })).toBeVisible()
  await expect(page.getByText('Excelencia científica e investigación con impacto social.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Conocer la carrera' })).toBeVisible()

  // Valida la sección unificada de anuncios (máximo 3)
  await expect(page.getByRole('heading', { name: 'Conoce la Licenciatura en Química', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Laboratorios Especializados', level: 3 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Oportunidades Laborales', level: 3 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Experiencia de Estudiantes', level: 3 })).toBeVisible()

  // Valida que no se pierden las secciones de noticias y eventos destacados
  await expect(page.getByRole('heading', { name: 'Eventos destacados', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Taller de Espectrometría UV-Vis' })).toBeVisible()

  await expect(page.getByRole('heading', { name: 'Noticias destacadas', level: 2 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Convocatoria de laboratorio' })).toBeVisible()

  // Valida que los enlaces hacia otras secciones se mantienen íntegros
  await expect(page.getByRole('link', { name: 'Ver todos los eventos →' })).toHaveAttribute('href', '/eventos')
  await expect(page.getByRole('link', { name: 'Ver todas las noticias →' })).toHaveAttribute('href', '/noticias')
})

test('el módulo administrativo de contenido institucional interactúa con modal de confirmación y toasts', async ({ page }) => {
  await page.goto('/administrador')
  await page.getByLabel('Correo institucional').fill('admin@uvg.edu.gt')
  await page.getByLabel('Contraseña').fill('Acceso123!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/administrador\/panel$/)

  await page.goto('/administrador/contenido')
  await expect(page.getByRole('heading', { name: 'Contenido Institucional', level: 1 })).toBeVisible()

  // Verifica que cargue el Hero y los bloques de anuncios
  await expect(page.getByLabel('Título principal')).toHaveValue('Licenciatura en Química Farmacéutica y Pura')
  await expect(page.getByText('3 de 3 anuncios activos')).toBeVisible()

  // Intenta guardar el Hero: debe levantar el modal de confirmación primero
  await page.getByRole('button', { name: 'Guardar sección de Inicio' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: '¿Guardar sección de Inicio?' })).toBeVisible()

  // Confirma en el modal
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()

  // Verifica que se muestre el toast flotante de éxito
  await expect(page.locator('.toast-item--success')).toBeVisible()
  await expect(page.getByText('La sección de Inicio (Hero) se guardó correctamente.')).toBeVisible()
})
