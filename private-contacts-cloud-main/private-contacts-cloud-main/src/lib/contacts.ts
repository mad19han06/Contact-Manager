import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Contact = Tables<"contacts">;
export type ContactInsert = Omit<TablesInsert<"contacts">, "user_id">;
export type ContactUpdate = TablesUpdate<"contacts">;

export async function getContacts(search?: string) {
  let query = supabase.from("contacts").select("*").order("created_at", { ascending: false });
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getContact(id: string) {
  const { data, error } = await supabase.from("contacts").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createContact(contact: ContactInsert, userId: string) {
  const { data, error } = await supabase.from("contacts").insert({ ...contact, user_id: userId }).select().single();
  if (error) throw error;
  return data;
}

export async function updateContact(id: string, contact: ContactUpdate) {
  const { data, error } = await supabase.from("contacts").update(contact).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function getContactsCount() {
  const { count, error } = await supabase.from("contacts").select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}
