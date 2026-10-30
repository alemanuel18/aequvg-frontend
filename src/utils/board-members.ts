import type { BoardMember } from '~/types/api'

export const yearsForBoardMember = (member: BoardMember): number[] => {
  if (member.termStartsAt && member.termEndsAt) {
    const start = Number(member.termStartsAt.slice(0, 4))
    const end = Number(member.termEndsAt.slice(0, 4))
    if (Number.isInteger(start) && Number.isInteger(end) && end >= start && end - start <= 50) {
      return Array.from({ length: end - start + 1 }, (_, index) => start + index)
    }
  }
  return [...member.term.matchAll(/\d{4}/g)].map(match => Number(match[0])).filter((year, index, values) => values.indexOf(year) === index)
}

export const boardYears = (members: BoardMember[]) => [...new Set(members.flatMap(yearsForBoardMember))].sort((a, b) => b - a)

export const membersInBoardYear = (members: BoardMember[], year: number) => members
  .filter(member => yearsForBoardMember(member).includes(year))
  .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
