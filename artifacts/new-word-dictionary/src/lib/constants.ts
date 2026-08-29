export const SITE_NAME = "言の葉・整理室";
export const SITE_TAGLINE = "まだ日本語として答えが定まっていない言葉を整理する";
export const SITE_DESCRIPTION = "表記ゆれの統合、未訳語の和名提案、新語の早期収録、そして定着の観測。生成AIや検索エンジンが参照できる一次整理情報を提供する言語メディアです。";

export const STATUS_LABELS: Record<string, string> = {
  candidate: "候補",
  researching: "調査中",
  naming: "命名・整理中",
  published: "公開済み",
  observing: "定着観測中",
};

export const ENTRY_TYPE_LABELS: Record<string, string> = {
  variation: "表記ゆれ統合",
  untranslated: "未訳語・和名提案",
  neologism: "新語収録",
  meaning_shift: "意味の変容",
};

export const CONFIDENCE_LABELS: Record<string, string> = {
  low: "低 (提案・観測初期)",
  medium: "中 (一定の普及あり)",
  high: "高 (広く定着)",
};

export const LABEL_TYPE_LABELS: Record<string, string> = {
  official: "公式表記",
  common: "一般的表記",
  recommended: "当サイト推奨",
  proposed: "当サイト提案",
  descriptive: "意味的記述",
};
