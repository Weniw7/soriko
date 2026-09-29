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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      collector_profiles: {
        Row: {
          country_code: string | null
          created_at: string
          display_name: string | null
          favorite_era: string | null
          favorite_product_language:
            | Database["public"]["Enums"]["product_language"]
            | null
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          favorite_era?: string | null
          favorite_product_language?:
            | Database["public"]["Enums"]["product_language"]
            | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          favorite_era?: string | null
          favorite_product_language?:
            | Database["public"]["Enums"]["product_language"]
            | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_lots: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          purchase_order_item_id: string | null
          quantity_available: number
          quantity_received: number
          received_at: string
          status: Database["public"]["Enums"]["inventory_status"]
          unit_cost_eur: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          purchase_order_item_id?: string | null
          quantity_available: number
          quantity_received: number
          received_at?: string
          status?: Database["public"]["Enums"]["inventory_status"]
          unit_cost_eur: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          purchase_order_item_id?: string | null
          quantity_available?: number
          quantity_received?: number
          received_at?: string
          status?: Database["public"]["Enums"]["inventory_status"]
          unit_cost_eur?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      landed_cost_calculations: {
        Row: {
          admin_fees_eur: number
          consolidation_fee_eur: number
          created_at: string
          customs_duty_eur: number
          domestic_jp_shipping_eur: number
          id: string
          import_vat_cash_eur: number
          international_shipping_eur: number
          landed_cash_total_eur: number | null
          landed_economic_total_eur: number | null
          other_costs_eur: number
          product_cost_eur: number
          product_id: string
          proxy_fee_eur: number
          quantity: number
          recoverable_import_vat_eur: number
          supplier_listing_id: string | null
        }
        Insert: {
          admin_fees_eur?: number
          consolidation_fee_eur?: number
          created_at?: string
          customs_duty_eur?: number
          domestic_jp_shipping_eur?: number
          id?: string
          import_vat_cash_eur?: number
          international_shipping_eur?: number
          landed_cash_total_eur?: number | null
          landed_economic_total_eur?: number | null
          other_costs_eur?: number
          product_cost_eur?: number
          product_id: string
          proxy_fee_eur?: number
          quantity: number
          recoverable_import_vat_eur?: number
          supplier_listing_id?: string | null
        }
        Update: {
          admin_fees_eur?: number
          consolidation_fee_eur?: number
          created_at?: string
          customs_duty_eur?: number
          domestic_jp_shipping_eur?: number
          id?: string
          import_vat_cash_eur?: number
          international_shipping_eur?: number
          landed_cash_total_eur?: number | null
          landed_economic_total_eur?: number | null
          other_costs_eur?: number
          product_cost_eur?: number
          product_id?: string
          proxy_fee_eur?: number
          quantity?: number
          recoverable_import_vat_eur?: number
          supplier_listing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landed_cost_calculations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landed_cost_calculations_supplier_listing_id_fkey"
            columns: ["supplier_listing_id"]
            isOneToOne: false
            referencedRelation: "supplier_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      market_snapshots: {
        Row: {
          avg_1d: number | null
          avg_30d: number | null
          avg_7d: number | null
          avg_price: number | null
          captured_at: string
          currency: string
          id: string
          min_price: number | null
          product_id: string
          seller_count: number | null
          source_id: string
          stock_count: number | null
          trend_price: number | null
        }
        Insert: {
          avg_1d?: number | null
          avg_30d?: number | null
          avg_7d?: number | null
          avg_price?: number | null
          captured_at?: string
          currency?: string
          id?: string
          min_price?: number | null
          product_id: string
          seller_count?: number | null
          source_id: string
          stock_count?: number | null
          trend_price?: number | null
        }
        Update: {
          avg_1d?: number | null
          avg_30d?: number | null
          avg_7d?: number | null
          avg_price?: number | null
          captured_at?: string
          currency?: string
          id?: string
          min_price?: number | null
          product_id?: string
          seller_count?: number | null
          source_id?: string
          stock_count?: number | null
          trend_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_snapshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_snapshots_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "market_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      market_sources: {
        Row: {
          active: boolean
          base_url: string | null
          created_at: string
          id: string
          name: string
          region: string | null
          source_type: string
        }
        Insert: {
          active?: boolean
          base_url?: string | null
          created_at?: string
          id?: string
          name: string
          region?: string | null
          source_type: string
        }
        Update: {
          active?: boolean
          base_url?: string | null
          created_at?: string
          id?: string
          name?: string
          region?: string | null
          source_type?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          consent_at: string | null
          consent_version: string | null
          created_at: string
          email: string
          id: string
          locale: string
          source: string
          status: string
        }
        Insert: {
          confirmed_at?: string | null
          consent_at?: string | null
          consent_version?: string | null
          created_at?: string
          email: string
          id?: string
          locale?: string
          source?: string
          status?: string
        }
        Update: {
          confirmed_at?: string | null
          consent_at?: string | null
          consent_version?: string | null
          created_at?: string
          email?: string
          id?: string
          locale?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          created_at: string
          estimated_profit_eur: number | null
          id: string
          landed_cost_id: string | null
          margin_pct: number | null
          market_price_eur: number | null
          max_buy_price_eur: number | null
          net_revenue_eur: number | null
          product_id: string
          proposed_price_eur: number | null
          rationale: string | null
          recommended_qty: number | null
          risk_score: number | null
          roi_pct: number | null
          rotation_score: number | null
          signal: Database["public"]["Enums"]["opportunity_signal"]
          status: string
          supplier_listing_id: string | null
          total_score: number | null
        }
        Insert: {
          created_at?: string
          estimated_profit_eur?: number | null
          id?: string
          landed_cost_id?: string | null
          margin_pct?: number | null
          market_price_eur?: number | null
          max_buy_price_eur?: number | null
          net_revenue_eur?: number | null
          product_id: string
          proposed_price_eur?: number | null
          rationale?: string | null
          recommended_qty?: number | null
          risk_score?: number | null
          roi_pct?: number | null
          rotation_score?: number | null
          signal?: Database["public"]["Enums"]["opportunity_signal"]
          status?: string
          supplier_listing_id?: string | null
          total_score?: number | null
        }
        Update: {
          created_at?: string
          estimated_profit_eur?: number | null
          id?: string
          landed_cost_id?: string | null
          margin_pct?: number | null
          market_price_eur?: number | null
          max_buy_price_eur?: number | null
          net_revenue_eur?: number | null
          product_id?: string
          proposed_price_eur?: number | null
          rationale?: string | null
          recommended_qty?: number | null
          risk_score?: number | null
          roi_pct?: number | null
          rotation_score?: number | null
          signal?: Database["public"]["Enums"]["opportunity_signal"]
          status?: string
          supplier_listing_id?: string | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_landed_cost_id_fkey"
            columns: ["landed_cost_id"]
            isOneToOne: false
            referencedRelation: "landed_cost_calculations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_supplier_listing_id_fkey"
            columns: ["supplier_listing_id"]
            isOneToOne: false
            referencedRelation: "supplier_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          barcode: string | null
          created_at: string
          id: string
          image_url: string | null
          language: Database["public"]["Enums"]["product_language"]
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          sealed: boolean
          set_id: string | null
          sku: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          language: Database["public"]["Enums"]["product_language"]
          name: string
          product_type?: Database["public"]["Enums"]["product_type"]
          sealed?: boolean
          set_id?: string | null
          sku?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          barcode?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          language?: Database["public"]["Enums"]["product_language"]
          name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          sealed?: boolean
          set_id?: string | null
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          landed_unit_cost_eur: number | null
          product_id: string
          purchase_order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          landed_unit_cost_eur?: number | null
          product_id: string
          purchase_order_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          landed_unit_cost_eur?: number | null
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          expected_at: string | null
          id: string
          notes: string | null
          ordered_at: string | null
          received_at: string | null
          shipping: number
          status: Database["public"]["Enums"]["purchase_status"]
          subtotal: number
          supplier_id: string
          supplier_order_ref: string | null
          taxes_duties: number
          total: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency: string
          expected_at?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          received_at?: string | null
          shipping?: number
          status?: Database["public"]["Enums"]["purchase_status"]
          subtotal?: number
          supplier_id: string
          supplier_order_ref?: string | null
          taxes_duties?: number
          total?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          expected_at?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          received_at?: string | null
          shipping?: number
          status?: Database["public"]["Enums"]["purchase_status"]
          subtotal?: number
          supplier_id?: string
          supplier_order_ref?: string | null
          taxes_duties?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          created_at: string
          id: string
          inventory_lot_id: string | null
          product_id: string
          profit_eur: number | null
          quantity: number
          sales_order_id: string
          unit_cost_eur: number | null
          unit_price_eur: number
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_lot_id?: string | null
          product_id: string
          profit_eur?: number | null
          quantity: number
          sales_order_id: string
          unit_cost_eur?: number | null
          unit_price_eur: number
        }
        Update: {
          created_at?: string
          id?: string
          inventory_lot_id?: string | null
          product_id?: string
          profit_eur?: number | null
          quantity?: number
          sales_order_id?: string
          unit_cost_eur?: number | null
          unit_price_eur?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_inventory_lot_id_fkey"
            columns: ["inventory_lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          channel: string
          created_at: string
          customer_country: string | null
          external_order_id: string | null
          gross_total_eur: number
          id: string
          net_total_eur: number
          ordered_at: string
          payment_fees_eur: number
          shipping_cost_eur: number
          tax_eur: number
        }
        Insert: {
          channel?: string
          created_at?: string
          customer_country?: string | null
          external_order_id?: string | null
          gross_total_eur?: number
          id?: string
          net_total_eur?: number
          ordered_at?: string
          payment_fees_eur?: number
          shipping_cost_eur?: number
          tax_eur?: number
        }
        Update: {
          channel?: string
          created_at?: string
          customer_country?: string | null
          external_order_id?: string | null
          gross_total_eur?: number
          id?: string
          net_total_eur?: number
          ordered_at?: string
          payment_fees_eur?: number
          shipping_cost_eur?: number
          tax_eur?: number
        }
        Relationships: []
      }
      scan_runs: {
        Row: {
          error_summary: string | null
          finished_at: string | null
          id: string
          opportunities_found: number
          products_scanned: number
          source_name: string
          started_at: string
          status: string
        }
        Insert: {
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          opportunities_found?: number
          products_scanned?: number
          source_name: string
          started_at?: string
          status: string
        }
        Update: {
          error_summary?: string | null
          finished_at?: string | null
          id?: string
          opportunities_found?: number
          products_scanned?: number
          source_name?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      sets: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          region: string | null
          release_date: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          region?: string | null
          release_date?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          region?: string | null
          release_date?: string | null
        }
        Relationships: []
      }
      shipping_quotes: {
        Row: {
          amount: number
          carrier: string | null
          created_at: string
          currency: string
          destination_country: string
          id: string
          notes: string | null
          origin_country: string | null
          package_weight_kg: number | null
          supplier_id: string | null
          valid_until: string | null
        }
        Insert: {
          amount: number
          carrier?: string | null
          created_at?: string
          currency: string
          destination_country?: string
          id?: string
          notes?: string | null
          origin_country?: string | null
          package_weight_kg?: number | null
          supplier_id?: string | null
          valid_until?: string | null
        }
        Update: {
          amount?: number
          carrier?: string | null
          created_at?: string
          currency?: string
          destination_country?: string
          id?: string
          notes?: string | null
          origin_country?: string | null
          package_weight_kg?: number | null
          supplier_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_listings: {
        Row: {
          captured_at: string
          currency: string
          external_sku: string | null
          id: string
          min_qty: number | null
          product_id: string
          source_url: string | null
          stock_qty: number | null
          supplier_id: string
          unit_price: number
        }
        Insert: {
          captured_at?: string
          currency: string
          external_sku?: string | null
          id?: string
          min_qty?: number | null
          product_id: string
          source_url?: string | null
          stock_qty?: number | null
          supplier_id: string
          unit_price: number
        }
        Update: {
          captured_at?: string
          currency?: string
          external_sku?: string | null
          id?: string
          min_qty?: number | null
          product_id?: string
          source_url?: string | null
          stock_qty?: number | null
          supplier_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_listings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          b2b_status: string | null
          country_code: string | null
          created_at: string
          id: string
          lead_time_days: number | null
          moq_amount: number | null
          moq_currency: string | null
          name: string
          notes: string | null
          rating: number | null
          shipping_notes: string | null
          supplier_type: Database["public"]["Enums"]["supplier_type"]
          updated_at: string
          verified: boolean
          website_url: string | null
        }
        Insert: {
          b2b_status?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          lead_time_days?: number | null
          moq_amount?: number | null
          moq_currency?: string | null
          name: string
          notes?: string | null
          rating?: number | null
          shipping_notes?: string | null
          supplier_type: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          b2b_status?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          lead_time_days?: number | null
          moq_amount?: number | null
          moq_currency?: string | null
          name?: string
          notes?: string | null
          rating?: number | null
          shipping_notes?: string | null
          supplier_type?: Database["public"]["Enums"]["supplier_type"]
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          notify_price: boolean
          notify_stock: boolean
          priority: number
          product_id: string
          target_price_eur: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_price?: boolean
          notify_stock?: boolean
          priority?: number
          product_id: string
          target_price_eur?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_price?: boolean
          notify_stock?: boolean
          priority?: number
          product_id?: string
          target_price_eur?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_write: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      inventory_status:
        | "AVAILABLE"
        | "RESERVED"
        | "SOLD"
        | "DAMAGED"
        | "RETURNED"
      opportunity_signal: "GREEN" | "YELLOW" | "RED"
      product_language: "JP" | "EN" | "ES" | "OTHER"
      product_type:
        | "BOOSTER_BOX"
        | "ETB"
        | "COLLECTION"
        | "SINGLE"
        | "ACCESSORY"
        | "OTHER"
      purchase_status:
        | "DRAFT"
        | "ORDERED"
        | "PAID"
        | "SHIPPED"
        | "CUSTOMS"
        | "RECEIVED"
        | "CANCELLED"
      supplier_type: "EU_B2B" | "JP_B2B" | "PROXY" | "MARKETPLACE" | "OTHER"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      inventory_status: [
        "AVAILABLE",
        "RESERVED",
        "SOLD",
        "DAMAGED",
        "RETURNED",
      ],
      opportunity_signal: ["GREEN", "YELLOW", "RED"],
      product_language: ["JP", "EN", "ES", "OTHER"],
      product_type: [
        "BOOSTER_BOX",
        "ETB",
        "COLLECTION",
        "SINGLE",
        "ACCESSORY",
        "OTHER",
      ],
      purchase_status: [
        "DRAFT",
        "ORDERED",
        "PAID",
        "SHIPPED",
        "CUSTOMS",
        "RECEIVED",
        "CANCELLED",
      ],
      supplier_type: ["EU_B2B", "JP_B2B", "PROXY", "MARKETPLACE", "OTHER"],
    },
  },
} as const
