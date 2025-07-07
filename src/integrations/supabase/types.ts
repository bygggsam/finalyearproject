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
      audit_logs: {
        Row: {
          action: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          ai_structured_result: Json | null
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          extracted_content: string | null
          file_name: string
          file_url: string | null
          formatted_text: string | null
          id: string
          input_format: Database["public"]["Enums"]["input_format"]
          ocr_result: Json | null
          patient_id: string | null
          patient_name: string
          processing_progress: number | null
          processing_stage: string | null
          processing_time: number | null
          status: Database["public"]["Enums"]["document_status"] | null
          updated_at: string | null
          upload_date: string | null
        }
        Insert: {
          ai_structured_result?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          extracted_content?: string | null
          file_name: string
          file_url?: string | null
          formatted_text?: string | null
          id?: string
          input_format: Database["public"]["Enums"]["input_format"]
          ocr_result?: Json | null
          patient_id?: string | null
          patient_name: string
          processing_progress?: number | null
          processing_stage?: string | null
          processing_time?: number | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string | null
          upload_date?: string | null
        }
        Update: {
          ai_structured_result?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          extracted_content?: string | null
          file_name?: string
          file_url?: string | null
          formatted_text?: string | null
          id?: string
          input_format?: Database["public"]["Enums"]["input_format"]
          ocr_result?: Json | null
          patient_id?: string | null
          patient_name?: string
          processing_progress?: number | null
          processing_stage?: string | null
          processing_time?: number | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string | null
          upload_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          contact_info: Json | null
          created_at: string | null
          created_by: string | null
          gender: string | null
          id: string
          medical_history: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          contact_info?: Json | null
          created_at?: string | null
          created_by?: string | null
          gender?: string | null
          id?: string
          medical_history?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          contact_info?: Json | null
          created_at?: string | null
          created_by?: string | null
          gender?: string | null
          id?: string
          medical_history?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          id: string
          last_login: string | null
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          id: string
          last_login?: string | null
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      document_status:
        | "uploaded"
        | "need_scanning"
        | "scanned"
        | "analyzing"
        | "processing"
        | "digitized"
        | "completed"
        | "error"
      document_type:
        | "case_history"
        | "consultation_notes"
        | "prescription"
        | "other"
      input_format: "handwritten_scan" | "handwritten_photo" | "existing_scan"
      user_role: "admin" | "doctor" | "records_officer" | "analyst"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_status: [
        "uploaded",
        "need_scanning",
        "scanned",
        "analyzing",
        "processing",
        "digitized",
        "completed",
        "error",
      ],
      document_type: [
        "case_history",
        "consultation_notes",
        "prescription",
        "other",
      ],
      input_format: ["handwritten_scan", "handwritten_photo", "existing_scan"],
      user_role: ["admin", "doctor", "records_officer", "analyst"],
    },
  },
} as const
