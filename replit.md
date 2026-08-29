# 新語辞典

海外発の新概念や日本語表記が定まっていない語を、出典・表記区分・関係語とともに整理する和文辞典。

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- API契約を先に変更し、Orvalでクライアント型とZodスキーマを再生成する。
- 公開検索は、見出し・別名・意味キーワード・カテゴリ・表記の近さを統合して候補順位とヒット理由を返す。
- 類似語と対義・対比語は、存在する辞書項目のslugを使う相互リンクとして管理する。

## Product

- 概念、カテゴリー、類似語、対義語、表記ゆれ・読み方の5導線から検索できる。
- 一覧で定義、カテゴリ、別表記、候補度、ヒット理由、関係語の有無を確認できる。
- 詳細ページから関係語とカテゴリ階層を回遊できる。

## User preferences

- 公開側は現代的なSaaS風ではなく、独自の和文辞典・百科事典調を保つ。明朝体、温かい紙色、細い罫線、索引感、十分な余白を使い、過度な角丸や装飾を避ける。
- 特定の既存辞典の商標、ロゴ、紙面はコピーしない。スマホでは読みやすさと検索結果への到達を最優先する。

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
