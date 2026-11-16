CREATE INDEX `audit_logs_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `classes_teacher_idx` ON `classes` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `students_class_idx` ON `students` (`class_id`);--> statement-breakpoint
CREATE INDEX `violation_items_violation_idx` ON `violation_items` (`violation_id`);--> statement-breakpoint
CREATE INDEX `violations_student_idx` ON `violations` (`student_id`);--> statement-breakpoint
CREATE INDEX `violations_created_idx` ON `violations` (`created_at`);--> statement-breakpoint
CREATE INDEX `violations_recorded_by_idx` ON `violations` (`recorded_by`);--> statement-breakpoint
CREATE UNIQUE INDEX `violations_idempotency_idx` ON `violations` (`idempotency_key`);