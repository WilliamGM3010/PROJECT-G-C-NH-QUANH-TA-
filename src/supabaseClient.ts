import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    isValidHttpUrl(supabaseUrl) &&
    supabaseAnonKey.length > 10
);

export const supabaseConfigWarning = !isSupabaseConfigured
  ? 'Chưa cấu hình biến môi trường VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY. Ứng dụng đang chạy ở chế độ dữ liệu mẫu cục bộ để không gián đoạn trải nghiệm.'
  : null;

/**
 * Khởi tạo Supabase client an toàn — trả về null nếu chưa có biến môi trường
 * thay vì ném lỗi gây trắng trang.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
