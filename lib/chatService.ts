// Placeholder chat data layer for channels and DMs with Supabase-ready shape.
// Replace storage calls with Supabase queries when credentials are available.

export type ChatScope = "channel" | "dm";

export interface ChatMessage {
  id: string;
  scope: ChatScope;
  channelId?: string; // when scope === "channel"
  threadId?: string; // when scope === "dm"
  authorId: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  replyToId?: string;
  isPinned?: boolean;
  reactions?: Record<string, string[]>; // emoji -> userIds
  attachments?: {
    id: string;
    name: string;
    url?: string;
    type: "image" | "file" | "video" | "audio";
    size?: number;
  }[];
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
}

export interface DmThread {
  id: string;
  userA: string;
  userB: string;
}

export interface Friendship {
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted" | "blocked";
  apiKey?: string; // optional API key provided when adding friend
}

const STORAGE_KEY = "Flow Chat_placeholder_data";

type PersistedData = {
  workspaces: Workspace[];
  channels: Channel[];
  threads: DmThread[];
  messages: ChatMessage[];
  friendships: Friendship[];
};

const initialData: PersistedData = {
  workspaces: [],
  channels: [],
  threads: [],
  messages: [],
  friendships: [],
};

const load = (): PersistedData => {
  if (typeof window === "undefined") return initialData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedData) : initialData;
  } catch {
    return initialData;
  }
};

const save = (data: PersistedData) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const now = () => new Date().toISOString();

export const chatService = {
  createWorkspace: async (name: string, ownerId: string) => {
    const data = load();
    const workspace: Workspace = { id: `ws-${Date.now()}`, name, ownerId };
    data.workspaces.push(workspace);
    save(data);
    return workspace;
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
    };
    data.channels.push(channel);
    save(data);
    return channel;
  },

  addFriend: async (
    requesterId: string,
    addresseeId: string,
    apiKey?: string
  ) => {
    const data = load();
    const friendship: Friendship = {
      requesterId,
      addresseeId,
      status: "pending",
      apiKey,
    };
    data.friendships.push(friendship);
    save(data);
    return friendship;
  },

  acceptFriend: async (requesterId: string, addresseeId: string) => {
    const data = load();
    data.friendships = data.friendships.map((f) =>
      f.requesterId === requesterId && f.addresseeId === addresseeId
        ? { ...f, status: "accepted" }
        : f
    );
    save(data);
  },

  getFriendships: async (userId: string) => {
    const data = load();
    return data.friendships.filter(
      (f) => f.requesterId === userId || f.addresseeId === userId
    );
  },

  createDmThread: async (userA: string, userB: string) => {
    const data = load();
    const existing = data.threads.find(
      (t) =>
        (t.userA === userA && t.userB === userB) ||
        (t.userA === userB && t.userB === userA)
    );
    if (existing) return existing;
    const thread: DmThread = { id: `dm-${Date.now()}`, userA, userB };
    data.threads.push(thread);
    save(data);
    return thread;
  },

  sendMessage: async (
    payload: Pick<
      ChatMessage,
      "scope" | "channelId" | "threadId" | "authorId" | "content" | "replyToId"
    >
  ) => {
    const data = load();
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      createdAt: now(),
      ...payload,
    };
    data.messages.push(message);
    save(data);
    return message;
  },

  listMessages: async (scope: ChatScope, id: string) => {
    const data = load();
    return data.messages.filter((m) =>
      scope === "channel" ? m.channelId === id : m.threadId === id
    );
  },

  editMessage: async (messageId: string, authorId: string, content: string) => {
    const data = load();
    data.messages = data.messages.map((m) =>
      m.id === messageId && m.authorId === authorId
        ? { ...m, content, editedAt: now() }
        : m
    );
    save(data);
  },

  deleteMessage: async (messageId: string, authorId: string) => {
    const data = load();
    data.messages = data.messages.filter(
      (m) => !(m.id === messageId && m.authorId === authorId)
    );
    save(data);
  },

  reactToMessage: async (messageId: string, emoji: string, userId: string) => {
    const data = load();
    data.messages = data.messages.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = m.reactions || {};
      const users = new Set(reactions[emoji] || []);
      if (users.has(userId)) {
        users.delete(userId);
      } else {
        users.add(userId);
      }
      return { ...m, reactions: { ...reactions, [emoji]: Array.from(users) } };
    });
    save(data);
  },
};

// Supabase wiring (placeholder):
// import { createClient } from "@supabase/supabase-js";
// const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
// Replace load/save with supabase RPC or table calls, and subscribe to realtime on channel_messages/dm_messages.
