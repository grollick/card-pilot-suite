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
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'guzzl.pro'

interface BookingConfirmationProps {
  customerName?: string
  serviceName?: string
  date?: string
  time?: string
  providerName?: string
  handle?: string
}

const BookingConfirmationEmail = ({
  customerName,
  serviceName,
  date,
  time,
  providerName,
  handle,
}: BookingConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Your booking{serviceName ? ` for ${serviceName}` : ''} is confirmed!
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>
          <span style={brandBold}>guzzl</span>
          <span style={brandDot}>.pro</span>
        </Text>
        <Heading style={h1}>
          {customerName ? `Hey ${customerName}, ` : ''}your booking is confirmed! 🎉
        </Heading>
        <Text style={text}>
          {providerName
            ? `${providerName} has received your booking request.`
            : 'Your booking request has been received.'}{' '}
          Here are the details:
        </Text>
        <Section style={detailsBox}>
          {serviceName && (
            <Text style={detailRow}>
              <span style={detailLabel}>Service</span>
              <span style={detailValue}>{serviceName}</span>
            </Text>
          )}
          {date && (
            <Text style={detailRow}>
              <span style={detailLabel}>Date</span>
              <span style={detailValue}>{date}</span>
            </Text>
          )}
          {time && (
            <Text style={detailRow}>
              <span style={detailLabel}>Time</span>
              <span style={detailValue}>{time}</span>
            </Text>
          )}
          {providerName && (
            <Text style={detailRow}>
              <span style={detailLabel}>With</span>
              <span style={detailValue}>{providerName}</span>
            </Text>
          )}
        </Section>
        <Text style={text}>
          You'll receive another notification once your appointment is confirmed
          by {providerName || 'the provider'}. If you need to make any changes,
          please reach out directly.
        </Text>
        {handle && (
          <Button
            style={button}
            href={`https://guzzl.pro/${handle}`}
          >
            View Business Card →
          </Button>
        )}
        <Hr style={hr} />
        <Text style={footer}>
          This email was sent by {SITE_NAME} on behalf of {providerName || 'a service professional'}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingConfirmationEmail,
  subject: (data: Record<string, any>) =>
    data?.serviceName
      ? `Booking confirmed: ${data.serviceName}`
      : 'Your booking is confirmed!',
  displayName: 'Booking confirmation',
  previewData: {
    customerName: 'Jane',
    serviceName: 'Deep Cleaning',
    date: 'Saturday, March 22, 2026',
    time: '10:00 AM – 11:30 AM',
    providerName: 'Mike\'s Cleaning Co.',
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
const detailsBox = {
  backgroundColor: '#f8f9fb',
  borderRadius: '10px',
  padding: '20px 24px',
  margin: '0 0 24px',
}
const detailRow = {
  fontSize: '14px',
  color: 'hsl(222, 47%, 11%)',
  margin: '0 0 8px',
  lineHeight: '1.5',
}
const detailLabel = {
  color: 'hsl(220, 9%, 46%)',
  display: 'inline-block' as const,
  width: '80px',
}
const detailValue = {
  fontWeight: '600' as const,
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
