export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          aircraft_type: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          tail_number: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          aircraft_type?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tail_number?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          aircraft_type?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          tail_number?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      inventory_batches: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          batch_number: string
          cost_per_unit: number | null
          created_at: string
          entered_by: string | null
          expiry_date: string | null
          id: string
          job_allocated_at: string | null
          job_allocated_by: string | null
          job_allocated_to: string | null
          location: string | null
          notes: string | null
          product_id: string
          purchase_order: string | null
          quantity: number
          received_date: string | null
          status: string | null
          supplier_id: string | null
          supplier_invoice_number: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_number: string
          cost_per_unit?: number | null
          created_at?: string
          entered_by?: string | null
          expiry_date?: string | null
          id?: string
          job_allocated_at?: string | null
          job_allocated_by?: string | null
          job_allocated_to?: string | null
          location?: string | null
          notes?: string | null
          product_id: string
          purchase_order?: string | null
          quantity?: number
          received_date?: string | null
          status?: string | null
          supplier_id?: string | null
          supplier_invoice_number?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_number?: string
          cost_per_unit?: number | null
          created_at?: string
          entered_by?: string | null
          expiry_date?: string | null
          id?: string
          job_allocated_at?: string | null
          job_allocated_by?: string | null
          job_allocated_to?: string | null
          location?: string | null
          notes?: string | null
          product_id?: string
          purchase_order?: string | null
          quantity?: number
          received_date?: string | null
          status?: string | null
          supplier_id?: string | null
          supplier_invoice_number?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          manufacturer: string | null
          minimum_stock: number | null
          name: string
          part_number: string
          reorder_point: number | null
          unit_cost: number | null
          unit_of_measure: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manufacturer?: string | null
          minimum_stock?: number | null
          name: string
          part_number: string
          reorder_point?: number | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          manufacturer?: string | null
          minimum_stock?: number | null
          name?: string
          part_number?: string
          reorder_point?: number | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_authorisations: {
        Row: {
          ac_approved: boolean | null
          auth_id: number
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          dss_approved: boolean | null
          invoice_no: string
          job_id: number
          updated_at: string | null
          user_id: string
          wb_bc_approved: boolean | null
        }
        Insert: {
          ac_approved?: boolean | null
          auth_id?: number
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          dss_approved?: boolean | null
          invoice_no: string
          job_id: number
          updated_at?: string | null
          user_id: string
          wb_bc_approved?: boolean | null
        }
        Update: {
          ac_approved?: boolean | null
          auth_id?: number
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          dss_approved?: boolean | null
          invoice_no?: string
          job_id?: number
          updated_at?: string | null
          user_id?: string
          wb_bc_approved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "job_authorisations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      job_items: {
        Row: {
          batch_no: number | null
          category: Database["public"]["Enums"]["item_category"] | null
          created_at: string | null
          description: string | null
          fitting_price: number | null
          issued_by_code: string | null
          item_date: string | null
          item_id: number
          job_id: number
          prepaid: boolean | null
          qty: number
          received_by: string | null
          stock_card_no: string | null
          total_cost: number | null
          unit_cost: number | null
          uom: string | null
          updated_at: string | null
          user_id: string
          verified_by: string | null
          warehouse: string | null
        }
        Insert: {
          batch_no?: number | null
          category?: Database["public"]["Enums"]["item_category"] | null
          created_at?: string | null
          description?: string | null
          fitting_price?: number | null
          issued_by_code?: string | null
          item_date?: string | null
          item_id?: number
          job_id: number
          prepaid?: boolean | null
          qty: number
          received_by?: string | null
          stock_card_no?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          uom?: string | null
          updated_at?: string | null
          user_id: string
          verified_by?: string | null
          warehouse?: string | null
        }
        Update: {
          batch_no?: number | null
          category?: Database["public"]["Enums"]["item_category"] | null
          created_at?: string | null
          description?: string | null
          fitting_price?: number | null
          issued_by_code?: string | null
          item_date?: string | null
          item_id?: number
          job_id?: number
          prepaid?: boolean | null
          qty?: number
          received_by?: string | null
          stock_card_no?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          uom?: string | null
          updated_at?: string | null
          user_id?: string
          verified_by?: string | null
          warehouse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      jobs: {
        Row: {
          aircraft_reg: string
          created_at: string | null
          customer_id: string | null
          date_opened: string
          invoice_date: string | null
          job_id: number
          job_no: string
          status: Database["public"]["Enums"]["job_status"] | null
          sub_job_card_of: number | null
          total_cost_price: number | null
          total_fitting_cost: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aircraft_reg: string
          created_at?: string | null
          customer_id?: string | null
          date_opened: string
          invoice_date?: string | null
          job_id?: number
          job_no: string
          status?: Database["public"]["Enums"]["job_status"] | null
          sub_job_card_of?: number | null
          total_cost_price?: number | null
          total_fitting_cost?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aircraft_reg?: string
          created_at?: string | null
          customer_id?: string | null
          date_opened?: string
          invoice_date?: string | null
          job_id?: number
          job_no?: string
          status?: Database["public"]["Enums"]["job_status"] | null
          sub_job_card_of?: number | null
          total_cost_price?: number | null
          total_fitting_cost?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_sub_job_card_of_fkey"
            columns: ["sub_job_card_of"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          specialty: string | null
          state: string | null
          updated_at: string
          user_id: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          specialty?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          specialty?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      inventory_summary: {
        Row: {
          batch_count: number | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          manufacturer: string | null
          minimum_stock: number | null
          name: string | null
          part_number: string | null
          reorder_point: number | null
          total_quantity: number | null
          unit_cost: number | null
          unit_of_measure: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_roles_view: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "parts_approver"
        | "job_allocator"
        | "batch_manager"
        | "supervisor"
      item_category: "spare" | "consumable" | "owner_supplied"
      job_status: "open" | "awaiting_auth" | "closed"
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
      app_role: [
        "admin",
        "parts_approver",
        "job_allocator",
        "batch_manager",
        "supervisor",
      ],
      item_category: ["spare", "consumable", "owner_supplied"],
      job_status: ["open", "awaiting_auth", "closed"],
    },
  },
} as const
