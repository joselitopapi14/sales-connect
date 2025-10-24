import { createClient } from "@/utils/supabase/client";
import type { User } from "@/data/users/columns";

const supabase = createClient();

export const usersService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  },

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data;
  },

  async create(user: Omit<User, "id" | "created_at">): Promise<User> {
    const { data, error } = await supabase
      .from("Users")
      .insert([user])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from("Users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("Users")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from("Users")
      .delete()
      .in("id", ids);

    if (error) {
      throw new Error(`Failed to delete users: ${error.message}`);
    }
  },
};
