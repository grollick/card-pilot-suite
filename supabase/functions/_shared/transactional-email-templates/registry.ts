/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as bookingConfirmation } from './booking-confirmation.tsx'
import { template as bookingConfirmed } from './booking-confirmed.tsx'
import { template as bookingCancelled } from './booking-cancelled.tsx'
import { template as welcome } from './welcome.tsx'
import { template as estimateSent } from './estimate-sent.tsx'
import { template as reviewRequest } from './review-request.tsx'
import { template as platformInvite } from './platform-invite.tsx'
import { template as newLead } from './new-lead.tsx'
import { template as leadReminder } from './lead-reminder.tsx'
import { template as estimateResponse } from './estimate-response.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmation': bookingConfirmation,
  'booking-confirmed': bookingConfirmed,
  'booking-cancelled': bookingCancelled,
  'welcome': welcome,
  'estimate-sent': estimateSent,
  'review-request': reviewRequest,
  'platform-invite': platformInvite,
  'new-lead': newLead,
  'lead-reminder': leadReminder,
  'estimate-response': estimateResponse,
}
