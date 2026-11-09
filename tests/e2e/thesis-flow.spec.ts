import { expect, test } from '@playwright/test'

const loginAsAdmin = async (page: import('@playwright/test').Page) => {
  await page.goto('/administrador')
  await page.getByLabel('Correo institucional').fill('admin@uvg.edu.gt')
  await page.getByLabel('Contraseña').fill('Acceso123!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/administrador\/panel$/)
}

const expectNoHorizontalOverflow = async (page: import('@playwright/test').Page) => {
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth
  }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
}

const selectTheses = async (page: import('@playwright/test').Page) => {
  const button = page.getByRole('button', { name: 'Tesis', exact: true })
  await button.click()
  await expect(button).toHaveClass(/is-active/)
}

test('administra una tesis y refleja cada cambio en la consulta pública', async ({ page }) => {
  const originalTitle = 'Evaluación de catalizadores para química sostenible'
  const updatedTitle = 'Catalizadores sostenibles para síntesis química'
  const repositoryUrl = 'https://repositorio.uvg.edu.gt/handle/123456789/7001'

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/investigacion')
  await page.waitForLoadState('networkidle')
  await selectTheses(page)
  await expect(page.getByRole('heading', { name: 'Tesis de ejemplo' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver tesis: Tesis de ejemplo' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0)
  await expect(page.locator('input[type="file"]')).toHaveCount(0)

  await page.getByRole('link', { name: 'Ver tesis: Tesis de ejemplo' }).click()
  await expect(page.getByRole('heading', { name: 'Tesis de ejemplo' })).toBeVisible()
  const sourceLink = page.getByRole('link', { name: /Consultar tesis en el repositorio UVG/ })
  await expect(sourceLink).toHaveAttribute('href', 'https://repositorio.uvg.edu.gt/handle/123456789/1')
  await expect(sourceLink).toHaveAttribute('target', '_blank')
  await expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer')
  await expect(page.getByText(/cualquier requisito de acceso dependen del repositorio de origen/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Eliminar' })).toHaveCount(0)

  await loginAsAdmin(page)
  await page.goto('/administrador/tesis')
  await expect(page.getByRole('heading', { name: 'Enlaces registrados' })).toBeVisible()
  await expect(page.locator('input[type="file"]')).toHaveCount(0)

  await page.getByLabel('Título').fill(originalTitle)
  await page.getByLabel('Enlace a la tesis').fill(repositoryUrl)
  await page.getByLabel('Autor').fill('Andrea López')
  await page.getByLabel('Año (opcional)').fill('2026')
  await page.getByLabel('Resumen (opcional)').fill('Estudio de catalizadores de origen natural para reducir residuos en procesos de síntesis.')
  await page.getByLabel('Identificador del repositorio (opcional)').fill('123456789/7001')
  await page.getByLabel('Publicar ahora').check()
  await page.getByRole('button', { name: 'Publicar tesis' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar', exact: true }).click()
  const newAdminItem = page.locator('.thesis-item').filter({ hasText: originalTitle })
  await expect(newAdminItem).toContainText('Publicada')
  await expect(page.getByText('La tesis se publicó.')).toBeVisible()

  await page.goto('/investigacion')
  await page.waitForLoadState('networkidle')
  await selectTheses(page)
  await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible()
  await page.getByRole('link', { name: `Ver tesis: ${originalTitle}` }).click()
  await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible()
  await expect(page.getByRole('link', { name: /Consultar tesis en el repositorio UVG/ })).toHaveAttribute('href', repositoryUrl)

  await page.setViewportSize({ width: 320, height: 720 })
  await expectNoHorizontalOverflow(page)

  await page.goto('/administrador/tesis')
  await newAdminItem.getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Título').fill(updatedTitle)
  await page.getByLabel('Resumen (opcional)').fill('Resumen actualizado para verificar que la edición se refleja en la vista pública.')
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click()
  const updatedAdminItem = page.locator('.thesis-item').filter({ hasText: updatedTitle })
  await expect(updatedAdminItem).toBeVisible()
  await expect(page.getByText('Se guardaron los cambios.')).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.goto('/investigacion')
  await page.waitForLoadState('networkidle')
  await selectTheses(page)
  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible()
  await expect(page.getByText('Resumen actualizado para verificar que la edición se refleja en la vista pública.')).toBeVisible()

  await page.goto('/administrador/tesis')
  await updatedAdminItem.getByRole('button', { name: 'Eliminar' }).click()
  await expect(page.getByRole('dialog')).toContainText('La tesis seguirá en el repositorio universitario.')
  await page.getByRole('dialog').getByRole('button', { name: 'Eliminar enlace' }).click()
  await expect(page.locator('.thesis-item').filter({ hasText: updatedTitle })).toHaveCount(0)
  await expect(page.getByText('Se quitó el enlace de la página.')).toBeVisible()

  await page.goto('/investigacion')
  await page.waitForLoadState('networkidle')
  await selectTheses(page)
  await expect(page.getByRole('heading', { name: updatedTitle })).toHaveCount(0)
  await page.getByLabel('Buscar investigaciones').fill('sin-resultados')
  await page.getByRole('button', { name: 'Buscar' }).click()
  await expect(page.getByRole('heading', { name: 'No hay investigaciones para esta búsqueda' })).toBeVisible()
  await page.getByLabel('Buscar investigaciones').fill('error-prueba')
  await page.getByRole('button', { name: 'Buscar' }).click()
  await expect(page.getByRole('heading', { name: 'No pudimos cargar las investigaciones' })).toBeVisible()
})
