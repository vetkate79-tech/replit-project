import { Link } from "wouter";
import { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";

export default function SourcesPolicy() {
  useEffect(() => {
    document.title = `情報源の基準 | ${SITE_NAME}`;
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 prose prose-slate dark:prose-invert">
      <h1 className="font-display">情報源の基準</h1>
      <p className="lead">
        新しい言葉を整理する上で、依拠する情報源の信頼性は極めて重要です。
      </p>

      <h2>1. 一次情報の優先</h2>
      <p>
        可能な限り、その言葉が最初に使われた論文、記事、または公式な発表を一次情報として参照します。
      </p>

      <h2>2. 用例の収集</h2>
      <p>
        表記ゆれを統合するにあたり、大手メディア、専門誌、学術機関、および一般のソーシャルメディアでの使用頻度を比較・参照します。
      </p>

      <h2>3. 情報源の明記</h2>
      <p>
        各言葉の解説ページには、依拠した主な情報源（URLや文献名）を明記し、読者が自ら検証できるようにします。
      </p>
    </div>
  );
}
