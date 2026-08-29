import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect } from "react";
import { useCreateWord, WordStatus, WordEntryType } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SITE_NAME, ENTRY_TYPE_LABELS } from "@/lib/constants";

const formSchema = z.object({
  englishTerm: z.string().min(1, "英単語または原語は必須です"),
  proposedJapanese: z.string().default(""),
  definition: z.string().min(1, "作業用の定義は必須です"),
  literalTranslation: z.string().optional(),
  category: z.string().min(1, "カテゴリーは必須です"),
  entryType: z.string().min(1, "整理の種類は必須です"),
});

const CATEGORIES = ["テクノロジー", "文化", "ビジネス", "社会", "科学", "インターネット", "エンタメ", "スポーツ", "政治"];

export default function AdminNewWord() {
  useEffect(() => {
    document.title = `新規整理の登録 | ${SITE_NAME}`;
  }, []);

  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createWord = useCreateWord();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      englishTerm: "",
      proposedJapanese: "",
      definition: "",
      literalTranslation: "",
      category: "テクノロジー",
      entryType: "variation",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createWord.mutate(
      {
        data: {
          ...values,
          entryType: values.entryType as WordEntryType,
          status: "candidate" as WordStatus,
        },
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["/api/words"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
          toast({
            title: "新規候補を登録しました",
            description: `"${data.englishTerm}" がワークフローに追加されました。`,
          });
          setLocation(`/admin/words/${data.id}`);
        },
        onError: () => {
          toast({
            title: "エラー",
            description: "候補の作成に失敗しました。",
            variant: "destructive",
          });
        }
      }
    );
  }

  return (
    <div className="w-full bg-muted/20 min-h-full pb-24">
      <div className="container mx-auto max-w-3xl px-4 md:px-8 py-10">
        
        <Link href="/admin" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> ダッシュボードに戻る
        </Link>
        
        <h1 className="text-3xl font-display font-bold mb-8">新規整理の登録</h1>

        <Card className="p-6 md:p-8 shadow-sm border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">基本情報</h2>
                
                <FormField
                  control={form.control}
                  name="entryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">整理の種類 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="種類を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ENTRY_TYPE_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>この言葉を整理する主な目的。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="englishTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">英単語 / 原語 *</FormLabel>
                      <FormControl>
                        <Input placeholder="例: Kylian Mbappé Lottin / Enshittification" className="font-serif text-lg" {...field} />
                      </FormControl>
                      <FormDescription>対象となる元の概念や綴り。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="proposedJapanese"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">提案・推奨される日本語</FormLabel>
                        <FormControl>
                          <Input placeholder="この段階では任意" {...field} />
                        </FormControl>
                        <FormDescription>整理・命名フェーズで後から追加可能です。</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="literalTranslation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">直訳</FormLabel>
                        <FormControl>
                          <Input placeholder="参考のための直接的な翻訳" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-lg font-bold border-b pb-2">コンテキスト</h2>
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">カテゴリー *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="カテゴリーを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="definition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">作業用の定義 *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="概念の明確で客観的な定義を提供してください..." 
                          className="min-h-[120px] resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 border-t gap-4">
                <Button type="button" variant="ghost" asChild>
                  <Link href="/admin">キャンセル</Link>
                </Button>
                <Button type="submit" disabled={createWord.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8">
                  {createWord.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  候補を登録して編集を始める
                </Button>
              </div>

            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
