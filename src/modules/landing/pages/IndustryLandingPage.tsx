import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Star, ChevronRight } from "lucide-react";
import { getIndustryPage, getIndustryDemoCard } from "@/modules/landing/data/industryPages";
import NotFound from "@/modules/shared/pages/NotFound";

function authLink(slug: string) {
  return `/auth?mode=signup&profession=${slug}`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function IndustryLandingPage() {
  const { industry } = useParams<{ industry: string }>();
  const page = industry ? getIndustryPage(industry) : undefined;
  const demo = page ? getIndustryDemoCard(page) : undefined;

  if (!page) return <NotFound />;

  const pageTitle = `${page.heroHeadline} | guzzl.pro`;
  const metaDesc = page.heroSubheadline.slice(0, 155);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://guzzl-pro.app/for/${page.slug}`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* ── Nav ── */}
        <nav className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="text-lg font-bold text-primary"><span className="font-extrabold text-primary">guzzl</span>.pro</Link>
            <div className="flex items-center gap-3">
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Pricing</Link>
              <Button asChild size="sm">
                <Link to={authLink(page.slug)}>{page.ctaText}</Link>
              </Button>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4" />
          <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 relative">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <div className="flex flex-wrap gap-2 mb-6">
                {page.focusAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="py-1.5 px-3 text-xs font-medium">
                    {area}
                  </Badge>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
                {page.heroHeadline}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                {page.heroSubheadline}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="text-base px-8">
                  <Link to={authLink(page.slug)}>
                    {page.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {demo && (
                  <Button asChild variant="outline" size="lg" className="text-base">
                    <Link to={`/demo/${demo.slug}`}>
                      {page.secondaryCtaText || "See Demo Card"}
                    </Link>
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">{page.ctaSubtext}</p>
            </motion.div>
          </div>
        </section>

        {/* ── Problem ── */}
        <section className="bg-muted/30 border-y border-border/30">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-2xl md:text-3xl font-bold text-center mb-12"
            >
              {page.problemHeadline}
            </motion.h2>
            <div className={`grid gap-6 ${page.problems.length === 4 ? 'sm:grid-cols-2' : 'md:grid-cols-3'}`}>
              {page.problems.map((p, i) => (
                <motion.div
                  key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="bg-card rounded-xl border border-border/60 p-6"
                >
                  <span className="text-3xl mb-3 block">{p.icon}</span>
                  <h3 className="font-semibold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </motion.div>
              ))}
            </div>
            {page.problemClosing && (
              <motion.p
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={page.problems.length}
                className="text-center text-lg font-semibold text-foreground mt-10"
              >
                {page.problemClosing}
              </motion.p>
            )}
          </div>
        </section>

        {/* ── Solution ── */}
        <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <motion.h2
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-2xl md:text-3xl font-bold text-center mb-4"
          >
            {page.solutionHeadline}
          </motion.h2>
          {page.solutionDescription && (
            <motion.p
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-center text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              {page.solutionDescription}
            </motion.p>
          )}
          {page.solutionBullets ? (
            <div className="max-w-xl mx-auto space-y-4">
              {page.solutionBullets.map((b, i) => (
                <motion.div
                  key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-foreground">{b}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-8 ${page.solutionPoints.length === 4 ? 'sm:grid-cols-2' : 'md:grid-cols-3'}`}>
              {page.solutionPoints.map((s, i) => (
                <motion.div
                  key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* ── How It Works ── */}
        <section className="bg-muted/30 border-y border-border/30">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-2xl md:text-3xl font-bold text-center mb-12"
            >
              How It Works
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-8">
              {page.howItWorks.map((step, i) => (
                <motion.div
                  key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Product Preview ── */}
        {page.productPreview && (
          <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-2xl md:text-3xl font-bold text-center mb-10"
            >
              {page.productPreview.headline}
            </motion.h2>
            <div className="max-w-2xl mx-auto">
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {page.productPreview.highlights.map((h, i) => (
                  <motion.div
                    key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                    className="flex items-center gap-3 bg-card rounded-lg border border-border/60 p-4"
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{h}</span>
                  </motion.div>
                ))}
              </div>
              <motion.p
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
                className="text-center text-sm text-muted-foreground"
              >
                {page.productPreview.caption}
              </motion.p>
            </div>
          </section>
        )}

        {/* ── Features ── */}
        <section className="bg-muted/30 border-y border-border/30">
          <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-2xl md:text-3xl font-bold text-center mb-12"
            >
              {page.featuresHeadline || `Everything a ${page.profession} Needs`}
            </motion.h2>
            <div className={`grid gap-6 ${page.features.length <= 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {page.features.map((f, i) => (
                <motion.div
                  key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="bg-card rounded-xl border border-border/60 p-5"
                >
                  <span className="text-2xl mb-2 block">{f.icon}</span>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social Proof (single quote) ── */}
        {page.socialProof && (
          <section className="max-w-4xl mx-auto px-4 py-16 md:py-20">
            <motion.blockquote
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-center"
            >
              <p className="text-xl md:text-2xl font-medium text-foreground italic leading-relaxed mb-4">
                "{page.socialProof.quote}"
              </p>
              <footer className="text-sm text-muted-foreground">— {page.socialProof.attribution}</footer>
            </motion.blockquote>
          </section>
        )}

        {/* ── Testimonials (from demo card) ── */}
        {!page.socialProof && demo && demo.testimonials.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-2xl md:text-3xl font-bold text-center mb-3"
            >
              {page.testimonialIntro}
            </motion.h2>
            <p className="text-center text-muted-foreground mb-10">Real reviews from real clients.</p>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {demo.testimonials.map((t, i) => (
                <motion.div
                  key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className="bg-card rounded-xl border border-border/60 p-6"
                >
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">"{t.text}"</p>
                  <p className="text-sm font-medium text-foreground">— {t.name}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── Demo Section ── */}
        {demo && page.demoSection && (
          <section className="border-y border-border/30 bg-muted/20">
            <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
                className="text-center"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-3">{page.demoSection.headline}</h2>
                <p className="text-muted-foreground mb-4 max-w-xl mx-auto">
                  See a sample {page.profession.toLowerCase()} card built with guzzl.pro.
                </p>

                {/* Mini card preview */}
                <div className="max-w-sm mx-auto bg-card rounded-2xl border border-border/60 shadow-lg overflow-hidden mb-6">
                  <div className="p-5" style={{ borderTop: `4px solid ${demo.accentColor}` }}>
                    <h3 className="text-lg font-bold text-foreground">{demo.name}</h3>
                    <p className="text-xs text-muted-foreground">{demo.company} · {demo.city}</p>
                    <p className="text-xs text-muted-foreground italic mt-1">"{demo.tagline}"</p>
                    <div className="mt-3 space-y-1.5">
                      {demo.services.slice(0, 3).map((s) => (
                        <div key={s.name} className="flex justify-between text-xs">
                          <span className="text-foreground">{s.name}</span>
                          <span className="text-muted-foreground font-medium">{s.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button asChild size="lg">
                  <Link to={`/demo/${demo.slug}`}>
                    {page.demoSection.buttonText} <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </section>
        )}

        {/* ── Demo Card Preview (fallback for pages without demoSection) ── */}
        {demo && !page.demoSection && (
          <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-2xl md:text-3xl font-bold text-center mb-3"
            >
              See What Your Card Could Look Like
            </motion.h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              Here's a sample {page.profession.toLowerCase()} card built with guzzl.pro.
            </p>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="max-w-md mx-auto bg-card rounded-2xl border border-border/60 shadow-lg overflow-hidden"
            >
              <div className="p-6" style={{ borderTop: `4px solid ${demo.accentColor}` }}>
                <h3 className="text-xl font-bold text-foreground">{demo.name}</h3>
                <p className="text-sm text-muted-foreground">{demo.company} · {demo.city}</p>
                <p className="text-sm text-muted-foreground italic mt-2">"{demo.tagline}"</p>
                <div className="mt-4 space-y-2">
                  {demo.services.slice(0, 3).map((s) => (
                    <div key={s.name} className="flex justify-between text-sm">
                      <span className="text-foreground">{s.name}</span>
                      <span className="text-muted-foreground font-medium">{s.price}</span>
                    </div>
                  ))}
                </div>
                {demo.testimonials[0] && (
                  <div className="mt-5 p-3 bg-muted/40 rounded-lg">
                    <div className="flex gap-0.5 mb-1">
                      {Array.from({ length: demo.testimonials[0].rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic">"{demo.testimonials[0].text.slice(0, 100)}…"</p>
                    <p className="text-xs text-foreground font-medium mt-1">— {demo.testimonials[0].name}</p>
                  </div>
                )}
                <Button asChild className="w-full mt-5" size="sm">
                  <Link to={`/demo/${demo.slug}`}>View Full Demo Card</Link>
                </Button>
              </div>
            </motion.div>
          </section>
        )}

        {/* ── Pricing Preview ── */}
        {page.pricingPreview && (
          <section className="max-w-5xl mx-auto px-4 py-16 md:py-20">
            <motion.h2
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="text-2xl md:text-3xl font-bold text-center mb-10"
            >
              {page.pricingPreview.headline}
            </motion.h2>
            <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {page.pricingPreview.plans.map((plan, i) => (
                <motion.div
                  key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className={`bg-card rounded-xl border p-6 text-center ${i === 1 ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border/60'}`}
                >
                  <h3 className="font-bold text-foreground text-lg mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
              className="text-center mt-6"
            >
              <Button asChild variant="outline">
                <Link to="/pricing">View Full Pricing <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </motion.div>
          </section>
        )}

        {/* ── Final CTA ── */}
        <section className="bg-primary/5 border-t border-border/30">
          <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                {page.finalCtaHeadline || `Ready to Grow Your ${page.profession} Business?`}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                {page.finalCtaSubheadline || `Join thousands of ${page.profession.toLowerCase()}s who use guzzl.pro to capture more leads, book more jobs, and build a stronger reputation.`}
              </p>
              <Button asChild size="lg" className="text-base px-10">
                <Link to={authLink(page.slug)}>
                  {page.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-3">{page.ctaSubtext}</p>
            </motion.div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border/40 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            {page.footerNote && <span className="block mb-1">{page.footerNote}</span>}
            © {new Date().getFullYear()} <Link to="/" className="text-primary hover:underline"><span className="font-extrabold text-primary">guzzl</span>.pro</Link> — The smart business card platform for local professionals.
          </p>
        </footer>
      </div>
    </>
  );
}
