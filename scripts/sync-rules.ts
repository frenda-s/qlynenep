import { eq, inArray } from 'drizzle-orm'
import { getLocalDB } from './db'
import { schoolSettings, classes, violationTypes } from '../server/database/schema'

const RULES_2026: [string, string, number][] = [
  // 1. Chấp hành giờ giấc
  ['Vắng học có lý do', 'Vắng học có lý do (-2 điểm / 1 hs / buổi)', 2],
  ['Vắng học không lý do', 'Vắng học không có lý do (-10 điểm / 1 hs / buổi)', 10],
  ['Cúp tiết, cúp chào cờ, sinh hoạt', 'Cúp tiết, cúp chào cờ hoặc các giờ sinh hoạt trong tuần (-10 điểm / 1 hs / lượt)', 10],
  ['Đi học muộn', 'Đi học muộn (-5 điểm / 1 hs)', 5],
  ['Sinh hoạt đầu giờ không trong lớp', 'Sinh hoạt đầu giờ không trong lớp (-10 điểm / 1 hs)', 10],

  // 2. Vệ sinh, trang trí
  ['Làm dơ bẩn phòng học, viết vẽ bậy', 'Làm dơ bẩn phòng học, viết, vẽ lên tường, bàn học (-15 điểm / 1 lượt hs)', 15],
  ['Không chuẩn bị, thu xếp dụng cụ, bàn ghế', 'Không chuẩn bị, thu xếp dụng cụ, bàn ghế các buổi sinh hoạt tập thể (-15 điểm / tập thể lớp)', 15],
  ['Không có bình hoa, khăn bàn trên bàn GV', 'Không có bình hoa, khăn bàn trên bàn giáo viên (-10 điểm / lớp)', 10],
  ['Bị GV phê bình do vệ sinh kém, xả rác', 'Bị giáo viên phê bình do giữ vệ sinh kém (xả rác trong lớp) (-20 điểm / buổi)', 20],

  // 3. Tác phong, nề nếp học sinh
  ['Vi phạm tác phong, đồng phục, bảng tên', 'Không đeo bảng tên, trang điểm lòe loẹt, sai đồng phục, đi dép lê, tóc không gọn/nhuộm tóc, nam không đóng thùng, nam đeo khuyên tai (-10 điểm / 1 hs)', 10],
  ['Ăn quà vặt, xả rác trong trường', 'Ăn quà trong lớp, cắn hạt dưa, xả rác, nhai kẹo cao su trong lớp, xả rác khuôn viên nhà trường (-10 điểm / 1 hs)', 10],
  ['Sử dụng điện thoại trong buổi học', 'Sử dụng điện thoại trong buổi học không đúng quy định (-20 điểm / 1 hs)', 20],
  ['Đánh nhau, vô lễ, hút thuốc, uống rượu bia', 'HS đánh nhau, vô lễ; hút thuốc lá, uống rượu bia tới trường (-30 điểm / 1 hs)', 30],
  ['Mang quẹt lửa, dao, kéo, đồ sắc nhọn', 'HS mang quẹt lửa, dao, kéo, đồ sắc nhọn đến trường (-20 điểm / 1 hs)', 20],
  ['Nói tục, chửi thề', 'HS nói tục, chửi thề (-20 điểm / 1 hs)', 20],
  ['Vi phạm quy định xe cộ và ATGT', 'Đi xe/để xe không đúng quy định, không gương chiếu hậu, độ chế xe, nẹt pô (-20 điểm / 1 hs)', 20],
  ['Sử dụng MXH bôi nhọ, lăng mạ người khác', 'Sử dụng mạng xã hội bôi nhọ, lăng mạ, bóc phốt, kích bác danh dự, nhân phẩm người khác (-20 điểm / 1 hs)', 20],

  // 4. Bảo quản trường lớp
  ['Làm hư hỏng tài sản trường lớp', 'Làm hư hỏng tài sản trong lớp: bàn, ghế, bảng, rèm, cửa... (-20 điểm / 1 hs)', 20],
  ['Không tắt quạt, điện khi ra khỏi lớp', 'HS không tắt quạt, điện khi ra về hoặc phòng trống (-20 điểm)', 20],
  ['Ra về không đóng cửa phòng học', 'HS ra về không đóng cửa (-10 điểm)', 10],

  // 5. Hoạt động ngoại khóa & phong trào
  ['Vắng có phép hoạt động ngoại khóa', 'Vắng có phép khi tham gia các hoạt động ngoại khóa (-5 điểm / 1 hs / lần)', 5],
  ['Vắng không phép hoạt động ngoại khóa', 'Vắng không có phép trong các buổi ngoại khóa, hoạt động phong trào (-10 điểm / 1 hs / lần)', 10],
  ['Tập thể xếp cuối cuộc thi do cấp trên tổ chức', 'Tập thể xếp cuối các cuộc thi do cấp trên tổ chức (-20 điểm / lớp)', 20],
]

async function main() {
  const { db, dispose } = await getLocalDB()

  console.log('🔄 Đang đồng bộ thông tin trường và nội quy tiêu chí 2026 - 2027...')

  // 1. Cập nhật tên trường
  const existingSetting = await db
    .select()
    .from(schoolSettings)
    .where(eq(schoolSettings.key, 'school_name'))
    .limit(1)

  if (existingSetting.length > 0) {
    await db
      .update(schoolSettings)
      .set({ value: 'TRƯỜNG THPT CHU VĂN AN – GIA NGHĨA', updatedAt: Date.now() })
      .where(eq(schoolSettings.key, 'school_name'))
  } else {
    await db
      .insert(schoolSettings)
      .values({ key: 'school_name', value: 'TRƯỜNG THPT CHU VĂN AN – GIA NGHĨA' })
  }
  console.log('✅ Đã cập nhật tên trường: TRƯỜNG THPT CHU VĂN AN – GIA NGHĨA')

  // 2. Cập nhật năm học các lớp thành 2026-2027
  await db.update(classes).set({ academicYear: '2026-2027', updatedAt: Date.now() })
  console.log('✅ Đã cập nhật năm học: 2026-2027 cho các lớp')

  // 3. Cập nhật / thêm mới các tiêu chí vi phạm
  const currentTypes = await db.select().from(violationTypes)
  const currentMap = new Map(currentTypes.map((t) => [t.name, t]))

  let added = 0
  let updated = 0
  const activeNames: string[] = []

  for (const [name, desc, points] of RULES_2026) {
    activeNames.push(name)
    const existing = currentMap.get(name)
    if (existing) {
      await db
        .update(violationTypes)
        .set({ description: desc, penaltyPoints: points, isActive: true, updatedAt: Date.now() })
        .where(eq(violationTypes.id, existing.id))
      updated++
    } else {
      await db.insert(violationTypes).values({
        name,
        description: desc,
        penaltyPoints: points,
        isActive: true,
      })
      added++
    }
  }

  // Tắt kích hoạt các loại lỗi cũ không còn trong danh mục mới
  for (const t of currentTypes) {
    if (!activeNames.includes(t.name) && t.isActive) {
      await db
        .update(violationTypes)
        .set({ isActive: false, updatedAt: Date.now() })
        .where(eq(violationTypes.id, t.id))
    }
  }

  console.log(`✅ Đồng bộ tiêu chí hoàn tất: Thêm mới ${added}, Cập nhật ${updated}. Tổng cộng ${RULES_2026.length} tiêu chuẩn thi đua.`)
  await dispose()
}

main().catch((err) => {
  console.error('❌ Thất bại:', err)
  process.exit(1)
})
