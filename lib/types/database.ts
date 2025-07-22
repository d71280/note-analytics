export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          note_username: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          note_username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          note_username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          icon: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          icon?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          icon?: string | null
          color?: string | null
          created_at?: string
        }
      }
      creators: {
        Row: {
          id: number
          note_id: string
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          follower_count: number
          following_count: number
          total_articles: number
          category_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          note_id: string
          username: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          follower_count?: number
          following_count?: number
          total_articles?: number
          category_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          note_id?: string
          username?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          follower_count?: number
          following_count?: number
          total_articles?: number
          category_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      creator_metrics: {
        Row: {
          id: number
          creator_id: number
          date: string
          follower_count: number | null
          total_likes: number | null
          total_articles: number | null
          engagement_rate: number | null
          growth_rate: number | null
          created_at: string
        }
        Insert: {
          id?: number
          creator_id: number
          date: string
          follower_count?: number | null
          total_likes?: number | null
          total_articles?: number | null
          engagement_rate?: number | null
          growth_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          creator_id?: number
          date?: string
          follower_count?: number | null
          total_likes?: number | null
          total_articles?: number | null
          engagement_rate?: number | null
          growth_rate?: number | null
          created_at?: string
        }
      }
      articles: {
        Row: {
          id: number
          creator_id: number
          note_article_id: string
          title: string
          content: string | null
          excerpt: string | null
          thumbnail_url: string | null
          like_count: number
          comment_count: number
          published_at: string | null
          tags: string[] | null
          reading_time: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          creator_id: number
          note_article_id: string
          title: string
          content?: string | null
          excerpt?: string | null
          thumbnail_url?: string | null
          like_count?: number
          comment_count?: number
          published_at?: string | null
          tags?: string[] | null
          reading_time?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          creator_id?: number
          note_article_id?: string
          title?: string
          content?: string | null
          excerpt?: string | null
          thumbnail_url?: string | null
          like_count?: number
          comment_count?: number
          published_at?: string | null
          tags?: string[] | null
          reading_time?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      article_metrics: {
        Row: {
          id: number
          article_id: number
          date: string
          like_count: number | null
          comment_count: number | null
          view_count: number | null
          like_velocity: number | null
          created_at: string
        }
        Insert: {
          id?: number
          article_id: number
          date: string
          like_count?: number | null
          comment_count?: number | null
          view_count?: number | null
          like_velocity?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          article_id?: number
          date?: string
          like_count?: number | null
          comment_count?: number | null
          view_count?: number | null
          like_velocity?: number | null
          created_at?: string
        }
      }
      analysis_history: {
        Row: {
          id: number
          user_id: string
          title: string
          content: string
          follower_count: number | null
          category_id: number | null
          overall_score: number | null
          title_score: number | null
          content_score: number | null
          seo_score: number | null
          readability_score: number | null
          predicted_likes: number | null
          engagement_rate: number | null
          viral_potential: string | null
          suggestions: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          content: string
          follower_count?: number | null
          category_id?: number | null
          overall_score?: number | null
          title_score?: number | null
          content_score?: number | null
          seo_score?: number | null
          readability_score?: number | null
          predicted_likes?: number | null
          engagement_rate?: number | null
          viral_potential?: string | null
          suggestions?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          content?: string
          follower_count?: number | null
          category_id?: number | null
          overall_score?: number | null
          title_score?: number | null
          content_score?: number | null
          seo_score?: number | null
          readability_score?: number | null
          predicted_likes?: number | null
          engagement_rate?: number | null
          viral_potential?: string | null
          suggestions?: Json | null
          created_at?: string
        }
      }
      favorite_creators: {
        Row: {
          id: number
          user_id: string
          creator_id: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          creator_id: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          creator_id?: number
          created_at?: string
        }
      }
      trending_articles: {
        Row: {
          id: number
          article_id: number
          category_id: number | null
          trending_score: number | null
          trending_date: string
          created_at: string
        }
        Insert: {
          id?: number
          article_id: number
          category_id?: number | null
          trending_score?: number | null
          trending_date: string
          created_at?: string
        }
        Update: {
          id?: number
          article_id?: number
          category_id?: number | null
          trending_score?: number | null
          trending_date?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}