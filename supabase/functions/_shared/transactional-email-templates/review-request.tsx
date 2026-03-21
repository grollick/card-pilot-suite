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
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'guzzl.pro'

interface ReviewRequestProps {
  customerName?: string
  providerName?: string
  serviceName?: string
  handle?: string
}

const ReviewRequestEmail = ({
  customerName,
  providerName,
  serviceName,
  handle,
}: ReviewRequestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      How was your experience with {providerName || 'your service provider'}?
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>
          <span style={brandBold}>guzzl</span>
          <span style={brandDot}>.pro</span>
        </Text>
        <Heading style={h1}>
          {customerName ? `Hi ${customerName},` : 'Hi,'} how did it go? ⭐
        </Heading>
        <Text style={text}>
          {serviceName
            ? `Your ${serviceName} with ${providerName || 'your provider'} has been marked as complete.`
            : `Your appointment with ${providerName || 'your provider'} has been marked as complete.`}
        </Text>
        <Text style={text}>
          We'd love to hear how it went! Your feedback helps other customers make
          informed decisions and helps {providerName || 'the provider'} continue
          improving their service.
        </Text>
        {handle && (
          <Button style={button} href={`https://guzzl.pro/${handle}?review=true`}>
            Leave a Review →
          </Button>
        )}
        <Text style={smallText}>
          It only takes 30 seconds — and it means a lot.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          This email was sent by {SITE_NAME} on behalf of{' '}
          {providerName || 'a service professional'}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReviewRequestEmail,
  subject: (data: Record<string, any>) =>
    data?.providerName
      ? `How was your experience with ${data.providerName}?`
      : 'How was your experience?',
  displayName: 'Review request',
  previewData: {
    customerName: 'Sarah',
    providerName: "Mike's Cleaning Co.",
    serviceName: 'Deep Cleaning',
    handle: 'mike-cleaning',
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
const smallText = {
  fontSize: '13px',
  color: 'hsl(220, 9%, 46%)',
  lineHeight: '1.5',
  margin: '16px 0 0',
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
