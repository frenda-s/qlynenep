export type ConductRating = 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu' | 'Kém'

/** Cùng ngưỡng với server/utils/conduct.ts để hiển thị nhất quán. */
export function classifyConduct(points: number): ConductRating {
  if (points >= 90) return 'Tốt'
  if (points >= 80) return 'Khá'
  if (points >= 65) return 'Trung bình'
  if (points >= 50) return 'Yếu'
  return 'Kém'
}

export function conductTone(rating: ConductRating): 'success' | 'default' | 'muted' | 'accent' {
  switch (rating) {
    case 'Tốt':
      return 'success'
    case 'Khá':
      return 'default'
    case 'Trung bình':
      return 'muted'
    default:
      return 'accent'
  }
}
