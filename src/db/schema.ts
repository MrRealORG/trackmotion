import { pgTable, uuid, text, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";

/** Stickers, previews and backgrounds managed from the admin console. */
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default("sticker"), // sticker | preview | background
  dataUrl: text("data_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Saved edits from the studio library. */
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  videoName: text("video_name").notNull(),
  duration: real("duration"),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Every render that leaves the studio. */
export const exportsLog = pgTable("exports_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  resolution: text("resolution").notNull(),
  width: integer("width"),
  height: integer("height"),
  frames: integer("frames"),
  duration: real("duration"),
  bytes: integer("bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Notes sent from the about page. */
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new | read | archived
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
