import { Helmet } from "react-helmet-async";
import { useLandingPage, type LandingPageSection } from "@/hooks/useLandingPages";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import PublicTopBar from "@/modules/public/components/PublicTopBar";

const PRIVACY_POLICY = `
## 1. Introduction

Welcome to guzzl.pro ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.

By using guzzl.pro, you agree to the collection and use of information in accordance with this policy.

## 2. Information We Collect

### 2.1 Information You Provide
- **Account Information:** Name, email address, phone number, business name, profession, and service area when you create an account.
- **Profile Information:** Bio, avatar/photo, company details, services offered, and pricing.
- **Communications:** Messages exchanged through our platform, including estimate requests, job responses, and client portal messages.
- **Payment Information:** Billing details processed through our third-party payment providers (we do not store full payment card details).
- **Content:** Reviews, project showcases, and any other content you submit.

### 2.2 Information Collected Automatically
- **Usage Data:** Pages visited, features used, time spent on the platform, and interaction patterns.
- **Device Information:** Browser type, operating system, device type, and screen resolution.
- **Location Data:** Approximate location based on IP address or, with your consent, more precise location for features like the On-Duty Map and local discovery.
- **Cookies and Tracking:** We use cookies and similar technologies to maintain sessions, remember preferences, and analyze usage.

## 3. How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our platform and services
- Create and manage your account and digital business card
- Facilitate connections between customers and professionals
- Process estimate requests, bookings, and job matches
- Send notifications about leads, bookings, and platform updates
- Display your profile in our marketplace and discovery features (when enabled)
- Show approximate location on the On-Duty Map (with privacy controls)
- Generate analytics and performance insights for your business
- Provide AI-powered features such as content generation and business suggestions
- Prevent fraud and ensure platform security
- Comply with legal obligations

## 4. Information Sharing

We do **not** sell your personal information. We may share information in the following circumstances:

- **Public Profile:** Your business profile, reviews, and services are visible to other users when marketplace visibility is enabled.
- **Service Connections:** When a customer requests an estimate or books a service, relevant contact information is shared between parties.
- **Service Providers:** We use third-party services for hosting, email delivery, payment processing, and analytics. These providers are bound by confidentiality agreements.
- **Legal Requirements:** We may disclose information if required by law, regulation, legal process, or governmental request.
- **Business Transfers:** In the event of a merger, acquisition, or sale of assets, user information may be transferred.

## 5. Location Data & Privacy

- **Approximate Locations Only:** The On-Duty Map and discovery features use approximate locations (city/service area level) to protect your privacy. We do not display exact business or home addresses.
- **Opt-In Control:** Location-based features are optional. You control your marketplace visibility and on-duty status.
- **Customer Location:** Customer geolocation is used only for local search and is not stored permanently.

## 6. Data Security

We implement industry-standard security measures including:
- Encryption in transit (TLS/SSL) and at rest
- Row-level security on database tables
- Secure authentication with email verification
- Regular security assessments

However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.

## 7. Data Retention

- We retain your account data for as long as your account is active.
- You can request deletion of your account and associated data at any time.
- Certain data may be retained as required by law or for legitimate business purposes (e.g., transaction records).
- Analytics and aggregated data may be retained in anonymized form.

## 8. Your Rights

Depending on your jurisdiction, you may have the right to:
- Access the personal data we hold about you
- Correct inaccurate or incomplete data
- Delete your personal data
- Object to or restrict processing of your data
- Data portability (receive your data in a structured format)
- Withdraw consent at any time

To exercise these rights, contact us at privacy@guzzl.pro.

## 9. Children's Privacy

guzzl.pro is not intended for individuals under the age of 18. We do not knowingly collect personal information from children.

## 10. Third-Party Links

Our platform may contain links to third-party websites or services. We are not responsible for their privacy practices. We encourage you to review their privacy policies.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date.

## 12. Contact Us

If you have questions about this Privacy Policy, please contact us at:

**Email:** privacy@guzzl.pro
**Platform:** guzzl.pro
`;

