import { createClient } from "@supabase/supabase-js";

export type E2ETestUser = {
  id: string;
  email: string;
  password: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required E2E environment variable: ${name}`);
  }
  return value;
}

export function createSupabaseAdmin() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("E2E_SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function ensureE2ETestUser(): Promise<E2ETestUser> {
  const email = requiredEnv("E2E_TEST_EMAIL");
  const password = requiredEnv("E2E_TEST_PASSWORD");
  const supabase = createSupabaseAdmin();

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const found = existing.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (found) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
    });
    if (updateError) throw updateError;
    return { id: found.id, email, password };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not return a created E2E user.");

  return { id: data.user.id, email, password };
}

export async function deleteRowsByUserId(tableName: string, userId: string) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from(tableName).delete().eq("user_id", userId);
  if (error) {
    throw new Error(`Failed to clean ${tableName}: ${error.message}`);
  }
}

export async function updateRow(tableName: string, id: string, values: Record<string, unknown>) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from(tableName).update(values).eq("id", id);
  if (error) throw new Error(`Failed to update ${tableName}.${id}: ${error.message}`);
}
