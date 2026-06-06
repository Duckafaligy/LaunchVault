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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      content_generation_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          inserted_count: number
          model: string | null
          rejected_count: number
          requested_types: string[]
          started_at: string
          status: string
          summary: Json
          trigger: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          inserted_count?: number
          model?: string | null
          rejected_count?: number
          requested_types?: string[]
          started_at?: string
          status?: string
          summary?: Json
          trigger?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          inserted_count?: number
          model?: string | null
          rejected_count?: number
          requested_types?: string[]
          started_at?: string
          status?: string
          summary?: Json
          trigger?: string
        }
        Relationships: []
      }
      content_interactions: {
        Row: {
          content_id: string
          created_at: string
          id: string
          interaction_type: string
          meta: Json
          rating: number | null
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          interaction_type: string
          meta?: Json
          rating?: number | null
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          meta?: Json
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          category: string
          course_size: string | null
          created_at: string
          description: string
          difficulty: string | null
          domain: string | null
          estimated_minutes: number | null
          generated_at: string | null
          generated_by: string | null
          id: string
          is_daily: boolean
          is_featured: boolean
          is_published: boolean
          preview_text: string
          quality_score: number | null
          quality_status: string | null
          short_description: string | null
          slug: string | null
          tags: string[]
          thumbnail_url: string | null
          tier_required: Database["public"]["Enums"]["subscription_tier"]
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          xp_reward: number
        }
        Insert: {
          category: string
          course_size?: string | null
          created_at?: string
          description: string
          difficulty?: string | null
          domain?: string | null
          estimated_minutes?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id: string
          is_daily?: boolean
          is_featured?: boolean
          is_published?: boolean
          preview_text?: string
          quality_score?: number | null
          quality_status?: string | null
          short_description?: string | null
          slug?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          tier_required?: Database["public"]["Enums"]["subscription_tier"]
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          category?: string
          course_size?: string | null
          created_at?: string
          description?: string
          difficulty?: string | null
          domain?: string | null
          estimated_minutes?: number | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_daily?: boolean
          is_featured?: boolean
          is_published?: boolean
          preview_text?: string
          quality_score?: number | null
          quality_status?: string | null
          short_description?: string | null
          slug?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          tier_required?: Database["public"]["Enums"]["subscription_tier"]
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      content_payloads: {
        Row: {
          agent_payload: Json | null
          business_payload: Json | null
          challenge_payload: Json | null
          cheatsheet_payload: Json | null
          code: string | null
          content_id: string
          course_sections: Json | null
          created_at: string
          extra: Json | null
          insight_payload: Json | null
          lesson_content: Json | null
          playbook_payload: Json | null
          preview_html: string | null
          prompt: string | null
          tool_payload: Json | null
          updated_at: string
          workflow_payload: Json | null
        }
        Insert: {
          agent_payload?: Json | null
          business_payload?: Json | null
          challenge_payload?: Json | null
          cheatsheet_payload?: Json | null
          code?: string | null
          content_id: string
          course_sections?: Json | null
          created_at?: string
          extra?: Json | null
          insight_payload?: Json | null
          lesson_content?: Json | null
          playbook_payload?: Json | null
          preview_html?: string | null
          prompt?: string | null
          tool_payload?: Json | null
          updated_at?: string
          workflow_payload?: Json | null
        }
        Update: {
          agent_payload?: Json | null
          business_payload?: Json | null
          challenge_payload?: Json | null
          cheatsheet_payload?: Json | null
          code?: string | null
          content_id?: string
          course_sections?: Json | null
          created_at?: string
          extra?: Json | null
          insight_payload?: Json | null
          lesson_content?: Json | null
          playbook_payload?: Json | null
          preview_html?: string | null
          prompt?: string | null
          tool_payload?: Json | null
          updated_at?: string
          workflow_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "content_payloads_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          completed_sections: number[]
          content_id: string
          created_at: string
          current_section: number
          id: string
          is_completed: boolean
          last_opened_at: string
          total_sections: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_sections?: number[]
          content_id: string
          created_at?: string
          current_section?: number
          id?: string
          is_completed?: boolean
          last_opened_at?: string
          total_sections?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_sections?: number[]
          content_id?: string
          created_at?: string
          current_section?: number
          id?: string
          is_completed?: boolean
          last_opened_at?: string
          total_sections?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cron_heartbeats: {
        Row: {
          env_ok: boolean
          error: string | null
          finished_at: string | null
          fired_at: string
          id: string
          origin: string | null
          plan_size: number | null
          source: string
        }
        Insert: {
          env_ok?: boolean
          error?: string | null
          finished_at?: string | null
          fired_at?: string
          id?: string
          origin?: string | null
          plan_size?: number | null
          source: string
        }
        Update: {
          env_ok?: boolean
          error?: string | null
          finished_at?: string | null
          fired_at?: string
          id?: string
          origin?: string | null
          plan_size?: number | null
          source?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          anon_id: string | null
          country: string | null
          id: number
          occurred_at: string
          path: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          country?: string | null
          id?: number
          occurred_at?: string
          path: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          country?: string | null
          id?: number
          occurred_at?: string
          path?: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          event_type: string
          id: string
          processed_at: string
          product_key: string | null
          provider: string
          raw_event: Json
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          processed_at?: string
          product_key?: string | null
          provider?: string
          raw_event: Json
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string
          product_key?: string | null
          provider?: string
          raw_event?: Json
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_streak: number
          email: string
          full_name: string | null
          id: string
          last_active_date: string | null
          longest_streak: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          xp_points: number
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_streak?: number
          email: string
          full_name?: string | null
          id: string
          last_active_date?: string | null
          longest_streak?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          xp_points?: number
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_streak?: number
          email?: string
          full_name?: string | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          xp_points?: number
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      test_runs: {
        Row: {
          admin_user_id: string
          content_types: string[]
          created_at: string
          id: string
          quality_score: number | null
          results: Json
          simulated_persona: Json
          simulated_tier: string
        }
        Insert: {
          admin_user_id: string
          content_types?: string[]
          created_at?: string
          id?: string
          quality_score?: number | null
          results?: Json
          simulated_persona?: Json
          simulated_tier: string
        }
        Update: {
          admin_user_id?: string
          content_types?: string[]
          created_at?: string
          id?: string
          quality_score?: number | null
          results?: Json
          simulated_persona?: Json
          simulated_tier?: string
        }
        Relationships: []
      }
      user_content_unlocks: {
        Row: {
          content_id: string
          created_at: string
          id: string
          unlock_type: Database["public"]["Enums"]["unlock_type"]
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          unlock_type: Database["public"]["Enums"]["unlock_type"]
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          unlock_type?: Database["public"]["Enums"]["unlock_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_unlocks_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          completed_onboarding: boolean
          created_at: string
          daily_time_minutes: number
          extra: Json
          focus_areas: string[]
          primary_goal: string | null
          skill_level: string
          tone_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_onboarding?: boolean
          created_at?: string
          daily_time_minutes?: number
          extra?: Json
          focus_areas?: string[]
          primary_goal?: string | null
          skill_level?: string
          tone_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_onboarding?: boolean
          created_at?: string
          daily_time_minutes?: number
          extra?: Json
          focus_areas?: string[]
          primary_goal?: string | null
          skill_level?: string
          tone_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_content_feed: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          domain: string | null
          estimated_minutes: number | null
          id: string | null
          is_daily: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          preview_text: string | null
          quality_score: number | null
          short_description: string | null
          slug: string | null
          tags: string[] | null
          tier_required: Database["public"]["Enums"]["subscription_tier"] | null
          title: string | null
          type: Database["public"]["Enums"]["content_type"] | null
        }
        Relationships: []
      }
      v_page_views_daily: {
        Row: {
          auth_views: number | null
          day: string | null
          unique_visitors: number | null
          views: number | null
        }
        Relationships: []
      }
      v_page_views_sources_30d: {
        Row: {
          host: string | null
          uniques: number | null
          views: number | null
        }
        Relationships: []
      }
      v_page_views_top_pages_30d: {
        Row: {
          path: string | null
          uniques: number | null
          views: number | null
        }
        Relationships: []
      }
      v_page_views_countries_30d: {
        Row: {
          country: string | null
          uniques: number | null
          views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_xp: { Args: { _amount: number; _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tier_access: {
        Args: {
          _required: Database["public"]["Enums"]["subscription_tier"]
          _user_id: string
        }
        Returns: boolean
      }
      tick_streak: { Args: { _user_id: string }; Returns: Json }
      tier_rank: {
        Args: { _tier: Database["public"]["Enums"]["subscription_tier"] }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      content_type:
        | "template"
        | "prompt"
        | "course"
        | "workflow"
        | "agent"
        | "business_lesson"
        | "insight"
        | "tool_guide"
        | "playbook"
        | "challenge"
        | "cheatsheet"
        | "glossary"
        | "essay"
      subscription_status:
        | "inactive"
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
      subscription_tier: "free" | "tier1" | "tier2" | "tier3" | "tier4"
      unlock_type: "admin" | "purchase"
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
      app_role: ["admin", "moderator", "user"],
      content_type: [
        "template",
        "prompt",
        "course",
        "workflow",
        "agent",
        "business_lesson",
        "insight",
        "tool_guide",
        "playbook",
        "challenge",
        "cheatsheet",
        "glossary",
        "essay",
      ],
      subscription_status: [
        "inactive",
        "active",
        "trialing",
        "past_due",
        "canceled",
      ],
      subscription_tier: ["free", "tier1", "tier2", "tier3", "tier4"],
      unlock_type: ["admin", "purchase"],
    },
  },
} as const
