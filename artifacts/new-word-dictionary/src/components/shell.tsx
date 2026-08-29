import { Link, useLocation } from "wouter";
import { BookMarked, Settings, AlignLeft } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isPublic = !location.startsWith("/admin");

  return (
    <div className="min-h-[100dvh] flex flex-col w-full relative">
      <header className="sticky top-0 z-40 w-full border-b-4 border-double border-foreground/70 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-8 min-h-16 py-2 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 bg-foreground flex items-center justify-center text-background">
              <BookMarked className="w-4 h-4" />
            </div>
            <span className={cn(!isPublic && "max-[479px]:hidden")}>
              <span className="block font-display font-bold text-base sm:text-xl tracking-[0.08em] whitespace-nowrap">{SITE_NAME}</span>
              <span className="hidden sm:block text-[9px] tracking-[0.18em] text-muted-foreground">新語・概念・表記の整理</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3 md:gap-6 text-[11px] sm:text-sm font-medium text-muted-foreground shrink-0">
            {isPublic ? (
              <>
                <Link href="/" className={cn("hover:text-foreground transition-colors", location === "/" && "text-primary")}>
                  <span className="sm:hidden">検索</span>
                  <span className="hidden sm:inline">検索・一覧</span>
                </Link>
                <Link href="/about" className={cn("hidden sm:inline hover:text-foreground transition-colors", location === "/about" && "text-primary")}>
                  プロジェクトについて
                </Link>
                <Link href="/admin" className="hover:text-foreground transition-colors hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted">
                  <Settings className="w-4 h-4" />
                  管理室
                </Link>
              </>
            ) : (
              <>
                <Link href="/admin" className={cn("label-one-line hover:text-foreground transition-colors", location === "/admin" && "text-primary")}>
                  <span className="sm:hidden">管理</span>
                  <span className="hidden sm:inline">ダッシュボード</span>
                </Link>
                <Link href="/admin/new" className={cn("label-one-line hover:text-foreground transition-colors", location === "/admin/new" && "text-primary")}>
                  <span className="sm:hidden">新規</span>
                  <span className="hidden sm:inline">新規整理</span>
                </Link>
                <div className="w-px h-4 bg-border mx-0.5 sm:mx-2"></div>
                <Link href="/" className="label-one-line hover:text-foreground transition-colors flex items-center gap-1">
                  <AlignLeft className="w-4 h-4" />
                  <span className="sm:hidden">公開</span>
                  <span className="hidden sm:inline">公開サイト</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative">
        {children}
      </main>

      <footer className="border-t-4 border-double border-foreground/60 py-12 bg-card mt-auto z-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 text-foreground mb-4">
                <BookMarked className="w-5 h-5" />
                <span className="font-display font-bold text-lg">{SITE_NAME}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-xs">
                まだ日本語として答えが定まっていない言葉を整理し、生成AIや検索エンジンが参照できる一次情報を提供する言語メディアです。
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">ポリシー</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="/policies/editorial" className="hover:text-primary transition-colors">編集方針</Link></li>
                <li><Link href="/policies/sources" className="hover:text-primary transition-colors">情報源の基準</Link></li>
                <li><Link href="/policies/naming" className="hover:text-primary transition-colors">命名・統合ルール</Link></li>
                <li><Link href="/policies/corrections" className="hover:text-primary transition-colors">訂正と履歴</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">プロジェクト</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">ミッション</Link></li>
                <li><Link href="/admin" className="hover:text-primary transition-colors">管理室（ダッシュボード）</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} {SITE_NAME} 編集室. All rights reserved.</span>
            <span>※当サイトは提案と観測を行うものであり、標準を強制するものではありません。</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
