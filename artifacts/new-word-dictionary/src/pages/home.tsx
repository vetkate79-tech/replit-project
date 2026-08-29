import { useListWords, useListCategories, useGetSearchInference, getGetSearchInferenceQueryKey, ListWordsParams, WordEntryType, SearchConfidenceBand } from "@workspace/api-client-react";
import { Link, useRoute } from "wouter";
import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, AlertCircle, ChevronRight, Hash, X, Filter, Brain, FolderTree, Waypoints, Contrast, Languages, Eye, Bot, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE_NAME, SITE_DESCRIPTION, ENTRY_TYPE_LABELS, LABEL_TYPE_LABELS, CONFIDENCE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [, categoryParams] = useRoute("/categories/:category");
  const initialSearch = new URLSearchParams(window.location.search).get("search") || "";
  const initialMiddle = new URLSearchParams(window.location.search).get("middle") || "";
  const initialSmall = new URLSearchParams(window.location.search).get("small") || "";
  const initialTag = new URLSearchParams(window.location.search).get("tag") || "";
  const routeCategory = categoryParams?.category
    ? decodeURIComponent(categoryParams.category)
    : "";
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  
  const [selectedEntryType, setSelectedEntryType] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(routeCategory);
  const [selectedMiddle, setSelectedMiddle] = useState(initialMiddle);
  const [selectedSmall, setSelectedSmall] = useState(initialSmall);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [searchMode, setSearchMode] = useState<string>("concept");
  const [sort, setSort] = useState<NonNullable<ListWordsParams["sort"]>>("newest");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    document.title = selectedCategory
      ? `${selectedCategory}の用語一覧 | ${SITE_NAME}`
      : `${SITE_NAME} | 未定の言葉を整理する`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", SITE_DESCRIPTION);
  }, [selectedCategory]);

  const { data: categories } = useListCategories();
  const topLevelCategories = useMemo(() => {
    if (!categories) return [];
    const uniqueLarges = new Set<string>();
    categories.forEach(c => {
      if (c.large) uniqueLarges.add(c.large);
    });
    return Array.from(uniqueLarges);
  }, [categories]);
  const middleCategories = useMemo(
    () =>
      Array.from(
        new Set(
          (categories || [])
            .filter((category) => !selectedCategory || category.large === selectedCategory)
            .map((category) => category.middle)
            .filter(Boolean),
        ),
      ),
    [categories, selectedCategory],
  );
  const smallCategories = useMemo(
    () =>
      Array.from(
        new Set(
          (categories || [])
            .filter(
              (category) =>
                (!selectedCategory || category.large === selectedCategory) &&
                (!selectedMiddle || category.middle === selectedMiddle),
            )
            .map((category) => category.small)
            .filter(Boolean),
        ),
      ),
    [categories, selectedCategory, selectedMiddle],
  );

  const { data: allWords } = useListWords({ publicOnly: true });
  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const word of allWords || []) {
      for (const tag of word.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "ja"))
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [allWords]);

  const queryParams: ListWordsParams = {
    publicOnly: true,
    sort,
  };
  
  if (debouncedSearch) queryParams.search = debouncedSearch;
  if (selectedEntryType) queryParams.entryType = selectedEntryType as WordEntryType;
  if (selectedCategory) queryParams.categoryLarge = selectedCategory;
  if (selectedMiddle) queryParams.categoryMiddle = selectedMiddle;
  if (selectedSmall) queryParams.categorySmall = selectedSmall;
  if (selectedTag) queryParams.tag = selectedTag;
  if (debouncedSearch) queryParams.searchMode = searchMode as ListWordsParams["searchMode"];

  const { data: words, isLoading: wordsLoading, error: wordsError } = useListWords(queryParams);
  const inferenceEnabled =
    searchMode === "concept" && debouncedSearch.trim().length >= 2;
  const {
    data: inference,
    isLoading: inferenceLoading,
    error: inferenceError,
  } = useGetSearchInference(
    { q: debouncedSearch.trim() || "未入力" },
    {
      query: {
        queryKey: getGetSearchInferenceQueryKey({
          q: debouncedSearch.trim() || "未入力",
        }),
        enabled: inferenceEnabled,
        staleTime: 5 * 60 * 1000,
        retry: 1,
      },
    },
  );
  const inferredByWordId = useMemo(
    () =>
      new Map(
        inference
          ? [
              inference.primaryCandidate,
              ...inference.alternativeCandidates,
            ].map((candidate) => [candidate.wordId, candidate])
          : [],
      ),
    [inference],
  );

  const confidenceBandLabel: Record<SearchConfidenceBand, string> = {
    established: "定着済み・根拠強",
    likely: "有力候補・根拠中",
    provisional: "暫定推定・未確定",
    site_proposal: "当サイト提案語",
  };

  const exactMatchExists = useMemo(() => {
    if (!words || !debouncedSearch || searchMode === "similar" || searchMode === "antonym") return true;
    const s = debouncedSearch.toLowerCase();
    return words.some(w => 
      w.proposedJapanese.toLowerCase().includes(s) || 
      (w.englishTerm && w.englishTerm.toLowerCase().includes(s)) || 
      (w.aliases && w.aliases.some(a => a.toLowerCase().includes(s)))
    );
  }, [words, debouncedSearch, searchMode]);

  const searchMethods = [
    { key: "concept", label: "概念検索（AI）", description: "意味・状況から候補を推定", icon: Brain },
    { key: "category", label: "カテゴリー検索", description: "分野から絞り込む", icon: FolderTree },
    { key: "similar", label: "類似語検索", description: "近い意味の語を探す", icon: Waypoints },
    { key: "antonym", label: "対義語検索", description: "反対・対比語を探す", icon: Contrast },
    { key: "spelling", label: "表記・読み方検索", description: "別名・綴りから探す", icon: Languages },
  ];
  const activeSearchMethod = searchMethods.find((method) => method.key === searchMode);

  const activateSearchMode = (mode: string) => {
    setSearchMode(mode);
    if (mode === "category") {
      document.getElementById("filters")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedMiddle("");
    setSelectedSmall("");
    setSelectedTag("");
    setSelectedEntryType("");
    setSearchMode("concept");
  };

  const hasFilters =
    search ||
    selectedEntryType ||
    selectedCategory ||
    selectedMiddle ||
    selectedSmall ||
    selectedTag;

  return (
    <div className="w-full bg-background min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
        
        {/* Header / Search Section */}
        <div className="mb-12 border-b-4 border-double border-foreground/60 pb-9">
          <div className="text-center mb-8">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.3em] text-primary">オンライン和文辞典</p>
            <h1 className="label-one-line text-[clamp(1.75rem,8vw,3rem)] font-display font-bold mb-4 tracking-[0.06em] text-foreground">{SITE_NAME}</h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-sans">{SITE_DESCRIPTION}</p>
          </div>
          
          <div className="max-w-2xl mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                searchMode === "similar"
                  ? "類似語を知りたい言葉を入力（例: バイブコーディング）"
                  : searchMode === "antonym"
                    ? "対義・対比語を知りたい言葉を入力（例: シャドーAI）"
                    : "言葉、別名、よみがな、または説明文から検索..."
              }
              className="w-full h-14 pl-12 pr-4 bg-card text-base border-x-0 border-t-0 border-b-2 border-foreground/60 hover:border-primary focus-visible:ring-0 focus-visible:border-primary rounded-none transition-colors"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            現在の検索方法: <span className="font-semibold text-foreground">{activeSearchMethod?.label}</span>
            <span className="mx-1">—</span>{activeSearchMethod?.description}
          </p>
          <div className="max-w-5xl mx-auto mt-7 grid grid-cols-2 sm:grid-cols-5 gap-2" aria-label="検索方法">
            {searchMethods.map((method) => {
              const Icon = method.icon;
              const active = searchMode === method.key;
              return (
                <button
                  type="button"
                  key={method.key}
                  onClick={() => activateSearchMode(method.key)}
                  className={cn(
                    "min-h-[84px] text-left border border-border border-t-2 px-3 py-3 bg-card transition-colors hover:border-primary",
                    active && "border-primary bg-primary/5",
                  )}
                  aria-pressed={active}
                >
                  <Icon className={cn("w-4 h-4 mb-2", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="label-one-line block text-[11px] sm:text-xs font-bold">{method.label}</span>
                  <span className="block text-[10px] text-muted-foreground mt-1 leading-snug">{method.description}</span>
                </button>
              );
            })}
          </div>
          {searchMode === "category" && (
            <nav aria-label="大分類索引" className="max-w-5xl mx-auto mt-4 border-y border-foreground/40 bg-card px-4 py-4">
              <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground">大分類索引</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {topLevelCategories.map((category) => (
                  <Link key={category} href={`/categories/${encodeURIComponent(category)}`} className="text-sm font-display font-semibold underline-offset-4 hover:text-primary hover:underline">
                    {category}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar Filters */}
          <aside id="filters" className="order-2 md:order-1 w-full md:w-64 shrink-0 space-y-8">
            <div className="bg-card border border-t-4 border-t-foreground/70 p-5 max-h-[260px] overflow-y-auto md:max-h-none md:overflow-visible">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold flex items-center gap-2"><Filter className="w-4 h-4" /> 絞り込み</h2>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3 mr-1" /> クリア
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">整理の種別</h3>
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      className={cn("justify-start h-8 px-2 text-sm font-normal", !selectedEntryType && "bg-primary/10 text-primary font-medium hover:bg-primary/20")}
                      onClick={() => setSelectedEntryType("")}
                    >
                      すべて
                    </Button>
                    {Object.entries(ENTRY_TYPE_LABELS).map(([k, v]) => (
                      <Button 
                        key={k}
                        variant="ghost" 
                        className={cn("justify-start h-8 px-2 text-sm font-normal", selectedEntryType === k && "bg-primary/10 text-primary font-medium hover:bg-primary/20")}
                        onClick={() => setSelectedEntryType(k)}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">分野・カテゴリ</h3>
                  <div className="flex flex-col gap-1">
                    <Button 
                      asChild
                      variant="ghost" 
                      className={cn("justify-start h-8 px-2 text-sm font-normal", !selectedCategory && "bg-primary/10 text-primary font-medium hover:bg-primary/20")}
                    >
                      <Link href="/">すべて</Link>
                    </Button>
                    {topLevelCategories.map((cat) => (
                      <Button
                        key={cat}
                        asChild
                        variant="ghost" 
                        className={cn("justify-start h-8 px-2 text-sm font-normal", selectedCategory === cat && "bg-primary/10 text-primary font-medium hover:bg-primary/20")}
                      >
                        <Link href={`/categories/${encodeURIComponent(cat)}`}>{cat}</Link>
                      </Button>
                    ))}
                  </div>
                </div>
                {middleCategories.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">中分類</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {middleCategories.map((category) => (
                        <Button
                          key={category}
                          variant="outline"
                          size="sm"
                          className={cn("h-7 px-2 text-xs", selectedMiddle === category && "border-primary bg-primary/10 text-primary")}
                          onClick={() => {
                            setSelectedMiddle(selectedMiddle === category ? "" : category);
                            setSelectedSmall("");
                          }}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedMiddle && smallCategories.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">小分類</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {smallCategories.map((category) => (
                        <Button
                          key={category}
                          variant="outline"
                          size="sm"
                          className={cn("h-7 px-2 text-xs", selectedSmall === category && "border-primary bg-primary/10 text-primary")}
                          onClick={() => setSelectedSmall(selectedSmall === category ? "" : category)}
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {popularTags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">タグから探す</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {popularTags.map((tag) => (
                        <Button
                          key={tag}
                          variant="ghost"
                          size="sm"
                          className={cn("h-7 px-2 text-xs", selectedTag === tag && "bg-primary/10 text-primary")}
                          onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                        >
                          <Hash className="mr-0.5 h-3 w-3" />{tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main List */}
          <main className="order-1 md:order-2 flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1 pb-3 border-b-2 border-foreground/50">
              <h2 className="min-w-0 safe-break pr-3 text-sm font-bold text-foreground">
                {debouncedSearch ? `「${debouncedSearch}」の検索結果` : "収録済みの言葉一覧"}
              </h2>
              <div className="flex items-center gap-1.5">
                {(["newest", "popular", "trending"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSort(value)}
                    className={cn(
                      "label-one-line min-h-8 border px-2.5 text-[11px] transition-colors",
                      sort === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
                    )}
                  >
                    {value === "newest" ? "新着順" : value === "popular" ? "人気順" : "急上昇順"}
                  </button>
                ))}
                <span className="label-one-line ml-1 shrink-0 text-xs text-muted-foreground">
                  {words?.length || 0}件
                </span>
              </div>
            </div>

            {debouncedSearch && !exactMatchExists && words && words.length > 0 && (
              <div className="mb-6 p-4 bg-muted/50 border rounded-lg text-sm text-muted-foreground flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p>完全一致する言葉は見つかりませんでしたが、関連する可能性のある言葉を表示しています。説明文やタグが一致している場合があります。</p>
              </div>
            )}

            {inferenceEnabled && (
              <section className="mb-7 border border-primary/40 bg-card" aria-live="polite">
                <div className="border-b border-border bg-primary/5 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                      <Brain className="h-5 w-5 text-primary" />
                      意図推定による回答
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      {inference?.aiUsed ? "AI推定＋辞典内根拠" : "辞典内根拠による推定"}
                    </span>
                  </div>
                  {inference && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {inference.intentSummary}
                    </p>
                  )}
                </div>

                {inferenceLoading ? (
                  <div className="flex items-center gap-3 px-5 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    入力意図と公開根拠を比較しています…
                  </div>
                ) : inferenceError || !inference ? (
                  <div className="px-5 py-5 text-sm text-muted-foreground">
                    AI推定を取得できなかったため、下の辞典内候補を表示しています。
                  </div>
                ) : (
                  <div className="space-y-5 p-5">
                    <div>
                      <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-primary">最有力候補</p>
                      <Link
                        href={`/words/${inference.primaryCandidate.slug}`}
                        className="block border-l-4 border-primary bg-primary/5 p-4 hover:bg-primary/10"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h4 className="font-display text-xl font-bold">{inference.primaryCandidate.candidateName}</h4>
                            {inference.primaryCandidate.originalTerm && (
                              <p className="mt-0.5 text-xs text-muted-foreground">{inference.primaryCandidate.originalTerm}</p>
                            )}
                          </div>
                          <Badge className="label-one-line bg-primary text-primary-foreground">
                            {confidenceBandLabel[inference.primaryCandidate.confidenceBand]}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed">{inference.primaryCandidate.conciseMeaning}</p>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{inference.primaryCandidate.explanation}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {inference.primaryCandidate.evidenceTypes.map((evidence) => (
                            <span key={evidence} className="border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">
                              {evidence}
                            </span>
                          ))}
                          <span className="border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">
                            {inference.primaryCandidate.isSiteProposal ? "当サイト提案語" : "既存収録語"}
                          </span>
                        </div>
                      </Link>
                    </div>

                    <p className="border-y border-border py-3 text-xs leading-relaxed text-muted-foreground">
                      {inference.uncertaintyNotice}
                    </p>

                    {inference.alternativeCandidates.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-muted-foreground">代替候補</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {inference.alternativeCandidates.map((candidate) => (
                            <Link key={candidate.wordId} href={`/words/${candidate.slug}`} className="border border-border p-3 hover:border-primary">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <strong className="font-display">{candidate.candidateName}</strong>
                                <span className="text-[10px] font-bold text-primary">{confidenceBandLabel[candidate.confidenceBand]}</span>
                              </div>
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{candidate.conciseMeaning}</p>
                              <p className="mt-2 text-[10px] text-muted-foreground">{candidate.evidenceTypes.join("・") || "辞典内の関連分野"}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {inference.proposedNames.length > 0 && (
                      <div className="border border-dashed border-primary/50 bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold">定着語がない場合の日本語名候補</p>
                          <Badge variant="outline">当サイト提案語・未確定</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          原語・入力文脈・類似概念・日本語としての自然さから生成した編集候補です。公開語としては未確定です。
                        </p>
                        <ul className="mt-3 space-y-2">
                          {inference.proposedNames.map((proposal) => (
                            <li key={proposal.name} className="bg-card p-3">
                              <strong className="font-display text-primary">{proposal.name}</strong>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{proposal.rationale}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {wordsLoading ? (
              <div className="flex justify-center items-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : wordsError ? (
              <div className="flex flex-col items-center py-20 text-muted-foreground bg-card border rounded-xl">
                <AlertCircle className="w-8 h-8 text-destructive mb-3" />
                <p className="text-sm">データの読み込みに失敗しました。</p>
              </div>
            ) : words?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-xl border border-dashed">
                <Search className="w-10 h-10 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold mb-2">見つかりませんでした</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  条件に一致する言葉はまだ整理されていません。別のキーワードをお試しください。
                </p>
                {hasFilters && (
                  <Button variant="outline" className="mt-6" onClick={handleClearFilters}>
                    絞り込みを解除する
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {words?.map((word) => (
                  <Link 
                    key={word.id} 
                    href={`/words/${word.slug}`}
                    className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <article className="bg-card border-y border-x-0 md:border-x p-5 md:p-6 transition-colors hover:border-primary relative overflow-hidden">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="secondary" className="label-one-line text-[10px] uppercase tracking-wider font-medium bg-secondary text-secondary-foreground">
                              {ENTRY_TYPE_LABELS[word.entryType] || word.entryType}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center">
                              {word.categoryLarge}
                              {word.categoryMiddle && <><ChevronRight className="w-3 h-3 mx-0.5" />{word.categoryMiddle}</>}
                              {word.categorySmall && <><ChevronRight className="w-3 h-3 mx-0.5" />{word.categorySmall}</>}
                            </span>
                            {word.tags?.slice(0, 3).map(t => (
                              <span key={t} className="label-one-line text-[10px] text-muted-foreground flex items-center bg-muted px-1.5 py-0.5 rounded">
                                <Hash className="w-3 h-3 mr-0.5 opacity-50" />{t}
                              </span>
                            ))}
                          </div>
                          <h3 className="min-w-0 text-xl md:text-2xl font-display font-bold group-hover:text-primary transition-colors flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="safe-break">{word.proposedJapanese}</span>
                            {word.englishTerm && <span className="safe-break text-sm font-sans font-normal text-muted-foreground">{word.englishTerm}</span>}
                          </h3>
                        </div>
                        
                        <div className="shrink-0 flex md:flex-col items-center md:items-end gap-2">
                          {debouncedSearch && typeof word.relevanceScore === "number" && (
                            <span className="text-[10px] font-bold tracking-wider text-primary">
                              候補度 {word.relevanceScore}
                            </span>
                          )}
                           {inferredByWordId.get(word.id) && (
                             <Badge className="label-one-line text-[10px] bg-primary text-primary-foreground">
                               {confidenceBandLabel[inferredByWordId.get(word.id)!.confidenceBand]}
                             </Badge>
                           )}
                          <Badge variant="outline" className="label-one-line text-[10px] font-medium border-primary/20 text-primary">
                            {LABEL_TYPE_LABELS[word.labelType] || word.labelType}
                          </Badge>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            定着度: <span className="font-medium text-foreground">{CONFIDENCE_LABELS[word.confidence] || "未設定"}</span>
                          </div>
                        </div>
                      </div>

                      {word.aliases && word.aliases.length > 0 && (
                        <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium">別表記:</span> 
                          {word.aliases.map((a, i) => (
                            <span key={i} className="label-one-line max-w-full overflow-hidden text-ellipsis bg-muted px-1.5 py-0.5 rounded text-foreground">{a}</span>
                          ))}
                        </div>
                      )}

                      <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2 md:line-clamp-3">
                        {word.shortAnswer || word.definition}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                        <span className={cn("label-one-line rounded border px-2 py-1", word.similarTerms?.length ? "border-primary/20 text-primary" : "border-border/60")}>
                          類似語 {word.similarTerms?.length ? `${word.similarTerms.length}件` : "なし"}
                        </span>
                        <span className={cn("label-one-line rounded border px-2 py-1", word.antonymTerms?.length ? "border-primary/20 text-primary" : "border-border/60")}>
                          対義・対比語 {word.antonymTerms?.length ? `${word.antonymTerms.length}件` : "なし"}
                        </span>
                        <span className="label-one-line inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1">
                          <Eye className="h-3 w-3" /> 閲覧 {word.viewCount.toLocaleString()}
                        </span>
                        <span className="label-one-line inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1">
                          <Bot className="h-3 w-3" /> クローラー {word.verifiedBotReferenceCount.toLocaleString()}
                        </span>
                        <span className="label-one-line inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1">
                          <BookOpen className="h-3 w-3" /> 出典 {word.externalSourceCount}
                        </span>
                      </div>

                      {debouncedSearch && word.matchReason && (
                        <div className="mt-5 pt-3 border-t border-dashed border-border/60 text-xs text-muted-foreground bg-primary/5 -mx-5 -mb-5 md:-mx-6 md:-mb-6 p-4 rounded-b-xl flex items-start gap-2">
                          <Search className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <span><strong className="text-primary font-medium">ヒット理由:</strong> {word.matchReason}</span>
                        </div>
                      )}
                      {inferredByWordId.get(word.id) && (
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                          {inferredByWordId.get(word.id)!.evidenceTypes.map((evidence) => (
                            <span key={evidence} className="border border-border/60 px-2 py-1">{evidence}</span>
                          ))}
                          <span className="border border-border/60 px-2 py-1">
                            {inferredByWordId.get(word.id)!.isSiteProposal ? "当サイト提案語" : "既存収録語"}
                          </span>
                        </div>
                      )}
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
