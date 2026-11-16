import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const erroConfiguracao =
  !url || !chave
    ? "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local e reinicie o npm run dev."
    : null;

export const supabase: SupabaseClient | null = erroConfiguracao
  ? null
  : createClient(url as string, chave as string, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });