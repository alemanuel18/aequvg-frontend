// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ModerationNotice from '../../src/components/common/ModerationNotice.vue'

describe('ModerationNotice', () => {
  it('muestra un rechazo comprensible y enlaza al contacto sin filtrar el contenido', () => {
    const wrapper = mount(ModerationNotice, {
      props: { code: 'COMMENT_REJECTED_BY_MODERATION' },
      global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
    })

    expect(wrapper.get('[role="alert"]').text()).toContain('Comentario no publicado')
    expect(wrapper.get('a').attributes('href')).toBe('/contacto')
    expect(wrapper.text()).not.toContain('insulto')
  })

  it('muestra el fin del bloqueo temporal y oculta canal y evidencia internos', () => {
    const wrapper = mount(ModerationNotice, {
      props: {
        code: 'ACCOUNT_TEMPORARILY_BLOCKED',
        fields: { blockedUntil: '2026-10-26T18:30:00.000Z', reviewChannel: 'interno@example.org', evidence: 'contenido privado' }
      },
      global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
    })

    expect(wrapper.text()).toContain('bloqueada temporalmente hasta el')
    expect(wrapper.text()).not.toContain('interno@example.org')
    expect(wrapper.text()).not.toContain('contenido privado')
  })

  it('pide revisión administrativa para el bloqueo permanente', () => {
    const wrapper = mount(ModerationNotice, {
      props: { code: 'ACCOUNT_PERMANENTLY_BLOCKED', fields: { reviewChannel: 'interno@example.org' } },
      global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } }
    })

    expect(wrapper.text()).toContain('Se requiere revisión administrativa')
    expect(wrapper.get('a').attributes('href')).toBe('/contacto')
    expect(wrapper.text()).not.toContain('interno@example.org')
  })
})
