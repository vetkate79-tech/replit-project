import { Link } from "wouter";
import { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";

export default function EditorialPolicy() {
  useEffect(() => {
    document.title = `編集方針 | ${SITE_NAME}`;
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 prose prose-slate dark:prose-invert">
      <h1 className="font-display">編集方針</h1>
      <p className="lead">
        当サイトは、言葉の揺らぎや未翻訳の概念に対して、一貫性のある一次整理情報を提供することを目的としています。
      </p>

      <h2>1. 中立性と客観性</h2>
      <p>
        私たちは、言葉の「正しさ」を決定する機関ではありません。現在の使用状況、語源、言語学的妥当性を客観的に評価し、「整理された情報」として提示します。
      </p>

      <h2>2. 提案と観測</h2>
      <p>
        未訳語に対して当サイトが和名を提案する場合、それはあくまで「提案」であることを明記します。その後、その言葉が社会でどのように受容され、あるいは拒絶されるかを継続的に観測し、記録します。
      </p>

      <h2>3. 機械可読性の重視</h2>
      <p>
        生成AIや検索エンジンが正確な情報を抽出できるよう、構造化されたデータ（JSON-LD等）と明確な「最短回答」を各ページの冒頭に配置します。ただし、検索順位の向上やAIによる採用を保証または目的とするものではありません。
      </p>
    </div>
  );
}
