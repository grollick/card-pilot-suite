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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for guzzl.pro</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for guzzl.pro. Click
          the button below to choose a new password.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1E3A8A',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#555',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const button = {
  backgroundColor: '#3B82F6',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '10px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '30px 0 0' }
