import { Link } from "wouter";
import { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";

export default function CorrectionsPolicy() {
  useEffect(() => {
    document.title = `訂正と履歴 | ${SITE_NAME}`;
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 prose prose-slate dark:prose-invert">
      <h1 className="font-display">訂正と履歴</h1>
      <p className="lead">
        言葉は生きており、その意味や最適な表記は時間とともに変化します。当サイトは継続的な更新を前提としています。
      </p>

      <h2>1. 継続的な観測と更新</h2>
      <p>
        一度公開した言葉であっても、社会での定着状況や新たな用例の出現に応じて、ステータスや推奨表記を更新します。
      </p>

      <h2>2. 更新履歴の透明性</h2>
      <p>
        大幅な定義の変更、推奨表記の変更、または誤りの訂正を行った場合は、各言葉のページに「更新履歴（Update History）」としてその内容と日付を記録します。
      </p>

      <h2>3. ご指摘の受付</h2>
      <p>
        事実誤認や、より適切な訳語の提案については、常にオープンに受け付けています（※現在は準備中）。
      </p>
    </div>
  );
}
