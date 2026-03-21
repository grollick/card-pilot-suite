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
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'guzzl.pro'

interface WelcomeEmailProps {
  name?: string
  handle?: string
}

const WelcomeEmail = ({ name, handle }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — let's get you set up!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>
          <span style={brandBold}>guzzl</span>
          <span style={brandDot}>.pro</span>
        </Text>
        <Heading style={h1}>
          {name ? `Hey ${name}, welcome aboard! 👋` : 'Welcome aboard! 👋'}
        </Heading>
        <Text style={text}>
          You've just joined the fastest way for service professionals to get discovered,
          booked, and paid. Here's how to hit the ground running:
        </Text>
        <Section style={stepsBox}>
          <Text style={stepItem}>
            <span style={stepNumber}>1</span>
            <span>Build your digital business card</span>
          </Text>
          <Text style={stepItem}>
            <span style={stepNumber}>2</span>
            <span>Set up your booking availability</span>
          </Text>
          <Text style={stepItem}>
            <span style={stepNumber}>3</span>
            <span>Share your link &amp; start getting leads</span>
          </Text>
        </Section>
        <Button style={button} href={`https://guzzl.pro/dashboard`}>
          Go to Dashboard →
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Questions? Just reply to this email — we're here to help.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: `Welcome to ${SITE_NAME} — let's get started!`,
  displayName: 'Welcome email',
  previewData: {
    name: 'Jane',
    handle: 'jane-plumbing',
  },
} satisfies TemplateEntry

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
  fontSize: '22px',
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
const stepsBox = {
  backgroundColor: '#f8f9fb',
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '0 0 24px',
}
const stepItem = {
  fontSize: '15px',
  color: 'hsl(222, 47%, 11%)',
  margin: '0 0 12px',
  lineHeight: '1.5',
  display: 'flex' as const,
  alignItems: 'center' as const,
  gap: '12px',
}
const stepNumber = {
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: 'hsl(230, 76%, 55%)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '700' as const,
  flexShrink: 0,
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
const hr = {
  borderColor: '#eaeaea',
  margin: '32px 0',
}
const footer = {
  fontSize: '12px',
  color: '#999999',
  lineHeight: '1.5',
}
