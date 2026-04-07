import { Link } from "react-router-dom";
import { Globe, Mail, ArrowUpRight } from "lucide-react";
import GuzzlLogo from "@/components/brand/GuzzlLogo";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Examples", href: "#examples" },
    { label: "Discover Pros", to: "/discover" },
  ],
  Company: [
    { label: "Products", to: "/products" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Service", to: "/terms" },
  ],
  Resources: [
    { label: "Log in", to: "/auth" },
    { label: "Get Started", to: "/onboarding" },
    { label: "Find a Pro", to: "/discover" },
  ],
};

export default function FooterSection() {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main footer */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-xl font-extrabold tracking-tight">
              <GuzzlLogo to={null} size="sm" />
            </span>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xs">
              The all-in-one platform that turns your business card into a customer-generating machine.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://guzzl.pro" target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors">
                <Globe className="h-4 w-4" />
              </a>
              <a href="mailto:hello@guzzl.pro" className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {"to" in link && link.to ? (
                      <Link to={link.to} className="text-sm text-foreground/70 hover:text-primary transition-colors flex items-center gap-1 group">
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <a href={link.href} className="text-sm text-foreground/70 hover:text-primary transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="glow-line" />
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} guzzl.pro — All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
