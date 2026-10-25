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
      global: { components: { StatePanel } }
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.comment-card__content').element.textContent).toBe(content)
  })
})
