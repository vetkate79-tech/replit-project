import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { useGetWord, useUpdateWord, getGetWordQueryKey, WordStatus, WordEntryType, ConfidenceLevel, Word } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { SITE_NAME, STATUS_LABELS, ENTRY_TYPE_LABELS, CONFIDENCE_LABELS } from "@/lib/constants";

const CATEGORIES = ["テクノロジー", "文化", "ビジネス", "社会", "科学", "インターネット", "エンタメ", "スポーツ", "政治"];
const STATUSES = Object.values(WordStatus);
const ENTRY_TYPES = Object.values(WordEntryType);
const CONFIDENCE_LEVELS = Object.values(ConfidenceLevel);

export default function AdminEditWord() {
  const [, params] = useRoute("/admin/words/:id");
  const id = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: word, isLoading, error } = useGetWord(id || "", {
    query: { enabled: !!id, queryKey: getGetWordQueryKey(id || "") }
  });

  useEffect(() => {
    if (word) {
      document.title = `編集: ${word.englishTerm} | ${SITE_NAME}`;
    }
  }, [word]);

  const updateWord = useUpdateWord();
  const mutateFnRef = useRef(updateWord.mutate);
  mutateFnRef.current = updateWord.mutate;

  const [formData, setFormData] = useState<Partial<Word>>({});
  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (word && id && initializedForId.current !== id) {
      initializedForId.current = id;
      setFormData(word);
    }
  }, [word, id]);

  const handleChange = (field: keyof Word, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof Word, value: string) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: arr }));
  };

  const saveChanges = () => {
    if (!id) return;
    
    // Explicitly destructure change note to ensure it's captured
    const { changeNote, ...rest } = formData as any;
    
    mutateFnRef.current(
      { id, data: { ...rest, changeNote } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetWordQueryKey(id), data);
          toast({
            title: "保存しました",
            description: "変更が正常に適用されました。",
          });
          // Reset change note after save
          setFormData(prev => ({ ...prev, changeNote: '' }));
        },
        onError: () => {
          toast({
            title: "エラー",
            description: "変更の保存に失敗しました。",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (error || !word) {
    return <div className="p-8 text-center text-destructive font-bold"><AlertCircle className="w-8 h-8 mx-auto mb-2" />単語が見つかりません。</div>;
  }

  return (
    <div className="w-full bg-muted/10 min-h-full pb-24">
      {/* Sticky Header */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b shadow-sm px-4 md:px-8 py-3">
        <div className="container mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-md hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="label-one-line text-[10px] bg-secondary text-secondary-foreground px-1.5 rounded uppercase font-bold tracking-widest">{ENTRY_TYPE_LABELS[formData.entryType as string || word.entryType]}</span>
                <span className="truncate text-[10px] text-muted-foreground font-mono">ID: {word.id} / {word.slug}</span>
              </div>
              <h1 className="min-w-0 font-display font-bold text-lg leading-none flex items-center gap-2">
                <span className="truncate">{formData.proposedJapanese || formData.englishTerm || word.englishTerm}</span>
                <Badge variant={formData.status as any || word.status} className="label-one-line shrink-0 ml-1 sm:ml-2 uppercase text-[10px] tracking-wider px-1.5 py-0">
                  {STATUS_LABELS[formData.status || word.status] || formData.status || word.status}
                </Badge>
              </h1>
            </div>
          </div>
          
          <Button onClick={saveChanges} disabled={updateWord.isPending} className="label-one-line min-h-11 w-full sm:w-auto font-bold">
            {updateWord.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            変更を保存
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 md:px-8 py-8 grid gap-8 lg:grid-cols-12">
        
        {/* Main Editor */}
        <div className="min-w-0 lg:col-span-8 space-y-8">
          
          {/* Section: Core Text */}
          <div className="dictionary-panel bg-card border p-5 md:p-8 space-y-6">
            <h2 className="text-lg font-bold border-b pb-2">主要テキスト (AI/検索向け)</h2>
            
            <div className="space-y-3">
              <Label className="font-bold flex flex-col gap-1 sm:flex-row sm:justify-between">
                <span>最短回答 (Summary)</span>
                <span className="text-xs text-muted-foreground font-normal">1〜3文で明快に</span>
              </Label>
              <Textarea 
                value={formData.shortAnswer || ''} 
                onChange={e => handleChange('shortAnswer', e.target.value)} 
                className="min-h-[80px] bg-primary/5 border-primary/20 focus-visible:ring-primary text-base"
                placeholder="この概念の結論、または推奨表記について最も重要な事実を書く。"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold">詳細な定義</Label>
              <Textarea 
                value={formData.definition || ''} 
                onChange={e => handleChange('definition', e.target.value)} 
                className="min-h-[150px] leading-relaxed"
              />
            </div>
          </div>

          {/* Section: Names and Aliases */}
          <div className="dictionary-panel bg-card border p-5 md:p-8 space-y-6">
            <h2 className="text-lg font-bold border-b pb-2">表記と揺らぎ (表記ゆれ統合)</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-bold">提案・推奨される日本語</Label>
                <Input 
                  value={formData.proposedJapanese || ''} 
                  onChange={e => handleChange('proposedJapanese', e.target.value)} 
                  className="font-bold text-primary text-lg h-12"
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold">英単語 / 原語</Label>
                <Input 
                  value={formData.englishTerm || ''} 
                  onChange={e => handleChange('englishTerm', e.target.value)}
                  className="font-serif italic text-lg h-12" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-bold text-xs text-muted-foreground uppercase">原語の言語</Label>
              <Input
                value={formData.originalLanguage || ''}
                onChange={e => handleChange('originalLanguage', e.target.value)}
                placeholder="例: フランス語、英語、スペイン語"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-bold">別名・表記ゆれ（カンマ区切り）</Label>
              <Input 
                value={(formData.aliases || []).join(', ')} 
                onChange={e => handleArrayChange('aliases', e.target.value)} 
                placeholder="例: エムバペ, エンバペ, ムバペ"
              />
              <p className="text-xs text-muted-foreground">ここで指定した別名でも検索可能になり、JSON-LDの alternateName に反映されます。</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-bold text-xs text-muted-foreground uppercase">よみがな</Label>
                <Input 
                  value={formData.reading || ''} 
                  onChange={e => handleChange('reading', e.target.value)} 
                  placeholder="ひらがな・カタカナ"
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-xs text-muted-foreground uppercase">発音表記</Label>
                <Input 
                  value={formData.pronunciation || ''} 
                  onChange={e => handleChange('pronunciation', e.target.value)} 
                  placeholder="例: /m.ba.pe/ または カタカナ発音"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-bold text-xs text-muted-foreground uppercase">公式・本人推奨表記</Label>
                <Input 
                  value={formData.officialLabel || ''} 
                  onChange={e => handleChange('officialLabel', e.target.value)} 
                  placeholder="公式が指定している表記がある場合"
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-xs text-muted-foreground uppercase">一般的な表記</Label>
                <Input
                  value={formData.commonLabel || ''}
                  onChange={e => handleChange('commonLabel', e.target.value)}
                  placeholder="現在もっとも広く使われる表記"
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-xs text-muted-foreground uppercase">主要メディアでの扱い (カンマ区切り)</Label>
                <Input 
                  value={(formData.mediaLabels || []).join(', ')} 
                  onChange={e => handleArrayChange('mediaLabels', e.target.value)} 
                  placeholder="例: NHK=エムバペ, 共同通信=ムバッペ"
                />
              </div>
            </div>
          </div>

          {/* Section: Reasoning */}
          <div className="dictionary-panel bg-card border p-5 md:p-8 space-y-6">
            <h2 className="text-lg font-bold border-b pb-2">編集部の推論と背景</h2>
            
            <div className="space-y-3">
              <Label className="font-bold">整理・命名の根拠</Label>
              <Textarea 
                value={formData.proposalReason || ''} 
                onChange={e => handleChange('proposalReason', e.target.value)} 
                className="min-h-[120px]"
                placeholder="なぜこの特定の日本語が選ばれたのか、表記ゆれの中でこれを推奨する理由は何か..."
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-bold text-xs text-muted-foreground uppercase">発生の背景</Label>
                <Textarea 
                  value={formData.originContext || ''} 
                  onChange={e => handleChange('originContext', e.target.value)} 
                />
              </div>
              <div className="space-y-3">
                <Label className="font-bold text-xs text-muted-foreground uppercase">海外・原語圏での用法</Label>
                <Textarea 
                  value={formData.overseasUsage || ''} 
                  onChange={e => handleChange('overseasUsage', e.target.value)} 
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="font-bold text-xs text-muted-foreground uppercase">現在の使われ方 (定着観測)</Label>
              <Input 
                value={formData.usageStatus || ''} 
                onChange={e => handleChange('usageStatus', e.target.value)} 
                placeholder="例: サッカーファンにはムバッペが定着しているが、報道はエムバペに移行中"
              />
            </div>
          </div>
          
          <div className="dictionary-panel bg-card border p-5 md:p-8 space-y-6">
            <h2 className="text-lg font-bold border-b pb-2">変更履歴 (オプショナル)</h2>
            <div className="space-y-3">
              <Label className="font-bold text-muted-foreground">今回の更新内容に関するノート</Label>
              <Input 
                value={(formData as any).changeNote || ''} 
                onChange={e => handleChange('changeNote' as any, e.target.value)} 
                placeholder="例: 最短回答を更新し、別名「エンバペ」を追加"
              />
              <p className="text-xs text-muted-foreground">入力すると、保存時に更新履歴として公開ページに追記されます。</p>
            </div>
          </div>
        </div>

        {/* Sidebar Metadata */}
        <div className="min-w-0 lg:col-span-4 space-y-6">
          <div className="dictionary-panel bg-card border p-5 space-y-5">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">分類とステータス</h2>
            
            <div className="space-y-2">
              <Label className="font-bold text-xs">ワークフローステータス</Label>
              <Select value={formData.status || 'candidate'} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger className="font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="uppercase text-xs font-bold tracking-wider">
                      {STATUS_LABELS[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">整理の種類</Label>
              <Select value={formData.entryType || 'variation'} onValueChange={v => handleChange('entryType', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTRY_TYPES.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {ENTRY_TYPE_LABELS[s] || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">カテゴリー</Label>
              <Select value={formData.category || ''} onValueChange={v => handleChange('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-xs">定着度・信頼性 (Confidence)</Label>
              <Select value={formData.confidence || 'low'} onValueChange={v => handleChange('confidence', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENCE_LEVELS.map(c => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {CONFIDENCE_LABELS[c] || c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-xs">発生時期</Label>
              <Input 
                value={formData.originPeriod || ''} 
                onChange={e => handleChange('originPeriod', e.target.value)} 
                placeholder="例: 2022年 第3四半期"
                className="h-8 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox 
                id="existing-trans" 
                checked={formData.existingJapaneseTranslation || false}
                onCheckedChange={c => handleChange('existingJapaneseTranslation', c === true)}
              />
              <Label htmlFor="existing-trans" className="text-sm font-medium">
                不十分な既存の翻訳がある
              </Label>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 space-y-5 shadow-sm">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">関連と出典</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-bold text-xs">名称監視の品質ゲート</Label>
                <Select value={formData.monitoringStatus || 'watching'} onValueChange={v => handleChange('monitoringStatus', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="watching">継続監視</SelectItem>
                    <SelectItem value="candidate_detected">別名称候補を検知</SelectItem>
                    <SelectItem value="evidence_review">根拠を評価中</SelectItem>
                    <SelectItem value="mainstream_confirmed">主流化を確認</SelectItem>
                    <SelectItem value="change_approved">推奨変更を承認</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs">定義の確度</Label>
                <Select value={formData.definitionConfidence || 'medium'} onValueChange={v => handleChange('definitionConfidence', v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低・暫定定義</SelectItem>
                    <SelectItem value="medium">中・観測中</SelectItem>
                    <SelectItem value="high">高・複数根拠一致</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">主流化を監視する別名称候補</Label>
              <Input
                value={formData.nameChangeCandidate || ''}
                onChange={e => handleChange('nameChangeCandidate', e.target.value)}
                placeholder="複数ソースで増加している名称"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">公開使用例（1行1件）</Label>
              <Textarea
                value={(formData.usageEvidence || []).map(item => [item.excerpt, item.context, item.sourceType, item.sourceUrl, new Date(item.checkedAt).toISOString().slice(0, 10)].join(' | ')).join('\n')}
                onChange={e => handleChange('usageEvidence', e.target.value.split('\n').filter(Boolean).map(line => {
                  const [excerpt = '', context = '', sourceType = 'その他', sourceUrl = '', checkedAt = new Date().toISOString().slice(0, 10)] = line.split('|').map(part => part.trim());
                  return { excerpt: excerpt.slice(0, 240), context, sourceType, sourceUrl, checkedAt: new Date(checkedAt) };
                }))}
                className="min-h-[140px] text-xs"
                placeholder="短い引用 | 使用文脈 | SNS・ニュース・動画等 | https://... | 2026-08-29"
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">引用は240文字以内。出典URLと確認日を必須とし、名称変更には異なる公開ソースが2件以上必要です。</p>
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-xs">関連用語（カンマ区切り）</Label>
              <Input 
                value={(formData.relatedTerms || []).join(', ')} 
                onChange={e => handleArrayChange('relatedTerms', e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">情報源（URLまたは名前、カンマ区切り）</Label>
              <Textarea 
                value={(formData.sources || []).join(', ')} 
                onChange={e => handleArrayChange('sources', e.target.value)} 
                className="min-h-[100px] text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs">独立した外部ソース数</Label>
              <Input
                type="number"
                min={0}
                value={formData.independentSourceCount ?? 0}
                onChange={e => handleChange('independentSourceCount', Math.max(0, Number(e.target.value) || 0))}
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                同一発表の転載は重複せず、独立して根拠を確認できる発信元だけを数えます。
              </p>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
