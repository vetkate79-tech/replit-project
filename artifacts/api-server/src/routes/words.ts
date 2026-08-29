import { Router, type IRouter, type Request } from "express";
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  db,
  wordDailyMetricsTable,
  wordsTable,
  type WordRecord,
} from "@workspace/db";
import {
  CreateWordBody,
  CreateWordResponse,
  GetDashboardSummaryResponse,
  GetFeedResponse,
  GetSitemapResponse,
  GetWordParams,
  GetWordResponse,
  ListCategoriesResponse,
  ListWordsQueryParams,
  ListWordsResponse,
  UpdateWordBody,
  UpdateWordParams,
  UpdateWordResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const requestOrigin = (req: Request) => {
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return `${forwardedProtocol || req.protocol}://${req.get("host")}`;
};

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u30a1-\u30f6]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0x60),
    )
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const SEARCH_CUES: Array<{ pattern: RegExp; terms: string[] }> = [
  { pattern: /会議|ミーティング|打ち合わせ/, terms: ["会議疲れ", "meeting", "組織", "生産性"] },
  { pattern: /辞め|退職|離職|仕事.*やる気/, terms: ["quiet quitting", "静かな退職", "キャリア", "職場"] },
  { pattern: /ai|人工知能|生成|チャット|モデル/, terms: ["生成AI", "agentic", "AIエージェント", "LLM", "自動化"] },
  { pattern: /広告|集客|顧客|売上|マーケ/, terms: ["マーケティング", "需要創出", "顧客獲得", "ブランド"] },
  { pattern: /起業|スタートアップ|創業|資金調達/, terms: ["startup", "venture", "PMF", "事業成長"] },
  { pattern: /投資|株|市場|資産|評価額/, terms: ["投資", "バリュエーション", "資本", "市場"] },
  { pattern: /経営|組織|管理職|上司|部下/, terms: ["経営", "組織", "マネジメント", "リーダーシップ"] },
  { pattern: /転職|キャリア|働き方|就職/, terms: ["キャリア", "スキル", "採用", "職場"] },
  { pattern: /sns|ネット|炎上|バズ|投稿/, terms: ["SNS", "ネットスラング", "拡散", "エンゲージメント"] },
  { pattern: /自己啓発|成長|習慣|意識高/, terms: ["自己啓発", "生産性", "ウェルビーイング", "目標"] },
  { pattern: /dx|デジタル|変革|業務改善/, terms: ["DX", "デジタル変革", "自動化", "業務プロセス"] },
  { pattern: /コンサル|戦略|課題|フレームワーク/, terms: ["コンサルティング", "戦略", "課題解決", "仮説"] },
];

const expandSearchText = (query: string) => {
  const extras = SEARCH_CUES.filter(({ pattern }) => pattern.test(query)).flatMap(
    ({ terms }) => terms,
  );
  return [query, ...extras].join(" ");
};

const searchTokens = (value: string) => {
  const normalized = normalizeSearchText(value);
  const tokens = new Set(
    normalized
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2),
  );
  for (const segment of normalized.match(/[\u3040-\u30ff\u3400-\u9fffー]{3,}/g) ?? []) {
    for (let index = 0; index < segment.length - 1; index += 1) {
      tokens.add(segment.slice(index, index + 2));
    }
  }
  return [...tokens];
};

