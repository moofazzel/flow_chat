// Workspace + channel + member scaffolding ready to swap to Supabase.

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

const STORAGE_KEY = "Flow Chat_workspace_data";

type Persisted = {
  workspaces: Workspace[];
  members: WorkspaceMember[];
  channels: Channel[];
};

const initialData: Persisted = {
  workspaces: [],
  members: [],
  channels: [],
};

const load = (): Persisted => {
  if (typeof window === "undefined") return initialData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : initialData;
  } catch {
    return initialData;
  }
};

const save = (data: Persisted) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const now = () => new Date().toISOString();

export const workspaceService = {
  createWorkspace: async (name: string, ownerId: string) => {
    const data = load();
    const workspace: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      ownerId,
      createdAt: now(),
    };
    data.workspaces.push(workspace);
    data.members.push({
      workspaceId: workspace.id,
      userId: ownerId,
      role: "owner",
    });
    save(data);
    return workspace;
  },

  addMember: async (
    workspaceId: string,
    userId: string,
    role: WorkspaceMember["role"] = "member"
  ) => {
    const data = load();
    const exists = data.members.find(
      (m) => m.workspaceId === workspaceId && m.userId === userId
    );
    if (!exists) {
      data.members.push({ workspaceId, userId, role });
      save(data);
    }
  },

  addChannel: async (
    workspaceId: string,
    name: string,
    description?: string
  ) => {
    const data = load();
    const channel: Channel = {
      id: `ch-${Date.now()}`,
      workspaceId,
      name,
      description,
      createdAt: now(),
    };
    data.channels.push(channel);
    save(data);
    return channel;
  },

  listChannels: async (workspaceId: string) => {
    const data = load();
    return data.channels.filter((c) => c.workspaceId === workspaceId);
  },

  listMembers: async (workspaceId: string) => {
    const data = load();
    return data.members.filter((m) => m.workspaceId === workspaceId);
  },
};

// Supabase mapping guidance (replace load/save):
// tables: workspaces, workspace_members, channels
// RLS: members can select channels; owner/admin can insert; members can send messages to channels they belong to.
