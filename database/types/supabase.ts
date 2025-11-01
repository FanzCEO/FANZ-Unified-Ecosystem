// TypeScript types for FANZ Unified Ecosystem Database
// Auto-generated from Supabase on 2025-11-01
// Project: mcayxybcgxhfttvwmhgm

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          password_hash: string | null
          display_name: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          bio: string | null
          date_of_birth: string | null
          phone_number: string | null
          email_verified: boolean | null
          phone_verified: boolean | null
          is_creator: boolean | null
          role: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          username: string
          password_hash?: string | null
          display_name?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          date_of_birth?: string | null
          phone_number?: string | null
          email_verified?: boolean | null
          phone_verified?: boolean | null
          is_creator?: boolean | null
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string
          password_hash?: string | null
          display_name?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          date_of_birth?: string | null
          phone_number?: string | null
          email_verified?: boolean | null
          phone_verified?: boolean | null
          is_creator?: boolean | null
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: []
      }
      creators: {
        Row: {
          id: string
          user_id: string
          creator_name: string
          description: string | null
          category: string | null
          status: Database["public"]["Enums"]["creator_status"] | null
          verification_status: Database["public"]["Enums"]["verification_status"] | null
          subscription_price_monthly: number | null
          subscription_price_quarterly: number | null
          subscription_price_yearly: number | null
          subscription_price_lifetime: number | null
          tips_enabled: boolean | null
          ppv_enabled: boolean | null
          merchandise_enabled: boolean | null
          live_streaming_enabled: boolean | null
          earnings_total: number | null
          earnings_this_month: number | null
          subscriber_count: number | null
          content_count: number | null
          tip_count: number | null
          social_links: Json | null
          bank_details_encrypted: string | null
          tax_info_encrypted: string | null
          payout_schedule: string | null
          minimum_payout: number | null
          commission_rate: number | null
          approved_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          creator_name: string
          description?: string | null
          category?: string | null
          status?: Database["public"]["Enums"]["creator_status"] | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
          subscription_price_monthly?: number | null
          subscription_price_quarterly?: number | null
          subscription_price_yearly?: number | null
          subscription_price_lifetime?: number | null
          tips_enabled?: boolean | null
          ppv_enabled?: boolean | null
          merchandise_enabled?: boolean | null
          live_streaming_enabled?: boolean | null
          earnings_total?: number | null
          earnings_this_month?: number | null
          subscriber_count?: number | null
          content_count?: number | null
          tip_count?: number | null
          social_links?: Json | null
          bank_details_encrypted?: string | null
          tax_info_encrypted?: string | null
          payout_schedule?: string | null
          minimum_payout?: number | null
          commission_rate?: number | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          creator_name?: string
          description?: string | null
          category?: string | null
          status?: Database["public"]["Enums"]["creator_status"] | null
          verification_status?: Database["public"]["Enums"]["verification_status"] | null
          subscription_price_monthly?: number | null
          subscription_price_quarterly?: number | null
          subscription_price_yearly?: number | null
          subscription_price_lifetime?: number | null
          tips_enabled?: boolean | null
          ppv_enabled?: boolean | null
          merchandise_enabled?: boolean | null
          live_streaming_enabled?: boolean | null
          earnings_total?: number | null
          earnings_this_month?: number | null
          subscriber_count?: number | null
          content_count?: number | null
          tip_count?: number | null
          social_links?: Json | null
          bank_details_encrypted?: string | null
          tax_info_encrypted?: string | null
          payout_schedule?: string | null
          minimum_payout?: number | null
          commission_rate?: number | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // ... Additional table types generated from Supabase
    }
    Views: {
      creator_earnings_summary: {
        Row: {
          creator_id: string | null
          creator_name: string | null
          user_id: string | null
          total_earnings: number | null
          this_month_earnings: number | null
          subscriber_count: number | null
          content_count: number | null
          tip_count: number | null
        }
      }
      content_performance: {
        Row: {
          post_id: string | null
          title: string | null
          creator_name: string | null
          cluster: Database["public"]["Enums"]["platform_cluster"] | null
          view_count: number | null
          like_count: number | null
          comment_count: number | null
          share_count: number | null
          engagement_rate: number | null
          created_at: string | null
          published_at: string | null
        }
      }
      active_subscriptions_summary: {
        Row: {
          creator_id: string | null
          creator_name: string | null
          total_active_subscribers: number | null
          average_subscription_price: number | null
          monthly_recurring_revenue: number | null
        }
      }
      platform_health_dashboard: {
        Row: {
          active_users_7d: number | null
          new_users_30d: number | null
          active_creators: number | null
          active_subscriptions: number | null
          platform_revenue_this_month: number | null
          tips_this_month: number | null
        }
      }
      platform_revenue_summary: {
        Row: {
          date: string | null
          transaction_count: number | null
          gross_revenue: number | null
          platform_revenue: number | null
          creator_earnings: number | null
          processor_costs: number | null
        }
      }
      user_engagement_metrics: {
        Row: {
          date: string | null
          cluster: Database["public"]["Enums"]["platform_cluster"] | null
          daily_active_users: number | null
          post_views: number | null
          post_likes: number | null
          comments: number | null
          new_subscriptions: number | null
          total_activities: number | null
        }
      }
    }
    Enums: {
      platform_cluster:
        | "fanzlab"
        | "boyfanz"
        | "girlfanz"
        | "daddyfanz"
        | "pupfanz"
        | "taboofanz"
        | "transfanz"
        | "cougarfanz"
        | "fanzcock"
      creator_status:
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
        | "banned"
      verification_status:
        | "unverified"
        | "pending"
        | "verified"
        | "rejected"
        | "expired"
      user_status:
        | "active"
        | "suspended"
        | "banned"
        | "pending_verification"
        | "deleted"
      content_status:
        | "draft"
        | "published"
        | "private"
        | "scheduled"
        | "archived"
        | "deleted"
      fanz_media_type: "image" | "video" | "audio" | "document" | "live_stream"
      fanz_subscription_type:
        | "monthly"
        | "quarterly"
        | "yearly"
        | "lifetime"
        | "custom"
      fanz_transaction_type:
        | "tip"
        | "subscription"
        | "ppv"
        | "merchandise"
        | "nft"
        | "withdrawal"
        | "refund"
        | "chargeback"
        | "fee"
      payment_method:
        | "ccbill"
        | "segpay"
        | "epoch"
        | "verotel"
        | "paxum"
        | "crypto_btc"
        | "crypto_eth"
        | "crypto_usdt"
        | "bank_transfer"
        | "wise"
        | "dwolla"
      transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "disputed"
      payout_status: "pending" | "processing" | "completed" | "failed"
      moderation_status: "pending" | "approved" | "rejected" | "escalated"
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

