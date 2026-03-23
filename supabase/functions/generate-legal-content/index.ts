import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { policy_type, business_name, business_description } = await req.json();

    const isPrivacy = policy_type === "privacy_policy";
    const title = isPrivacy ? "Privacy Policy" : "Terms of Service";

    const prompt = isPrivacy
      ? `Generate a comprehensive, professional Privacy Policy for "${business_name}". ${business_description}. Include sections for: Information We Collect, How We Use Information, Information Sharing, Data Security, Cookies and Tracking, Your Rights, Children's Privacy, Changes to This Policy, Contact Us. Use markdown formatting. Include today's date as the effective date. Make it legally sound but readable.`
      : `Generate comprehensive, professional Terms of Service for "${business_name}". ${business_description}. Include sections for: Acceptance of Terms, Description of Service, User Accounts, User Responsibilities, Intellectual Property, Payment Terms, Limitation of Liability, Disclaimers, Termination, Governing Law, Changes to Terms, Contact Information. Use markdown formatting. Include today's date as the effective date. Make it legally sound but readable.`;

    const response = await fetch("https://yxsnqhuilqdvqrmkjxzf.supabase.co/functions/v1/ai-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": req.headers.get("Authorization") || "",
      },
      body: JSON.stringify({
        prompt,
        model: "google/gemini-2.5-flash",
      }),
    });

    if (!response.ok) {
      // Fallback: generate a template directly
      const content = isPrivacy
        ? generatePrivacyTemplate(business_name)
        : generateTermsTemplate(business_name);
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || data?.content || data?.text || (isPrivacy ? generatePrivacyTemplate(business_name) : generateTermsTemplate(business_name));

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generatePrivacyTemplate(businessName: string): string {
  return `# Privacy Policy

**Effective Date:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

## 1. Information We Collect

${businessName} collects information you provide directly, including your name, email address, phone number, and business information when you create an account or use our services.

## 2. How We Use Your Information

We use your information to:
- Provide and maintain our services
- Send you updates and marketing communications
- Improve our platform and user experience
- Process transactions and send related information

## 3. Information Sharing

We do not sell your personal information. We may share information with:
- Service providers who assist in operating our platform
- Law enforcement when required by law
- Business partners with your consent

## 4. Data Security

We implement industry-standard security measures to protect your data, including encryption in transit and at rest.

## 5. Cookies and Tracking

We use cookies and similar technologies to improve your experience, analyze usage patterns, and deliver personalized content.

## 6. Your Rights

You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Opt out of marketing communications

## 7. Children's Privacy

Our services are not directed to children under 13. We do not knowingly collect personal information from children.

## 8. Changes to This Policy

We may update this policy from time to time. We will notify you of significant changes via email or through our platform.

## 9. Contact Us

If you have questions about this Privacy Policy, please contact us through our platform.`;
}

function generateTermsTemplate(businessName: string): string {
  return `# Terms of Service

**Effective Date:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

## 1. Acceptance of Terms

By accessing or using ${businessName}, you agree to be bound by these Terms of Service.

## 2. Description of Service

${businessName} provides a digital business card and CRM platform for service professionals, including lead management, booking, invoicing, and marketing tools.

## 3. User Accounts

You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.

## 4. User Responsibilities

You agree to:
- Provide accurate and complete information
- Use the service in compliance with applicable laws
- Not misuse or abuse the platform
- Not attempt to gain unauthorized access

## 5. Intellectual Property

All content, features, and functionality of ${businessName} are owned by us and protected by intellectual property laws.

## 6. Payment Terms

Paid features are billed according to the plan you select. All fees are non-refundable unless otherwise stated.

## 7. Limitation of Liability

${businessName} is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages.

## 8. Disclaimers

We do not guarantee uninterrupted or error-free service. We reserve the right to modify or discontinue features at any time.

## 9. Termination

We may suspend or terminate your account for violations of these terms. You may cancel your account at any time.

## 10. Governing Law

These terms are governed by applicable laws. Any disputes shall be resolved through binding arbitration.

## 11. Changes to Terms

We may update these terms from time to time. Continued use after changes constitutes acceptance.

## 12. Contact Information

For questions about these Terms of Service, please contact us through our platform.`;
}
