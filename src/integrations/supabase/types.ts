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
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_sell_rules: {
        Row: {
          created_at: string
          display_order: number
          id: string
          restaurant_id: string
          step_label: string
          suggest_category_id: string
          trigger_category_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          restaurant_id: string
          step_label?: string
          suggest_category_id: string
          trigger_category_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          restaurant_id?: string
          step_label?: string
          suggest_category_id?: string
          trigger_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_sell_rules_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_sell_rules_suggest_category_id_fkey"
            columns: ["suggest_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_sell_rules_trigger_category_id_fkey"
            columns: ["trigger_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: string | null
          restaurant_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          restaurant_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      extras: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string | null
          is_active: boolean
          name: string
          price: number
          product_id: string
          quantity_used: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          is_active?: boolean
          name: string
          price?: number
          product_id: string
          quantity_used?: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          is_active?: boolean
          name?: string
          price?: number
          product_id?: string
          quantity_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "extras_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extras_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category: string
          cost_price: number
          created_at: string
          current_stock: number
          expiration_date: string | null
          id: string
          min_stock: number
          name: string
          restaurant_id: string
          unit: string
        }
        Insert: {
          category?: string
          cost_price?: number
          created_at?: string
          current_stock?: number
          expiration_date?: string | null
          id?: string
          min_stock?: number
          name: string
          restaurant_id: string
          unit?: string
        }
        Update: {
          category?: string
          cost_price?: number
          created_at?: string
          current_stock?: number
          expiration_date?: string | null
          id?: string
          min_stock?: number
          name?: string
          restaurant_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          extras_json: Json | null
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          extras_json?: Json | null
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          extras_json?: Json | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          change_for: number | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          delivery_address: string | null
          id: string
          order_type: string
          payment_method: string
          restaurant_id: string
          status: string
          total_amount: number
        }
        Insert: {
          change_for?: number | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          order_type?: string
          payment_method?: string
          restaurant_id: string
          status?: string
          total_amount?: number
        }
        Update: {
          change_for?: number | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string | null
          id?: string
          order_type?: string
          payment_method?: string
          restaurant_id?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_features: number
          max_waiters: number
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_features?: number
          max_waiters?: number
          name: string
          price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_features?: number
          max_waiters?: number
          name?: string
          price?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          badge: string | null
          category: string
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          promo_price: number | null
          restaurant_id: string
          sell_price: number
        }
        Insert: {
          badge?: string | null
          category?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          promo_price?: number | null
          restaurant_id: string
          sell_price?: number
        }
        Update: {
          badge?: string | null
          category?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          promo_price?: number | null
          restaurant_id?: string
          sell_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          restaurant_id: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          restaurant_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          can_remove: boolean
          id: string
          ingredient_id: string
          product_id: string
          quantity_used: number
        }
        Insert: {
          can_remove?: boolean
          id?: string
          ingredient_id: string
          product_id: string
          quantity_used?: number
        }
        Update: {
          can_remove?: boolean
          id?: string
          ingredient_id?: string
          product_id?: string
          quantity_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          banner_url: string | null
          close_time: string | null
          created_at: string
          document: string | null
          id: string
          is_open: boolean | null
          logo_url: string | null
          name: string
          name_color: string | null
          open_time: string | null
          phone: string | null
          plan_id: string | null
          primary_color: string | null
          promo_banner_text: string | null
        }
        Insert: {
          banner_url?: string | null
          close_time?: string | null
          created_at?: string
          document?: string | null
          id?: string
          is_open?: boolean | null
          logo_url?: string | null
          name: string
          name_color?: string | null
          open_time?: string | null
          phone?: string | null
          plan_id?: string | null
          primary_color?: string | null
          promo_banner_text?: string | null
        }
        Update: {
          banner_url?: string | null
          close_time?: string | null
          created_at?: string
          document?: string | null
          id?: string
          is_open?: boolean | null
          logo_url?: string | null
          name?: string
          name_color?: string | null
          open_time?: string | null
          phone?: string | null
          plan_id?: string | null
          primary_color?: string | null
          promo_banner_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_entries: {
        Row: {
          cost_price: number
          created_at: string
          expiration_date: string | null
          id: string
          ingredient_id: string
          notes: string | null
          quantity: number
          restaurant_id: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          expiration_date?: string | null
          id?: string
          ingredient_id: string
          notes?: string | null
          quantity?: number
          restaurant_id: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          expiration_date?: string | null
          id?: string
          ingredient_id?: string
          notes?: string | null
          quantity?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entries_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
      count_restaurant_waiters: {
        Args: { _restaurant_id: string }
        Returns: number
      }
      get_daily_cmv: { Args: { _restaurant_id: string }; Returns: number }
      get_daily_revenue: { Args: { _restaurant_id: string }; Returns: number }
      get_user_restaurant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "ADMIN" | "STAFF"
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
      app_role: ["ADMIN", "STAFF"],
    },
  },
} as const
