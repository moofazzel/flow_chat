import { createClient } from "@/utils/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Re-export the User type to match our app's needs, extending Supabase's user
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string;
  status: "online" | "idle" | "dnd" | "offline";
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Helper to map Supabase user to our app's User type
const mapSupabaseUser = async (
  sbUser: SupabaseUser | null
): Promise<User | null> => {
  if (!sbUser) return null;

  const supabase = createClient();

  // Fetch the public profile from the 'users' table
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", sbUser.id)
    .single();

  if (!profile) return null;

  return {
    id: sbUser.id,
    email: sbUser.email || "",
    username: profile.username || sbUser.user_metadata.username || "User",
    full_name: profile.full_name || sbUser.user_metadata.full_name || "",
    avatar_url: profile.avatar_url || sbUser.user_metadata.avatar_url || "",
    status: profile.status || "online",
    created_at: profile.created_at,
  };
};

// Get current authenticated user
export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return mapSupabaseUser(user);
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

// Sign Up
export const register = async (
  email: string,
  password: string,
  username: string,
  fullName: string
): Promise<{ success: boolean; error?: string; user?: User }> => {
  const supabase = createClient();

  // 1. Check if email already exists
  const { data: existingUserByEmail } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (existingUserByEmail) {
    return {
      success: false,
      error: "An account with this email already exists. Please login instead.",
    };
  }

  // 2. Check if username already exists
  const { data: existingUserByUsername } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (existingUserByUsername) {
    return {
      success: false,
      error: "This username is already taken. Please choose another one.",
    };
  }

  // 3. Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Disable email confirmation
      // TODO: Enable email confirmation later
      emailRedirectTo: undefined,
      data: {
        username,
        full_name: fullName,
        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          fullName
        )}&background=random`,
      },
    },
  });

  if (error) {
    // Check for specific Supabase errors
    if (error.message.toLowerCase().includes("already registered")) {
      return {
        success: false,
        error:
          "An account with this email already exists. Please login instead.",
      };
    }
    return { success: false, error: error.message };
  }

  if (data.user) {
    // The trigger in SQL will handle creating the public.users record
    const mappedUser = await mapSupabaseUser(data.user);
    return { success: true, user: mappedUser || undefined };
  }

  return { success: false, error: "Registration failed" };
};

// Login
export const login = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.user) {
    const mappedUser = await mapSupabaseUser(data.user);
    return { success: true, user: mappedUser || undefined };
  }

  return { success: false, error: "Login failed" };
};

// Logout
export const logout = async (): Promise<void> => {
  const supabase = createClient();
  await supabase.auth.signOut();
};

// Update user profile
export const updateUserProfile = async (
  updates: Partial<Pick<User, "full_name" | "avatar_url" | "status">>
): Promise<{ success: boolean; error?: string; user?: User }> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  const updatedUser = await getCurrentUser();
  return { success: true, user: updatedUser || undefined };
};

// Get all users (for mentions, etc.)
export const getAllUsers = async (): Promise<User[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("username");

  if (error || !data) return [];

  return data as User[];
};
