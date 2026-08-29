import { useGetDashboardSummary, useListWords } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, BookOpen, Activity, Search, Edit3, SplitSquareHorizontal, Sparkles, AlertCircle, Bot, Quote, Target, Clock } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SITE_NAME, STATUS_LABELS, ENTRY_TYPE_LABELS } from "@/lib/constants";

export default function AdminDashboard() {
  useEffect(() => {
    document.title = `管理ダッシュボード | ${SITE_NAME}`;
  }, []);

  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: recentWords, isLoading: wordsLoading } = useListWords({ sort: 'newest' });

  return (
    <div className="w-full bg-muted/20 min-h-full pb-24">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b pb-6">
          <div>
            <h1 className="label-one-line text-[clamp(1.65rem,7vw,2rem)] font-display font-bold">管理ダッシュボード</h1>
            <p className="text-muted-foreground mt-2">単語の整理ワークフローと公開ステータスを管理します。</p>
          </div>
          <Button asChild className="label-one-line min-h-11">
            <Link href="/admin/new">
              <Plus className="w-4 h-4 mr-2" /> 新規整理を追加
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="総収録数" 
            value={summary?.total} 
            loading={summaryLoading} 
            icon={<BookOpen className="w-4 h-4 text-muted-foreground" />} 
          />
          <StatCard 
            title="公開済み" 
            value={summary?.published} 
            loading={summaryLoading} 
            icon={<Eye className="w-4 h-4 text-primary" />} 
          />
          <StatCard 
            title="進行中 (整理・命名)" 
            value={(summary?.candidate || 0) + (summary?.researching || 0) + (summary?.naming || 0)} 
            loading={summaryLoading} 
            icon={<Activity className="w-4 h-4 text-amber-500" />} 
          />
          <StatCard 
            title="人による閲覧" 
            value={summary?.totalViews} 
            loading={summaryLoading} 
            icon={<Search className="w-4 h-4 text-emerald-500" />} 
          />
          <StatCard title="確認済みクローラー" value={summary?.totalVerifiedBotReferences} loading={summaryLoading} icon={<Bot className="w-4 h-4 text-primary" />} />
          <StatCard title="外部引用・出典" value={summary?.externalCitationCount} loading={summaryLoading} icon={<Quote className="w-4 h-4 text-primary" />} />
          <StatCard title="本日の新規候補" value={summary?.candidatesToday} loading={summaryLoading} icon={<Search className="w-4 h-4 text-emerald-600" />} />
          <StatCard title="本日の公開" value={summary?.publishedToday} loading={summaryLoading} icon={<Eye className="w-4 h-4 text-emerald-600" />} />
        </div>

        <section className="dictionary-panel mb-8 border bg-card p-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <OperationTarget icon={<Target className="h-4 w-4" />} label="総収録目標" value={`${summary?.targetWordCount.toLocaleString() || "10,000"}語超`} />
            <OperationTarget icon={<Clock className="h-4 w-4" />} label="候補探索" value={`1日${summary?.scheduledScansPerDay || 12}回想定`} />
            <OperationTarget icon={<Search className="h-4 w-4" />} label="候補検出目標" value={`最低${summary?.dailyCandidateTarget || 20}件/日`} />
            <OperationTarget icon={<BookOpen className="h-4 w-4" />} label="品質通過後の公開" value={`${summary?.dailyPublishMin || 5}〜${summary?.dailyPublishMax || 20}件/日`} />
          </div>
          <p className="mt-4 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
            件数を満たすための架空語・根拠の薄い語は登録しません。公開は定義、読み、分類、出典、表記情報の品質ゲートを通過した項目に限ります。
          </p>
        </section>

        {/* Breakdown by Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="dictionary-panel bg-card border p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <SplitSquareHorizontal className="w-5 h-5" />
              </div>
              <div>
                <div className="label-one-line text-xs font-bold text-muted-foreground uppercase">表記ゆれ解決</div>
                <div className="text-xl font-bold">{summary?.variationResolved || 0} <span className="text-xs font-normal text-muted-foreground">件</span></div>
              </div>
            </div>
          </div>
          <div className="dictionary-panel bg-card border p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="label-one-line text-xs font-bold text-muted-foreground uppercase">未訳語の和名提案</div>
                <div className="text-xl font-bold">{summary?.untranslatedProposed || 0} <span className="text-xs font-normal text-muted-foreground">件</span></div>
              </div>
            </div>
          </div>
          <div className="dictionary-panel bg-card border p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="label-one-line text-xs font-bold text-muted-foreground uppercase">保留中の更新</div>
                <div className="text-xl font-bold">{summary?.pendingUpdates || 0} <span className="text-xs font-normal text-muted-foreground">件</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow 8 steps visualization (placeholder/concept) */}
        <div className="bg-card border rounded-xl p-6 shadow-sm mb-12 hidden md:block">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 text-center">整理ワークフロー 8ステップ</h3>
          <div className="flex justify-between items-center text-xs font-medium relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border -z-10 mx-6"></div>
            {['候補発見', '既存調査', '表記統合', '根拠評価', '推奨決定', '公開', 'AI発見性確認', '定着観測'].map((step, i) => (
              <div key={i} className="flex flex-col items-center bg-card px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 border-2 ${i < 6 ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border'}`}>
                  {i + 1}
                </div>
                <span className={i < 6 ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Word List */}
        <h2 className="text-xl font-display font-bold mb-6">最近の整理状況</h2>
        
        <div className="dictionary-panel bg-card border overflow-hidden">
          <p className="border-b bg-muted/35 px-4 py-2 text-[11px] text-muted-foreground md:hidden">表は横にスクロールできます</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="label-one-line p-4 font-bold border-b">ID / 英語・原語</th>
                  <th className="label-one-line p-4 font-bold border-b">提案された日本語</th>
                  <th className="label-one-line p-4 font-bold border-b">種類</th>
                  <th className="label-one-line p-4 font-bold border-b">ステータス</th>
                  <th className="label-one-line p-4 font-bold border-b text-right">アクション</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {wordsLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td className="p-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="p-4 flex justify-end"><Skeleton className="h-8 w-16" /></td>
                    </tr>
                  ))
                ) : recentWords?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      システムにはまだ単語がありません。何か新しいものを調査しましょう。
                    </td>
                  </tr>
                ) : (
                  recentWords?.map((word) => (
                    <tr key={word.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-xs text-muted-foreground mb-1">{word.slug}</div>
                        <div className="font-serif italic font-medium text-foreground">{word.englishTerm}</div>
                      </td>
                      <td className="p-4 text-primary font-bold text-base">{word.proposedJapanese || '-'}</td>
                      <td className="p-4">
                        <span className="label-one-line text-xs font-medium text-muted-foreground border px-2 py-0.5 rounded bg-muted/50">
                          {ENTRY_TYPE_LABELS[word.entryType] || word.entryType}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant={word.status as any} className="label-one-line text-[10px] font-bold tracking-wider px-2 py-0">
                          {STATUS_LABELS[word.status] || word.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-8 hover:bg-primary/10 hover:text-primary">
                          <Link href={`/admin/words/${word.id}`}>
                            <Edit3 className="w-4 h-4 mr-1.5" /> <span className="label-one-line">編集</span>
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, icon }: { title: string, value?: number, loading: boolean, icon: React.ReactNode }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="label-one-line overflow-hidden text-ellipsis text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wide sm:tracking-widest">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {loading ? (
          <Skeleton className="h-8 w-16 mt-1" />
        ) : (
          <div className="text-3xl font-bold font-display">{value?.toLocaleString() || 0}</div>
        )}
      </CardContent>
    </Card>
  );
}

function OperationTarget({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <div className="label-one-line text-[10px] font-bold text-muted-foreground">{label}</div>
        <div className="mt-1 font-display text-lg font-bold">{value}</div>
      </div>
    </div>
  );
}
