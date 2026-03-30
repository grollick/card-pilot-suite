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
      ab_test_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          session_id: string | null
          test_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          session_id?: string | null
          test_id: string
          variant_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          session_id?: string | null
          test_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_events_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_events_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_test_variants: {
        Row: {
          clicks: number
          created_at: string
          cta_text: string | null
          headline: string | null
          hero_visual_url: string | null
          id: string
          signups: number
          subheadline: string | null
          test_id: string
          variant_key: string
          views: number
          weight: number
        }
        Insert: {
          clicks?: number
          created_at?: string
          cta_text?: string | null
          headline?: string | null
          hero_visual_url?: string | null
          id?: string
          signups?: number
          subheadline?: string | null
          test_id: string
          variant_key: string
          views?: number
          weight?: number
        }
        Update: {
          clicks?: number
          created_at?: string
          cta_text?: string | null
          headline?: string | null
          hero_visual_url?: string | null
          id?: string
          signups?: number
          subheadline?: string | null
          test_id?: string
          variant_key?: string
          views?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_variants_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          page: string
          section: string
          status: string
          updated_at: string
          winner_variant_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          page?: string
          section?: string
          status?: string
          updated_at?: string
          winner_variant_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          page?: string
          section?: string
          status?: string
          updated_at?: string
          winner_variant_id?: string | null
        }
        Relationships: []
      }
      ai_credit_purchases: {
        Row: {
          amount_paid: number
          created_at: string
          credits_purchased: number
          credits_remaining: number
          expires_at: string | null
          id: string
          purchase_type: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          credits_purchased?: number
          credits_remaining?: number
          expires_at?: string | null
          id?: string
          purchase_type?: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          credits_purchased?: number
          credits_remaining?: number
          expires_at?: string | null
          id?: string
          purchase_type?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          month_key: string
          request_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_key: string
          request_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_key?: string
          request_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      app_developer_profiles: {
        Row: {
          business_name: string
          commission_rate: number
          contact_email: string
          created_at: string
          id: string
          stripe_connect_id: string | null
          stripe_onboarded: boolean
          total_payouts: number
          total_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string
          commission_rate?: number
          contact_email?: string
          created_at?: string
          id?: string
          stripe_connect_id?: string | null
          stripe_onboarded?: boolean
          total_payouts?: number
          total_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string
          commission_rate?: number
          contact_email?: string
          created_at?: string
          id?: string
          stripe_connect_id?: string | null
          stripe_onboarded?: boolean
          total_payouts?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_purchases: {
        Row: {
          amount_cents: number
          app_id: string
          created_at: string
          currency: string
          developer_id: string | null
          developer_payout_cents: number
          id: string
          platform_fee_cents: number
          purchase_type: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          app_id: string
          created_at?: string
          currency?: string
          developer_id?: string | null
          developer_payout_cents?: number
          id?: string
          platform_fee_cents?: number
          purchase_type?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          app_id?: string
          created_at?: string
          currency?: string
          developer_id?: string | null
          developer_payout_cents?: number
          id?: string
          platform_fee_cents?: number
          purchase_type?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_purchases_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "marketplace_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_purchases_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "app_developer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_reviews: {
        Row: {
          app_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_reviews_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "marketplace_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_campaigns: {
        Row: {
          campaign_type: string
          content_types: string[]
          created_at: string
          frequency: string
          id: string
          name: string
          next_post_at: string | null
          org_id: string | null
          posts_generated: number
          posts_per_week: number
          profession: string | null
          settings_json: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_type?: string
          content_types?: string[]
          created_at?: string
          frequency?: string
          id?: string
          name: string
          next_post_at?: string | null
          org_id?: string | null
          posts_generated?: number
          posts_per_week?: number
          profession?: string | null
          settings_json?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_type?: string
          content_types?: string[]
          created_at?: string
          frequency?: string
          id?: string
          name?: string
          next_post_at?: string | null
          org_id?: string | null
          posts_generated?: number
          posts_per_week?: number
          profession?: string | null
          settings_json?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_campaigns_org_id_fkey"
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
      automation_runs: {
        Row: {
          automation_id: string
          booking_id: string | null
          contact_id: string | null
          created_at: string
          executed_at: string | null
          id: string
          meta_data: Json | null
          scheduled_for: string
          status: string
          user_id: string
        }
        Insert: {
          automation_id: string
          booking_id?: string | null
          contact_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          meta_data?: Json | null
          scheduled_for?: string
          status?: string
          user_id: string
        }
        Update: {
          automation_id?: string
          booking_id?: string | null
          contact_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          meta_data?: Json | null
          scheduled_for?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      autopilot_log: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          meta_json: Json | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          meta_json?: Json | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          meta_json?: Json | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      autopilot_settings: {
        Row: {
          approval_mode: string
          created_at: string
          enabled: boolean
          estimate_reminders: boolean
          id: string
          lead_followup: boolean
          promotions: boolean
          review_requests: boolean
          social_posts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_mode?: string
          created_at?: string
          enabled?: boolean
          estimate_reminders?: boolean
          id?: string
          lead_followup?: boolean
          promotions?: boolean
          review_requests?: boolean
          social_posts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_mode?: string
          created_at?: string
          enabled?: boolean
          estimate_reminders?: boolean
          id?: string
          lead_followup?: boolean
          promotions?: boolean
          review_requests?: boolean
          social_posts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      beta_access: {
        Row: {
          created_at: string
          created_by_admin: string | null
          expiry_date: string
          granted_plan: string
          id: string
          is_active: boolean
          notes: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by_admin?: string | null
          expiry_date: string
          granted_plan?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by_admin?: string | null
          expiry_date?: string
          granted_plan?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      beta_feedback: {
        Row: {
          admin_notes: string | null
          created_at: string
          device_type: string | null
          feature_tag: string | null
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          message: string
          meta_json: Json | null
          page_url: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          device_type?: string | null
          feature_tag?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          message: string
          meta_json?: Json | null
          page_url?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          device_type?: string | null
          feature_tag?: string | null
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          message?: string
          meta_json?: Json | null
          page_url?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      bug_issues: {
        Row: {
          created_at: string
          description: string | null
          feature_tag: string | null
          feedback_ids: string[] | null
          frequency_score: number
          id: string
          impact_score: number
          priority_level: Database["public"]["Enums"]["priority_level"]
          priority_score: number | null
          report_count: number
          resolved_at: string | null
          revenue_risk_score: number
          roadmap_status: Database["public"]["Enums"]["roadmap_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_tag?: string | null
          feedback_ids?: string[] | null
          frequency_score?: number
          id?: string
          impact_score?: number
          priority_level?: Database["public"]["Enums"]["priority_level"]
          priority_score?: number | null
          report_count?: number
          resolved_at?: string | null
          revenue_risk_score?: number
          roadmap_status?: Database["public"]["Enums"]["roadmap_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_tag?: string | null
          feedback_ids?: string[] | null
          frequency_score?: number
          id?: string
          impact_score?: number
          priority_level?: Database["public"]["Enums"]["priority_level"]
          priority_score?: number | null
          report_count?: number
          resolved_at?: string | null
          revenue_risk_score?: number
          roadmap_status?: Database["public"]["Enums"]["roadmap_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_bookings: {
        Row: {
          booking_date: string
          booking_time: string | null
          business_id: string
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          lead_id: string | null
          notes: string | null
          service_id: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          booking_date: string
          booking_time?: string | null
          business_id: string
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          service_id?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string | null
          business_id?: string
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          service_id?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_pipeline_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "business_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          business_id: string
          category_key: string
          created_at: string | null
          id: string
        }
        Insert: {
          business_id: string
          category_key: string
          created_at?: string | null
          id?: string
        }
        Update: {
          business_id?: string
          category_key?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_pipeline_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_leads: {
        Row: {
          business_id: string
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          message: string | null
          phone: string | null
          service_id: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          service_id?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          service_id?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_pipeline_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_leads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_leads_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          bio: string | null
          booking_enabled: boolean | null
          business_id: string
          created_at: string | null
          cta_primary_text: string | null
          cta_secondary_text: string | null
          custom_domain: string | null
          headline: string | null
          id: string
          lead_form_enabled: boolean | null
          marketplace_enabled: boolean | null
          subheadline: string | null
          theme_color: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          booking_enabled?: boolean | null
          business_id: string
          created_at?: string | null
          cta_primary_text?: string | null
          cta_secondary_text?: string | null
          custom_domain?: string | null
          headline?: string | null
          id?: string
          lead_form_enabled?: boolean | null
          marketplace_enabled?: boolean | null
          subheadline?: string | null
          theme_color?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          booking_enabled?: boolean | null
          business_id?: string
          created_at?: string | null
          cta_primary_text?: string | null
          cta_secondary_text?: string | null
          custom_domain?: string | null
          headline?: string | null
          id?: string
          lead_form_enabled?: boolean | null
          marketplace_enabled?: boolean | null
          subheadline?: string | null
          theme_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_pipeline_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          booking_id: string | null
          business_id: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          rating: number
          review_text: string | null
          reviewer_name: string
          source: string | null
        }
        Insert: {
          booking_id?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating: number
          review_text?: string | null
          reviewer_name: string
          source?: string | null
        }
        Update: {
          booking_id?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          review_text?: string | null
          reviewer_name?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "business_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_pipeline_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_name: string
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_marketplace_visible: boolean | null
          location_city: string | null
          location_region: string | null
          logo_url: string | null
          owner_user_id: string
          phone: string | null
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          business_name: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_marketplace_visible?: boolean | null
          location_city?: string | null
          location_region?: string | null
          logo_url?: string | null
          owner_user_id: string
          phone?: string | null
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          business_name?: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_marketplace_visible?: boolean | null
          location_city?: string | null
          location_region?: string | null
          logo_url?: string | null
          owner_user_id?: string
          phone?: string | null
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
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
          is_team_card: boolean
          org_id: string | null
          published_at: string | null
          sections_json: Json
          status: Database["public"]["Enums"]["card_status"]
          team_member_id: string | null
          theme_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_team_card?: boolean
          org_id?: string | null
          published_at?: string | null
          sections_json?: Json
          status?: Database["public"]["Enums"]["card_status"]
          team_member_id?: string | null
          theme_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_team_card?: boolean
          org_id?: string | null
          published_at?: string | null
          sections_json?: Json
          status?: Database["public"]["Enums"]["card_status"]
          team_member_id?: string | null
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
          {
            foreignKeyName: "cards_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "client_safe_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_messages: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          message: string
          read_at: string | null
          sender: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          message: string
          read_at?: string | null
          sender?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          message?: string
          read_at?: string | null
          sender?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          lead_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          lead_id: string
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          lead_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_tokens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      daily_metrics: {
        Row: {
          bookings_count: number
          card_views: number
          created_at: string
          estimates_sent: number
          id: string
          jobs_completed: number
          leads_count: number
          metric_date: string
          org_id: string | null
          qr_scans: number
          referrals_count: number
          revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bookings_count?: number
          card_views?: number
          created_at?: string
          estimates_sent?: number
          id?: string
          jobs_completed?: number
          leads_count?: number
          metric_date?: string
          org_id?: string | null
          qr_scans?: number
          referrals_count?: number
          revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bookings_count?: number
          card_views?: number
          created_at?: string
          estimates_sent?: number
          id?: string
          jobs_completed?: number
          leads_count?: number
          metric_date?: string
          org_id?: string | null
          qr_scans?: number
          referrals_count?: number
          revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_completed: boolean
          note_date: string
          note_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_completed?: boolean
          note_date?: string
          note_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          note_date?: string
          note_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_sequence_enrollments: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          current_step: number
          enrolled_at: string
          id: string
          last_email_at: string | null
          sequence_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          last_email_at?: string | null
          sequence_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          last_email_at?: string | null
          sequence_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_events: {
        Row: {
          created_at: string
          enrollment_id: string
          event_type: string
          id: string
          meta_data: Json | null
          step_id: string | null
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          event_type: string
          id?: string
          meta_data?: Json | null
          step_id?: string | null
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          event_type?: string
          id?: string
          meta_data?: Json | null
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_events_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_events_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          body: string
          created_at: string
          delay_hours: number
          enabled: boolean
          id: string
          sequence_id: string
          step_number: number
          stop_conditions: Json
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          delay_hours?: number
          enabled?: boolean
          id?: string
          sequence_id: string
          step_number?: number
          stop_conditions?: Json
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          delay_hours?: number
          enabled?: boolean
          id?: string
          sequence_id?: string
          step_number?: number
          stop_conditions?: Json
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_emails_per_day: number
          name: string
          status: Database["public"]["Enums"]["sequence_status"]
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["sequence_trigger"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_emails_per_day?: number
          name: string
          status?: Database["public"]["Enums"]["sequence_status"]
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["sequence_trigger"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_emails_per_day?: number
          name?: string
          status?: Database["public"]["Enums"]["sequence_status"]
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["sequence_trigger"]
          updated_at?: string
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
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      estimate_duty_log: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lead_id: string | null
          response_time_minutes: number | null
          user_id: string
          was_on_duty: boolean
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string | null
          response_time_minutes?: number | null
          user_id: string
          was_on_duty?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string | null
          response_time_minutes?: number | null
          user_id?: string
          was_on_duty?: boolean
        }
        Relationships: []
      }
      estimate_duty_services: {
        Row: {
          created_at: string
          id: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_duty_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_duty_status: {
        Row: {
          accepted_leads_count: number
          auto_off_after_hours: number | null
          auto_off_outside_hours: boolean
          available_until: string | null
          avg_response_minutes: number | null
          completed_estimates_count: number
          created_at: string
          duty_type: string
          id: string
          is_on_duty: boolean
          last_response_at: string | null
          leads_received: number
          max_leads: number | null
          missed_leads_count: number
          service_radius_km: number | null
          service_types: string[] | null
          updated_at: string
          user_id: string
          went_on_duty_at: string | null
        }
        Insert: {
          accepted_leads_count?: number
          auto_off_after_hours?: number | null
          auto_off_outside_hours?: boolean
          available_until?: string | null
          avg_response_minutes?: number | null
          completed_estimates_count?: number
          created_at?: string
          duty_type?: string
          id?: string
          is_on_duty?: boolean
          last_response_at?: string | null
          leads_received?: number
          max_leads?: number | null
          missed_leads_count?: number
          service_radius_km?: number | null
          service_types?: string[] | null
          updated_at?: string
          user_id: string
          went_on_duty_at?: string | null
        }
        Update: {
          accepted_leads_count?: number
          auto_off_after_hours?: number | null
          auto_off_outside_hours?: boolean
          available_until?: string | null
          avg_response_minutes?: number | null
          completed_estimates_count?: number
          created_at?: string
          duty_type?: string
          id?: string
          is_on_duty?: boolean
          last_response_at?: string | null
          leads_received?: number
          max_leads?: number | null
          missed_leads_count?: number
          service_radius_km?: number | null
          service_types?: string[] | null
          updated_at?: string
          user_id?: string
          went_on_duty_at?: string | null
        }
        Relationships: []
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
      estimate_matches: {
        Row: {
          created_at: string
          estimate_request_id: string
          id: string
          lead_id: string | null
          match_score: number
          notified_at: string | null
          priority_rank: number
          responded_at: string | null
          response_deadline_at: string | null
          status: string
          updated_at: string
          user_id: string
          was_notified: boolean
        }
        Insert: {
          created_at?: string
          estimate_request_id: string
          id?: string
          lead_id?: string | null
          match_score?: number
          notified_at?: string | null
          priority_rank?: number
          responded_at?: string | null
          response_deadline_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          was_notified?: boolean
        }
        Update: {
          created_at?: string
          estimate_request_id?: string
          id?: string
          lead_id?: string | null
          match_score?: number
          notified_at?: string | null
          priority_rank?: number
          responded_at?: string | null
          response_deadline_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          was_notified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "estimate_matches_estimate_request_id_fkey"
            columns: ["estimate_request_id"]
            isOneToOne: false
            referencedRelation: "estimate_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_photos: {
        Row: {
          caption: string | null
          created_at: string
          estimate_id: string
          file_name: string
          file_path: string
          id: string
          line_item_id: string | null
          sort_order: number | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          estimate_id: string
          file_name: string
          file_path: string
          id?: string
          line_item_id?: string | null
          sort_order?: number | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          estimate_id?: string
          file_name?: string
          file_path?: string
          id?: string
          line_item_id?: string | null
          sort_order?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_photos_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_photos_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "estimate_line_items"
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
      estimate_requests: {
        Row: {
          budget: string | null
          category: string | null
          city: string | null
          created_at: string
          id: string
          lead_quality_score: number | null
          location: string | null
          profession: string | null
          request_details: string | null
          requester_email: string | null
          requester_name: string
          requester_phone: string | null
          service_needed: string | null
          source: string
          status: string
          timeline: string | null
          tracking_token: string | null
          updated_at: string
        }
        Insert: {
          budget?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          lead_quality_score?: number | null
          location?: string | null
          profession?: string | null
          request_details?: string | null
          requester_email?: string | null
          requester_name: string
          requester_phone?: string | null
          service_needed?: string | null
          source?: string
          status?: string
          timeline?: string | null
          tracking_token?: string | null
          updated_at?: string
        }
        Update: {
          budget?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          lead_quality_score?: number | null
          location?: string | null
          profession?: string | null
          request_details?: string | null
          requester_email?: string | null
          requester_name?: string
          requester_phone?: string | null
          service_needed?: string | null
          source?: string
          status?: string
          timeline?: string | null
          tracking_token?: string | null
          updated_at?: string
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
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          is_billable: boolean
          job_id: string | null
          notes: string | null
          org_id: string | null
          receipt_url: string | null
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          is_billable?: boolean
          job_id?: string | null
          notes?: string | null
          org_id?: string | null
          receipt_url?: string | null
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_billable?: boolean
          job_id?: string | null
          notes?: string | null
          org_id?: string | null
          receipt_url?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      first_lead_guarantee: {
        Row: {
          activated_at: string
          created_at: string
          deadline_at: string
          first_lead_at: string | null
          first_response_at: string | null
          id: string
          matched_request_id: string | null
          status: string
          test_lead_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          deadline_at?: string
          first_lead_at?: string | null
          first_response_at?: string | null
          id?: string
          matched_request_id?: string | null
          status?: string
          test_lead_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          deadline_at?: string
          first_lead_at?: string | null
          first_response_at?: string | null
          id?: string
          matched_request_id?: string | null
          status?: string
          test_lead_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      google_business_sync: {
        Row: {
          business_name: string | null
          created_at: string
          id: string
          last_synced_at: string | null
          org_id: string | null
          place_id: string | null
          status: string
          sync_info: boolean
          sync_photos: boolean
          sync_reviews: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          org_id?: string | null
          place_id?: string | null
          status?: string
          sync_info?: boolean
          sync_photos?: boolean
          sync_reviews?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          org_id?: string | null
          place_id?: string | null
          status?: string
          sync_info?: boolean
          sync_photos?: boolean
          sync_reviews?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_business_sync_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_automation_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          result_json: Json | null
          status: string
          target_contact_id: string | null
          target_user_id: string | null
          workflow_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          result_json?: Json | null
          status?: string
          target_contact_id?: string | null
          target_user_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          result_json?: Json | null
          status?: string
          target_contact_id?: string | null
          target_user_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_automation_log_target_contact_id_fkey"
            columns: ["target_contact_id"]
            isOneToOne: false
            referencedRelation: "outreach_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_automation_log_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "growth_automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_automation_workflows: {
        Row: {
          action_config: Json
          created_at: string
          created_by: string
          id: string
          name: string
          stats_json: Json
          status: string
          trigger_config: Json
          updated_at: string
          workflow_type: string
        }
        Insert: {
          action_config?: Json
          created_at?: string
          created_by: string
          id?: string
          name: string
          stats_json?: Json
          status?: string
          trigger_config?: Json
          updated_at?: string
          workflow_type?: string
        }
        Update: {
          action_config?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          stats_json?: Json
          status?: string
          trigger_config?: Json
          updated_at?: string
          workflow_type?: string
        }
        Relationships: []
      }
      installed_apps: {
        Row: {
          app_id: string
          config: Json | null
          enabled: boolean
          id: string
          installed_at: string
          org_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          config?: Json | null
          enabled?: boolean
          id?: string
          installed_at?: string
          org_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          config?: Json | null
          enabled?: boolean
          id?: string
          installed_at?: string
          org_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installed_apps_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "marketplace_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installed_apps_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_insights: {
        Row: {
          action_status: string
          category: string
          created_at: string
          id: string
          insight_text: string
          interview_id: string
          updated_at: string
        }
        Insert: {
          action_status?: string
          category: string
          created_at?: string
          id?: string
          insight_text: string
          interview_id: string
          updated_at?: string
        }
        Update: {
          action_status?: string
          category?: string
          created_at?: string
          id?: string
          insight_text?: string
          interview_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_insights_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "user_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          sort_order: number
          title: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          line_total?: number
          quantity?: number
          sort_order?: number
          title: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          sort_order?: number
          title?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          paid_at: string
          payment_method: string
          payment_reference: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          paid_at?: string
          payment_method?: string
          payment_reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          paid_at?: string
          payment_method?: string
          payment_reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          created_at: string
          discount_amount: number
          due_date: string | null
          grand_total: number
          id: string
          invoice_number: string
          issue_date: string
          job_id: string | null
          last_reminder_at: string | null
          lead_id: string | null
          notes: string | null
          org_id: string | null
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_token: string | null
          reminder_count: number
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id: string | null
          subtotal: number
          tax_total: number
          terms: string | null
          updated_at: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          grand_total?: number
          id?: string
          invoice_number: string
          issue_date?: string
          job_id?: string | null
          last_reminder_at?: string | null
          lead_id?: string | null
          notes?: string | null
          org_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_token?: string | null
          reminder_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_total?: number
          terms?: string | null
          updated_at?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          grand_total?: number
          id?: string
          invoice_number?: string
          issue_date?: string
          job_id?: string | null
          last_reminder_at?: string | null
          lead_id?: string | null
          notes?: string | null
          org_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_token?: string | null
          reminder_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_total?: number
          terms?: string | null
          updated_at?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      job_request_responses: {
        Row: {
          availability: string | null
          created_at: string
          estimate_request_id: string
          id: string
          message: string
          price_estimate: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          estimate_request_id: string
          id?: string
          message?: string
          price_estimate?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          estimate_request_id?: string
          id?: string
          message?: string
          price_estimate?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_request_responses_estimate_request_id_fkey"
            columns: ["estimate_request_id"]
            isOneToOne: false
            referencedRelation: "estimate_requests"
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
      landing_page_content: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          page_description: string | null
          page_key: string
          page_title: string
          sections_json: Json
          settings_json: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          page_description?: string | null
          page_key: string
          page_title?: string
          sections_json?: Json
          settings_json?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          page_description?: string | null
          page_key?: string
          page_title?: string
          sections_json?: Json
          settings_json?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      lead_assignment_settings: {
        Row: {
          assignment_mode: string
          created_at: string
          fallback_to_owner: boolean
          filter_by_availability: boolean
          id: string
          match_by_location: boolean
          match_by_services: boolean
          org_id: string | null
          recovery_enabled: boolean
          recovery_mode: string
          round_robin_index: number
          timeout_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_mode?: string
          created_at?: string
          fallback_to_owner?: boolean
          filter_by_availability?: boolean
          id?: string
          match_by_location?: boolean
          match_by_services?: boolean
          org_id?: string | null
          recovery_enabled?: boolean
          recovery_mode?: string
          round_robin_index?: number
          timeout_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_mode?: string
          created_at?: string
          fallback_to_owner?: boolean
          filter_by_availability?: boolean
          id?: string
          match_by_location?: boolean
          match_by_services?: boolean
          org_id?: string | null
          recovery_enabled?: boolean
          recovery_mode?: string
          round_robin_index?: number
          timeout_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignment_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to: string
          assignment_mode: string
          created_at: string
          id: string
          lead_id: string
          missed_at: string | null
          org_id: string | null
          reassigned_from: string | null
          recovery_status: string
          responded_at: string | null
          status: string
          timeout_minutes: number
        }
        Insert: {
          assigned_by?: string | null
          assigned_to: string
          assignment_mode?: string
          created_at?: string
          id?: string
          lead_id: string
          missed_at?: string | null
          org_id?: string | null
          reassigned_from?: string | null
          recovery_status?: string
          responded_at?: string | null
          status?: string
          timeout_minutes?: number
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string
          assignment_mode?: string
          created_at?: string
          id?: string
          lead_id?: string
          missed_at?: string | null
          org_id?: string | null
          reassigned_from?: string | null
          recovery_status?: string
          responded_at?: string | null
          status?: string
          timeout_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_routing_log: {
        Row: {
          converted_at: string | null
          created_at: string
          delivered_at: string
          id: string
          lead_id: string | null
          lead_quality_score: number
          quote_request_id: string | null
          reminder_1h_sent: boolean
          reminder_24h_sent: boolean
          responded_at: string | null
          status: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          delivered_at?: string
          id?: string
          lead_id?: string | null
          lead_quality_score?: number
          quote_request_id?: string | null
          reminder_1h_sent?: boolean
          reminder_24h_sent?: boolean
          responded_at?: string | null
          status?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          delivered_at?: string
          id?: string
          lead_id?: string | null
          lead_quality_score?: number
          quote_request_id?: string | null
          reminder_1h_sent?: boolean
          reminder_24h_sent?: boolean
          responded_at?: string | null
          status?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_routing_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_routing_log_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "marketplace_quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to_user_id: string | null
          company: string | null
          contact_type: Database["public"]["Enums"]["contact_type"]
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
          contact_type?: Database["public"]["Enums"]["contact_type"]
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
          contact_type?: Database["public"]["Enums"]["contact_type"]
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
      loyalty_cards: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          lead_id: string | null
          program_id: string
          redeemed_at: string | null
          reward_redeemed: boolean
          stamps_collected: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          program_id: string
          redeemed_at?: string | null
          reward_redeemed?: boolean
          stamps_collected?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          program_id?: string
          redeemed_at?: string | null
          reward_redeemed?: boolean
          stamps_collected?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_cards_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "loyalty_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          reward_description: string
          stamps_required: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          reward_description?: string
          stamps_required?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          reward_description?: string
          stamps_required?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_stamps: {
        Row: {
          card_id: string
          id: string
          notes: string | null
          stamped_at: string
          stamped_by: string | null
        }
        Insert: {
          card_id: string
          id?: string
          notes?: string | null
          stamped_at?: string
          stamped_by?: string | null
        }
        Update: {
          card_id?: string
          id?: string
          notes?: string | null
          stamped_at?: string
          stamped_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_stamps_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "loyalty_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_apps: {
        Row: {
          avg_rating: number
          category: Database["public"]["Enums"]["app_category"]
          config_schema: Json | null
          created_at: string
          description: string
          developer_name: string
          developer_profile_id: string | null
          features: string[] | null
          icon_url: string | null
          id: string
          install_count: number
          is_featured: boolean
          is_published: boolean
          long_description: string | null
          name: string
          permissions: string[] | null
          price_amount: number | null
          pricing_type: Database["public"]["Enums"]["app_pricing_type"]
          screenshot_urls: string[] | null
          slug: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          avg_rating?: number
          category?: Database["public"]["Enums"]["app_category"]
          config_schema?: Json | null
          created_at?: string
          description: string
          developer_name?: string
          developer_profile_id?: string | null
          features?: string[] | null
          icon_url?: string | null
          id?: string
          install_count?: number
          is_featured?: boolean
          is_published?: boolean
          long_description?: string | null
          name: string
          permissions?: string[] | null
          price_amount?: number | null
          pricing_type?: Database["public"]["Enums"]["app_pricing_type"]
          screenshot_urls?: string[] | null
          slug: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          avg_rating?: number
          category?: Database["public"]["Enums"]["app_category"]
          config_schema?: Json | null
          created_at?: string
          description?: string
          developer_name?: string
          developer_profile_id?: string | null
          features?: string[] | null
          icon_url?: string | null
          id?: string
          install_count?: number
          is_featured?: boolean
          is_published?: boolean
          long_description?: string | null
          name?: string
          permissions?: string[] | null
          price_amount?: number | null
          pricing_type?: Database["public"]["Enums"]["app_pricing_type"]
          screenshot_urls?: string[] | null
          slug?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_apps_developer_profile_id_fkey"
            columns: ["developer_profile_id"]
            isOneToOne: false
            referencedRelation: "app_developer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_lead_credits: {
        Row: {
          amount: number
          billed: boolean
          created_at: string
          id: string
          lead_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount?: number
          billed?: boolean
          created_at?: string
          id?: string
          lead_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          amount?: number
          billed?: boolean
          created_at?: string
          id?: string
          lead_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_lead_credits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_metrics: {
        Row: {
          avg_rating: number | null
          booking_count_30d: number | null
          business_id: string
          lead_count_30d: number | null
          marketplace_score: number | null
          profile_completeness_score: number | null
          response_score: number | null
          review_count: number | null
          updated_at: string | null
        }
        Insert: {
          avg_rating?: number | null
          booking_count_30d?: number | null
          business_id: string
          lead_count_30d?: number | null
          marketplace_score?: number | null
          profile_completeness_score?: number | null
          response_score?: number | null
          review_count?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_rating?: number | null
          booking_count_30d?: number | null
          business_id?: string
          lead_count_30d?: number | null
          marketplace_score?: number | null
          profile_completeness_score?: number | null
          response_score?: number | null
          review_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_pipeline_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "marketplace_metrics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_quote_requests: {
        Row: {
          budget: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          lead_quality_score: number
          location: string | null
          notes: string | null
          profession: string | null
          service_needed: string | null
          timeline: string | null
        }
        Insert: {
          budget?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          lead_quality_score?: number
          location?: string | null
          notes?: string | null
          profession?: string | null
          service_needed?: string | null
          timeline?: string | null
        }
        Update: {
          budget?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          lead_quality_score?: number
          location?: string | null
          notes?: string | null
          profession?: string | null
          service_needed?: string | null
          timeline?: string | null
        }
        Relationships: []
      }
      neighborhood_boosts: {
        Row: {
          bookings_count: number
          created_at: string
          duration_days: number
          expires_at: string
          id: string
          leads_count: number
          org_id: string | null
          radius_km: number
          started_at: string
          status: string
          target_city: string | null
          target_postal_code: string | null
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          bookings_count?: number
          created_at?: string
          duration_days?: number
          expires_at: string
          id?: string
          leads_count?: number
          org_id?: string | null
          radius_km?: number
          started_at?: string
          status?: string
          target_city?: string | null
          target_postal_code?: string | null
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          bookings_count?: number
          created_at?: string
          duration_days?: number
          expires_at?: string
          id?: string
          leads_count?: number
          org_id?: string | null
          radius_km?: number
          started_at?: string
          status?: string
          target_city?: string | null
          target_postal_code?: string | null
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "neighborhood_boosts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          brand_color: string | null
          created_at: string
          created_by: string
          custom_domain: string | null
          custom_email_from: string | null
          id: string
          logo_url: string | null
          name: string
          powered_by_text: string | null
          slug: string
          updated_at: string
          white_label_enabled: boolean
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          created_by: string
          custom_domain?: string | null
          custom_email_from?: string | null
          id?: string
          logo_url?: string | null
          name: string
          powered_by_text?: string | null
          slug: string
          updated_at?: string
          white_label_enabled?: boolean
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          created_by?: string
          custom_domain?: string | null
          custom_email_from?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          powered_by_text?: string | null
          slug?: string
          updated_at?: string
          white_label_enabled?: boolean
        }
        Relationships: []
      }
      outreach_contacts: {
        Row: {
          business: string | null
          city: string | null
          created_at: string
          created_by: string
          email: string | null
          flagged_for_handoff: boolean | null
          followup_count: number | null
          handoff_reason: string | null
          id: string
          last_contact_at: string | null
          name: string
          next_followup_at: string | null
          notes: string | null
          phone: string | null
          profession: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          flagged_for_handoff?: boolean | null
          followup_count?: number | null
          handoff_reason?: string | null
          id?: string
          last_contact_at?: string | null
          name: string
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          profession?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          flagged_for_handoff?: boolean | null
          followup_count?: number | null
          handoff_reason?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          profession?: string | null
          source?: string | null
          status?: string
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
          abuse_flags: string[] | null
          ai_personality: string
          available_for_work: boolean
          avatar_url: string | null
          avg_response_minutes: number | null
          bio: string | null
          city: string | null
          company: string | null
          created_at: string
          current_org_id: string | null
          daily_report_enabled: boolean
          email: string | null
          featured: boolean
          featured_until: string | null
          followup_body: string | null
          followup_delay_minutes: number
          followup_enabled: boolean
          followup_subject: string | null
          handle: string | null
          id: string
          is_suspended: boolean
          marketplace_enabled: boolean
          name: string | null
          onboarding_completed: boolean
          phone: string | null
          plan: string
          primary_cta: string | null
          profession_id: string | null
          referral_code: string | null
          referred_by: string | null
          service_area: string | null
          signup_source: string | null
          signup_utm_campaign: string | null
          signup_utm_medium: string | null
          style_pack: string | null
          suspended_reason: string | null
          tour_completed: boolean
          trust_level: string
          trust_score: number
          trust_signals: Json
          updated_at: string
          verification_level: Database["public"]["Enums"]["verification_level"]
        }
        Insert: {
          abuse_flags?: string[] | null
          ai_personality?: string
          available_for_work?: boolean
          avatar_url?: string | null
          avg_response_minutes?: number | null
          bio?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          current_org_id?: string | null
          daily_report_enabled?: boolean
          email?: string | null
          featured?: boolean
          featured_until?: string | null
          followup_body?: string | null
          followup_delay_minutes?: number
          followup_enabled?: boolean
          followup_subject?: string | null
          handle?: string | null
          id: string
          is_suspended?: boolean
          marketplace_enabled?: boolean
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          primary_cta?: string | null
          profession_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          service_area?: string | null
          signup_source?: string | null
          signup_utm_campaign?: string | null
          signup_utm_medium?: string | null
          style_pack?: string | null
          suspended_reason?: string | null
          tour_completed?: boolean
          trust_level?: string
          trust_score?: number
          trust_signals?: Json
          updated_at?: string
          verification_level?: Database["public"]["Enums"]["verification_level"]
        }
        Update: {
          abuse_flags?: string[] | null
          ai_personality?: string
          available_for_work?: boolean
          avatar_url?: string | null
          avg_response_minutes?: number | null
          bio?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          current_org_id?: string | null
          daily_report_enabled?: boolean
          email?: string | null
          featured?: boolean
          featured_until?: string | null
          followup_body?: string | null
          followup_delay_minutes?: number
          followup_enabled?: boolean
          followup_subject?: string | null
          handle?: string | null
          id?: string
          is_suspended?: boolean
          marketplace_enabled?: boolean
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string
          primary_cta?: string | null
          profession_id?: string | null
          referral_code?: string | null
          referred_by?: string | null
          service_area?: string | null
          signup_source?: string | null
          signup_utm_campaign?: string | null
          signup_utm_medium?: string | null
          style_pack?: string | null
          suspended_reason?: string | null
          tour_completed?: boolean
          trust_level?: string
          trust_score?: number
          trust_signals?: Json
          updated_at?: string
          verification_level?: Database["public"]["Enums"]["verification_level"]
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
      recurring_plans: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["recurring_billing_cycle"]
          created_at: string
          custom_interval_days: number | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          id: string
          job_id: string | null
          last_completed_at: string | null
          lead_id: string | null
          next_service_date: string | null
          notes: string | null
          org_id: string | null
          preferred_day_of_week: number | null
          preferred_time: string | null
          price: number
          service_name: string
          skip_next: boolean
          start_date: string
          status: Database["public"]["Enums"]["recurring_plan_status"]
          updated_at: string
          user_id: string
          visits_completed: number
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["recurring_billing_cycle"]
          created_at?: string
          custom_interval_days?: number | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          job_id?: string | null
          last_completed_at?: string | null
          lead_id?: string | null
          next_service_date?: string | null
          notes?: string | null
          org_id?: string | null
          preferred_day_of_week?: number | null
          preferred_time?: string | null
          price?: number
          service_name: string
          skip_next?: boolean
          start_date?: string
          status?: Database["public"]["Enums"]["recurring_plan_status"]
          updated_at?: string
          user_id: string
          visits_completed?: number
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["recurring_billing_cycle"]
          created_at?: string
          custom_interval_days?: number | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          id?: string
          job_id?: string | null
          last_completed_at?: string | null
          lead_id?: string | null
          next_service_date?: string | null
          notes?: string | null
          org_id?: string | null
          preferred_day_of_week?: number | null
          preferred_time?: string | null
          price?: number
          service_name?: string
          skip_next?: boolean
          start_date?: string
          status?: Database["public"]["Enums"]["recurring_plan_status"]
          updated_at?: string
          user_id?: string
          visits_completed?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_plans_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_plans_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          created_at: string
          fraud_flags: Json | null
          id: string
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
          reward_days: number | null
          reward_type: string | null
          rewarded: boolean
          status: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          fraud_flags?: Json | null
          id?: string
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
          reward_days?: number | null
          reward_type?: string | null
          rewarded?: boolean
          status?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          fraud_flags?: Json | null
          id?: string
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
          reward_days?: number | null
          reward_type?: string | null
          rewarded?: boolean
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          is_public: boolean
          lead_id: string | null
          owner_response: string | null
          owner_response_at: string | null
          project_id: string | null
          rating: number
          reported: boolean
          reported_reason: string | null
          review_text: string | null
          reviewer_email: string | null
          reviewer_name: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          is_public?: boolean
          lead_id?: string | null
          owner_response?: string | null
          owner_response_at?: string | null
          project_id?: string | null
          rating?: number
          reported?: boolean
          reported_reason?: string | null
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name: string
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          is_public?: boolean
          lead_id?: string | null
          owner_response?: string | null
          owner_response_at?: string | null
          project_id?: string | null
          rating?: number
          reported?: boolean
          reported_reason?: string | null
          review_text?: string | null
          reviewer_email?: string | null
          reviewer_name?: string
          source?: string
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
      sales_crm_contacts: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          stage: Database["public"]["Enums"]["sales_crm_stage"]
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          stage?: Database["public"]["Enums"]["sales_crm_stage"]
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          stage?: Database["public"]["Enums"]["sales_crm_stage"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      service_areas: {
        Row: {
          business_id: string
          city: string
          created_at: string | null
          id: string
          postal_code: string | null
          radius_km: number | null
          region: string | null
        }
        Insert: {
          business_id: string
          city: string
          created_at?: string | null
          id?: string
          postal_code?: string | null
          radius_km?: number | null
          region?: string | null
        }
        Update: {
          business_id?: string
          city?: string
          created_at?: string | null
          id?: string
          postal_code?: string | null
          radius_km?: number | null
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_pipeline_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "service_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          price_amount: number | null
          price_type: string | null
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          price_amount?: number | null
          price_type?: string | null
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          price_amount?: number | null
          price_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_pipeline_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_abuse_log: {
        Row: {
          blocked: boolean | null
          created_at: string
          email: string | null
          email_domain: string | null
          fingerprint_hash: string | null
          flags: string[] | null
          id: string
          ip_hash: string
          risk_level: string
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          created_at?: string
          email?: string | null
          email_domain?: string | null
          fingerprint_hash?: string | null
          flags?: string[] | null
          id?: string
          ip_hash: string
          risk_level?: string
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          created_at?: string
          email?: string | null
          email_domain?: string | null
          fingerprint_hash?: string | null
          flags?: string[] | null
          id?: string
          ip_hash?: string
          risk_level?: string
          user_id?: string | null
        }
        Relationships: []
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
          bookings_generated: number
          campaign_id: string | null
          clicks: number
          content: string
          content_label: string | null
          content_type: string | null
          created_at: string
          engagement_score: number
          id: string
          lead_id: string | null
          leads_generated: number
          link_clicks: number
          media_urls: string[] | null
          org_id: string | null
          performance_notes: string | null
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
          bookings_generated?: number
          campaign_id?: string | null
          clicks?: number
          content: string
          content_label?: string | null
          content_type?: string | null
          created_at?: string
          engagement_score?: number
          id?: string
          lead_id?: string | null
          leads_generated?: number
          link_clicks?: number
          media_urls?: string[] | null
          org_id?: string | null
          performance_notes?: string | null
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
          bookings_generated?: number
          campaign_id?: string | null
          clicks?: number
          content?: string
          content_label?: string | null
          content_type?: string | null
          created_at?: string
          engagement_score?: number
          id?: string
          lead_id?: string | null
          leads_generated?: number
          link_clicks?: number
          media_urls?: string[] | null
          org_id?: string | null
          performance_notes?: string | null
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
      success_stories: {
        Row: {
          business_type: string
          created_at: string
          display_locations: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          metric_label: string | null
          metric_value: string | null
          quote: string | null
          result_text: string
          timeframe: string
          updated_at: string
          user_name: string
        }
        Insert: {
          business_type: string
          created_at?: string
          display_locations?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metric_label?: string | null
          metric_value?: string | null
          quote?: string | null
          result_text: string
          timeframe?: string
          updated_at?: string
          user_name: string
        }
        Update: {
          business_type?: string
          created_at?: string
          display_locations?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metric_label?: string | null
          metric_value?: string | null
          quote?: string | null
          result_text?: string
          timeframe?: string
          updated_at?: string
          user_name?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          message: string
          meta_data: Json | null
          severity: Database["public"]["Enums"]["system_event_severity"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          message: string
          meta_data?: Json | null
          severity?: Database["public"]["Enums"]["system_event_severity"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          meta_data?: Json | null
          severity?: Database["public"]["Enums"]["system_event_severity"]
          user_id?: string | null
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
      user_interviews: {
        Row: {
          answers: Json | null
          candidate_group: string | null
          candidate_reason: string | null
          created_at: string
          follow_up_status: string | null
          id: string
          interview_date: string
          interviewer_name: string
          notes: string | null
          pain_points: string[] | null
          positive_reactions: string[] | null
          status: string
          suggested_improvements: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          candidate_group?: string | null
          candidate_reason?: string | null
          created_at?: string
          follow_up_status?: string | null
          id?: string
          interview_date?: string
          interviewer_name?: string
          notes?: string | null
          pain_points?: string[] | null
          positive_reactions?: string[] | null
          status?: string
          suggested_improvements?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          candidate_group?: string | null
          candidate_reason?: string | null
          created_at?: string
          follow_up_status?: string | null
          id?: string
          interview_date?: string
          interviewer_name?: string
          notes?: string | null
          pain_points?: string[] | null
          positive_reactions?: string[] | null
          status?: string
          suggested_improvements?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      business_pipeline_summary: {
        Row: {
          avg_rating: number | null
          business_id: string | null
          business_name: string | null
          total_bookings: number | null
          total_leads: number | null
          total_reviews: number | null
        }
        Relationships: []
      }
      client_safe_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          company: string | null
          handle: string | null
          id: string | null
          name: string | null
          service_area: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          handle?: string | null
          id?: string | null
          name?: string | null
          service_area?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company?: string | null
          handle?: string | null
          id?: string | null
          name?: string | null
          service_area?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          available_for_work: boolean | null
          avatar_url: string | null
          avg_response_minutes: number | null
          bio: string | null
          city: string | null
          company: string | null
          featured: boolean | null
          featured_until: string | null
          handle: string | null
          id: string | null
          marketplace_enabled: boolean | null
          name: string | null
          primary_cta: string | null
          profession_id: string | null
          service_area: string | null
          style_pack: string | null
          verification_level: string | null
        }
        Relationships: []
      }
      public_reviews: {
        Row: {
          created_at: string | null
          id: string | null
          is_public: boolean | null
          lead_id: string | null
          owner_response: string | null
          owner_response_at: string | null
          rating: number | null
          review_text: string | null
          reviewer_name: string | null
          source: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      capture_lead: {
        Args: {
          p_activity_description?: string
          p_activity_title?: string
          p_activity_type?: string
          p_email?: string
          p_handle?: string
          p_meta_json?: Json
          p_name: string
          p_owner_id: string
          p_phone?: string
          p_source?: string
        }
        Returns: Json
      }
      check_and_increment_ai_usage: {
        Args: { p_limit: number; p_user_id: string }
        Returns: Json
      }
      check_referral_activation: { Args: { p_user_id: string }; Returns: Json }
      create_workspace_from_profession: {
        Args: {
          p_owner_user_id: string
          p_profession_code: string
          p_workspace_id: string
        }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      expire_beta_access: { Args: never; Returns: number }
      get_active_boosts: {
        Args: never
        Returns: {
          expires_at: string
          radius_km: number
          status: string
          target_city: string
        }[]
      }
      get_effective_plan: { Args: { p_user_id: string }; Returns: Json }
      get_public_profiles: {
        Args: { p_handle?: string }
        Returns: {
          available_for_work: boolean
          avatar_url: string
          avg_response_minutes: number
          bio: string
          city: string
          company: string
          featured: boolean
          featured_until: string
          handle: string
          id: string
          marketplace_enabled: boolean
          name: string
          primary_cta: string
          profession_id: string
          service_area: string
          style_pack: string
          verification_level: string
        }[]
      }
      get_public_reviews: {
        Args: { p_user_id?: string }
        Returns: {
          created_at: string
          id: string
          is_public: boolean
          lead_id: string
          owner_response: string
          owner_response_at: string
          rating: number
          review_text: string
          reviewer_name: string
          source: string
          user_id: string
        }[]
      }
      get_services_by_handle: {
        Args: { p_handle: string }
        Returns: {
          description: string
          duration_min: number
          id: string
          name: string
          price: number
        }[]
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
      increment_ab_variant_counter: {
        Args: { p_counter: string; p_variant_id: string }
        Returns: undefined
      }
      increment_boost_views: { Args: { p_user_id: string }; Returns: undefined }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_manager_or_above: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      owns_lead: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      recalculate_trust_score: { Args: { p_user_id: string }; Returns: number }
      recalculate_verification_level: {
        Args: { p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      analytics_event_type:
        | "card_view"
        | "button_click"
        | "form_submit"
        | "booking_created"
        | "contact_saved"
      app_category:
        | "payments"
        | "accounting"
        | "marketing"
        | "automation"
        | "analytics"
        | "industry_tools"
        | "communication"
        | "productivity"
      app_pricing_type: "free" | "paid_once" | "subscription"
      app_role: "admin" | "user" | "client" | "founder"
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
      contact_type:
        | "lead"
        | "client"
        | "vendor"
        | "partner"
        | "personal"
        | "other"
      enrollment_status: "active" | "completed" | "cancelled" | "paused"
      estimate_status:
        | "draft"
        | "sent"
        | "viewed"
        | "approved"
        | "declined"
        | "expired"
      feedback_status: "new" | "in_review" | "planned" | "fixed"
      feedback_type: "bug" | "suggestion" | "confusing" | "positive"
      invoice_status:
        | "draft"
        | "sent"
        | "viewed"
        | "paid"
        | "overdue"
        | "cancelled"
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
        | "business_card"
        | "marketplace"
      org_role: "owner" | "admin" | "member"
      priority_level: "critical" | "high" | "medium" | "low"
      recurring_billing_cycle: "per_visit" | "monthly" | "custom"
      recurring_frequency:
        | "weekly"
        | "biweekly"
        | "monthly"
        | "quarterly"
        | "custom"
      recurring_plan_status: "active" | "paused" | "cancelled" | "completed"
      roadmap_status: "backlog" | "next_up" | "in_progress" | "done"
      sales_crm_stage:
        | "new_lead"
        | "contacted"
        | "interested"
        | "card_built"
        | "got_first_lead"
        | "paid"
        | "upsell"
      sequence_status: "active" | "paused" | "draft"
      sequence_trigger:
        | "signup"
        | "incomplete_profile"
        | "inactivity"
        | "lead_activity"
        | "beta_expiry"
        | "manual"
      social_post_status: "draft" | "scheduled" | "published" | "failed"
      system_event_severity: "info" | "warning" | "error" | "critical"
      verification_level: "basic" | "verified" | "pro_verified"
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
      app_category: [
        "payments",
        "accounting",
        "marketing",
        "automation",
        "analytics",
        "industry_tools",
        "communication",
        "productivity",
      ],
      app_pricing_type: ["free", "paid_once", "subscription"],
      app_role: ["admin", "user", "client", "founder"],
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
      contact_type: [
        "lead",
        "client",
        "vendor",
        "partner",
        "personal",
        "other",
      ],
      enrollment_status: ["active", "completed", "cancelled", "paused"],
      estimate_status: [
        "draft",
        "sent",
        "viewed",
        "approved",
        "declined",
        "expired",
      ],
      feedback_status: ["new", "in_review", "planned", "fixed"],
      feedback_type: ["bug", "suggestion", "confusing", "positive"],
      invoice_status: [
        "draft",
        "sent",
        "viewed",
        "paid",
        "overdue",
        "cancelled",
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
        "business_card",
        "marketplace",
      ],
      org_role: ["owner", "admin", "member"],
      priority_level: ["critical", "high", "medium", "low"],
      recurring_billing_cycle: ["per_visit", "monthly", "custom"],
      recurring_frequency: [
        "weekly",
        "biweekly",
        "monthly",
        "quarterly",
        "custom",
      ],
      recurring_plan_status: ["active", "paused", "cancelled", "completed"],
      roadmap_status: ["backlog", "next_up", "in_progress", "done"],
      sales_crm_stage: [
        "new_lead",
        "contacted",
        "interested",
        "card_built",
        "got_first_lead",
        "paid",
        "upsell",
      ],
      sequence_status: ["active", "paused", "draft"],
      sequence_trigger: [
        "signup",
        "incomplete_profile",
        "inactivity",
        "lead_activity",
        "beta_expiry",
        "manual",
      ],
      social_post_status: ["draft", "scheduled", "published", "failed"],
      system_event_severity: ["info", "warning", "error", "critical"],
      verification_level: ["basic", "verified", "pro_verified"],
    },
  },
} as const
