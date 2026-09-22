import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const now = () => Date.now()
const uuid = () => crypto.randomUUID()

export const ROLES = ['ADMIN', 'TEACHER', 'DISCIPLINE'] as const
export type Role = (typeof ROLES)[number]
export const STATUSES = ['active', 'inactive'] as const
export type Status = (typeof STATUSES)[number]

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(uuid),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull(),
    role: text('role', { enum: ROLES }).notNull(),
    status: text('status', { enum: STATUSES }).notNull().default('active'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [uniqueIndex('users_username_idx').on(t.username)],
)

export const classes = sqliteTable('classes', {
  id: text('id').primaryKey().$defaultFn(uuid),
  name: text('name').notNull(),
  grade: integer('grade').notNull(),
  academicYear: text('academic_year').notNull(),
  teacherId: text('teacher_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status', { enum: STATUSES }).notNull().default('active'),
  createdAt: integer('created_at').notNull().$defaultFn(now),
  updatedAt: integer('updated_at').notNull().$defaultFn(now),
})

export const students = sqliteTable(
  'students',
  {
    id: text('id').primaryKey().$defaultFn(uuid),
    studentCode: text('student_code').notNull(),
    fullName: text('full_name').notNull(),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'restrict' }),
    qrCode: text('qr_code').notNull(),
    photo: text('photo'),
    status: text('status', { enum: STATUSES }).notNull().default('active'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [
    uniqueIndex('students_student_code_idx').on(t.studentCode),
    uniqueIndex('students_qr_code_idx').on(t.qrCode),
  ],
)

export const violationTypes = sqliteTable('violation_types', {
  id: text('id').primaryKey().$defaultFn(uuid),
  name: text('name').notNull(),
  description: text('description'),
  penaltyPoints: integer('penalty_points').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull().$defaultFn(now),
  updatedAt: integer('updated_at').notNull().$defaultFn(now),
})

export const violations = sqliteTable('violations', {
  id: text('id').primaryKey().$defaultFn(uuid),
  studentId: text('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'restrict' }),
  recordedBy: text('recorded_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  note: text('note'),
  totalPoints: integer('total_points').notNull(),
  idempotencyKey: text('idempotency_key'),
  createdAt: integer('created_at').notNull().$defaultFn(now),
})

export const violationItems = sqliteTable('violation_items', {
  id: text('id').primaryKey().$defaultFn(uuid),
  violationId: text('violation_id')
    .notNull()
    .references(() => violations.id, { onDelete: 'cascade' }),
  violationTypeId: text('violation_type_id')
    .notNull()
    .references(() => violationTypes.id, { onDelete: 'restrict' }),
  penaltyPoints: integer('penalty_points').notNull(),
})

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(uuid),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  metadata: text('metadata'),
  createdAt: integer('created_at').notNull().$defaultFn(now),
})

export const schoolSettings = sqliteTable('school_settings', {
  id: text('id').primaryKey().$defaultFn(uuid),
  key: text('key').notNull().unique(),
  value: text('value'),
  updatedAt: integer('updated_at').notNull().$defaultFn(now),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Class = typeof classes.$inferSelect
export type Student = typeof students.$inferSelect
export type NewStudent = typeof students.$inferInsert
export type ViolationType = typeof violationTypes.$inferSelect
export type Violation = typeof violations.$inferSelect
export type ViolationItem = typeof violationItems.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect

export { sql }
