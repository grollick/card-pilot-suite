/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { customerName?: string; decision?: string; estimateNumber?: string; totalAmount?: string; note?: string | null }
const EstimateResponseEmail = ({ customerName, decision, estimateNumber, totalAmount, note }: Props) => {
  const verb = decision === 'approved' ? 'approved' : 'declined'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${customerName || 'Your customer'} ${verb} estimate ${estimateNumber || ''}`}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }}>
        <Container style={{ padding: '32px', maxWidth: '520px' }}>
          <Heading style={{ color: 'hsl(217, 91%, 60%)', fontSize: '22px' }}>
            {customerName || 'Your customer'} {verb} estimate {estimateNumber}
          </Heading>
          <Text>Total: {totalAmount}{note ? ` · "${note}"` : ''}</Text>
          <Button href="https://guzzl.pro/app/estimates" style={{ backgroundColor: 'hsl(217, 91%, 60%)', color: '#ffffff', padding: '12px 20px', borderRadius: '6px' }}>
            Open estimates
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
export const template = {
  component: EstimateResponseEmail,
  subject: (d: Record<string, any>) => `${d.customerName || 'Your customer'} ${d.decision === 'approved' ? 'approved' : 'declined'} estimate ${d.estimateNumber || ''}`.trim(),
  displayName: 'Estimate response (to pro)',
  previewData: { customerName: 'Sarah Lee', decision: 'approved', estimateNumber: 'EST-0042', totalAmount: '$1,250.00', note: 'Can you start Monday?' },
} satisfies TemplateEntry