const TERMS_OF_SERVICE = `
## 1. Acceptance of Terms

By accessing or using guzzl.pro ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Platform.

## 2. Description of Service

guzzl.pro is a digital business card and professional marketplace platform that enables:
- Creation and management of digital business cards
- Customer discovery and local professional search
- Estimate requests, bookings, and job matching
- CRM, invoicing, and business management tools
- AI-powered content generation and business insights

## 3. Account Registration

- You must provide accurate and complete information when creating an account.
- You are responsible for maintaining the security of your account credentials.
- You must be at least 18 years old to create an account.
- One person or business may maintain one primary account.
- You are responsible for all activity that occurs under your account.

## 4. User Conduct

You agree **not** to:
- Provide false or misleading information in your profile or listings
- Impersonate another person or business
- Use the platform for any unlawful purpose
- Send spam, unsolicited messages, or engage in harassment
- Attempt to gain unauthorized access to the platform or other users' accounts
- Scrape, crawl, or use automated means to access the platform without permission
- Interfere with or disrupt the platform's infrastructure
- Post content that is defamatory, obscene, or violates third-party rights

## 5. Professional Listings & Marketplace

- **Accuracy:** Professionals are responsible for ensuring their profile, services, and pricing are accurate and up-to-date.
- **Availability:** The On-Duty feature and availability status must reflect your genuine availability.
- **Responses:** When you accept a lead or estimate request, you are expected to respond in a timely and professional manner.
- **Reviews:** Reviews must be honest and based on genuine experiences. We reserve the right to remove fraudulent reviews.
- **Rankings:** Marketplace rankings are based on organic factors including profile completeness, response speed, reviews, and activity. Manipulation of rankings is prohibited.

## 6. Estimate Requests & Job Matching

- guzzl.pro facilitates connections between customers and professionals but is **not a party** to any agreement, transaction, or contract between them.
- We do not guarantee the quality, safety, legality, or timeliness of services provided by professionals.
- Customers and professionals are solely responsible for their interactions, agreements, and disputes.
- Pricing and quotes provided through the platform are estimates only unless otherwise agreed between parties.

## 7. Payments & Subscriptions

- **Free Tier:** Basic features are available at no cost with usage limits.
- **Paid Plans:** Pro and Agency plans offer additional features and higher limits. Pricing is available on our pricing page.
- **Billing:** Subscriptions are billed on a recurring basis. You can cancel at any time.
- **Refunds:** Refunds are handled on a case-by-case basis. Contact support for assistance.
- **Invoice Payments:** Payments processed through invoices are between the professional and their client. guzzl.pro is not responsible for payment disputes.

## 8. Intellectual Property

- **Your Content:** You retain ownership of content you create on the platform (profile, projects, posts). By posting, you grant us a non-exclusive license to display and distribute that content on the platform.
- **AI-Generated Content:** Content generated by our AI tools is provided for your use but may not be unique. You are responsible for reviewing and customizing AI-generated content.
- **Our Platform:** The guzzl.pro platform, including its design, code, features, and branding, is owned by us and protected by intellectual property laws.
- **Trademarks:** "guzzl.pro" and "CardPilot" are our trademarks. You may not use them without permission.

## 9. Privacy

Your use of the platform is also governed by our [Privacy Policy](/privacy). Please review it to understand how we collect, use, and protect your information.

## 10. Limitation of Liability

To the maximum extent permitted by law:
- guzzl.pro is provided "as is" and "as available" without warranties of any kind.
- We are not liable for any indirect, incidental, special, consequential, or punitive damages.
- Our total liability shall not exceed the amount you paid to us in the 12 months preceding the claim.
- We are not responsible for the actions, content, or services of third-party professionals or users.

## 11. Indemnification

You agree to indemnify and hold harmless guzzl.pro, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the platform or violation of these Terms.

## 12. Termination

- You may delete your account at any time through the platform settings.
- We reserve the right to suspend or terminate accounts that violate these Terms or engage in abusive behavior.
- Upon termination, your right to use the platform ceases. Certain provisions survive termination (including Limitation of Liability, Indemnification, and Governing Law).

## 13. Modifications to Terms

We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the modified Terms. Material changes will be communicated via email or platform notification.

## 14. Governing Law

These Terms are governed by and construed in accordance with applicable laws. Any disputes shall be resolved through binding arbitration or in the courts of competent jurisdiction.

## 15. Severability

If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.

## 16. Contact

For questions about these Terms, contact us at:

**Email:** support@guzzl.pro
**Platform:** guzzl.pro
`;

const DEFAULTS: Record<string, { title: string; body: string }> = {
  privacy: { title: "Privacy Policy", body: PRIVACY_POLICY },
  terms: { title: "Terms of Service", body: TERMS_OF_SERVICE },
};

export default function LegalPage({ pageKey }: { pageKey: string }) {
  const config = DEFAULTS[pageKey] || { title: "Legal", body: "" };
  const { data: page, isLoading } = useLandingPage(pageKey);

  // Try DB content first, fall back to hardcoded
  const sections = (page?.sections_json || []) as LandingPageSection[];
  const legalSection = sections.find((s) => s.type === "legal_content" && s.enabled);

  const title = legalSection?.content?.title || config.title;
  const body = legalSection?.content?.body || config.body;
  const lastUpdated = legalSection?.content?.last_updated || "March 19, 2026";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} | guzzl.pro</title>
        <meta name="description" content={`${title} for guzzl.pro — the digital business card and professional marketplace platform.`} />
      </Helmet>

      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-foreground">
            guzzl.pro
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {pageKey !== "privacy" && (
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
            )}
            {pageKey !== "terms" && (
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
            )}
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-6">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} guzzl.pro. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