const editDistance = (left: string, right: string) => {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
    let previous = rows[0];
    rows[0] = rightIndex;
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = rows[leftIndex];
      rows[leftIndex] = Math.min(
        rows[leftIndex] + 1,
        rows[leftIndex - 1] + 1,
        previous + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return rows[left.length];
};

const scoreWord = (word: WordRecord, rawQuery: string) => {
  const query = normalizeSearchText(rawQuery);
  const expanded = expandSearchText(rawQuery);
  let score = 0;
  let matchReason = "意味・関連語から推定";
  const check = (
    values: string[],
    exactScore: number,
    containsScore: number,
    reason: string,
  ) => {
    for (const rawValue of values.filter(Boolean)) {
      const value = normalizeSearchText(rawValue);
      if (!value) continue;
      if (value === query) {
        if (exactScore > score) matchReason = reason;
        score = Math.max(score, exactScore);
      } else if (value.includes(query) || query.includes(value)) {
        if (containsScore > score) matchReason = reason;
        score = Math.max(score, containsScore);
      }
    }
  };

  check([word.proposedJapanese, word.englishTerm], 100, 86, "見出し語が一致");
  check(word.aliases, 98, 84, "別表記・別名が一致");
  check([word.reading, word.pronunciation], 94, 80, "読み・発音が一致");
  check(word.tags, 82, 70, "タグが一致");
  check(word.semanticKeywords, 84, 72, "意味キーワードが一致");
  check(word.relatedTerms, 78, 66, "関連語が一致");
  check(
    [word.categoryLarge, word.categoryMiddle, word.categorySmall],
    72,
    58,
    "カテゴリが一致",
  );
  check([word.shortAnswer, word.definition, word.usageStatus], 74, 60, "説明文の意味が一致");

  const searchableCorpus = normalizeSearchText(
    [
      word.proposedJapanese,
      word.englishTerm,
      word.definition,
      word.shortAnswer,
      word.usageStatus,
      word.categoryLarge,
      word.categoryMiddle,
      word.categorySmall,
      ...word.aliases,
      ...word.tags,
      ...word.semanticKeywords,
      ...word.relatedTerms,
    ].join(" "),
  );
  const overlaps = searchTokens(expanded).filter((token) =>
    searchableCorpus.includes(token),
  ).length;
  if (overlaps > 0) {
    score = Math.max(score, Math.min(76, 28 + overlaps * 6));
  }

  if (/^[a-z0-9 -]{4,}$/i.test(rawQuery.trim())) {
    const candidates = [word.englishTerm, ...word.aliases]
      .map(normalizeSearchText)
      .filter(
        (candidate) =>
          /^[a-z0-9 -]+$/.test(candidate) &&
          Math.min(candidate.length, query.length) /
            Math.max(candidate.length, query.length) >=
            0.6,
      );
    if (!candidates.length) {
      return {
        ...word,
        relevanceScore: Math.min(100, Math.round(score)),
        matchReason,
      };
    }
    const bestDistance = Math.min(
      ...candidates.map((candidate) => editDistance(query, candidate)),
    );
    const maxLength = Math.max(
      query.length,
      ...candidates.map((candidate) => candidate.length),
    );
    const similarity = maxLength ? 1 - bestDistance / maxLength : 0;
    if (similarity >= 0.6) {
      const fuzzyScore = Math.round(45 + similarity * 35);
      if (fuzzyScore > score) matchReason = "綴りの近さから推定";
      score = Math.max(score, fuzzyScore);
    }
  }

  return {
    ...word,
    relevanceScore: Math.min(100, Math.round(score)),
    matchReason,
  };
};

const publicEntryValidationError = (entry: {
  status?: string;
  proposedJapanese?: string;
  shortAnswer?: string;
  definition?: string;
  sources?: string[];
  reading?: string;
  originalLanguage?: string;
  categoryLarge?: string;
  categoryMiddle?: string;
  categorySmall?: string;
}) => {
  if (!["published", "observing"].includes(entry.status ?? "")) return null;
  const answer = entry.shortAnswer?.trim() ?? "";
  const sentenceCount = answer
    .split(/[。！？.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length;
  if (!entry.proposedJapanese?.trim()) return "公開には推奨表記または提案和名が必要です";
  if (!entry.definition?.trim()) return "公開には定義が必要です";
  if (!entry.reading?.trim()) return "公開には読みが必要です";
  if (!entry.originalLanguage?.trim()) return "公開には原語の言語が必要です";
  if (
    !entry.categoryLarge?.trim() ||
    !entry.categoryMiddle?.trim() ||
    !entry.categorySmall?.trim()
  ) {
    return "公開には大分類・中分類・小分類が必要です";
  }
  if (!answer) return "公開には最短回答が必要です";
  if (answer.length > 360 || sentenceCount > 3) {
    return "最短回答は360文字以内・1〜3文で入力してください";
  }
  if (!entry.sources?.length) return "公開には1件以上の出典が必要です";
  return null;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `word-${Date.now()}`;

const wordLocator = (value: string): SQL => {
  const numericId = Number(value);
  return Number.isInteger(numericId)
    ? or(eq(wordsTable.id, numericId), eq(wordsTable.slug, value))!
    : eq(wordsTable.slug, value);
};

const knownReferenceCrawler =
  /(Googlebot|Google-Extended|OAI-SearchBot|GPTBot|ChatGPT-User|ClaudeBot|Claude-Web|anthropic-ai|PerplexityBot|Bingbot|DuckDuckBot|Applebot|YandexBot|Bytespider|Meta-ExternalAgent)/i;
const genericAutomatedAgent =
  /(bot|crawler|spider|slurp|scraper|preview|fetch|headless|monitor)/i;

const requestAudience = (req: Request): "human" | "verifiedCrawler" | "unclassifiedBot" => {
  const userAgent = req.get("user-agent")?.trim() ?? "";
  if (!userAgent) return "unclassifiedBot";
  if (knownReferenceCrawler.test(userAgent)) return "verifiedCrawler";
  if (genericAutomatedAgent.test(userAgent)) return "unclassifiedBot";
  return "human";
};

const trustSignals = (word: WordRecord) => {
  const externalSourceCount = new Set(
    word.sources.map((source) => source.trim()).filter(Boolean),
  ).size;
  const independentSourceCount = Math.min(
    externalSourceCount,
    Math.max(0, word.independentSourceCount),
  );
  const daysSinceUpdate = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(`${word.updatedAt}T00:00:00Z`).getTime()) /
        86_400_000,
    ),
  );
  const freshnessPoints =
    daysSinceUpdate <= 30 ? 15 : daysSinceUpdate <= 90 ? 11 : daysSinceUpdate <= 365 ? 6 : 2;
  const score = Math.min(
    100,
    Math.round(
      Math.min(25, externalSourceCount * 8) +
        Math.min(15, independentSourceCount * 5) +
        (word.officialLabel.trim() ? 15 : 0) +
        Math.min(10, word.mediaLabels.length * 3) +
        (word.commonLabel.trim() ? 5 : 0) +
        (word.reading.trim() ? 5 : 0) +
        (word.definition.trim() && word.shortAnswer.trim() ? 10 : 0) +
        freshnessPoints,
    ),
  );
  const trustLabel =
    score >= 80 ? "根拠が十分" : score >= 60 ? "根拠が充実" : score >= 40 ? "根拠を確認中" : "観測初期";

  return { externalSourceCount, independentSourceCount, trustScore: score, trustLabel };
};

const presentWord = <T extends WordRecord>(word: T) => ({
  ...word,
  ...trustSignals(word),
  totalReferenceCount: word.viewCount + word.verifiedBotReferenceCount,
});

router.get("/words", async (req, res): Promise<void> => {
  const parsed = ListWordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filters: SQL[] = [];
  if (parsed.data.category) {
    filters.push(eq(wordsTable.category, parsed.data.category));
  }
  if (parsed.data.categoryLarge) {
    filters.push(eq(wordsTable.categoryLarge, parsed.data.categoryLarge));
  }
  if (parsed.data.categoryMiddle) {
    filters.push(eq(wordsTable.categoryMiddle, parsed.data.categoryMiddle));
  }
  if (parsed.data.categorySmall) {
    filters.push(eq(wordsTable.categorySmall, parsed.data.categorySmall));
  }
  if (parsed.data.tag) {
    filters.push(
      sql`exists (select 1 from unnest(${wordsTable.tags}) tag where tag ilike ${parsed.data.tag})`,
    );
  }
  if (parsed.data.status) {
    filters.push(eq(wordsTable.status, parsed.data.status));
  }
  if (parsed.data.entryType) {
    filters.push(eq(wordsTable.entryType, parsed.data.entryType));
  }
  if (parsed.data.publicOnly) {
    filters.push(sql`${wordsTable.status} in ('published', 'observing')`);
  }

  let words = await db
    .select()
    .from(wordsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(wordsTable.updatedAt));

  if (!parsed.data.search && parsed.data.sort === "popular") {
    words = words.sort(
      (left, right) =>
        right.viewCount +
        right.verifiedBotReferenceCount -
        (left.viewCount + left.verifiedBotReferenceCount),
    );
  }
  if (!parsed.data.search && parsed.data.sort === "trending") {
    const since = new Date(Date.now() - 6 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const recent = await db
      .select({
        wordId: wordDailyMetricsTable.wordId,
        references: sql<number>`sum(${wordDailyMetricsTable.humanViews} + ${wordDailyMetricsTable.verifiedBotReferences})::int`,
      })
      .from(wordDailyMetricsTable)
      .where(gte(wordDailyMetricsTable.metricDate, since))
      .groupBy(wordDailyMetricsTable.wordId);
    const recentByWord = new Map(recent.map((entry) => [entry.wordId, entry.references]));
    words = words.sort(
      (left, right) =>
        (recentByWord.get(right.id) ?? 0) - (recentByWord.get(left.id) ?? 0) ||
        right.viewCount - left.viewCount,
    );
  }

  let response = words;
  if (parsed.data.search) {
    const rankedWords = words
      .map((word) => scoreWord(word, parsed.data.search!))
      .sort(
        (left, right) =>
          right.relevanceScore - left.relevanceScore ||
          right.viewCount - left.viewCount,
      );
    const positiveMatches = rankedWords.filter(
      (word) => word.relevanceScore > 0,
    );
    if (
      parsed.data.searchMode === "similar" ||
      parsed.data.searchMode === "antonym"
    ) {
      const relationSeed = positiveMatches[0];
      const relatedSlugs = new Set(
        relationSeed ? (
          (parsed.data.searchMode === "similar"
            ? relationSeed.similarTerms
            : relationSeed.antonymTerms
          ).map((related) => related.slug)
        ) : [],
      );
      const relatedWords = words
        .filter((word) => relatedSlugs.has(word.slug))
        .map((word) => ({
          ...word,
          relevanceScore: 92,
          matchReason:
            parsed.data.searchMode === "similar"
              ? "入力語の類似語として登録"
              : "入力語の対義・対比語として登録",
        }));
      response = relatedWords.length
        ? relatedWords
        : positiveMatches.length
          ? positiveMatches
          : rankedWords.slice(0, 8).map((word, index) => ({
              ...word,
              relevanceScore: Math.max(8, 20 - index * 2),
              matchReason: "近い分野・注目語から提案",
            }));
    } else {
      response = (
        positiveMatches.length
          ? positiveMatches
          : rankedWords.slice(0, 8).map((word, index) => ({
              ...word,
              relevanceScore: Math.max(8, 20 - index * 2),
              matchReason: "近い分野・注目語から提案",
            }))
      ).slice(0, 20);
    }
  }

  res.json(ListWordsResponse.parse(response.map(presentWord)));
});

router.post("/words", async (req, res): Promise<void> => {
  const parsed = CreateWordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const validationError = publicEntryValidationError(parsed.data);
  if (validationError) {
    res.status(422).json({ error: validationError });
    return;
  }

  const baseSlug = slugify(parsed.data.englishTerm);
  const matches = await db
    .select({ count: count() })
    .from(wordsTable)
    .where(ilike(wordsTable.slug, `${baseSlug}%`));
  const slug = matches[0]?.count ? `${baseSlug}-${matches[0].count + 1}` : baseSlug;
  const today = new Date().toISOString().slice(0, 10);

  const [word] = await db
    .insert(wordsTable)
    .values({
      slug,
      englishTerm: parsed.data.englishTerm,
      proposedJapanese: parsed.data.proposedJapanese,
      definition: parsed.data.definition,
      literalTranslation: parsed.data.literalTranslation ?? "",
      category: parsed.data.category,
      categoryLarge: parsed.data.categoryLarge ?? parsed.data.category,
      categoryMiddle: parsed.data.categoryMiddle ?? "一般",
      categorySmall: parsed.data.categorySmall ?? "用語",
      tags: parsed.data.tags ?? [],
      semanticKeywords: parsed.data.semanticKeywords ?? [],
      status: parsed.data.status,
      entryType: parsed.data.entryType,
      labelType: parsed.data.labelType ?? "descriptive",
      shortAnswer: parsed.data.shortAnswer ?? parsed.data.definition,
      aliases: parsed.data.aliases ?? [],
      reading: parsed.data.reading ?? "",
      pronunciation: parsed.data.pronunciation ?? "",
      originalLanguage: parsed.data.originalLanguage ?? "英語",
      officialLabel: parsed.data.officialLabel ?? "",
      commonLabel: parsed.data.commonLabel ?? "",
      mediaLabels: parsed.data.mediaLabels ?? [],
      usageStatus: parsed.data.usageStatus ?? "",
      confidence: parsed.data.confidence ?? "medium",
      updateHistory: [
        { date: today, note: "候補を登録" },
      ],
      originPeriod: parsed.data.originPeriod ?? "",
      originContext: parsed.data.originContext ?? "",
      overseasUsage: parsed.data.overseasUsage ?? "",
      existingJapaneseTranslation:
        parsed.data.existingJapaneseTranslation ?? false,
      proposalReason: parsed.data.proposalReason ?? "",
      relatedTerms: parsed.data.relatedTerms ?? [],
      similarTerms: parsed.data.similarTerms ?? [],
      antonymTerms: parsed.data.antonymTerms ?? [],
      sources: parsed.data.sources ?? [],
      independentSourceCount: parsed.data.independentSourceCount ?? 0,
      sourcePublishedAt: parsed.data.sourcePublishedAt ?? "",
      sourceAttribution:
        parsed.data.sourceAttribution ?? "外部資料と一般用法を当サイトが整理",
      monitoringStatus: parsed.data.monitoringStatus ?? "watching",
      nameChangeCandidate: parsed.data.nameChangeCandidate ?? "",
      definitionConfidence: parsed.data.definitionConfidence ?? "medium",
      usageEvidence: (parsed.data.usageEvidence ?? []).map((evidence) => ({
        ...evidence,
        checkedAt:
          evidence.checkedAt instanceof Date
            ? evidence.checkedAt.toISOString().slice(0, 10)
            : evidence.checkedAt,
      })),
      nameChangeHistory: [],
      lastMonitoredAt: null,
      firstDefinedAt: today,
      detectedAt: today,
      publishedAt: ["published", "observing"].includes(parsed.data.status)
        ? today
        : null,
      updatedAt: today,
    })
    .returning();

  res.status(201).json(CreateWordResponse.parse(presentWord(word)));
});

router.get("/words/:id", async (req, res): Promise<void> => {
  const params = GetWordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existingWord] = await db
    .select()
    .from(wordsTable)
    .where(wordLocator(params.data.id))
    .limit(1);

  if (!existingWord) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  let word = existingWord;
  const isPublicSlugRequest =
    !Number.isInteger(Number(params.data.id)) &&
    ["published", "observing"].includes(existingWord.status);
  if (isPublicSlugRequest) {
    const audience = requestAudience(req);
    if (audience === "human" || audience === "verifiedCrawler") {
      const humanIncrement = audience === "human" ? 1 : 0;
      const crawlerIncrement = audience === "verifiedCrawler" ? 1 : 0;
      [word] = await db
        .update(wordsTable)
        .set({
          viewCount: sql`${wordsTable.viewCount} + ${humanIncrement}`,
          verifiedBotReferenceCount: sql`${wordsTable.verifiedBotReferenceCount} + ${crawlerIncrement}`,
        })
        .where(eq(wordsTable.id, existingWord.id))
        .returning();
      const today = new Date().toISOString().slice(0, 10);
      await db
        .insert(wordDailyMetricsTable)
        .values({
          wordId: existingWord.id,
          metricDate: today,
          humanViews: humanIncrement,
          verifiedBotReferences: crawlerIncrement,
        })
        .onConflictDoUpdate({
          target: [
            wordDailyMetricsTable.wordId,
            wordDailyMetricsTable.metricDate,
          ],
          set: {
            humanViews: sql`${wordDailyMetricsTable.humanViews} + ${humanIncrement}`,
            verifiedBotReferences: sql`${wordDailyMetricsTable.verifiedBotReferences} + ${crawlerIncrement}`,
          },
        });
    }
  }

  res.json(GetWordResponse.parse(presentWord(word)));
});

router.patch("/words/:id", async (req, res): Promise<void> => {
  const params = UpdateWordParams.safeParse(req.params);
  const body = UpdateWordBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res
      .status(400)
      .json({ error: params.error?.message ?? body.error?.message });
    return;
  }

  const [current] = await db
    .select()
    .from(wordsTable)
    .where(wordLocator(params.data.id))
    .limit(1);

  if (!current) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  const { changeNote, ...rawUpdates } = body.data;
  const updates = {
    ...rawUpdates,
    usageEvidence: rawUpdates.usageEvidence?.map((evidence) => ({
      ...evidence,
      checkedAt:
        evidence.checkedAt instanceof Date
          ? evidence.checkedAt.toISOString().slice(0, 10)
          : evidence.checkedAt,
    })),
  };
  const proposedNameChanged =
    typeof updates.proposedJapanese === "string" &&
    updates.proposedJapanese.trim() !== current.proposedJapanese.trim();
  const nextMonitoringStatus =
    updates.monitoringStatus ?? current.monitoringStatus;
  const nextUsageEvidence = updates.usageEvidence ?? current.usageEvidence;
  const distinctEvidenceSources = new Set(
    nextUsageEvidence.map((evidence) => evidence.sourceUrl.trim()).filter(Boolean),
  );
  if (
    proposedNameChanged &&
    (nextMonitoringStatus !== "change_approved" ||
      distinctEvidenceSources.size < 2 ||
      updates.proposedJapanese?.trim() !==
        (updates.nameChangeCandidate ?? current.nameChangeCandidate).trim())
  ) {
    res.status(422).json({
      error:
        "推奨名称の変更には、変更候補との一致、変更承認状態、2件以上の独立した公開使用例が必要です",
    });
    return;
  }
  const merged = { ...current, ...updates };
  const validationError = publicEntryValidationError(merged);
  if (validationError) {
    res.status(422).json({ error: validationError });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const [word] = await db
    .update(wordsTable)
    .set({
      ...updates,
      updatedAt: today,
      publishedAt:
        updates.status &&
        ["published", "observing"].includes(updates.status) &&
        !current.publishedAt
          ? today
          : current.publishedAt,
      lastMonitoredAt:
        updates.monitoringStatus || updates.usageEvidence
          ? today
          : current.lastMonitoredAt,
      nameChangeHistory: proposedNameChanged
        ? [
            ...current.nameChangeHistory,
            {
              date: today,
              previousName: current.proposedJapanese,
              newName: updates.proposedJapanese!.trim(),
              reason:
                changeNote?.trim() ||
                "複数の公開使用例から主流表記の変化を確認",
              evidenceCount: distinctEvidenceSources.size,
              sources: [...distinctEvidenceSources],
            },
          ]
        : current.nameChangeHistory,
      aliases: proposedNameChanged
        ? Array.from(
            new Set([
              ...(updates.aliases ?? current.aliases),
              current.proposedJapanese,
            ]),
          )
        : updates.aliases,
      updateHistory: [
        ...current.updateHistory,
        {
          date: today,
          note: changeNote?.trim() || "根拠・表記情報を更新",
        },
      ],
    })
    .where(wordLocator(params.data.id))
    .returning();

  if (!word) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  res.json(UpdateWordResponse.parse(presentWord(word)));
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [summary] = await db
    .select({
      total: sql<number>`count(*)::int`,
      published: sql<number>`count(*) filter (where ${wordsTable.status} = 'published')::int`,
      candidate: sql<number>`count(*) filter (where ${wordsTable.status} = 'candidate')::int`,
      researching: sql<number>`count(*) filter (where ${wordsTable.status} = 'researching')::int`,
      naming: sql<number>`count(*) filter (where ${wordsTable.status} = 'naming')::int`,
      observing: sql<number>`count(*) filter (where ${wordsTable.status} = 'observing')::int`,
      totalViews: sql<number>`coalesce(sum(${wordsTable.viewCount}), 0)::int`,
      totalVerifiedBotReferences: sql<number>`coalesce(sum(${wordsTable.verifiedBotReferenceCount}), 0)::int`,
      totalReferences: sql<number>`coalesce(sum(${wordsTable.viewCount} + ${wordsTable.verifiedBotReferenceCount}), 0)::int`,
      candidatesToday: sql<number>`count(*) filter (where ${wordsTable.detectedAt} = current_date)::int`,
      publishedToday: sql<number>`count(*) filter (where ${wordsTable.publishedAt} = current_date)::int`,
      externalCitationCount: sql<number>`coalesce(sum(cardinality(${wordsTable.sources})), 0)::int`,
      variationResolved: sql<number>`count(*) filter (where ${wordsTable.entryType} = 'variation' and ${wordsTable.status} in ('published', 'observing'))::int`,
      untranslatedProposed: sql<number>`count(*) filter (where ${wordsTable.entryType} = 'untranslated' and ${wordsTable.status} in ('published', 'observing'))::int`,
      pendingUpdates: sql<number>`count(*) filter (where ${wordsTable.status} in ('candidate', 'researching', 'naming'))::int`,
    })
    .from(wordsTable);

  res.json(
    GetDashboardSummaryResponse.parse({
      ...summary,
      externalMentions: summary.externalCitationCount,
      aiCitations: summary.totalVerifiedBotReferences,
      targetWordCount: 10_000,
      scheduledScansPerDay: 12,
      dailyCandidateTarget: 20,
      dailyPublishMin: 5,
      dailyPublishMax: 20,
    }),
  );
});

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db
    .select({
      name: sql<string>`${wordsTable.categoryLarge} || ' / ' || ${wordsTable.categoryMiddle} || ' / ' || ${wordsTable.categorySmall}`,
      large: wordsTable.categoryLarge,
      middle: wordsTable.categoryMiddle,
      small: wordsTable.categorySmall,
      count: count(),
    })
    .from(wordsTable)
    .where(sql`${wordsTable.status} in ('published', 'observing')`)
    .groupBy(
      wordsTable.categoryLarge,
      wordsTable.categoryMiddle,
      wordsTable.categorySmall,
    )
    .orderBy(desc(count()));

  res.json(ListCategoriesResponse.parse(categories));
});

