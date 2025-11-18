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
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string | null
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          postal_code: string | null
          state: string | null
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          postal_code?: string | null
          state?: string | null
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          postal_code?: string | null
          state?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string | null
          has_eyesight: boolean | null
          id: string
          lens_type_id: string | null
          prescription_data: Json | null
          prescription_image_url: string | null
          product_id: string
          quantity: number
          session_id: string | null
          updated_at: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          has_eyesight?: boolean | null
          id?: string
          lens_type_id?: string | null
          prescription_data?: Json | null
          prescription_image_url?: string | null
          product_id: string
          quantity?: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          has_eyesight?: boolean | null
          id?: string
          lens_type_id?: string | null
          prescription_data?: Json | null
          prescription_image_url?: string | null
          product_id?: string
          quantity?: number
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_lens_type_id_fkey"
            columns: ["lens_type_id"]
            isOneToOne: false
            referencedRelation: "lens_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      lens_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_enabled: boolean | null
          name: string
          price_adjustment: number | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean | null
          name: string
          price_adjustment?: number | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_enabled?: boolean | null
          name?: string
          price_adjustment?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lens_types_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          has_eyesight: boolean | null
          id: string
          lens_type_id: string | null
          order_id: string
          prescription_data: Json | null
          prescription_image_url: string | null
          product_id: string | null
          quantity: number
          total_price: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          has_eyesight?: boolean | null
          id?: string
          lens_type_id?: string | null
          order_id: string
          prescription_data?: Json | null
          prescription_image_url?: string | null
          product_id?: string | null
          quantity?: number
          total_price: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          has_eyesight?: boolean | null
          id?: string
          lens_type_id?: string | null
          order_id?: string
          prescription_data?: Json | null
          prescription_image_url?: string | null
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_lens_type_id_fkey"
            columns: ["lens_type_id"]
            isOneToOne: false
            referencedRelation: "lens_types"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_notes: string | null
          id: string
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping_address: Json
          shipping_cost: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_notes?: string | null
          id?: string
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping_address: Json
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          total: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_notes?: string | null
          id?: string
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_address?: Json
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          images: string[] | null
          material: string | null
          price_adjustment: number | null
          product_id: string
          size: string | null
          sku: string
          stock: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          material?: string | null
          price_adjustment?: number | null
          product_id: string
          size?: string | null
          sku: string
          stock?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          material?: string | null
          price_adjustment?: number | null
          product_id?: string
          size?: string | null
          sku?: string
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category_id: string | null
          created_at: string | null
          description: string | null
          has_lens_options: boolean | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          has_lens_options?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          has_lens_options?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
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
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      order_status:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_method:
        | "jazzcash"
        | "easypaisa"
        | "bank_transfer"
        | "card"
        | "cod"
      user_role: "user" | "admin"
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
      order_status: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_method: ["jazzcash", "easypaisa", "bank_transfer", "card", "cod"],
      user_role: ["user", "admin"],
    },
  },
} as const
