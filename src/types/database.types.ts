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
      club_member_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          club_membership_id: string
          id: string
          role_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          club_membership_id: string
          id?: string
          role_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          club_membership_id?: string
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_member_roles_club_membership_id_fkey"
            columns: ["club_membership_id"]
            isOneToOne: false
            referencedRelation: "club_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_member_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_memberships: {
        Row: {
          club_id: string
          created_at: string
          id: string
          joined_at: string
          status: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          joined_at?: string
          status?: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          city: string | null
          claim_submitted_at: string | null
          claimed_by: string | null
          country: string
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          official_registry_id: string | null
          slug: string
          updated_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          city?: string | null
          claim_submitted_at?: string | null
          claimed_by?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          official_registry_id?: string | null
          slug: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          city?: string | null
          claim_submitted_at?: string | null
          claimed_by?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          official_registry_id?: string | null
          slug?: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          scope: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          scope: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          scope?: string
        }
        Relationships: []
      }
      player_guardians: {
        Row: {
          created_at: string
          guardian_user_id: string
          id: string
          player_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          guardian_user_id: string
          id?: string
          player_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          guardian_user_id?: string
          id?: string
          player_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_guardians_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_team_assignments: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          left_at: string | null
          player_id: string
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          player_id: string
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          player_id?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_team_assignments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_team_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          birth_year: number | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          first_name: string
          id: string
          is_active: boolean
          jersey_nr: number | null
          last_name: string
          position: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          jersey_nr?: number | null
          last_name: string
          position?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          jersey_nr?: number | null
          last_name?: string
          position?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          onboarding_role: string | null
          phone: string | null
          privacy_accepted_at: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          onboarding_role?: string | null
          phone?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_role?: string | null
          phone?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          name_de: string
          scope: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name_de: string
          scope: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name_de?: string
          scope?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          club_id: string
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          starts_at: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          starts_at?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitation_links: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          max_uses: number
          public_code: string | null
          revoked_at: string | null
          team_id: string
          token_hash: string | null
          use_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          public_code?: string | null
          revoked_at?: string | null
          team_id: string
          token_hash?: string | null
          use_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number
          public_code?: string | null
          revoked_at?: string | null
          team_id?: string
          token_hash?: string | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_invitation_links_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_join_requests: {
        Row: {
          created_at: string
          guardian_user_id: string | null
          id: string
          invitation_link_id: string | null
          player_id: string | null
          request_type: string
          requester_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          guardian_user_id?: string | null
          id?: string
          invitation_link_id?: string | null
          player_id?: string | null
          request_type?: string
          requester_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          guardian_user_id?: string | null
          id?: string
          invitation_link_id?: string | null
          player_id?: string | null
          request_type?: string
          requester_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_join_requests_invitation_link_id_fkey"
            columns: ["invitation_link_id"]
            isOneToOne: false
            referencedRelation: "team_invitation_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_join_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_join_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role_id: string
          team_membership_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id: string
          team_membership_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id?: string
          team_membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_roles_team_membership_id_fkey"
            columns: ["team_membership_id"]
            isOneToOne: false
            referencedRelation: "team_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          age_group: string | null
          club_id: string | null
          created_at: string
          created_by: string
          gender: string | null
          id: string
          is_active: boolean
          name: string
          ownership_type: string
          season_id: string | null
          status: string
          team_type: string | null
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          club_id?: string | null
          created_at?: string
          created_by: string
          gender?: string | null
          id?: string
          is_active?: boolean
          name: string
          ownership_type?: string
          season_id?: string | null
          status?: string
          team_type?: string | null
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          club_id?: string | null
          created_at?: string
          created_by?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          name?: string
          ownership_type?: string
          season_id?: string | null
          status?: string
          team_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_join_request: { Args: { p_request_id: string }; Returns: string }
      can_trainer_read_player: {
        Args: { p_player_id: string }
        Returns: boolean
      }
      can_trainer_read_player_pending: {
        Args: { p_player_id: string }
        Returns: boolean
      }
      cleanup_expired_join_requests: { Args: never; Returns: number }
      create_club: {
        Args: { p_name: string; p_season_name?: string; p_slug: string }
        Returns: string
      }
      create_independent_team: {
        Args: {
          p_age_group?: string
          p_also_head_coach?: boolean
          p_gender?: string
          p_team_name: string
        }
        Returns: string
      }
      create_invitation_link: {
        Args: {
          p_expires_in_days?: number
          p_max_uses?: number
          p_team_id: string
        }
        Returns: string
      }
      generate_team_code: { Args: never; Returns: string }
      get_invitation_link_info: { Args: { p_token: string }; Returns: Json }
      get_public_invitation_info_by_code: {
        Args: { p_code: string }
        Returns: Json
      }
      get_team_invite_code: { Args: { p_team_id: string }; Returns: string }
      has_club_role: {
        Args: { p_club_id: string; p_role_key: string }
        Returns: boolean
      }
      has_team_role: {
        Args: { p_role_keys: string[]; p_team_id: string }
        Returns: boolean
      }
      is_club_member: { Args: { p_club_id: string }; Returns: boolean }
      is_guardian_of: { Args: { p_player_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_team_member: { Args: { p_team_id: string }; Returns: boolean }
      reject_join_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      revoke_invitation_link: {
        Args: { p_link_id: string }
        Returns: undefined
      }
      submit_join_request: {
        Args: {
          p_birth_year?: number
          p_first_name: string
          p_jersey_nr?: number
          p_last_name: string
          p_position?: string
          p_token: string
        }
        Returns: string
      }
      submit_join_request_guardian: {
        Args: {
          p_child_date_of_birth: string
          p_code: string
          p_first_name: string
          p_last_name: string
        }
        Returns: string
      }
      submit_join_request_self: { Args: { p_code: string }; Returns: string }
      update_player_basic_info: {
        Args: {
          p_birth_year?: number
          p_first_name: string
          p_jersey_nr?: number
          p_last_name: string
          p_player_id: string
          p_position?: string
        }
        Returns: undefined
      }
      withdraw_join_request: {
        Args: { p_request_id: string }
        Returns: undefined
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

