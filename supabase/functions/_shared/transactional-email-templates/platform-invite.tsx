/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
  Section,
  Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'guzzl.pro'
const SITE_URL = 'https://guzzl.pro'

interface PlatformInviteProps {
  recipientName?: string
  senderName?: string
  personalMessage?: string
  referralCode?: string
}

const PlatformInviteEmail = ({ recipientName, senderName, personalMessage, referralCode }: PlatformInviteProps) => {
  const signupUrl = referralCode ? `${SITE_URL}/ref/${referralCode}` : `${SITE_URL}/get-started`
  const greeting = recipientName ? `Hey ${recipientName},` : `Hey there,`
  const sender = senderName || 'The guzzl.pro team'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{sender} invited you to try {SITE_NAME} — your free digital business card</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={logo}>guzzl<span style={logoDot}>.pro</span></Text>
          </Section>

          <Heading style={h1}>{greeting}</Heading>

          <Text style={text}>
            {senderName
              ? `${senderName} thinks you'd love guzzl.pro — the free digital business card that helps local professionals get more customers.`
              : `You've been personally invited to try guzzl.pro — the free digital business card that helps local professionals get more customers.`
            }
          </Text>

          {personalMessage && (
            <Section style={messageBox}>
              <Text style={messageLabel}>Personal note from {senderName || 'the sender'}:</Text>
              <Text style={messageText}>"{personalMessage}"</Text>
            </Section>
          )}

          <Section style={benefitsSection}>
            <Heading as="h2" style={h2}>What you get — completely free:</Heading>
            <Text style={benefitItem}>✅ A stunning digital business card in 2 minutes</Text>
            <Text style={benefitItem}>✅ Built-in booking, CRM, and lead capture</Text>
            <Text style={benefitItem}>✅ QR code to share anywhere — cards, flyers, trucks</Text>
            <Text style={benefitItem}>✅ AI-powered social posts to grow your reach</Text>
            <Text style={benefitItem}>✅ Get found on the guzzl.pro marketplace</Text>
          </Section>

          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button style={button} href={signupUrl}>
              Get Your Free Card →
            </Button>
          </Section>

          <Text style={subText}>
            It takes less than 2 minutes. No credit card needed. Just pick your profession and go.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This is a personal invitation from {sender}. You're receiving this because someone thought guzzl.pro could help your business grow.
          </Text>

          {/* CTA banner */}
          <Section style={ctaBanner}>
            <Text style={ctaText}>Join 1,000+ local pros already on guzzl.pro</Text>
            <Button style={ctaButton} href={signupUrl}>
              Claim Your Free Card
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PlatformInviteEmail,
  subject: (data: Record<string, any>) =>
    data?.senderName
      ? `${data.senderName} invited you to guzzl.pro`
      : `You're invited to guzzl.pro — your free digital business card`,
  displayName: 'Platform invite (1:1)',
  previewData: {
    recipientName: 'Marcus',
    senderName: 'Jordan',
    personalMessage: "Hey Marcus, I set up my card on guzzl.pro and it has been awesome for getting new clients. You should check it out!",
    referralCode: 'JORDAN2024',
  },
} satisfies TemplateEntry

// ── Styles ──
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '16px 0 8px' }
const logo = { fontSize: '28px', fontWeight: '900' as const, color: 'hsl(230, 76%, 55%)', margin: '0', letterSpacing: '-0.5px' }
const logoDot = { color: 'hsl(222, 47%, 11%)' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: 'hsl(222, 47%, 11%)', margin: '24px 0 16px', lineHeight: '1.3' }
const h2 = { fontSize: '16px', fontWeight: '600' as const, color: 'hsl(222, 47%, 11%)', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const subText = { fontSize: '13px', color: '#888888', lineHeight: '1.5', margin: '0 0 20px', textAlign: 'center' as const }
const messageBox = {
  backgroundColor: '#f8f9ff',
  borderRadius: '10px',
  padding: '16px 20px',
  margin: '0 0 24px',
  borderLeft: '3px solid hsl(230, 76%, 55%)',
}
const messageLabel = { fontSize: '11px', color: '#999999', margin: '0 0 6px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: '600' as const }
const messageText = { fontSize: '14px', color: 'hsl(222, 47%, 11%)', margin: '0', fontStyle: 'italic' as const, lineHeight: '1.5' }
const benefitsSection = { margin: '0 0 8px' }
const benefitItem = { fontSize: '14px', color: 'hsl(222, 47%, 11%)', margin: '0 0 8px', lineHeight: '1.5' }
const button = {
  backgroundColor: 'hsl(230, 76%, 55%)',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700' as const,
  borderRadius: '10px',
  padding: '16px 32px',
  textDecoration: 'none',
}
const hr = { borderColor: '#eaeaea', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#999999', lineHeight: '1.5', margin: '0 0 16px' }
const ctaBanner = {
  backgroundColor: '#f0f2ff',
  borderRadius: '10px',
  padding: '20px 24px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
const ctaText = { fontSize: '14px', color: 'hsl(222, 47%, 11%)', fontWeight: '600' as const, margin: '0 0 12px' }
const ctaButton = {
  backgroundColor: 'hsl(230, 76%, 55%)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '10px 20px',
  textDecoration: 'none',
}
