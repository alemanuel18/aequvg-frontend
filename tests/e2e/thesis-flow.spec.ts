import { expect, test } from '@playwright/test'

const loginAsAdmin = async (page: import('@playwright/test').Page) => {
  await page.goto('/administrador')
  await page.getByLabel('Correo institucional').fill('admin@uvg.edu.gt')
  await page.getByLabel('Contraseña').fill('Acceso123!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/administrador\/panel$/)
}

const loginAsStudent = async (page: import('@playwright/test').Page) => {
  await page.goto('/acceso')
  await page.getByLabel('Correo institucional').fill('estudiante@uvg.edu.gt')
  await page.getByLabel('Contraseña').fill('Estudiante123!')
  await page.getByRole('button', { name: 'Iniciar sesión' }).click()
  await expect(page).toHaveURL(/\/mi-cuenta$/)
}

const expectNoHorizontalOverflow = async (page: import('@playwright/test').Page) => {
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    overflowing: [...document.querySelectorAll<HTMLElement>('*')]
      .map((element) => ({ element: element.tagName.toLowerCase(), className: String(element.className), right: Math.ceil(element.getBoundingClientRect().right), width: Math.ceil(element.getBoundingClientRect().width) }))
      .filter(({ right }) => right > document.documentElement.clientWidth + 1)
      .slice(0, 8),
    layout: ['.admin-content', '.theses-admin', '.form-card', 'form', '.contributors-fieldset', '.contributor-editor', '.contributor-row'].map((selector) => {
      const element = document.querySelector<HTMLElement>(selector)
      if (!element) return { selector, missing: true }
      const style = getComputedStyle(element)
      return { selector, width: Math.ceil(element.getBoundingClientRect().width), scroll: element.scrollWidth, client: element.clientWidth, columns: style.gridTemplateColumns, containerType: style.containerType }
    })
  }))
  expect(dimensions.scroll, JSON.stringify({ overflowing: dimensions.overflowing, layout: dimensions.layout })).toBeLessThanOrEqual(dimensions.client)
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
  const addedCategoryName = 'Química de laboratorio'
  await page.getByLabel('Nueva categoría').fill(addedCategoryName)
  await page.getByRole('button', { name: 'Crear categoría' }).click()
  await expect(page.getByText(`Se creó la categoría «${addedCategoryName}».`)).toBeVisible()

  await page.getByLabel('Título').fill(originalTitle)
  await page.getByLabel(/URL del repositorio/).fill(repositoryUrl)
  await page.getByLabel('Nombre de Autor principal').fill('Andrea López')
  await expect(page.getByLabel('Crear autor nuevo').first()).toBeChecked()
  const nameLabel = page.locator('.contributor-row .field-label').filter({ hasText: 'Nombre completo' })
  const nameLabelBox = await nameLabel.boundingBox()
  const nameRequiredMarkBox = await nameLabel.locator('[aria-hidden="true"]').boundingBox()
  expect(nameLabelBox).not.toBeNull()
  expect(nameRequiredMarkBox).not.toBeNull()
  expect(Math.abs(nameLabelBox!.y - nameRequiredMarkBox!.y)).toBeLessThan(4)
  await page.getByRole('button', { name: 'Agregar coautor' }).click()
  const coauthorOne = page.locator('.contributor-row').nth(1)
  await coauthorOne.getByLabel('Crear autor nuevo').uncheck()
  const authorPicker = coauthorOne.getByLabel('Buscar o seleccionar autor para Coautor 1')
  await authorPicker.fill('Estudiante')
  await coauthorOne.getByRole('option', { name: 'Estudiante de prueba' }).click()
  await expect(authorPicker).toHaveValue('Estudiante de prueba')
  await page.getByRole('button', { name: 'Agregar coautor' }).click()
  await page.getByLabel('Nombre de Coautor 2').fill('Carlos Pérez')
  await page.getByLabel('Química ambiental').check()
  await page.getByLabel(addedCategoryName).check()
  await expect(page.locator('.contributor-row strong')).toHaveText(['Autor principal', 'Coautor 1', 'Coautor 2'])
  await expect(page.locator('.contributor-row input[aria-label="Nombre de Coautor 1"]')).toHaveValue('Carlos Pérez')
  await expect(page.getByRole('button', { name: /Mover/ })).toHaveCount(0)
  await page.setViewportSize({ width: 1920, height: 1080 })
  for (const width of [967, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(250)
    await expectNoHorizontalOverflow(page)
    const rowSize = await page.locator('.contributor-row').first().evaluate((element) => ({ scroll: element.scrollWidth, client: element.clientWidth }))
    expect(rowSize.scroll).toBeLessThanOrEqual(rowSize.client)
    const fieldsetRight = await page.locator('.contributors-fieldset').evaluate((element) => Math.ceil(element.getBoundingClientRect().right))
    expect(fieldsetRight).toBeLessThanOrEqual(width)
  }
  await page.getByLabel('Año').fill('2026')
  await page.getByLabel('Resumen').fill('Estudio de catalizadores de origen natural para reducir residuos en procesos de síntesis.')
  await page.getByLabel('Publicar ahora').check()
  await page.getByRole('button', { name: 'Publicar tesis' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar', exact: true }).click()
  const newAdminItem = page.locator('.thesis-item').filter({ hasText: originalTitle })
  await expect(newAdminItem).toContainText('Publicada')
  await expect(page.getByText('La tesis se publicó.')).toBeVisible()

  await page.goto('/investigacion')
  await page.waitForLoadState('networkidle')
  await selectTheses(page)
  await page.getByRole('button', { name: 'Química ambiental', exact: true }).click()
  await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible()
  await expect(page.locator('.research-category-tags')).toContainText('Química ambiental')
  await expect(page.locator('.research-category-tags')).toContainText(addedCategoryName)
  await page.getByRole('button', { name: 'Todas', exact: true }).last().click()
  await page.getByRole('link', { name: `Ver tesis: ${originalTitle}` }).click()
  await expect(page.getByRole('heading', { name: originalTitle })).toBeVisible()
  await expect(page.locator('.thesis-detail__categories')).toContainText('Química ambiental')
  await expect(page.locator('.thesis-detail__categories')).toContainText(addedCategoryName)
  await expect(page.getByRole('link', { name: /Consultar tesis en el repositorio UVG/ })).toHaveAttribute('href', repositoryUrl)
  const publicAuthors = page.locator('.thesis-detail__authors li')
  await expect(publicAuthors).toHaveCount(3)
  await expect(publicAuthors.nth(0)).toContainText('Andrea López')
  await expect(publicAuthors.nth(0)).toContainText('Autor principal')
  await expect(publicAuthors.nth(1)).toContainText('Carlos Pérez')
  await expect(publicAuthors.nth(1)).toContainText('Coautor')
  await expect(publicAuthors.nth(2)).toContainText('Estudiante de prueba')
  await expect(publicAuthors.nth(2)).toContainText('Coautor')

  await page.setViewportSize({ width: 320, height: 720 })
  await expectNoHorizontalOverflow(page)

  await page.goto('/administrador/tesis')
  const addedCategoryRow = page.locator('.category-management__list li').filter({ hasText: addedCategoryName })
  await addedCategoryRow.getByRole('button', { name: 'Desactivar' }).click()
  await expect(page.getByText(`Se desactivó «${addedCategoryName}».`)).toBeVisible()
  await newAdminItem.getByRole('button', { name: 'Editar' }).click()
  await page.getByLabel('Título').fill(updatedTitle)
  await page.getByLabel('Resumen').fill('Resumen actualizado para verificar que la edición se refleja en la vista pública.')
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
  await page.getByRole('link', { name: `Ver tesis: ${updatedTitle}` }).click()
  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible()
  await expect(page.locator('.thesis-detail__authors li')).toHaveCount(3)
  await expect(page.locator('.thesis-detail__authors li').nth(0)).toContainText('Andrea López')
  await expect(page.locator('.thesis-detail__authors li').nth(1)).toContainText('Carlos Pérez')
  await expect(page.locator('.thesis-detail__authors li').nth(2)).toContainText('Estudiante de prueba')
  await expect(page.locator('.thesis-detail__categories')).toContainText('Química ambiental')
  await expect(page.locator('.thesis-detail__categories')).not.toContainText(addedCategoryName)

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

test('muestra errores claros por URL insegura, duplicado y fallo de guardado', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/administrador/tesis')

  await page.getByLabel('Título').fill('Intento con URL insegura')
  await page.getByLabel('Autor').fill('Autor de prueba')
  await page.getByLabel('Año').fill('2026')
  await page.getByLabel('Resumen').fill('Resumen breve de prueba.')
  const urlField = page.getByLabel(/URL del repositorio/)
  await urlField.fill('')
  await page.getByRole('button', { name: 'Agregar enlace' }).click()
  expect(await urlField.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true)

  await urlField.fill('http://repositorio.uvg.edu.gt/tesis.pdf')
  await page.getByRole('button', { name: 'Agregar enlace' }).click()
  await expect(page.getByRole('alert')).toContainText('La URL del repositorio debe comenzar con https://.')

  await page.getByLabel('Título').fill('Intento duplicado')
  await urlField.fill('  HTTPS://REPOSITORIO.UVG.EDU.GT/handle/123456789/1  ')
  await page.getByRole('button', { name: 'Agregar enlace' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Agregar', exact: true }).click()
  await expect(page.getByText('Ya existe una tesis con esa URL del repositorio.')).toBeVisible()
  await expect(page.locator('.thesis-item').filter({ hasText: 'Intento duplicado' })).toHaveCount(0)

  await page.getByLabel('Título').fill('Falla de guardado')
  await urlField.fill('https://repositorio.uvg.edu.gt/fallo-guardado')
  await page.getByRole('button', { name: 'Agregar enlace' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Agregar', exact: true }).click()
  await expect(page.getByText('Fallo simulado al guardar.')).toBeVisible()
  await expect(page.locator('.thesis-item').filter({ hasText: 'Falla de guardado' })).toHaveCount(0)
})

test('bloquea el alta si falta título, autor, año o resumen aunque se proporcione la URL', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/administrador/tesis')

  const urlField = page.getByLabel(/URL del repositorio/)
  const titleField = page.getByLabel('Título')
  const authorField = page.getByLabel('Nombre de Autor principal')
  const yearField = page.getByLabel('Año')
  const summaryField = page.getByLabel('Resumen')
  await urlField.fill('https://repositorio.uvg.edu.gt/handle/123456789/4914')
  expect(await urlField.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(true)
  expect(await titleField.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true)
  expect(await authorField.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true)
  expect(await yearField.evaluate((element: HTMLInputElement) => element.validity.valueMissing)).toBe(true)
  expect(await summaryField.evaluate((element: HTMLTextAreaElement) => element.validity.valueMissing)).toBe(true)

  await page.getByRole('button', { name: 'Agregar enlace' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.thesis-item').filter({ hasText: '123456789/4914' })).toHaveCount(0)
})

test('estudiantes consultan tesis sin ver controles administrativos', async ({ page }) => {
  await loginAsStudent(page)
  await page.goto('/investigacion')
  await page.waitForLoadState('networkidle')
  await selectTheses(page)
  await expect(page.getByRole('heading', { name: 'Tesis de ejemplo' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Eliminar' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Consultar tesis en el repositorio UVG/ })).toHaveCount(0)
  await page.getByRole('link', { name: 'Ver tesis: Tesis de ejemplo' }).click()
  await expect(page.getByRole('link', { name: /Consultar tesis en el repositorio UVG/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Eliminar' })).toHaveCount(0)

  await page.goto('/administrador/tesis')
  await expect(page).toHaveURL(/\/administrador\?returnTo=/)
})
