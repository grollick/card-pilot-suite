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
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'guzzl.pro'

interface EstimateSentProps {
  customerName?: string
  providerName?: string
  estimateNumber?: string
  totalAmount?: string
  expiryDate?: string
  viewUrl?: string
}

const EstimateSentEmail = ({
  customerName,
  providerName,
  estimateNumber,
  totalAmount,
  expiryDate,
  viewUrl,
}: EstimateSentProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {providerName
        ? `${providerName} sent you an estimate`
        : 'You have a new estimate to review'}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>
          <span style={brandBold}>guzzl</span>
          <span style={brandDot}>.pro</span>
        </Text>
        <Heading style={h1}>
          {customerName ? `Hi ${customerName},` : 'Hi,'} you have a new estimate! 📋
        </Heading>
        <Text style={text}>
          {providerName
            ? `${providerName} has prepared an estimate for you.`
            : 'An estimate has been prepared for you.'}{' '}
          Please review the details below.
        </Text>
        <Section style={detailsBox}>
          {estimateNumber && (
            <Text style={detailRow}>
              <span style={detailLabel}>Estimate #</span>
              <span style={detailValue}>{estimateNumber}</span>
            </Text>
          )}
          {totalAmount && (
            <Text style={detailRow}>
              <span style={detailLabel}>Total</span>
              <span style={detailValue}>{totalAmount}</span>
            </Text>
          )}
          {expiryDate && (
            <Text style={detailRow}>
              <span style={detailLabel}>Valid until</span>
              <span style={detailValue}>{expiryDate}</span>
            </Text>
          )}
        </Section>
        {viewUrl && (
          <Button style={button} href={viewUrl}>
            View Estimate →
          </Button>
        )}
        {!viewUrl && (
          <Text style={text}>
            Please contact {providerName || 'the provider'} directly if you have
            questions or would like to proceed.
          </Text>
        )}
        <Hr style={hr} />
        <Text style={footer}>
          This estimate was sent via {SITE_NAME} on behalf of{' '}
          {providerName || 'a service professional'}.
        </Text>
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

export const template = {
  component: EstimateSentEmail,
  subject: (data: Record<string, any>) =>
    data?.estimateNumber
      ? `Estimate #${data.estimateNumber} from ${data?.providerName || SITE_NAME}`
      : `You have a new estimate from ${data?.providerName || SITE_NAME}`,
  displayName: 'Estimate sent notification',
  previewData: {
    customerName: 'Sarah',
    providerName: "Mike's Cleaning Co.",
    estimateNumber: 'EST-0042',
    totalAmount: '$1,250.00',
    expiryDate: 'April 15, 2026',
    viewUrl: 'https://guzzl.pro/estimates/preview/abc123',
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
  width: '100px',
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
const ctaBanner = {
  backgroundColor: '#f0f2ff',
  borderRadius: '10px',
  padding: '20px 24px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
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
