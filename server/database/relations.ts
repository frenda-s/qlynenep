import { relations } from 'drizzle-orm'
import {
  auditLogs,
  classes,
  students,
  users,
  violationItems,
  violationTypes,
  violations,
} from './schema'

export const usersRelations = relations(users, ({ many }) => ({
  taughtClasses: many(classes),
}))

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, { fields: [classes.teacherId], references: [users.id] }),
  students: many(students),
}))

export const studentsRelations = relations(students, ({ one, many }) => ({
  class: one(classes, { fields: [students.classId], references: [classes.id] }),
  violations: many(violations),
}))

export const violationTypesRelations = relations(violationTypes, ({ many }) => ({
  items: many(violationItems),
}))

export const violationsRelations = relations(violations, ({ one, many }) => ({
  student: one(students, { fields: [violations.studentId], references: [students.id] }),
  recordedByUser: one(users, { fields: [violations.recordedBy], references: [users.id] }),
  items: many(violationItems),
}))

export const violationItemsRelations = relations(violationItems, ({ one }) => ({
  violation: one(violations, {
    fields: [violationItems.violationId],
    references: [violations.id],
  }),
  violationType: one(violationTypes, {
    fields: [violationItems.violationTypeId],
    references: [violationTypes.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}))
