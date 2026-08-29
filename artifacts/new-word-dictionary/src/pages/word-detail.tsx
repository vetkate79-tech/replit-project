import { getGetWordQueryKey, useGetWord } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Calendar, Loader2, AlertCircle, CheckCircle2, BookOpen, Quote, RefreshCw, Eye, Bot, Sigma, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_NAME, STATUS_LABELS, ENTRY_TYPE_LABELS, CONFIDENCE_LABELS, LABEL_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function WordDetail() {
  const [, params] = useRoute("/words/:slug");
  const slug = params?.slug || "";

  const { data: word, isLoading, error } = useGetWord(slug, {
    query: {
      enabled: !!slug,
      queryKey: getGetWordQueryKey(slug),
    }
  });

  useEffect(() => {
    if (word) {
      const title = word.proposedJapanese || word.englishTerm;
      const description = word.shortAnswer || word.definition.substring(0, 150);
      const canonicalUrl = new URL(`/words/${word.slug}`, window.location.origin).toString();
      document.title = `${title}とは？読み方・別表記・意味 | ${SITE_NAME}`;
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);

      let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;

      const setPropertyMeta = (property: string, content: string) => {
        let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("property", property);
          document.head.appendChild(meta);
        }
        meta.content = content;
      };
      setPropertyMeta("og:title", document.title);
      setPropertyMeta("og:description", description);
      setPropertyMeta("og:type", "article");
      setPropertyMeta("og:url", canonicalUrl);
      
      let script = document.querySelector('#json-ld');
      if (!script) {
        script = document.createElement('script');
        script.id = 'json-ld';
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      
      const categoryPath = [word.categoryLarge, word.categoryMiddle, word.categorySmall].filter(Boolean).join(" > ");
      const keywords = [...(word.tags || []), ...(word.semanticKeywords || [])].join(", ");
      
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "DefinedTerm",
        "name": word.proposedJapanese,
        "alternateName": word.aliases && word.aliases.length > 0 ? word.aliases : undefined,
        "inDefinedTermSet": SITE_NAME,
        "termCode": word.englishTerm,
        "description": word.shortAnswer || word.definition,
        "url": canonicalUrl,
        "category": categoryPath || undefined,
        "keywords": keywords || undefined,
        "citation": word.sources,
        "dateModified": word.updatedAt || word.firstDefinedAt
      });
    }
  }, [word]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm font-medium">辞書データを読み込み中...</p>
      </div>
    );
  }

  if (error || !word) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-background">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-display font-bold mb-2">言葉が見つかりません</h1>
        <p className="text-muted-foreground mb-6">お探しの項目は存在しないか、整理前の状態です。</p>
        <Button asChild variant="outline">
          <Link href="/">索引机に戻る</Link>
        </Button>
      </div>
    );
  }

  const categoryPath = [word.categoryLarge, word.categoryMiddle, word.categorySmall].filter(Boolean);

  return (
    <div className="w-full bg-background pb-24 min-h-screen">
      {/* Top Context Bar */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto max-w-5xl px-4 md:px-8 py-3 flex items-center justify-between gap-3 text-xs">
          <Link href="/" className="inline-flex items-center font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 索引へ戻る
          </Link>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="label-one-line font-mono bg-muted px-2 py-1 rounded">ID: W-{String(word.id).padStart(6, "0")}</span>
            {word.status !== 'published' && (
              <Badge variant="destructive" className="uppercase text-[10px] tracking-wider px-1.5 py-0 bg-destructive/10 text-destructive border-destructive/20">
                {STATUS_LABELS[word.status] || word.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 md:px-8 mt-10 md:mt-16 grid gap-12 lg:grid-cols-12 items-start">
        
        {/* Main Content Column */}
        <div className="min-w-0 lg:col-span-8 space-y-12">
          
          <header className="space-y-6">
            <div className="flex gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="font-medium bg-secondary text-secondary-foreground">
                {ENTRY_TYPE_LABELS[word.entryType] || word.entryType}
              </Badge>
              {categoryPath.length > 0 && (
                <nav aria-label="カテゴリー階層" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {word.categoryLarge && (
                    <Link href={`/categories/${encodeURIComponent(word.categoryLarge)}`} className="underline-offset-4 hover:text-primary hover:underline">
                      {word.categoryLarge}
                    </Link>
                  )}
                  {word.categoryMiddle && (
                    <>
                      <span aria-hidden="true">›</span>
                      <Link href={`/categories/${encodeURIComponent(word.categoryLarge)}?middle=${encodeURIComponent(word.categoryMiddle)}`} className="underline-offset-4 hover:text-primary hover:underline">
                        {word.categoryMiddle}
                      </Link>
                    </>
                  )}
                  {word.categorySmall && (
                    <>
                      <span aria-hidden="true">›</span>
                      <Link href={`/categories/${encodeURIComponent(word.categoryLarge)}?middle=${encodeURIComponent(word.categoryMiddle)}&small=${encodeURIComponent(word.categorySmall)}`} className="underline-offset-4 hover:text-primary hover:underline">
                        {word.categorySmall}
                      </Link>
                    </>
                  )}
                </nav>
              )}
            </div>

            <div>
              <h1 className="safe-break text-[clamp(2.25rem,8vw,3.75rem)] font-display font-bold text-foreground mb-4 leading-[1.15] tracking-tight">
                {word.proposedJapanese}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-muted-foreground">
                <Badge className="label-one-line w-fit bg-primary text-primary-foreground pointer-events-none text-xs px-2.5 py-0.5">
                  {LABEL_TYPE_LABELS[word.labelType] || word.labelType}
                </Badge>
                {(word.reading || word.pronunciation) && (
                  <div className="text-sm flex gap-4 bg-muted/50 px-3 py-1 rounded-md">
                    {word.reading && <span><span className="text-[10px] uppercase opacity-70 mr-1">よみ</span>{word.reading}</span>}
                    {word.pronunciation && <span><span className="text-[10px] uppercase opacity-70 mr-1">発音</span>{word.pronunciation}</span>}
                  </div>
                )}
              </div>
            </div>

            {(word.englishTerm || word.originalLanguage) && (
              <div className="dictionary-panel min-w-0 bg-card p-5 border flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <span className="safe-break min-w-0 text-2xl font-serif text-foreground">
                  {word.englishTerm}
                </span>
                {(word.originalLanguage || word.literalTranslation) && (
                  <div className="min-w-0 text-sm text-muted-foreground flex flex-col gap-1 border-l pl-4 border-border/50">
                    {word.originalLanguage && <div><span className="text-[10px] uppercase font-bold mr-2 opacity-70">原語</span>{word.originalLanguage}</div>}
                    {word.literalTranslation && <div><span className="text-[10px] uppercase font-bold mr-2 opacity-70">直訳</span>{word.literalTranslation}</div>}
                  </div>
                )}
              </div>
            )}
          </header>

          {/* Short Answer (The most important part for AI/Search) */}
          <section className="dictionary-panel bg-primary/5 border border-primary/20 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold tracking-widest text-primary uppercase">最短回答</h2>
            </div>
            <p className="text-lg md:text-xl leading-relaxed text-foreground font-medium">
              {word.shortAnswer || "まだ最短回答が設定されていません。"}
            </p>
          </section>

          {(word.usageEvidence?.length || word.nameChangeHistory?.length) ? (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
                <h2 className="text-lg font-bold">使用実態と名称の観測</h2>
                <span className="text-xs text-muted-foreground">
                  定義の確度: {word.definitionConfidence === "high" ? "高" : word.definitionConfidence === "low" ? "低・暫定" : "中・観測中"}
                </span>
              </div>
              {word.usageEvidence && word.usageEvidence.length > 0 && (
                <div className="grid gap-3">
                  <h3 className="text-sm font-bold">使用例からみた意味</h3>
                  {word.usageEvidence.map((evidence, index) => (
                    <blockquote key={`${evidence.sourceUrl}-${index}`} className="dictionary-panel border bg-card p-4">
                      <p className="font-serif text-sm leading-relaxed">「{evidence.excerpt}」</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{evidence.context}</p>
                      <footer className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        <span>{evidence.sourceType}</span>
                        <span>確認日 {new Date(evidence.checkedAt).toLocaleDateString("ja-JP")}</span>
                        <a href={evidence.sourceUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">出典を確認</a>
                      </footer>
                    </blockquote>
                  ))}
                  <p className="text-[10px] text-muted-foreground">引用は意味を断定するものではなく、複数の公開文脈を比較する観測資料です。</p>
                </div>
              )}
              {word.nameChangeHistory && word.nameChangeHistory.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-bold">推奨名称の変更履歴</h3>
                  <ol className="space-y-3">
                    {word.nameChangeHistory.map((change, index) => (
                      <li key={`${change.date}-${index}`} className="border-l-2 border-primary/50 pl-4">
                        <p><strong>{change.previousName}</strong> → <strong className="text-primary">{change.newName}</strong></p>
                        <p className="mt-1 text-sm">{change.reason}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(change.date).toLocaleDateString("ja-JP")}・独立根拠 {change.evidenceCount}件。旧称は別名として検索できます。</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          ) : null}

          {/* Detailed Definition */}
          <section>
            <h2 className="text-lg font-bold border-b border-border/60 pb-3 mb-6 flex items-center gap-2">
              <Quote className="w-4 h-4 text-muted-foreground" /> 詳細な定義
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-foreground leading-loose text-[15px]">
              <p className="whitespace-pre-wrap">{word.definition}</p>
            </div>
          </section>

          {(word.originContext || word.overseasUsage) && (
            <section>
              <h2 className="text-lg font-bold border-b border-border/60 pb-3 mb-6">背景・使用状況</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {word.originContext && (
                  <div className="bg-card border rounded-lg p-5">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">背景・判断材料</h3>
                    <p className="text-sm text-foreground leading-relaxed">{word.originContext}</p>
                  </div>
                )}
                {word.overseasUsage && (
                  <div className="bg-card border rounded-lg p-5">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">海外・原語圏での用法</h3>
                    <p className="text-sm text-foreground leading-relaxed">{word.overseasUsage}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Reasoning */}
          <section className="dictionary-panel bg-card border p-6 md:p-8">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4 border-b border-border/60 pb-3">
              <BookOpen className="w-5 h-5 text-muted-foreground" /> 
              整理・命名の根拠
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-foreground text-[15px] leading-relaxed">
              {word.proposalReason ? (
                <p className="whitespace-pre-wrap">{word.proposalReason}</p>
              ) : (
                <p className="italic text-muted-foreground">編集中です。</p>
              )}
            </div>
          </section>
        </div>

        {/* Metadata Sidebar */}
        <aside className="min-w-0 lg:col-span-4 space-y-6">
          <section className="dictionary-panel bg-card border p-5" aria-label="参照実績と定着度">
            <h2 className="mb-4 border-b border-border/70 pb-2 text-sm font-bold">参照実績・根拠</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <Metric icon={<Eye className="h-4 w-4" />} label="人による閲覧" value={word.viewCount.toLocaleString()} />
              <Metric icon={<Bot className="h-4 w-4" />} label="確認済みクローラー" value={word.verifiedBotReferenceCount.toLocaleString()} />
              <Metric icon={<Sigma className="h-4 w-4" />} label="合計参照" value={word.totalReferenceCount.toLocaleString()} />
              <Metric icon={<BookOpen className="h-4 w-4" />} label="外部出典" value={`${word.externalSourceCount}件`} />
              <div className="col-span-2 border-t border-border/70 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="label-one-line inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" /> 定着度・信頼度
                  </span>
                  <span className="label-one-line font-display text-xl font-bold text-primary">{word.trustScore}/100</span>
                </div>
                <p className="mt-1 text-xs font-medium">{word.trustLabel}</p>
              </div>
            </div>
            <p className="mt-4 border-t border-border/70 pt-3 text-[10px] leading-relaxed text-muted-foreground">
              閲覧量は注目度・参照実績です。語の正しさを示すものではありません。定着度は出典数、独立性、公式・主要媒体での採用、表記情報、更新鮮度から別に算出します。
            </p>
          </section>
          
          <div className="dictionary-panel bg-card border p-6 space-y-6">
            <h3 className="font-bold text-sm border-b border-border/60 pb-2">メタデータ</h3>
            
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">当サイト初回収録日</div>
              <div className="flex items-center gap-2 font-mono text-sm text-foreground">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {word.firstDefinedAt ? new Date(word.firstDefinedAt).toLocaleDateString("ja-JP") : '未公開'}
              </div>
            </div>
            
            {word.updatedAt && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">最終更新</div>
                <div className="flex items-center gap-2 font-mono text-sm text-foreground">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  {new Date(word.updatedAt).toLocaleDateString("ja-JP")}
                </div>
              </div>
            )}

            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">定着度・信頼性</div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full shadow-inner",
                  word.confidence === 'high' ? 'bg-green-500' : 
                  word.confidence === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                )} />
                <span className="text-sm font-medium">{CONFIDENCE_LABELS[word.confidence] || word.confidence || "未設定"}</span>
              </div>
            </div>
            
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">現在の使われ方</div>
              <div className="text-sm text-foreground">{word.usageStatus || "観測中"}</div>
            </div>
          </div>

          <div className="dictionary-panel bg-muted/30 border p-6 space-y-6">
            <h3 className="font-bold text-sm border-b border-border/60 pb-2">表記ステータス</h3>
            
            {word.officialLabel && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">公式・本人推奨</div>
                <div className="text-sm font-medium text-foreground bg-card px-3 py-2 rounded border">{word.officialLabel}</div>
              </div>
            )}

            {word.commonLabel && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">一般的な表記</div>
                <div className="text-sm font-medium text-foreground bg-card px-3 py-2 rounded border">{word.commonLabel}</div>
              </div>
            )}
            
            {word.mediaLabels && word.mediaLabels.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">主要メディアの扱い</div>
                <div className="text-sm font-medium text-foreground bg-card px-3 py-2 rounded border">{word.mediaLabels.join(" / ")}</div>
              </div>
            )}

            {word.aliases && word.aliases.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">その他の別名・表記ゆれ</div>
                <div className="flex flex-wrap gap-2">
                  {word.aliases.map((alias, i) => (
                    <span key={i} className="label-one-line max-w-full overflow-hidden text-ellipsis text-xs bg-card text-foreground px-2 py-1 rounded border shadow-sm">
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-2 text-[10px] leading-relaxed text-muted-foreground border-t border-border/60 mt-4">
              <strong className="text-foreground">表記区分について：</strong><br/>
              唯一の正解や正式名称を断定するものではなく、出典と使用状況を比較した編集判断です。
            </div>
          </div>

          {word.sourceAttribution && (
            <div className="dictionary-panel bg-card border border-primary/20 p-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">出典・帰属</h3>
              <p className="text-sm font-medium">{word.sourceAttribution}</p>
              {word.sourcePublishedAt && (
                <p className="text-xs text-muted-foreground mt-2">参照資料の公表時期: {word.sourcePublishedAt}</p>
              )}
            </div>
          )}

          {(word.sources && word.sources.length > 0) ||
          (word.relatedTerms && word.relatedTerms.length > 0) ||
          (word.similarTerms && word.similarTerms.length > 0) ||
          (word.antonymTerms && word.antonymTerms.length > 0) ? (
            <div className="space-y-6">
              {word.similarTerms && word.similarTerms.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">類似語</h3>
                  <div className="grid gap-2">
                    {word.similarTerms.map((term) => (
                      <Link key={term.slug} href={`/words/${term.slug}`} className="flex min-w-0 items-center justify-between gap-3 border-y border-border/70 px-1 py-3 text-sm font-medium hover:text-primary">
                        <span className="safe-break min-w-0">{term.label}</span>
                        <span className="label-one-line shrink-0 text-xs text-muted-foreground">項目を見る →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {word.antonymTerms && word.antonymTerms.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">対義語・対比語</h3>
                  <div className="grid gap-2">
                    {word.antonymTerms.map((term) => (
                      <Link key={term.slug} href={`/words/${term.slug}`} className="flex min-w-0 items-center justify-between gap-3 border-y border-border/70 px-1 py-3 text-sm font-medium hover:text-primary">
                        <span className="safe-break min-w-0">{term.label}</span>
                        <span className="label-one-line shrink-0 text-xs text-muted-foreground">項目を見る →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {word.relatedTerms && word.relatedTerms.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">関連用語</h3>
                  <div className="flex flex-wrap gap-2">
                    {word.relatedTerms.map((term, i) => (
                      <Link key={i} href={`/?search=${encodeURIComponent(term)}`}>
                        <Badge variant="secondary" className="bg-secondary/60 font-normal hover:bg-secondary/80">
                          {term}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {word.sources && word.sources.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">主な情報源</h3>
                  <ul className="space-y-3">
                    {word.sources.map((source, i) => {
                      const isUrl = source.startsWith('http');
                      return (
                        <li key={i} className="text-xs flex items-start gap-2 bg-card p-2 rounded border">
                          <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                          {isUrl ? (
                            <a href={source} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                              {source}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">{source}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

        </aside>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="label-one-line mb-1 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
        {icon}{label}
      </div>
      <div className="font-display text-xl font-bold">{value}</div>
    </div>
  );
}
