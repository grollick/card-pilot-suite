export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          handle: string
          id: string
          lead_id: string | null
          meta_json: Json | null
          org_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          handle: string
          id?: string
          lead_id?: string | null
          meta_json?: Json | null
          org_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          handle?: string
          id?: string
          lead_id?: string | null
          meta_json?: Json | null
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          enabled: boolean
          id: string
          org_id: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          enabled?: boolean
          id?: string
          org_id?: string | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          enabled?: boolean
          id?: string
          org_id?: string | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          buffer_min: number
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          org_id: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          buffer_min?: number
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          org_id?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          buffer_min?: number
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          org_id?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_min: number
          id: string
          name: string
          org_id: string | null
          price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          name: string
          org_id?: string | null
          price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          name?: string
          org_id?: string | null
          price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          end_datetime: string
          id: string
          internal_notes: string | null
          lead_id: string | null
          notes: string | null
          org_id: string | null
          service_id: string | null
          start_datetime: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          end_datetime: string
          id?: string
          internal_notes?: string | null
          lead_id?: string | null
          notes?: string | null
          org_id?: string | null
          service_id?: string | null
          start_datetime: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          end_datetime?: string
          id?: string
          internal_notes?: string | null
          lead_id?: string | null
          notes?: string | null
          org_id?: string | null
          service_id?: string | null
          start_datetime?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          created_at: string
          font_family: string | null
          id: string
          logo_url: string | null
          org_id: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          font_family?: string | null
          id?: string
          logo_url?: string | null
          org_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          font_family?: string | null
          id?: string
          logo_url?: string | null
          org_id?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_emails: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          lead_id: string
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_email_status"]
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          lead_id: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_email_status"]
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_email_status"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_emails_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          published_at: string | null
          sections_json: Json
          status: Database["public"]["Enums"]["card_status"]
          theme_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          published_at?: string | null
          sections_json?: Json
          status?: Database["public"]["Enums"]["card_status"]
          theme_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          published_at?: string | null
          sections_json?: Json
          status?: Database["public"]["Enums"]["card_status"]
          theme_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by_user_id: string | null
          description: string | null
          id: string
          lead_id: string
          occurred_at: string
          org_id: string | null
          related_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          lead_id: string
          occurred_at?: string
          org_id?: string | null
          related_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by_user_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          occurred_at?: string
          org_id?: string | null
          related_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          created_at: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_palettes: {
        Row: {
          created_at: string
          id: string
          name: string
          palette: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          palette?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          palette?: Json
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          org_id: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          calc_depth: number
          calc_length: number
          calc_mode: string
          calc_width: number
          created_at: string
          description: string | null
          estimate_id: string
          id: string
          is_optional: boolean
          labor_hours: number | null
          labor_rate: number | null
          line_total: number
          markup_percent: number | null
          material_cost: number | null
          quantity: number
          section_id: string | null
          sort_order: number
          tax_percent: number | null
          title: string
          unit: string | null
          unit_price: number
        }
        Insert: {
          calc_depth?: number
          calc_length?: number
          calc_mode?: string
          calc_width?: number
          created_at?: string
          description?: string | null
          estimate_id: string
          id?: string
          is_optional?: boolean
          labor_hours?: number | null
          labor_rate?: number | null
          line_total?: number
          markup_percent?: number | null
          material_cost?: number | null
          quantity?: number
          section_id?: string | null
          sort_order?: number
          tax_percent?: number | null
          title: string
          unit?: string | null
          unit_price?: number
        }
        Update: {
          calc_depth?: number
          calc_length?: number
          calc_mode?: string
          calc_width?: number
          created_at?: string
          description?: string | null
          estimate_id?: string
          id?: string
          is_optional?: boolean
          labor_hours?: number | null
          labor_rate?: number | null
          line_total?: number
          markup_percent?: number | null
          material_cost?: number | null
          quantity?: number
          section_id?: string | null
          sort_order?: number
          tax_percent?: number | null
          title?: string
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "estimate_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_presets: {
        Row: {
          created_at: string
          id: string
          name: string
          preset_type: string
          sort_order: number
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          preset_type: string
          sort_order?: number
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          preset_type?: string
          sort_order?: number
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      estimate_sections: {
        Row: {
          created_at: string
          estimate_id: string
          id: string
          name: string
          notes: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          estimate_id: string
          id?: string
          name: string
          notes?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          estimate_id?: string
          id?: string
          name?: string
          notes?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_sections_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approved_at: string | null
          booking_id: string | null
          converted_booking_id: string | null
          created_at: string
          declined_at: string | null
          deposit_amount: number
          deposit_percent: number
          discount_amount: number
          discount_percent: number
          estimate_number: string
          expiry_date: string | null
          grand_total: number
          id: string
          internal_notes: string | null
          issue_date: string
          job_address: string | null
          job_type: string | null
          labor_total: number
          lead_id: string | null
          markup_total: number
          material_total: number
          notes: string | null
          org_id: string | null
          scope_of_work: string | null
          status: Database["public"]["Enums"]["estimate_status"]
          subtotal: number
          tax_total: number
          template_key: string | null
          terms_conditions: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          booking_id?: string | null
          converted_booking_id?: string | null
          created_at?: string
          declined_at?: string | null
          deposit_amount?: number
          deposit_percent?: number
          discount_amount?: number
          discount_percent?: number
          estimate_number: string
          expiry_date?: string | null
          grand_total?: number
          id?: string
          internal_notes?: string | null
          issue_date?: string
          job_address?: string | null
          job_type?: string | null
          labor_total?: number
          lead_id?: string | null
          markup_total?: number
          material_total?: number
          notes?: string | null
          org_id?: string | null
          scope_of_work?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number
          tax_total?: number
          template_key?: string | null
          terms_conditions?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          booking_id?: string | null
          converted_booking_id?: string | null
          created_at?: string
          declined_at?: string | null
          deposit_amount?: number
          deposit_percent?: number
          discount_amount?: number
          discount_percent?: number
          estimate_number?: string
          expiry_date?: string | null
          grand_total?: number
          id?: string
          internal_notes?: string | null
          issue_date?: string
          job_address?: string | null
          job_type?: string | null
          labor_total?: number
          lead_id?: string | null
          markup_total?: number
          material_total?: number
          notes?: string | null
          org_id?: string | null
          scope_of_work?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number
          tax_total?: number
          template_key?: string | null
          terms_conditions?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimates_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_converted_booking_id_fkey"
            columns: ["converted_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_steps: {
        Row: {
          body: string
          created_at: string
          delay_minutes: number
          enabled: boolean
          id: string
          step_number: number
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          delay_minutes?: number
          enabled?: boolean
          id?: string
          step_number?: number
          subject?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          delay_minutes?: number
          enabled?: boolean
          id?: string
          step_number?: number
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      followup_variants: {
        Row: {
          body: string
          created_at: string
          id: string
          step_id: string
          subject: string
          updated_at: string
          variant_key: string
          weight: number
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          step_id: string
          subject: string
          updated_at?: string
          variant_key: string
          weight?: number
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          step_id?: string
          subject?: string
          updated_at?: string
          variant_key?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "followup_variants_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "followup_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      job_materials: {
        Row: {
          created_at: string
          id: string
          job_id: string
          name: string
          notes: string | null
          quantity: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          name: string
          notes?: string | null
          quantity?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          name?: string
          notes?: string | null
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_materials_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          id: string
          job_id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          job_id: string
          photo_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          job_id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_tasks: {
        Row: {
          assigned_to_user_id: string | null
          created_at: string
          due_date: string | null
          id: string
          job_id: string
          notes: string | null
          sort_order: number
          status: string
          title: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          job_id: string
          notes?: string | null
          sort_order?: number
          status?: string
          title: string
        }
        Update: {
          assigned_to_user_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          sort_order?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          booking_id: string | null
          created_at: string
          estimate_id: string | null
          id: string
          internal_notes: string | null
          job_address: string | null
          job_number: string
          job_type: string | null
          lead_id: string | null
          notes: string | null
          org_id: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          signature_name: string | null
          signature_url: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          booking_id?: string | null
          created_at?: string
          estimate_id?: string | null
          id?: string
          internal_notes?: string | null
          job_address?: string | null
          job_number: string
          job_type?: string | null
          lead_id?: string | null
          notes?: string | null
          org_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          signature_name?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          booking_id?: string | null
          created_at?: string
          estimate_id?: string | null
          id?: string
          internal_notes?: string | null
          job_address?: string | null
          job_number?: string
          job_type?: string | null
          lead_id?: string | null
          notes?: string | null
          org_id?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          signature_name?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to_user_id: string | null
          company: string | null
          created_at: string
          custom_fields_json: Json
          email: string | null
          id: string
          last_activity_at: string | null
          lead_score: number
          lifecycle_stage: string
          name: string
          next_activity_at: string | null
          notes: string | null
          org_id: string | null
          phone: string | null
          preferred_contact_method: string | null
          preferred_language: string | null
          source: Database["public"]["Enums"]["lead_source"]
          stage_id: string | null
          status: string
          tags: string[] | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          assigned_to_user_id?: string | null
          company?: string | null
          created_at?: string
          custom_fields_json?: Json
          email?: string | null
          id?: string
          last_activity_at?: string | null
          lead_score?: number
          lifecycle_stage?: string
          name: string
          next_activity_at?: string | null
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage_id?: string | null
          status?: string
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          assigned_to_user_id?: string | null
          company?: string | null
          created_at?: string
          custom_fields_json?: Json
          email?: string | null
          id?: string
          last_activity_at?: string | null
          lead_score?: number
          lifecycle_stage?: string
          name?: string
          next_activity_at?: string | null
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_language?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage_id?: string | null
          status?: string
          tags?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          created_at: string
          id: string
          is_lost: boolean
          is_won: boolean
          name: string
          org_id: string | null
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name: string
          org_id?: string | null
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name?: string
          org_id?: string | null
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      professions: {
        Row: {
          category: string
          created_at: string
          default_booking_services: Json
          default_card_sections: Json
          default_email_templates: Json
          default_pipeline_stages: Json
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          default_booking_services?: Json
          default_card_sections?: Json
          default_email_templates?: Json
          default_pipeline_stages?: Json
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          default_booking_services?: Json
          default_card_sections?: Json
          default_email_templates?: Json
          default_pipeline_stages?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          company: string | null
          created_at: string
          current_org_id: string | null
          daily_report_enabled: boolean
          email: string | null
          followup_body: string | null
          followup_delay_minutes: number
          followup_enabled: boolean
          followup_subject: string | null
          handle: string | null
          id: string
          name: string | null
          onboarding_completed: boolean
          phone: string | null
          plan: string
          primary_cta: string | null
          profession_id: string | null
          referral_code: string | null
          referred_by: string | null
          style_pack: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          current_org_id?: string | null
          daily_report_enabled?: boolean
          email?: string | null
          followup_body?: string | null
          followup_delay_minutes?: number
          followup_enabled?: boolean
          followup_subject?: string | null
          handle?: string | null
          id: string
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          primary_cta?: string | null
          profession_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          style_pack?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          current_org_id?: string | null
          daily_report_enabled?: boolean
          email?: string | null
          followup_body?: string | null
          followup_delay_minutes?: number
          followup_enabled?: boolean
          followup_subject?: string | null
          handle?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          primary_cta?: string | null
          profession_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          style_pack?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_org_id_fkey"
            columns: ["current_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          location: string | null
          org_id: string | null
          services_used: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          org_id?: string | null
          services_used?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          org_id?: string | null
          services_used?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          active: boolean
          badge_text: string | null
          created_at: string
          description: string | null
          discount_text: string | null
          expires_at: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          badge_text?: string | null
          created_at?: string
          description?: string | null
          discount_text?: string | null
          expires_at?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          badge_text?: string | null
          created_at?: string
          description?: string | null
          discount_text?: string | null
          expires_at?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_campaigns: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string | null
          placement: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id?: string | null
          placement?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string | null
          placement?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_scans: {
        Row: {
          campaign_id: string
          created_at: string
          device: string | null
          handle: string
          id: string
          ip_hash: string | null
          lead_id: string | null
          meta_json: Json | null
          referrer: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          device?: string | null
          handle: string
          id?: string
          ip_hash?: string | null
          lead_id?: string | null
          meta_json?: Json | null
          referrer?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          device?: string | null
          handle?: string
          id?: string
          ip_hash?: string | null
          lead_id?: string | null
          meta_json?: Json | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "qr_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scans_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          budget: string | null
          created_at: string
          description: string | null
          form_answers: Json | null
          id: string
          lead_id: string | null
          location: string | null
          photo_urls: string[] | null
          project_type: string | null
          status: string
          timeline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          description?: string | null
          form_answers?: Json | null
          id?: string
          lead_id?: string | null
          location?: string | null
          photo_urls?: string[] | null
          project_type?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          description?: string | null
          form_answers?: Json | null
          id?: string
          lead_id?: string | null
          location?: string | null
          photo_urls?: string[] | null
          project_type?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
          rewarded: boolean
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
          rewarded?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
          rewarded?: boolean
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          lead_id: string | null
          project_id: string | null
          rating: number
          review_text: string | null
          reviewer_email: string | null
          reviewer_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          lead_id?: string | null
          project_id?: string | null
          rating?: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          lead_id?: string | null
          project_id?: string | null
          rating?: number
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_followups: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          opened_at: string | null
          recipient_email: string | null
          recipient_name: string | null
          replied_at: string | null
          send_at: string
          sent_at: string | null
          status: string
          step_id: string | null
          step_number: number | null
          trigger_type: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          replied_at?: string | null
          send_at: string
          sent_at?: string | null
          status?: string
          step_id?: string | null
          step_number?: number | null
          trigger_type?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          replied_at?: string | null
          send_at?: string
          sent_at?: string | null
          status?: string
          step_id?: string | null
          step_number?: number | null
          trigger_type?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_followups_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "followup_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_followups_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "followup_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          account_name: string | null
          connected: boolean
          created_at: string
          id: string
          org_id: string | null
          platform_avatar_url: string | null
          platform_username: string | null
          provider: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          connected?: boolean
          created_at?: string
          id?: string
          org_id?: string | null
          platform_avatar_url?: string | null
          platform_username?: string | null
          provider: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          connected?: boolean
          created_at?: string
          id?: string
          org_id?: string | null
          platform_avatar_url?: string | null
          platform_username?: string | null
          provider?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_campaigns: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          org_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          approval_status: string | null
          campaign_id: string | null
          content: string
          content_label: string | null
          created_at: string
          id: string
          lead_id: string | null
          media_urls: string[] | null
          org_id: string | null
          platform_overrides: Json | null
          platforms_json: Json
          queue_position: number | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["social_post_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          campaign_id?: string | null
          content: string
          content_label?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          media_urls?: string[] | null
          org_id?: string | null
          platform_overrides?: Json | null
          platforms_json?: Json
          queue_position?: number | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["social_post_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          campaign_id?: string | null
          content?: string
          content_label?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          media_urls?: string[] | null
          org_id?: string | null
          platform_overrides?: Json | null
          platforms_json?: Json
          queue_position?: number | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["social_post_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_queue_slots: {
        Row: {
          account_id: string | null
          created_at: string | null
          day_of_week: number
          enabled: boolean | null
          id: string
          platform: string
          time_slot: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          day_of_week: number
          enabled?: boolean | null
          id?: string
          platform: string
          time_slot: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          day_of_week?: number
          enabled?: boolean | null
          id?: string
          platform?: string
          time_slot?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_queue_slots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      style_packs: {
        Row: {
          created_at: string
          default_palettes: Json
          id: string
          key: string
          name: string
          recommended_for_categories: Json
          style: string
          theme_tokens: Json
        }
        Insert: {
          created_at?: string
          default_palettes?: Json
          id?: string
          key: string
          name: string
          recommended_for_categories?: Json
          style: string
          theme_tokens?: Json
        }
        Update: {
          created_at?: string
          default_palettes?: Json
          id?: string
          key?: string
          name?: string
          recommended_for_categories?: Json
          style?: string
          theme_tokens?: Json
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          org_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          org_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          org_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to_user_id: string | null
          booking_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          created_by_user_id: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          org_id: string | null
          priority: string
          remind_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          booking_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          org_id?: string | null
          priority?: string
          remind_at?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to_user_id?: string | null
          booking_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          org_id?: string | null
          priority?: string
          remind_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_workspace_from_profession: {
        Args: {
          p_owner_user_id: string
          p_profession_code: string
          p_workspace_id: string
        }
        Returns: Json
      }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["org_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      owns_lead: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      analytics_event_type:
        | "card_view"
        | "button_click"
        | "form_submit"
        | "booking_created"
        | "contact_saved"
      app_role: "admin" | "user"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "requested"
        | "no_show"
      campaign_email_status: "pending" | "sent" | "failed" | "bounced"
      campaign_status: "draft" | "sending" | "sent" | "paused"
      card_status: "draft" | "published" | "unpublished"
      estimate_status:
        | "draft"
        | "sent"
        | "viewed"
        | "approved"
        | "declined"
        | "expired"
      job_status:
        | "draft"
        | "scheduled"
        | "in_progress"
        | "paused"
        | "completed"
        | "cancelled"
      lead_source:
        | "card_form"
        | "booking"
        | "manual"
        | "import"
        | "referral"
        | "other"
      org_role: "owner" | "admin" | "member"
      social_post_status: "draft" | "scheduled" | "published" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analytics_event_type: [
        "card_view",
        "button_click",
        "form_submit",
        "booking_created",
        "contact_saved",
      ],
      app_role: ["admin", "user"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "requested",
        "no_show",
      ],
      campaign_email_status: ["pending", "sent", "failed", "bounced"],
      campaign_status: ["draft", "sending", "sent", "paused"],
      card_status: ["draft", "published", "unpublished"],
      estimate_status: [
        "draft",
        "sent",
        "viewed",
        "approved",
        "declined",
        "expired",
      ],
      job_status: [
        "draft",
        "scheduled",
        "in_progress",
        "paused",
        "completed",
        "cancelled",
      ],
      lead_source: [
        "card_form",
        "booking",
        "manual",
        "import",
        "referral",
        "other",
      ],
      org_role: ["owner", "admin", "member"],
      social_post_status: ["draft", "scheduled", "published", "failed"],
    },
  },
} as const
