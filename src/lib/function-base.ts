const fallbackFunctionBase = "https://placeholder.supabase.co/functions/v1";

export const functionBase = (() => {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!publicUrl) {
    if (typeof window !== "undefined") {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL. Falling back to placeholder functions URL.");
    }
    return fallbackFunctionBase;
  }

  return `${publicUrl}/functions/v1`;
})();
