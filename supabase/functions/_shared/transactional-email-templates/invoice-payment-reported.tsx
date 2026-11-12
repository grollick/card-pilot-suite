/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { customerName?: string; invoiceNumber?: string; amount?: string; method?: string; reference?: string | null; note?: string | null; invoiceUrl?: string }
const InvoicePaymentReportedEmail = ({ customerName, invoiceNumber, amount, method, reference, note, invoiceUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${customerName || 'Your customer'} says they paid invoice ${invoiceNumber || ''}`}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }}>
      <Container style={{ padding: '32px', maxWidth: '520px' }}>
        <Heading style={{ color: 'hsl(217, 91%, 60%)', fontSize: '22px' }}>
          {customerName || 'Your customer'} says they paid invoice {invoiceNumber}
        </Heading>
        <Text>Amount due: {amount}</Text>
        <Text>How they paid: {method}</Text>
        {reference ? <Text>Reference: {reference}</Text> : null}
        {note ? <Text>Note: "{note}"</Text> : null}
        <Text>Check that the money arrived, then mark the invoice paid.</Text>
        <Button href={invoiceUrl || 'https://guzzl.pro/app/invoices'} style={{ backgroundColor: 'hsl(217, 91%, 60%)', color: '#ffffff', padding: '12px 20px', borderRadius: '6px' }}>
          Open invoice
        </Button>
      </Container>
    </Body>
  </Html>
)
export const template = {
  component: InvoicePaymentReportedEmail,
  subject: (d: Record<string, any>) => `${d.customerName || 'Your customer'} says they paid invoice ${d.invoiceNumber || ''}`.trim(),
  displayName: 'Customer payment report (to pro)',
  previewData: { customerName: 'Sarah Lee', invoiceNumber: 'INV-2611-1234', amount: '$1,250.00', method: 'e-transfer', reference: '12345', note: 'Sent this morning', invoiceUrl: 'https://guzzl.pro/app/invoices' },
} satisfies TemplateEntry
