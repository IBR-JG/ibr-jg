import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const erroConfiguracao =
  !supabaseUrl || !supabaseAnonKey
    ? "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    : null;

if (erroConfiguracao) {
  console.warn(`[supabase] ${erroConfiguracao}`);
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? "https://supabase.invalid",
  supabaseAnonKey ?? "chave-nao-configurada"
);