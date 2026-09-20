import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const warnings = sqliteTable("warnings", {
  id: text("id").primaryKey(),
  clientReportId: text("client_report_id").notNull().unique(),
  trekId: text("trek_id").notNull(),
  status: text("status").notNull(),
  severity: text("severity").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  payload: text("payload").notNull(),
}, (table) => [
  index("idx_warnings_trek_status").on(table.trekId, table.status),
  index("idx_warnings_updated_at").on(table.updatedAt),
]);
