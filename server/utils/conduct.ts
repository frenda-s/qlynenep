export type ConductRating = 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu' | 'Kém'

/**
 * Phân loại hạnh kiểm theo thang điểm nề nếp (mặc định 100 điểm).
 * Ngưỡng tham chiếu Thông tư đánh giá hạnh kiểm của học sinh.
 */
export function classifyConduct(points: number): ConductRating {
  if (points >= 90) return 'Tốt'
  if (points >= 80) return 'Khá'
  if (points >= 65) return 'Trung bình'
  if (points >= 50) return 'Yếu'
  return 'Kém'
}

export const CONDUCT_ORDER: ConductRating[] = ['Tốt', 'Khá', 'Trung bình', 'Yếu', 'Kém']

export function conductTone(rating: ConductRating): 'success' | 'default' | 'accent' | 'muted' {
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
