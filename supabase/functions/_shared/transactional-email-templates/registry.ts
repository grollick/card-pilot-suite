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
import { template as welcome } from './welcome.tsx'
import { template as estimateSent } from './estimate-sent.tsx'
import { template as reviewRequest } from './review-request.tsx'
import { template as platformInvite } from './platform-invite.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmation': bookingConfirmation,
  'welcome': welcome,
  'estimate-sent': estimateSent,
  'review-request': reviewRequest,
  'platform-invite': platformInvite,
}
