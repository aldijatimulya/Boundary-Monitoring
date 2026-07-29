import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client ini dipakai di komponen sisi-browser ("use client").
// Untuk operasi admin sisi-server, buat client terpisah dengan SERVICE_ROLE_KEY
// di dalam route handler / server action -- jangan pernah expose service role ke browser.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
