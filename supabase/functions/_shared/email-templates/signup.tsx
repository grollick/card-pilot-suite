/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Verify your email for guzzl.pro</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>
          <span style={brandBold}>guzzl</span>
          <span style={brandDot}>.pro</span>
        </Text>
        <Heading style={h1}>Welcome aboard! 🎉</Heading>
        <Text style={text}>
          Thanks for creating your guzzl.pro account. You're one step away from
          your smart digital business card and growth suite.
        </Text>
        <Text style={text}>
          Please verify your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to get started:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify My Email →
        </Button>
        <Text style={footer}>
          If you didn't create an account on guzzl.pro, you can safely ignore
          this email.
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

export default SignupEmail

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
const link = { color: 'hsl(230, 76%, 55%)', textDecoration: 'underline' }
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
