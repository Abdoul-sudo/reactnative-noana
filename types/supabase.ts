export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          address: string
          city: string
          lat: number | null
          lng: number | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          address: string
          city: string
          lat?: number | null
          lng?: number | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          address?: string
          city?: string
          lat?: number | null
          lng?: number | null
          is_default?: boolean | null
          created_at?: string | null
          updated_at?: string | null
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
      menu_categories: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          name: string
          restaurant_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          restaurant_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          dietary_tags: Json | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          prep_time_min: number | null
          price: number
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          dietary_tags?: Json | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          prep_time_min?: number | null
          price: number
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          dietary_tags?: Json | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          prep_time_min?: number | null
          price?: number
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string
          restaurant_id: string
          status: string
          items: Json
          delivery_address: Json
          subtotal: number
          delivery_fee: number
          total: number
          special_instructions: string | null
          estimated_delivery_at: string | null
          placed_at: string | null
          confirmed_at: string | null
          preparing_at: string | null
          on_the_way_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_id: string
          status?: string
          items: Json
          delivery_address: Json
          subtotal: number
          delivery_fee?: number
          total: number
          special_instructions?: string | null
          estimated_delivery_at?: string | null
          placed_at?: string | null
          confirmed_at?: string | null
          preparing_at?: string | null
          on_the_way_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_id?: string
          status?: string
          items?: Json
          delivery_address?: Json
          subtotal?: number
          delivery_fee?: number
          total?: number
          special_instructions?: string | null
          estimated_delivery_at?: string | null
          placed_at?: string | null
          confirmed_at?: string | null
          preparing_at?: string | null
          on_the_way_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          cuisine_preferences: Json | null
          dietary_preferences: Json | null
          display_name: string | null
          email: string | null
          id: string
          onboarding_completed: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          cuisine_preferences?: Json | null
          dietary_preferences?: Json | null
          display_name?: string | null
          email?: string | null
          id: string
          onboarding_completed?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          cuisine_preferences?: Json | null
          dietary_preferences?: Json | null
          display_name?: string | null
          email?: string | null
          id?: string
          onboarding_completed?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          cover_image_url: string | null
          created_at: string | null
          cuisine_type: string | null
          deleted_at: string | null
          delivery_fee: number | null
          delivery_time_min: number | null
          description: string | null
          dietary_options: Json | null
          id: string
          is_open: boolean | null
          latitude: number
          logo_url: string | null
          longitude: number
          minimum_order: number | null
          name: string
          owner_id: string
          phone: string | null
          price_range: string | null
          rating: number | null
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          deleted_at?: string | null
          delivery_fee?: number | null
          delivery_time_min?: number | null
          description?: string | null
          dietary_options?: Json | null
          id?: string
          is_open?: boolean | null
          latitude: number
          logo_url?: string | null
          longitude: number
          minimum_order?: number | null
          name: string
          owner_id: string
          phone?: string | null
          price_range?: string | null
          rating?: number | null
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          deleted_at?: string | null
          delivery_fee?: number | null
          delivery_time_min?: number | null
          description?: string | null
          dietary_options?: Json | null
          id?: string
          is_open?: boolean | null
          latitude?: number
          logo_url?: string | null
          longitude?: number
          minimum_order?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          price_range?: string | null
          rating?: number | null
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          owner_reply: string | null
          owner_reply_at: string | null
          rating: number
          restaurant_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          owner_reply?: string | null
          owner_reply_at?: string | null
          rating: number
          restaurant_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          owner_reply?: string | null
          owner_reply_at?: string | null
          rating?: number
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nearby_restaurants: {
        Args: {
          dietary_filter?: Json
          radius_km?: number
          user_lat: number
          user_lng: number
        }
        Returns: {
          cover_image_url: string
          cuisine_type: string
          delivery_fee: number
          delivery_time_min: number
          dietary_options: Json
          distance_km: number
          id: string
          is_open: boolean
          name: string
          price_range: string
          rating: number
          slug: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

