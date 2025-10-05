/**
 * Supabaseクライアント
 * 世界ランキング機能用
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase環境変数が設定されていません。ランキング機能は無効です。');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Supabaseが有効かチェック
export const isSupabaseEnabled = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};
