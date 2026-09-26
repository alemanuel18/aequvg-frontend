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

test('lista publicaciones públicas de noticias', async ({ page }) => {
  await page.goto('/noticias')
  await expect(page.getByRole('heading', { name: 'Noticias y anuncios', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: /Leer noticia: Convocatoria de laboratorio/ })).toBeVisible()
})

test('muestra el detalle público y el estado de publicación no encontrada', async ({ page }) => {
  await page.goto('/noticias/7')
  await expect(page.getByRole('heading', { name: 'Convocatoria de laboratorio', level: 1 })).toBeVisible()
  await expect(page.getByText('La actividad se realizará en el laboratorio central.')).toBeVisible()
  await page.goto('/noticias/999')
  await expect(page.getByRole('heading', { name: 'No encontramos esta publicación', level: 2 })).toBeVisible()
})