router.get("/sitemap.xml", async (req, res): Promise<void> => {
  const words = await db
    .select({ slug: wordsTable.slug, updatedAt: wordsTable.updatedAt })
    .from(wordsTable)
    .where(sql`${wordsTable.status} in ('published', 'observing')`)
    .orderBy(desc(wordsTable.updatedAt));
  const categories = await db
    .selectDistinct({ name: wordsTable.categoryLarge })
    .from(wordsTable)
    .where(sql`${wordsTable.status} in ('published', 'observing')`);
  const origin = requestOrigin(req);
  const staticPaths = [
    "",
    "/about",
    "/policies/editorial",
    "/policies/sources",
    "/policies/corrections",
    "/policies/naming",
  ];
  const urls = [
    ...staticPaths.map(
      (path) =>
        `<url><loc>${escapeXml(`${origin}${path || "/"}`)}</loc><changefreq>${path ? "monthly" : "daily"}</changefreq></url>`,
    ),
    ...words.map(
      (word) =>
        `<url><loc>${escapeXml(`${origin}/words/${word.slug}`)}</loc><lastmod>${word.updatedAt}</lastmod><changefreq>weekly</changefreq></url>`,
    ),
    ...categories.map(
      (category) =>
        `<url><loc>${escapeXml(`${origin}/categories/${encodeURIComponent(category.name)}`)}</loc><changefreq>weekly</changefreq></url>`,
    ),
  ].join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  res.type("application/xml").send(GetSitemapResponse.parse(xml));
});

router.get("/feed.xml", async (req, res): Promise<void> => {
  const words = await db
    .select()
    .from(wordsTable)
    .where(sql`${wordsTable.status} in ('published', 'observing')`)
    .orderBy(desc(wordsTable.updatedAt))
    .limit(20);
  const origin = requestOrigin(req);
  const items = words
    .map(
      (word) =>
        `<item><title>${escapeXml(word.proposedJapanese || word.englishTerm)}</title><link>${escapeXml(`${origin}/words/${word.slug}`)}</link><guid>${escapeXml(`${origin}/words/${word.slug}`)}</guid><description>${escapeXml(word.shortAnswer || word.definition)}</description><pubDate>${new Date(word.updatedAt).toUTCString()}</pubDate></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>言の葉・整理室</title><link>${escapeXml(origin)}</link><description>まだ日本語として答えが定まっていない言葉を整理する言語サイト</description><language>ja</language>${items}</channel></rss>`;

  res.type("application/rss+xml").send(GetFeedResponse.parse(xml));
});

export default router;