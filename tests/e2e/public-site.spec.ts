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
  await expect(page.getByRole('heading', { name: 'Noticias y anuncios', level: 1 })).toBeVisible()
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
})
