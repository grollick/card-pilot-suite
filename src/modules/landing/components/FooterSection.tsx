import { Link } from "react-router-dom";

export default function FooterSection() {
  return (
    <footer className="border-t border-border py-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold tracking-tight gradient-text"><span className="font-extrabold text-primary">guzzl</span>.pro</span>
          <span className="text-sm text-muted-foreground">© 2026</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <Link to="/discover" className="hover:text-foreground transition-colors">Discover</Link>
          <Link to="/auth" className="hover:text-foreground transition-colors">Log in</Link>
        </div>
      </div>
    </footer>
  );
}
