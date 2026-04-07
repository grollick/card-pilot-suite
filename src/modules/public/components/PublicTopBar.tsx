import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GuzzlLogo from "@/components/brand/GuzzlLogo";

interface PublicTopBarProps {
  /** Label shown on the right side */
  title?: string;
  /** Icon to show next to title */
  icon?: React.ReactNode;
  /** Where the back button goes — defaults to browser back */
  backTo?: string;
  /** Label for the back link */
  backLabel?: string;
  /** Extra content on the right */
  children?: React.ReactNode;
}

export default function PublicTopBar({ title, icon, backTo, backLabel = "Back", children }: PublicTopBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <nav className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>

        <div className="flex items-center gap-3">
          {title && (
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              {icon}
              {title}
            </span>
          )}
          {children}
          <GuzzlLogo size="sm" />
        </div>
      </div>
    </nav>
  );
}
