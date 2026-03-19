import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ReactNode } from "react";

const PRODUCT_NAME = "ClaimVex";

interface HeaderProps {
  historyDrawer?: ReactNode;
}

const Header = ({ historyDrawer }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="relative flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3 sm:px-6">
      {/* Left: history drawer + logo + name */}
      <div className="flex min-w-0 items-center gap-2">
        {historyDrawer}

        <button
          onClick={() => navigate("/")}
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="Back to home"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            CV
          </div>
          <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            {PRODUCT_NAME}
          </span>
        </button>

        <div className="h-4 w-px shrink-0 bg-border" />

        <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">
          CPT Coding Validation Engine
        </span>
      </div>

      {/* Right: theme toggle + Beta badge */}
      <div className="ml-2 flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <Badge variant="secondary" className="text-xs font-medium">
          Beta
        </Badge>
      </div>

      {/* Subtle gradient border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </header>
  );
};

export default Header;
