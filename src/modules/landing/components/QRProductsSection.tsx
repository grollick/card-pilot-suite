import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { QrCode, ChevronRight } from "lucide-react";
import { QR_PRODUCTS } from "@/lib/qrProducts";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function QRProductsSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        custom={0}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
          <QrCode className="h-3 w-3" /> Physical Products
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">Smart QR products that drive leads</h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Premium laser-engraved plates, NFC cards, and signs — each one linked to your guzzl.pro card.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QR_PRODUCTS.map((p, i) => (
          <motion.div
            key={p.id}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={i}
            className="rounded-xl border border-border bg-card p-6 text-center hover:shadow-card-hover transition-shadow"
          >
            <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold mb-1">{p.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{p.description}</p>
            <p className="text-2xl font-extrabold text-primary">${p.price}</p>
            <Link to="/products" className="inline-flex items-center text-xs text-primary font-medium mt-3 hover:underline">
              View details <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
