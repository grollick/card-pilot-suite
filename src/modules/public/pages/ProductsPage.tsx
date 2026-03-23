import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QR_PRODUCTS } from "@/lib/qrProducts";
import { motion } from "framer-motion";
import { ArrowLeft, Check, QrCode, ShoppingCart, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-lg font-extrabold tracking-tight">
            <span className="gradient-text"><span className="font-black text-primary">guzzl</span>.pro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Home
              </Button>
            </Link>
            <Link to="/onboarding">
              <Button size="sm" className="shadow-glow">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <QrCode className="h-3 w-3" /> Physical Products
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-[1.1]">
            Smart QR products that{" "}
            <span className="gradient-text">generate leads for you</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
            Premium laser-engraved plates, NFC business cards, and outdoor signs — each one linked to your guzzl.pro digital card. Every scan is a potential customer.
          </p>
        </motion.div>
      </section>

      {/* Products Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {QR_PRODUCTS.map((product, i) => (
            <motion.div
              key={product.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className={`rounded-2xl border bg-card p-8 flex flex-col ${
                product.popular ? "border-primary ring-2 ring-primary/20 relative" : "border-border"
              }`}
            >
              {product.popular && (
                <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  Best Seller
                </div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{product.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                </div>
                <div className="h-16 w-16 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold">${product.price}</span>
                <span className="text-muted-foreground text-sm ml-1">one-time</span>
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <Button className={`w-full ${product.popular ? "shadow-glow" : ""}`} size="lg">
                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                  Order Now — ${product.price}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Requires a guzzl.pro account • Ships in 3-5 business days
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bundle CTA */}
      <section className="bg-primary/5 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Bundle & save — get the complete kit
            </h2>
            <p className="text-muted-foreground mb-6">
              NFC card + metal plate + truck sticker for $99 (save $18).
              Everything you need to capture leads everywhere.
            </p>
            <Link to="/onboarding">
              <Button size="lg" className="shadow-glow">
                Get Started First <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2026 guzzl.pro. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
