import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { name?: string; email?: string; phone?: string; message?: string; title?: string }
const NewLeadEmail = ({ name, email, phone, message, title }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>A customer reached out through guzzl.pro.</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }}>
      <Container style={{ padding: '32px', maxWidth: '520px' }}>
        <Heading style={{ color: 'hsl(217, 91%, 60%)' }}>New enquiry on guzzl.pro</Heading>
        {title && <Text>{title}</Text>}
        <Text>Name: {name || 'Customer'}</Text>
        {email && <Text>Email: {email}</Text>}
        {phone && <Text>Phone: {phone}</Text>}
        {message && <Text style={{ whiteSpace: 'pre-wrap' }}>{message}</Text>}
        <Button href="https://guzzl.pro/app/contacts" style={{ backgroundColor: 'hsl(217, 91%, 60%)', color: '#ffffff', padding: '12px 20px', borderRadius: '6px' }}>View contact</Button>
      </Container>
    </Body>
  </Html>
)
export const template = {
  component: NewLeadEmail,
  subject: (data: Record<string, unknown>) => `New lead captured: ${data.name || 'Customer'}`,
  displayName: 'New lead notification',
} satisfies TemplateEntry