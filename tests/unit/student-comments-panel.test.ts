// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import StudentCommentsPanel from '../../src/components/student/StudentCommentsPanel.vue'
import StatePanel from '../../src/components/common/StatePanel.vue'

describe('StudentCommentsPanel', () => {
  it('renderiza el comentario como texto y no interpreta HTML', () => {
    const content = '<img src=x onerror="alert(1)"> comentario propio'
    const wrapper = mount(StudentCommentsPanel, {
      props: {
        comments: [{
          id: 1,
          targetType: 'EVENTO',
          targetId: 12,
          content,
          authorName: 'Ana Pérez',
          createdAt: '2026-10-25T12:00:00.000Z'
        }],
        loading: false,
        error: ''
      },
      global: {
        components: { StatePanel },
        stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }
      }
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.comment-card__content').element.textContent).toBe(content)
    expect(wrapper.get('h3 a').attributes('href')).toBe('/eventos/12')
  })

  it('muestra al autor anonimizado sin nombre anterior, avatar ni enlace a su perfil', () => {
    const wrapper = mount(StudentCommentsPanel, {
      props: {
        comments: [{
          id: 2,
          targetType: 'NOTICIA',
          targetId: 7,
          content: 'Comentario conservado',
          authorName: 'Anónimo',
          createdAt: '2026-10-25T12:00:00.000Z'
        }],
        loading: false,
        error: ''
      },
      global: {
        components: { StatePanel },
        stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } }
      }
    })

    expect(wrapper.get('.comment-card__author').text()).toBe('Anónimo')
    expect(wrapper.find('.comment-card__author a').exists()).toBe(false)
    expect(wrapper.find('.comment-card__author img').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Ana Pérez')
    expect(wrapper.get('h3 a').attributes('href')).toBe('/noticias/7')
  })
})
