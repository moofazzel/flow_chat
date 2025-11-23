import { createClient } from "@/utils/supabase/client";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "member";
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export const workspaceService = {
  createWorkspace: async (name: string, ownerId: string) => {
    const supabase = createClient();
    const { data: server, error } = await supabase
      .from("servers")
      .insert({ name, owner_id: ownerId })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("server_members").insert({
      server_id: server.id,
      user_id: ownerId,
      role: "owner",
    });

    return {
      id: server.id,
      name: server.name,
      ownerId: server.owner_id,
      createdAt: server.created_at,
    } as Workspace;
  },

  addMember: async (
    workspaceId: string,
    userId: string,
    role: WorkspaceMember["role"] = "member"
  ) => {
    const supabase = createClient();
    await supabase.from("server_members").insert({
      server_id: workspaceId,
      user_id: userId,
      role,
    });
  },

  addChannel: async (
    workspaceId: string,
    name: string,
    description?: string
  ) => {
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("channels")
      .select("position")
      .eq("server_id", workspaceId)
      .order("position", { ascending: false })
      .limit(1);

    const position = existing?.[0]?.position ?? 0;

    const { data: channel, error } = await supabase
      .from("channels")
      .insert({
        server_id: workspaceId,
        name,
        description,
        type: "text",
        position: position + 1,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: channel.id,
      workspaceId: channel.server_id,
      name: channel.name,
      description: channel.description,
      createdAt: channel.created_at,
    } as Channel;
  },

  listChannels: async (workspaceId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("channels")
      .select("*")
      .eq("server_id", workspaceId)
      .order("position", { ascending: true });

    return (data || []).map((c: any) => ({
      id: c.id,
      workspaceId: c.server_id,
      name: c.name,
      description: c.description,
      createdAt: c.created_at,
    })) as Channel[];
  },

  listMembers: async (workspaceId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("server_members")
      .select("*")
      .eq("server_id", workspaceId);

    return (data || []).map((m: any) => ({
      workspaceId: m.server_id,
      userId: m.user_id,
      role: m.role,
    })) as WorkspaceMember[];
  },
};
