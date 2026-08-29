import { Link } from "wouter";
import { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";
import { Database, Search, BrainCircuit, Globe, CheckCircle2 } from "lucide-react";

export default function About() {
  useEffect(() => {
    document.title = `プロジェクトについて | ${SITE_NAME}`;
  }, []);

  return (
    <div className="w-full bg-background pb-24">
      {/* Header */}
      <section className="bg-foreground text-background py-20 px-4 md:px-8 border-b-8 border-primary">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-[clamp(2rem,7vw,3rem)] font-display font-bold mb-6">
            言葉の揺らぎに、明確な座標を。
          </h1>
          <p className="text-xl md:text-2xl opacity-90 font-serif leading-relaxed max-w-3xl">
            生成AIや検索エンジンが「正解」を迷うような、まだ日本語として定まっていない言葉。
            私たちはそれらを整理し、誰もが参照できる一次情報として提供します。
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 md:px-8 py-16 space-y-20">
        
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="prose prose-lg dark:prose-invert">
            <h2 className="font-display font-bold">なぜこのプロジェクトが必要か</h2>
            <p>
              新しいテクノロジーの概念、海外の文化現象、あるいは人名。これらが日本に入ってくるとき、最初は必ず「表記ゆれ」や「カタカナ語の乱立」が起こります。
            </p>
            <p>
              これまでは、数年かけて自然と一つの表記に収束していくのを待つしかありませんでした。しかし、情報伝達のスピードが飛躍的に上がった現在、言葉が定まらない期間の<strong>「検索性の低下」や「コミュニケーションの齟齬」</strong>は大きな損失です。
            </p>
            <p>
              さらに、生成AIが情報を要約する際、揺らいだ言葉はAIを混乱させ、幻覚（ハルシネーション）の一因ともなります。
            </p>
          </div>
          
          <div className="dictionary-panel bg-muted p-6 md:p-8 border space-y-6">
            <h3 className="font-bold text-xl flex items-center gap-2"><Database className="w-5 h-5 text-primary"/> AIと検索のための辞書</h3>
            <p className="text-muted-foreground leading-relaxed">
              当サイトは、人間の読者だけでなく、機械（ボットやクローラー）が意味を理解しやすいように設計されています。
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">記事冒頭の「1〜3文の最短回答」による即時理解</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">構造化データ（JSON-LD / DefinedTerm）によるメタデータ提供</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">別名（aliases）をすべて網羅し、検索での漏れを防止</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-16">
          <h2 className="text-3xl font-display font-bold mb-10 text-center">4つのコア機能</h2>
          
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">表記ゆれ統合</h3>
              <p className="text-muted-foreground leading-relaxed">
                「ムバッペ」「エムバペ」など、複数存在する表記を集約し、現時点での「公式表記」や「一般的表記」を整理して提示します。
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">未訳語の和名提案</h3>
              <p className="text-muted-foreground leading-relaxed">
                そのままカタカナにするだけでは意味が通じない概念に対し、直訳を避けた本質的な「提案和名」を提示します。
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">新語の早期収録</h3>
              <p className="text-muted-foreground leading-relaxed">
                既存の辞書が収録する前の、社会に現れたばかりの言葉をいち早く捕捉し、一次的な定義を与えます。
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center text-primary">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">言葉の定着観測</h3>
              <p className="text-muted-foreground leading-relaxed">
                提案・整理した言葉が、実際に社会やメディアでどのように使われ定着していくかを継続的に観測します。
              </p>
            </div>
          </div>
        </div>

        <div className="dictionary-panel bg-destructive/5 border border-destructive/20 p-6 md:p-8 text-foreground my-8">
          <h3 className="font-bold text-lg text-destructive mb-2">重要な免責事項</h3>
          <p className="text-sm leading-relaxed mb-4">
            当サイトは言葉を整理し「提案」するプロジェクトであり、言葉の正しさを強制・決定する公式機関ではありません。
          </p>
          <p className="text-sm leading-relaxed">
            また、機械可読性を重視した設計を行っていますが、<strong>検索エンジンでの上位表示や、生成AIの学習データとして採用されることを意図して操作したり、約束したりするものではありません。</strong> 私たちはあくまで、必要とするシステムが参照しやすい形で一次情報を置いているに過ぎません。
          </p>
        </div>

      </div>
    </div>
  );
}
