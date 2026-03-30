
-- SMS Message Events table
create table if not exists sms_message_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  lead_id uuid references business_leads(id) on delete cascade,
  booking_id uuid references business_bookings(id) on delete set null,
  phone text,
  message_type text not null,
  message_body text not null,
  delivery_status text default 'draft',
  was_ai_generated boolean default true,
  was_user_edited boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- SMS indexes
create index if not exists idx_sms_business on sms_message_events(business_id);
create index if not exists idx_sms_lead on sms_message_events(lead_id);
create index if not exists idx_sms_booking on sms_message_events(booking_id);
create index if not exists idx_sms_status on sms_message_events(delivery_status);
create index if not exists idx_sms_created on sms_message_events(created_at);

-- Additional indexes on existing business_notifications
create index if not exists idx_biz_notif_business on business_notifications(business_id);
create index if not exists idx_biz_notif_read on business_notifications(is_read);
create index if not exists idx_biz_notif_created on business_notifications(created_at);
create index if not exists idx_biz_notif_type on business_notifications(type);

-- Helper function for creating notifications
create or replace function create_notification(
  p_business_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_entity_type text,
  p_entity_id uuid,
  p_urgency text default 'medium'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into business_notifications (business_id, type, title, body, entity_type, entity_id, urgency)
  values (p_business_id, p_type, p_title, p_body, p_entity_type, p_entity_id, p_urgency);
end;
$$;

-- RLS for sms_message_events
alter table sms_message_events enable row level security;

create policy "sms_owner_access"
on sms_message_events
for all
using (
  exists (
    select 1 from businesses b
    where b.id = business_id
    and b.owner_user_id = auth.uid()
  )
);
