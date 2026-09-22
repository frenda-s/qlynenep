import { sql } from 'drizzle-orm'
import { hashPassword } from '../server/utils/hash'
import { genQrCode, genStudentCode } from '../server/utils/id'
import {
  classes,
  students,
  users,
  violationTypes,
  violations,
  violationItems,
  schoolSettings,
} from '../server/database/schema'
import type { DB } from '../server/database/client'

const rand = (n: number) => Math.floor(Math.random() * n)
const pick = <T>(arr: T[]): T => arr[rand(arr.length)]
const range = (n: number) => Array.from({ length: n }, (_, i) => i)

const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ']
const MIDDLE = ['Văn', 'Thị', 'Minh', 'Quốc', 'Thanh', 'Anh', 'Ngọc', 'Đức', 'Hữu', 'Thu']
const FIRST = ['An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Hùng', 'Khang', 'Linh', 'Long', 'Mai',
  'Nam', 'Nhung', 'Phương', 'Quân', 'Quỳnh', 'Sơn', 'Thảo', 'Trang', 'Tuấn', 'Vy']

function fullName(): string {
  return `${pick(LAST_NAMES)} ${pick(MIDDLE)} ${pick(FIRST)}`
}

export async function seed(db: DB) {
  const existing = await db.select({ n: sql<number>`count(*)` }).from(users)
  if (Number(existing[0]?.n) > 0) {
    console.log('⚠️  Database đã có dữ liệu. Bỏ qua seed (chạy `pnpm db:reset` để làm sạch).')
    return
  }

  // ── Users ─────────────────────────────────────────────
  const adminHash = await hashPassword('admin123')
  const [admin] = await db
    .insert(users)
    .values({
      username: 'admin',
      passwordHash: adminHash,
      fullName: 'Quản trị viên',
      role: 'ADMIN',
    })
    .returning()

  const teacherRows = []
  for (const i of range(2)) {
    const hash = await hashPassword('teacher123')
    const [t] = await db
      .insert(users)
      .values({
        username: `teacher${i + 1}`,
        passwordHash: hash,
        fullName: `Giáo viên ${i + 1}`,
        role: 'TEACHER',
      })
      .returning()
    teacherRows.push(t)
  }

  const disciplineRows = []
  for (const i of range(3)) {
    const hash = await hashPassword('discipline123')
    const [d] = await db
      .insert(users)
      .values({
        username: `discipline${i + 1}`,
        passwordHash: hash,
        fullName: `Ban nề nếp ${i + 1}`,
        role: 'DISCIPLINE',
      })
      .returning()
    disciplineRows.push(d)
  }

  // ── Classes ───────────────────────────────────────────
  const classRows = []
  for (const i of range(5)) {
    const [c] = await db
      .insert(classes)
      .values({
        name: `10A${i + 1}`,
        grade: 10,
        academicYear: '2026-2027',
        teacherId: i < 2 ? teacherRows[i].id : null,
      })
      .returning()
    classRows.push(c)
  }

  // ── Students (100) ────────────────────────────────────
  const studentRows = []
  for (const i of range(100)) {
    const cls = classRows[i % 5]
    const [s] = await db
      .insert(students)
      .values({
        studentCode: genStudentCode(i + 1),
        fullName: fullName(),
        classId: cls.id,
        qrCode: genQrCode(),
      })
      .returning()
    studentRows.push(s)
  }

  // ── School settings ───────────────────────────────────
  await db
    .insert(schoolSettings)
    .values({ key: 'school_name', value: 'TRƯỜNG THPT CHU VĂN AN – GIA NGHĨA' })

  // ── Violation types (Tiêu chí thi đua 2026 – 2027) ────
  const typeDefs: [string, string, number][] = [
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
  const typeRows = []
  for (const [name, desc, points] of typeDefs) {
    const [t] = await db
      .insert(violationTypes)
      .values({ name, description: desc, penaltyPoints: points, isActive: true })
      .returning()
    typeRows.push(t)
  }

  // ── Violations (120) ──────────────────────────────────
  const recorders = [...disciplineRows, ...teacherRows, admin]
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000

  for (let i = 0; i < 120; i++) {
    const student = pick(studentRows)
    const recorder = pick(recorders)
    const itemCount = 1 + rand(2) // 1-2 lỗi
    const chosen = new Set<number>()
    while (chosen.size < itemCount) chosen.add(rand(typeRows.length))

    const items = [...chosen].map((idx) => typeRows[idx])
    const total = items.reduce((s, t) => s + t.penaltyPoints, 0)
    const createdAt = now - rand(35) * DAY - rand(24) * 3600 * 1000

    const violationId = crypto.randomUUID()
    await db.batch([
      db.insert(violations).values({
        id: violationId,
        studentId: student.id,
        recordedBy: recorder.id,
        note: null,
        totalPoints: -total,
        idempotencyKey: crypto.randomUUID(),
        createdAt,
      }),
      ...items.map((t) =>
        db.insert(violationItems).values({
          id: crypto.randomUUID(),
          violationId,
          violationTypeId: t.id,
          penaltyPoints: t.penaltyPoints,
        }),
      ),
    ])
  }

  console.log('✅ Seed xong:')
  console.log(`   - 1 ADMIN (admin / admin123)`)
  console.log(`   - 2 TEACHER (teacher1..2 / teacher123)`)
  console.log(`   - 3 DISCIPLINE (discipline1..3 / discipline123)`)
  console.log(`   - ${classRows.length} lớp`)
  console.log(`   - ${studentRows.length} học sinh`)
  console.log(`   - ${typeRows.length} loại vi phạm`)
  console.log(`   - 120 bản ghi vi phạm`)
}
