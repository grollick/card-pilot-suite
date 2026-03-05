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
          company: string | null
          created_at: string
          current_org_id: string | null
          email: string | null
          handle: string | null
          id: string
          name: string | null
          onboarding_completed: boolean
          phone: string | null
          plan: string
          primary_cta: string | null
          profession_id: string | null
          style_pack: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          current_org_id?: string | null
          email?: string | null
          handle?: string | null
          id: string
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          primary_cta?: string | null
          profession_id?: string | null
          style_pack?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          current_org_id?: string | null
          email?: string | null
          handle?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          primary_cta?: string | null
          profession_id?: string | null
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
      social_accounts: {
        Row: {
          account_name: string | null
          connected: boolean
          created_at: string
          id: string
          org_id: string | null
          provider: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          connected?: boolean
          created_at?: string
          id?: string
          org_id?: string | null
          provider: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          connected?: boolean
          created_at?: string
          id?: string
          org_id?: string | null
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
      social_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string | null
          media_urls: string[] | null
          org_id: string | null
          platforms_json: Json
          scheduled_at: string | null
          status: Database["public"]["Enums"]["social_post_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id?: string | null
          media_urls?: string[] | null
          org_id?: string | null
          platforms_json?: Json
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["social_post_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          media_urls?: string[] | null
          org_id?: string | null
          platforms_json?: Json
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["social_post_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
