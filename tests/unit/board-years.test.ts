import { describe, expect, it } from 'vitest'
import { boardYears, membersInBoardYear, yearsForBoardMember } from '../../src/utils/board-members'
import type { BoardMember } from '../../src/types/api'

const member = (id: number, start: string, end: string, displayOrder = 0): BoardMember => ({
  id, photoId: null, name: `Integrante ${id}`, position: 'Vocal', description: null, institutionalEmail: `persona${id}@uvg.edu.gt`, term: `${start.slice(0, 4)}–${end.slice(0, 4)}`,
  termStartsAt: start, termEndsAt: end, displayOrder, status: 'ACTIVO', photo: null
})

describe('años de Junta Directiva', () => {
  it('incluye cada año abarcado por las fechas', () => {
    expect(yearsForBoardMember(member(1, '2024-08-01', '2026-05-31'))).toEqual([2024, 2025, 2026])
  })

  it('ordena los años del más reciente al más antiguo', () => {
    expect(boardYears([member(1, '2024-01-01', '2025-01-01'), member(2, '2026-01-01', '2027-01-01')])).toEqual([2027, 2026, 2025, 2024])
  })

  it('ordena integrantes del año según displayOrder', () => {
    expect(membersInBoardYear([member(1, '2026-01-01', '2026-12-31', 2), member(2, '2026-01-01', '2026-12-31', 0)], 2026).map(item => item.id)).toEqual([2, 1])
  })
})
