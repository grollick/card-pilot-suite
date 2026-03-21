/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join guzzl.pro</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>
          <span style={brandBold}>guzzl</span>
          <span style={brandDot}>.pro</span>
        </Text>
        <Heading style={h1}>You've been invited!</Heading>
        <Text style={text}>
          Someone has invited you to join their team on guzzl.pro — the smart
          business card and growth platform for service professionals.
        </Text>
        <Text style={text}>
          Click the button below to accept and create your account:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation →
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
        <Hr style={hr} />
        <Section style={ctaBanner}>
          <Text style={ctaText}>Are you a service professional?</Text>
          <Button style={ctaButton} href="https://guzzl.pro/onboarding">
            Get Your Free guzzl.pro Business Card →
          </Button>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Inter', 'DM Sans', Arial, sans-serif",
}
const container = { padding: '40px 32px' }
const brand = {
  fontSize: '24px',
  fontWeight: '400' as const,
  margin: '0 0 32px',
}
const brandBold = {
  fontWeight: '800' as const,
  color: 'hsl(230, 76%, 55%)',
}
const brandDot = {
  color: 'hsl(222, 47%, 11%)',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(222, 47%, 11%)',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(220, 9%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: 'hsl(230, 76%, 55%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = {
  fontSize: '13px',
  color: '#999999',
  margin: '32px 0 0',
  lineHeight: '1.5',
}
const hr = {
  borderColor: '#eaeaea',
  margin: '24px 0',
}
const ctaBanner = {
  backgroundColor: '#f0f2ff',
  borderRadius: '10px',
  padding: '20px 24px',
  textAlign: 'center' as const,
}
const ctaText = {
  fontSize: '14px',
  color: 'hsl(222, 47%, 11%)',
  fontWeight: '600' as const,
  margin: '0 0 12px',
}
const ctaButton = {
  backgroundColor: 'hsl(230, 76%, 55%)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '10px 20px',
  textDecoration: 'none',
}
