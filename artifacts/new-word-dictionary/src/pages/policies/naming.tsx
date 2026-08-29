import { Link } from "wouter";
import { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";

export default function NamingPolicy() {
  useEffect(() => {
    document.title = `命名・統合ルール | ${SITE_NAME}`;
  }, []);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 prose prose-slate dark:prose-invert">
      <h1 className="font-display">命名・統合ルール</h1>
      <p className="lead">
        表記ゆれの統合および新たな和名の提案にあたっては、以下のルールに従います。
      </p>

      <h2>1. 表記ゆれの統合基準</h2>
      <ul>
        <li><strong>原語の発音への忠実さ:</strong> 外来語の場合、原語の発音に最も近いカタカナ表記を一つの基準とします。</li>
        <li><strong>既存の慣用:</strong> すでに社会に広く定着している表記がある場合は、発音の忠実さよりも慣用を優先することがあります（例: 「コンピューター」と「コンピュータ」）。</li>
        <li><strong>公式見解:</strong> 関連する公式機関や本人が推奨する表記が存在する場合、それを「公式表記」として明記し、原則として推奨します。</li>
      </ul>

      <h2>2. 和名提案の基準</h2>
      <p>
        英語などの概念がそのままカタカナで輸入されることで意味が通じにくくなる場合、以下を考慮して和名を提案します。
      </p>
      <ul>
        <li>概念の本質を直感的に表しているか。</li>
        <li>既存の日本語の語彙体系に自然に馴染むか。</li>
        <li>不必要な直訳を避け、文化的文脈を反映しているか。</li>
      </ul>
    </div>
  );
}
