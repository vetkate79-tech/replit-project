import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wordsTable = pgTable("words", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  englishTerm: text("english_term").notNull(),
  proposedJapanese: text("proposed_japanese").notNull().default(""),
  definition: text("definition").notNull(),
  literalTranslation: text("literal_translation").notNull().default(""),
  category: text("category").notNull(),
  categoryLarge: text("category_large").notNull().default("その他"),
  categoryMiddle: text("category_middle").notNull().default("一般"),
  categorySmall: text("category_small").notNull().default("用語"),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  semanticKeywords: text("semantic_keywords")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  status: text("status").notNull().default("candidate"),
  originPeriod: text("origin_period").notNull().default(""),
  originContext: text("origin_context").notNull().default(""),
  overseasUsage: text("overseas_usage").notNull().default(""),
  existingJapaneseTranslation: boolean("existing_japanese_translation")
    .notNull()
    .default(false),
  proposalReason: text("proposal_reason").notNull().default(""),
  relatedTerms: text("related_terms")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  similarTerms: jsonb("similar_terms")
    .$type<Array<{ slug: string; label: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  antonymTerms: jsonb("antonym_terms")
    .$type<Array<{ slug: string; label: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  sources: text("sources").array().notNull().default(sql`'{}'::text[]`),
  firstDefinedAt: date("first_defined_at", { mode: "string" })
    .notNull()
    .default(sql`CURRENT_DATE`),
  updatedAt: date("updated_at", { mode: "string" })
    .notNull()
    .default(sql`CURRENT_DATE`),
  viewCount: integer("view_count").notNull().default(0),
  verifiedBotReferenceCount: integer("verified_bot_reference_count")
    .notNull()
    .default(0),
  independentSourceCount: integer("independent_source_count")
    .notNull()
    .default(0),
  detectedAt: date("detected_at", { mode: "string" })
    .notNull()
    .default(sql`CURRENT_DATE`),
  publishedAt: date("published_at", { mode: "string" }),
  entryType: text("entry_type").notNull().default("neologism"),
  labelType: text("label_type").notNull().default("descriptive"),
  shortAnswer: text("short_answer").notNull().default(""),
  aliases: text("aliases").array().notNull().default(sql`'{}'::text[]`),
  reading: text("reading").notNull().default(""),
  pronunciation: text("pronunciation").notNull().default(""),
  originalLanguage: text("original_language").notNull().default("英語"),
  officialLabel: text("official_label").notNull().default(""),
  commonLabel: text("common_label").notNull().default(""),
  mediaLabels: text("media_labels")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  usageStatus: text("usage_status").notNull().default(""),
  confidence: text("confidence").notNull().default("medium"),
  updateHistory: jsonb("update_history")
    .$type<Array<{ date: string; note: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  sourcePublishedAt: text("source_published_at").notNull().default(""),
  sourceAttribution: text("source_attribution")
    .notNull()
    .default("外部資料と一般用法を当サイトが整理"),
  monitoringStatus: text("monitoring_status")
    .notNull()
    .default("watching"),
  nameChangeCandidate: text("name_change_candidate").notNull().default(""),
  definitionConfidence: text("definition_confidence")
    .notNull()
    .default("medium"),
  usageEvidence: jsonb("usage_evidence")
    .$type<
      Array<{
        excerpt: string;
        context: string;
        sourceType: string;
        sourceUrl: string;
        checkedAt: string;
      }>
    >()
    .notNull()
    .default(sql`'[]'::jsonb`),
  nameChangeHistory: jsonb("name_change_history")
    .$type<
      Array<{
        date: string;
        previousName: string;
        newName: string;
        reason: string;
        evidenceCount: number;
        sources: string[];
      }>
    >()
    .notNull()
    .default(sql`'[]'::jsonb`),
  lastMonitoredAt: date("last_monitored_at", { mode: "string" }),
});

export const insertWordSchema = createInsertSchema(wordsTable).omit({
  id: true,
});
export type InsertWord = z.infer<typeof insertWordSchema>;
export type WordRecord = typeof wordsTable.$inferSelect;

export const wordDailyMetricsTable = pgTable(
  "word_daily_metrics",
  {
    id: serial("id").primaryKey(),
    wordId: integer("word_id")
      .notNull()
      .references(() => wordsTable.id, { onDelete: "cascade" }),
    metricDate: date("metric_date", { mode: "string" })
      .notNull()
      .default(sql`CURRENT_DATE`),
    humanViews: integer("human_views").notNull().default(0),
    verifiedBotReferences: integer("verified_bot_references")
      .notNull()
      .default(0),
  },
  (table) => [
    uniqueIndex("word_daily_metrics_word_date_idx").on(
      table.wordId,
      table.metricDate,
    ),
  ],
);