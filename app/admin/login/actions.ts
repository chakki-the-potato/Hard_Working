"use server";

import { redirect } from "next/navigation";
import { hasAdminRole } from "@/lib/auth/admin";
import {
  getAdminLoginPath,
  getSafeReturnPath,
} from "@/lib/auth/return-path";
import { createClient } from "@/lib/supabase/server";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 1024;

export async function signInWithPassword(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const returnTo = getSafeReturnPath(formData.get("returnTo"));

  if (typeof emailValue !== "string" || typeof passwordValue !== "string") {
    redirect(getAdminLoginPath(returnTo, "invalid_credentials"));
  }

  const email = emailValue.trim();
  const password = passwordValue;

  if (
    !email ||
    !email.includes("@") ||
    email.length > MAX_EMAIL_LENGTH ||
    !password ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    redirect(getAdminLoginPath(returnTo, "invalid_credentials"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.warn("Supabase password sign-in failed", {
      code: error.code,
      status: error.status,
    });
    redirect(getAdminLoginPath(returnTo, "invalid_credentials"));
  }

  if (!hasAdminRole(data.user)) {
    await supabase.auth.signOut();
    redirect(getAdminLoginPath(returnTo, "unauthorized"));
  }

  redirect(returnTo);
}
