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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      // ... (Full types object truncated for brevity - see database/supabase-types.ts for complete types)
    }
    Views: {
      active_subscriptions_summary: {
        Row: {
          average_subscription_price: number | null
          creator_id: string | null
          creator_name: string | null
          monthly_recurring_revenue: number | null
          total_active_subscribers: number | null
        }
        Relationships: []
      }
      content_performance: {
        Row: {
          cluster: Database["public"]["Enums"]["platform_cluster"] | null
          comment_count: number | null
          created_at: string | null
          creator_name: string | null
          engagement_rate: number | null
          like_count: number | null
          post_id: string | null
          published_at: string | null
          share_count: number | null
          title: string | null
          view_count: number | null
        }
        Relationships: []
      }
      creator_earnings_summary: {
        Row: {
          content_count: number | null
          creator_id: string | null
          creator_name: string | null
          subscriber_count: number | null
          this_month_earnings: number | null
          tip_count: number | null
          total_earnings: number | null
          user_id: string | null
        }
        Relationships: []
      }
      platform_health_dashboard: {
        Row: {
          active_creators: number | null
          active_subscriptions: number | null
          active_users_7d: number | null
          new_users_30d: number | null
          platform_revenue_this_month: number | null
          tips_this_month: number | null
        }
        Relationships: []
      }
      platform_revenue_summary: {
        Row: {
          creator_earnings: number | null
          date: string | null
          gross_revenue: number | null
          platform_revenue: number | null
          processor_costs: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      user_engagement_metrics: {
        Row: {
          cluster: Database["public"]["Enums"]["platform_cluster"] | null
          comments: number | null
          daily_active_users: number | null
          date: string | null
          new_subscriptions: number | null
          post_likes: number | null
          post_views: number | null
          total_activities: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      content_status: "draft" | "published" | "private" | "scheduled" | "archived" | "deleted"
      creator_status: "pending" | "approved" | "rejected" | "suspended" | "banned"
      fanz_media_type: "image" | "video" | "audio" | "document" | "live_stream"
      fanz_subscription_type: "monthly" | "quarterly" | "yearly" | "lifetime" | "custom"
      fanz_transaction_type: "tip" | "subscription" | "ppv" | "merchandise" | "nft" | "withdrawal" | "refund" | "chargeback" | "fee"
      moderation_status: "pending" | "approved" | "rejected" | "escalated"
      payment_method: "ccbill" | "segpay" | "epoch" | "verotel" | "paxum" | "crypto_btc" | "crypto_eth" | "crypto_usdt" | "bank_transfer" | "wise" | "dwolla"
      payout_status: "pending" | "processing" | "completed" | "failed"
      platform_cluster: "fanzlab" | "boyfanz" | "girlfanz" | "daddyfanz" | "pupfanz" | "taboofanz" | "transfanz" | "cougarfanz" | "fanzcock"
      transaction_status: "pending" | "processing" | "completed" | "failed" | "cancelled" | "disputed"
      user_status: "active" | "suspended" | "banned" | "pending_verification" | "deleted"
      verification_status: "unverified" | "pending" | "verified" | "rejected" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<TableName extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals }> = 
  TableName extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[TableName["schema"]]["Tables"][keyof DatabaseWithoutInternals[TableName["schema"]]["Tables"]]
    : TableName extends keyof DefaultSchema["Tables"]
      ? DefaultSchema["Tables"][TableName]
      : never

export type Enums<EnumName extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][EnumName]
