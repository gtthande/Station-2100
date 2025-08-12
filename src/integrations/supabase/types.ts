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
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          permissions: Json | null
          role_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          permissions?: Json | null
          role_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          permissions?: Json | null
          role_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      departments: {
        Row: {
          created_at: string
          department_description: string | null
          department_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_description?: string | null
          department_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_description?: string | null
          department_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_batches: {
        Row: {
          aircraft_reg_no: string | null
          alternate_department_id: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          batch_date: string | null
          batch_id_a: string | null
          batch_id_b: string | null
          batch_number: string
          bin_no: string | null
          buying_price: number | null
          core_id: string | null
          core_value: number | null
          cost_per_unit: number | null
          created_at: string
          department_id: string | null
          dollar_amount: number | null
          dollar_rate: number | null
          entered_by: string | null
          expiry_date: string | null
          freight_rate: number | null
          id: string
          job_allocated_at: string | null
          job_allocated_by: string | null
          job_allocated_to: string | null
          location: string | null
          lpo: string | null
          notes: string | null
          product_id: string
          purchase_order: string | null
          quantity: number
          receipt_id: string | null
          receive_code: string | null
          received_by: string | null
          received_date: string | null
          reference_no: string | null
          sale_markup_percent: number | null
          sale_markup_value: number | null
          selling_price: number | null
          serial_no: string | null
          status: string | null
          supplier_id: string | null
          supplier_invoice_number: string | null
          the_size: string | null
          total_rate: number | null
          updated_at: string
          url: string | null
          user_id: string
          verification_code: string | null
          verified_by: string | null
        }
        Insert: {
          aircraft_reg_no?: string | null
          alternate_department_id?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_date?: string | null
          batch_id_a?: string | null
          batch_id_b?: string | null
          batch_number: string
          bin_no?: string | null
          buying_price?: number | null
          core_id?: string | null
          core_value?: number | null
          cost_per_unit?: number | null
          created_at?: string
          department_id?: string | null
          dollar_amount?: number | null
          dollar_rate?: number | null
          entered_by?: string | null
          expiry_date?: string | null
          freight_rate?: number | null
          id?: string
          job_allocated_at?: string | null
          job_allocated_by?: string | null
          job_allocated_to?: string | null
          location?: string | null
          lpo?: string | null
          notes?: string | null
          product_id: string
          purchase_order?: string | null
          quantity?: number
          receipt_id?: string | null
          receive_code?: string | null
          received_by?: string | null
          received_date?: string | null
          reference_no?: string | null
          sale_markup_percent?: number | null
          sale_markup_value?: number | null
          selling_price?: number | null
          serial_no?: string | null
          status?: string | null
          supplier_id?: string | null
          supplier_invoice_number?: string | null
          the_size?: string | null
          total_rate?: number | null
          updated_at?: string
          url?: string | null
          user_id: string
          verification_code?: string | null
          verified_by?: string | null
        }
        Update: {
          aircraft_reg_no?: string | null
          alternate_department_id?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          batch_date?: string | null
          batch_id_a?: string | null
          batch_id_b?: string | null
          batch_number?: string
          bin_no?: string | null
          buying_price?: number | null
          core_id?: string | null
          core_value?: number | null
          cost_per_unit?: number | null
          created_at?: string
          department_id?: string | null
          dollar_amount?: number | null
          dollar_rate?: number | null
          entered_by?: string | null
          expiry_date?: string | null
          freight_rate?: number | null
          id?: string
          job_allocated_at?: string | null
          job_allocated_by?: string | null
          job_allocated_to?: string | null
          location?: string | null
          lpo?: string | null
          notes?: string | null
          product_id?: string
          purchase_order?: string | null
          quantity?: number
          receipt_id?: string | null
          receive_code?: string | null
          received_by?: string | null
          received_date?: string | null
          reference_no?: string | null
          sale_markup_percent?: number | null
          sale_markup_value?: number | null
          selling_price?: number | null
          serial_no?: string | null
          status?: string | null
          supplier_id?: string | null
          supplier_invoice_number?: string | null
          the_size?: string | null
          total_rate?: number | null
          updated_at?: string
          url?: string | null
          user_id?: string
          verification_code?: string | null
          verified_by?: string | null
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
          active: boolean | null
          bin_no: string | null
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          minimum_stock: number | null
          open_bal_date: string | null
          open_balance: number | null
          part_number: string
          purchase_price: number | null
          rack: string | null
          reorder_point: number | null
          reorder_qty: number | null
          row_position: string | null
          sale_markup: number | null
          sale_price: number | null
          stock_category: string | null
          superseding_no: string | null
          unit_cost: number | null
          unit_of_measure: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          bin_no?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          minimum_stock?: number | null
          open_bal_date?: string | null
          open_balance?: number | null
          part_number: string
          purchase_price?: number | null
          rack?: string | null
          reorder_point?: number | null
          reorder_qty?: number | null
          row_position?: string | null
          sale_markup?: number | null
          sale_price?: number | null
          stock_category?: string | null
          superseding_no?: string | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          bin_no?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          minimum_stock?: number | null
          open_bal_date?: string | null
          open_balance?: number | null
          part_number?: string
          purchase_price?: number | null
          rack?: string | null
          reorder_point?: number | null
          reorder_qty?: number | null
          row_position?: string | null
          sale_markup?: number | null
          sale_price?: number | null
          stock_category?: string | null
          superseding_no?: string | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_approval_notifications: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string | null
          created_by: string
          id: string
          job_id: number
          message: string
          tab_type: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          job_id: number
          message: string
          tab_type: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          job_id?: number
          message?: string
          tab_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_approval_notifications_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_approval_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_approval_notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["jobcardid"]
          },
          {
            foreignKeyName: "job_approval_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      job_cards: {
        Row: {
          ac_approvedate: string | null
          ac_aproved: boolean | null
          ac_aproved_by: string | null
          ac_forwarddate: string | null
          ac_no: number | null
          accomponentserno: string | null
          aircraft_regno: string | null
          approvedate: string | null
          approvedby: string | null
          assignedto: number | null
          authorisedby: number | null
          authoriseddate: string | null
          category: string | null
          close_invoice: string | null
          closed: boolean | null
          consumables_approved: boolean | null
          consumables_approved_by: string | null
          custaddress: string | null
          custfax: string | null
          custinvno: number | null
          customerid: number | null
          customername: string | null
          custphone: string | null
          date_closed: string | null
          date_opened: string | null
          dateforwarded: string | null
          description: string | null
          empid: number | null
          finalized_at: string | null
          finalized_by: string | null
          invoice_number: string | null
          issuedby: number | null
          issueddate: string | null
          job_status: string | null
          jobcardid: number
          manual_jobno: number | null
          oss_approved: boolean | null
          oss_approved_by: string | null
          oss_approvedate: string | null
          oss_forwarddate: string | null
          oss_no: number | null
          owner_supplied_approved: boolean | null
          owner_supplied_approved_at: string | null
          owner_supplied_approved_by: string | null
          parts_cost: unknown | null
          parts_price: unknown | null
          prepaid: boolean | null
          preparedate: string | null
          preparedby: string | null
          printed: boolean | null
          receivedby: number | null
          receiveddate: string | null
          remarks: string | null
          requestedby: number | null
          requisitiondate: string | null
          service_cost: unknown | null
          service_fitting_cost: unknown | null
          stockcardpostedby: number | null
          stockcardposteddate: string | null
          subjobcardid: string | null
          user_id: string | null
          warehouse_a_approved: boolean | null
          warehouse_a_approved_at: string | null
          warehouse_a_approved_by: string | null
          warehouse_bc_approved: boolean | null
          warehouse_bc_approved_at: string | null
          warehouse_bc_approved_by: string | null
          whb_approvedate: string | null
          whb_aproved: boolean | null
          whb_aproved_by: string | null
          whb_forwarddate: string | null
          whbnc_cost: unknown | null
          whbnc_fitting: unknown | null
          whbnc_no: number | null
        }
        Insert: {
          ac_approvedate?: string | null
          ac_aproved?: boolean | null
          ac_aproved_by?: string | null
          ac_forwarddate?: string | null
          ac_no?: number | null
          accomponentserno?: string | null
          aircraft_regno?: string | null
          approvedate?: string | null
          approvedby?: string | null
          assignedto?: number | null
          authorisedby?: number | null
          authoriseddate?: string | null
          category?: string | null
          close_invoice?: string | null
          closed?: boolean | null
          consumables_approved?: boolean | null
          consumables_approved_by?: string | null
          custaddress?: string | null
          custfax?: string | null
          custinvno?: number | null
          customerid?: number | null
          customername?: string | null
          custphone?: string | null
          date_closed?: string | null
          date_opened?: string | null
          dateforwarded?: string | null
          description?: string | null
          empid?: number | null
          finalized_at?: string | null
          finalized_by?: string | null
          invoice_number?: string | null
          issuedby?: number | null
          issueddate?: string | null
          job_status?: string | null
          jobcardid?: number
          manual_jobno?: number | null
          oss_approved?: boolean | null
          oss_approved_by?: string | null
          oss_approvedate?: string | null
          oss_forwarddate?: string | null
          oss_no?: number | null
          owner_supplied_approved?: boolean | null
          owner_supplied_approved_at?: string | null
          owner_supplied_approved_by?: string | null
          parts_cost?: unknown | null
          parts_price?: unknown | null
          prepaid?: boolean | null
          preparedate?: string | null
          preparedby?: string | null
          printed?: boolean | null
          receivedby?: number | null
          receiveddate?: string | null
          remarks?: string | null
          requestedby?: number | null
          requisitiondate?: string | null
          service_cost?: unknown | null
          service_fitting_cost?: unknown | null
          stockcardpostedby?: number | null
          stockcardposteddate?: string | null
          subjobcardid?: string | null
          user_id?: string | null
          warehouse_a_approved?: boolean | null
          warehouse_a_approved_at?: string | null
          warehouse_a_approved_by?: string | null
          warehouse_bc_approved?: boolean | null
          warehouse_bc_approved_at?: string | null
          warehouse_bc_approved_by?: string | null
          whb_approvedate?: string | null
          whb_aproved?: boolean | null
          whb_aproved_by?: string | null
          whb_forwarddate?: string | null
          whbnc_cost?: unknown | null
          whbnc_fitting?: unknown | null
          whbnc_no?: number | null
        }
        Update: {
          ac_approvedate?: string | null
          ac_aproved?: boolean | null
          ac_aproved_by?: string | null
          ac_forwarddate?: string | null
          ac_no?: number | null
          accomponentserno?: string | null
          aircraft_regno?: string | null
          approvedate?: string | null
          approvedby?: string | null
          assignedto?: number | null
          authorisedby?: number | null
          authoriseddate?: string | null
          category?: string | null
          close_invoice?: string | null
          closed?: boolean | null
          consumables_approved?: boolean | null
          consumables_approved_by?: string | null
          custaddress?: string | null
          custfax?: string | null
          custinvno?: number | null
          customerid?: number | null
          customername?: string | null
          custphone?: string | null
          date_closed?: string | null
          date_opened?: string | null
          dateforwarded?: string | null
          description?: string | null
          empid?: number | null
          finalized_at?: string | null
          finalized_by?: string | null
          invoice_number?: string | null
          issuedby?: number | null
          issueddate?: string | null
          job_status?: string | null
          jobcardid?: number
          manual_jobno?: number | null
          oss_approved?: boolean | null
          oss_approved_by?: string | null
          oss_approvedate?: string | null
          oss_forwarddate?: string | null
          oss_no?: number | null
          owner_supplied_approved?: boolean | null
          owner_supplied_approved_at?: string | null
          owner_supplied_approved_by?: string | null
          parts_cost?: unknown | null
          parts_price?: unknown | null
          prepaid?: boolean | null
          preparedate?: string | null
          preparedby?: string | null
          printed?: boolean | null
          receivedby?: number | null
          receiveddate?: string | null
          remarks?: string | null
          requestedby?: number | null
          requisitiondate?: string | null
          service_cost?: unknown | null
          service_fitting_cost?: unknown | null
          stockcardpostedby?: number | null
          stockcardposteddate?: string | null
          subjobcardid?: string | null
          user_id?: string | null
          warehouse_a_approved?: boolean | null
          warehouse_a_approved_at?: string | null
          warehouse_a_approved_by?: string | null
          warehouse_bc_approved?: boolean | null
          warehouse_bc_approved_at?: string | null
          warehouse_bc_approved_by?: string | null
          whb_approvedate?: string | null
          whb_aproved?: boolean | null
          whb_aproved_by?: string | null
          whb_forwarddate?: string | null
          whbnc_cost?: unknown | null
          whbnc_fitting?: unknown | null
          whbnc_no?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_cards_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_owner_supplied_approved_by_fkey"
            columns: ["owner_supplied_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_warehouse_a_approved_by_fkey"
            columns: ["warehouse_a_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_warehouse_bc_approved_by_fkey"
            columns: ["warehouse_bc_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          issued_at: string | null
          issued_by_code: string | null
          issued_by_staff_id: string | null
          item_date: string | null
          item_id: number
          job_id: number
          prepaid: boolean | null
          qty: number
          received_at: string | null
          received_by: string | null
          received_by_staff_id: string | null
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
          issued_at?: string | null
          issued_by_code?: string | null
          issued_by_staff_id?: string | null
          item_date?: string | null
          item_id?: number
          job_id: number
          prepaid?: boolean | null
          qty: number
          received_at?: string | null
          received_by?: string | null
          received_by_staff_id?: string | null
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
          issued_at?: string | null
          issued_by_code?: string | null
          issued_by_staff_id?: string | null
          item_date?: string | null
          item_id?: number
          job_id?: number
          prepaid?: boolean | null
          qty?: number
          received_at?: string | null
          received_by?: string | null
          received_by_staff_id?: string | null
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
            foreignKeyName: "job_items_issued_by_staff_id_fkey"
            columns: ["issued_by_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["job_id"]
          },
          {
            foreignKeyName: "job_items_received_by_staff_id_fkey"
            columns: ["received_by_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobcard_parts: {
        Row: {
          batch_no: string
          buying_price: unknown | null
          cancelled: boolean | null
          department_id: number
          description: string | null
          empno: string | null
          fitting_price: unknown | null
          issuecode: string | null
          issuedby: string | null
          jobcardid: number | null
          part_date: string | null
          partno: number
          prepaid_dets: string | null
          qty_requested: number | null
          quantity: number | null
          staffname: string | null
          type: string | null
          uom: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          batch_no: string
          buying_price?: unknown | null
          cancelled?: boolean | null
          department_id: number
          description?: string | null
          empno?: string | null
          fitting_price?: unknown | null
          issuecode?: string | null
          issuedby?: string | null
          jobcardid?: number | null
          part_date?: string | null
          partno: number
          prepaid_dets?: string | null
          qty_requested?: number | null
          quantity?: number | null
          staffname?: string | null
          type?: string | null
          uom?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          batch_no?: string
          buying_price?: unknown | null
          cancelled?: boolean | null
          department_id?: number
          description?: string | null
          empno?: string | null
          fitting_price?: unknown | null
          issuecode?: string | null
          issuedby?: string | null
          jobcardid?: number | null
          part_date?: string | null
          partno?: number
          prepaid_dets?: string | null
          qty_requested?: number | null
          quantity?: number | null
          staffname?: string | null
          type?: string | null
          uom?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "jobcard_parts_jobcardid_fkey"
            columns: ["jobcardid"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["jobcardid"]
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
          badge_id: string | null
          biometric_data: string | null
          created_at: string | null
          department_id: string | null
          email: string
          full_name: string | null
          id: string
          is_staff: boolean | null
          phone: string | null
          pin_code: string | null
          position: string | null
          profile_image_url: string | null
          role: string | null
          staff_active: boolean | null
          staff_code: string | null
          updated_at: string | null
        }
        Insert: {
          badge_id?: string | null
          biometric_data?: string | null
          created_at?: string | null
          department_id?: string | null
          email: string
          full_name?: string | null
          id: string
          is_staff?: boolean | null
          phone?: string | null
          pin_code?: string | null
          position?: string | null
          profile_image_url?: string | null
          role?: string | null
          staff_active?: boolean | null
          staff_code?: string | null
          updated_at?: string | null
        }
        Update: {
          badge_id?: string | null
          biometric_data?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_staff?: boolean | null
          phone?: string | null
          pin_code?: string | null
          position?: string | null
          profile_image_url?: string | null
          role?: string | null
          staff_active?: boolean | null
          staff_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_role: Database["public"]["Enums"]["app_role"] | null
          old_role: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"] | null
          old_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      security_config_notes: {
        Row: {
          config_type: string
          created_at: string | null
          description: string
          id: string
          status: string | null
        }
        Insert: {
          config_type: string
          created_at?: string | null
          description: string
          id?: string
          status?: string | null
        }
        Update: {
          config_type?: string
          created_at?: string | null
          description?: string
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      staff_auth_log: {
        Row: {
          action: string
          auth_data: string | null
          auth_method: string
          created_at: string | null
          id: string
          job_item_id: number | null
          staff_id: string
          user_id: string
        }
        Insert: {
          action: string
          auth_data?: string | null
          auth_method: string
          created_at?: string | null
          id?: string
          job_item_id?: number | null
          staff_id: string
          user_id: string
        }
        Update: {
          action?: string
          auth_data?: string | null
          auth_method?: string
          created_at?: string | null
          id?: string
          job_item_id?: number | null
          staff_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_auth_log_job_item_id_fkey"
            columns: ["job_item_id"]
            isOneToOne: false
            referencedRelation: "job_items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "staff_auth_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_auth_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          granted: boolean | null
          granted_at: string | null
          granted_by: string
          id: string
          permission: string
          staff_id: string
          user_id: string
        }
        Insert: {
          granted?: boolean | null
          granted_at?: string | null
          granted_by: string
          id?: string
          permission: string
          staff_id: string
          user_id: string
        }
        Update: {
          granted?: boolean | null
          granted_at?: string | null
          granted_by?: string
          id?: string
          permission?: string
          staff_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_permissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_categories: {
        Row: {
          category_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          batch_id: string | null
          created_at: string | null
          created_by: string
          department_id: string | null
          event_type: Database["public"]["Enums"]["stock_movement_event"]
          id: string
          movement_date: string
          notes: string | null
          product_id: string
          quantity: number
          source_ref: string
          unit_cost: number
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          created_by: string
          department_id?: string | null
          event_type: Database["public"]["Enums"]["stock_movement_event"]
          id?: string
          movement_date: string
          notes?: string | null
          product_id: string
          quantity: number
          source_ref: string
          unit_cost?: number
          user_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          created_by?: string
          department_id?: string | null
          event_type?: Database["public"]["Enums"]["stock_movement_event"]
          id?: string
          movement_date?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          source_ref?: string
          unit_cost?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_batch_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_department_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
        ]
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
      tool_events: {
        Row: {
          actor_user_id: string
          at: string
          created_at: string
          event_type: Database["public"]["Enums"]["app_tool_event_type"]
          id: string
          loan_id: string | null
          meta: Json | null
          tool_id: string
          user_id: string
        }
        Insert: {
          actor_user_id: string
          at?: string
          created_at?: string
          event_type: Database["public"]["Enums"]["app_tool_event_type"]
          id?: string
          loan_id?: string | null
          meta?: Json | null
          tool_id: string
          user_id: string
        }
        Update: {
          actor_user_id?: string
          at?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["app_tool_event_type"]
          id?: string
          loan_id?: string | null
          meta?: Json | null
          tool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_events_actor_fk"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_events_loan_id_fk"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "tool_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_events_loan_id_fk"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "v_tool_movement"
            referencedColumns: ["loan_id"]
          },
          {
            foreignKeyName: "tool_events_tool_id_fk"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_events_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_loans: {
        Row: {
          auth_method: Database["public"]["Enums"]["app_tool_auth_method"]
          borrower_user_id: string
          checkout_at: string
          created_at: string
          due_at: string
          id: string
          issuer_user_id: string
          notes: string | null
          returned_at: string | null
          tool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_method: Database["public"]["Enums"]["app_tool_auth_method"]
          borrower_user_id: string
          checkout_at?: string
          created_at?: string
          due_at: string
          id?: string
          issuer_user_id: string
          notes?: string | null
          returned_at?: string | null
          tool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_method?: Database["public"]["Enums"]["app_tool_auth_method"]
          borrower_user_id?: string
          checkout_at?: string
          created_at?: string
          due_at?: string
          id?: string
          issuer_user_id?: string
          notes?: string | null
          returned_at?: string | null
          tool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_loans_borrower_fk"
            columns: ["borrower_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_loans_issuer_fk"
            columns: ["issuer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_loans_tool_id_fk"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_loans_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          created_at: string
          default_due_hours: number | null
          id: string
          name: string
          serial_no: string | null
          sku: string | null
          status: Database["public"]["Enums"]["app_tool_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_due_hours?: number | null
          id?: string
          name: string
          serial_no?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["app_tool_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_due_hours?: number | null
          id?: string
          name?: string
          serial_no?: string | null
          sku?: string | null
          status?: Database["public"]["Enums"]["app_tool_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_roles: {
        Row: {
          created_at: string
          custom_role_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
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
      v_tool_movement: {
        Row: {
          actor_name: string | null
          at: string | null
          event: string | null
          from_holder: string | null
          issuer_name: string | null
          loan_id: string | null
          serial_no: string | null
          sku: string | null
          to_holder: string | null
          tool_id: string | null
          tool_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_events_tool_id_fk"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_events_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      compute_tool_due_at: {
        Args: { _tool_id: string; _checkout_at: string }
        Returns: string
      }
      get_batch_breakdown_report: {
        Args: { _user_id: string; _product_id?: string; _as_of_date?: string }
        Returns: {
          product_id: string
          part_number: string
          batch_id: string
          batch_number: string
          quantity_on_hand: number
          weighted_avg_cost: number
          total_value: number
          date_received: string
        }[]
      }
      get_inventory_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          product_id: string
          part_number: string
          description: string
          total_quantity: number
          allocated_quantity: number
          available_quantity: number
          reorder_point: number
        }[]
      }
      get_stock_on_hand: {
        Args: {
          _user_id: string
          _product_id: string
          _as_of_date?: string
          _batch_id?: string
        }
        Returns: {
          product_id: string
          batch_id: string
          quantity_on_hand: number
          weighted_avg_cost: number
          total_value: number
        }[]
      }
      get_stock_valuation_report: {
        Args: { _user_id: string; _as_of_date?: string }
        Returns: {
          product_id: string
          part_number: string
          description: string
          quantity_on_hand: number
          weighted_avg_cost: number
          total_value: number
        }[]
      }
      get_user_roles_with_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          role: string
          full_name: string
          email: string
          created_at: string
        }[]
      }
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
      app_tool_auth_method: "code" | "fingerprint"
      app_tool_event_type: "checkout" | "return" | "transfer"
      app_tool_status: "in_stock" | "checked_out"
      item_category: "spare" | "consumable" | "owner_supplied"
      job_status: "open" | "awaiting_auth" | "closed"
      stock_movement_event:
        | "OPEN_BALANCE"
        | "BATCH_RECEIPT"
        | "JOB_CARD_ISSUE"
        | "ADJUSTMENT_IN"
        | "ADJUSTMENT_OUT"
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
      app_tool_auth_method: ["code", "fingerprint"],
      app_tool_event_type: ["checkout", "return", "transfer"],
      app_tool_status: ["in_stock", "checked_out"],
      item_category: ["spare", "consumable", "owner_supplied"],
      job_status: ["open", "awaiting_auth", "closed"],
      stock_movement_event: [
        "OPEN_BALANCE",
        "BATCH_RECEIPT",
        "JOB_CARD_ISSUE",
        "ADJUSTMENT_IN",
        "ADJUSTMENT_OUT",
      ],
    },
  },
} as const
