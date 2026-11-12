/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { leadName?: string; service?: string }
const LeadReminderEmail = ({ leadName, service }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{leadName || 'A customer'} is waiting to hear from you</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }}>
      <Container style={{ padding: '32px', maxWidth: '520px' }}>
        <Text style={{ fontSize: '24px', margin: '0 0 24px' }}>
          <span style={{ fontWeight: 800, color: 'hsl(230, 76%, 55%)' }}>guzzl</span>
          <span style={{ color: 'hsl(222, 47%, 11%)' }}>.pro</span>
        </Text>
        <Heading style={{ fontSize: '22px', color: 'hsl(222, 47%, 11%)' }}>Reply while they're still deciding</Heading>
        <Text style={{ fontSize: '15px', color: 'hsl(220, 9%, 46%)' }}>
          {leadName || 'A customer'} asked about {service || 'your services'} and hasn't heard back yet.
        </Text>
        <Button href="https://guzzl.pro/app/contacts" style={{ backgroundColor: 'hsl(230, 76%, 55%)', color: '#ffffff', padding: '14px 28px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none' }}>
          Open my contacts
        </Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LeadReminderEmail,
  subject: (data: Record<string, any>) => `Reminder: ${data?.leadName || 'A customer'} is waiting to hear from you`,
  displayName: 'Lead reminder',
  previewData: { leadName: 'Jane', service: 'Drain repair' },
} satisfies TemplateEntry
