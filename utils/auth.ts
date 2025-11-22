// Authentication utilities for Chatapp

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  fullName: string;
  createdAt: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const STORAGE_KEY = 'chatapp_auth';
const USERS_KEY = 'chatapp_users';

// Get current authenticated user
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const authData = localStorage.getItem(STORAGE_KEY);
  if (!authData) return null;
  
  try {
    const { user } = JSON.parse(authData);
    return user;
  } catch (error) {
    console.error('Failed to parse auth data:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

// Get all registered users
const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  
  const usersData = localStorage.getItem(USERS_KEY);
  if (!usersData) return [];
  
  try {
    return JSON.parse(usersData);
  } catch (error) {
    console.error('Failed to parse users data:', error);
    return [];
  }
};

// Save users to storage
const saveUsers = (users: User[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Generate avatar from username
const generateAvatar = (username: string): string => {
  return username.slice(0, 2).toUpperCase();
};

// Register new user
export const register = (
  email: string,
  username: string,
  password: string,
  fullName: string
): { success: boolean; error?: string; user?: User } => {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window not available' };
  }

  // Validate inputs
  if (!email || !username || !password || !fullName) {
    return { success: false, error: 'All fields are required' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  // Check if user already exists
  const users = getUsers();
  const existingUser = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || 
           u.username.toLowerCase() === username.toLowerCase()
  );

  if (existingUser) {
    return { success: false, error: 'Email or username already exists' };
  }

  // Create new user
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase(),
    username,
    fullName,
    avatar: generateAvatar(username),
    createdAt: new Date().toISOString(),
    status: 'online',
  };

  // Save user
  users.push(newUser);
  saveUsers(users);

  // Store password (in production, this would be hashed on backend)
  const passwordsKey = 'chatapp_passwords';
  const passwords = JSON.parse(localStorage.getItem(passwordsKey) || '{}');
  passwords[newUser.id] = password; // In production: hash this!
  localStorage.setItem(passwordsKey, JSON.stringify(passwords));

  return { success: true, user: newUser };
};

// Login user
export const login = (
  emailOrUsername: string,
  password: string
): { success: boolean; error?: string; user?: User } => {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window not available' };
  }

  // Validate inputs
  if (!emailOrUsername || !password) {
    return { success: false, error: 'Email/username and password are required' };
  }

  // Find user
  const users = getUsers();
  const user = users.find(
    (u) =>
      u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
      u.username.toLowerCase() === emailOrUsername.toLowerCase()
  );

  if (!user) {
    return { success: false, error: 'Invalid email/username or password' };
  }

  // Verify password
  const passwordsKey = 'chatapp_passwords';
  const passwords = JSON.parse(localStorage.getItem(passwordsKey) || '{}');
  const storedPassword = passwords[user.id];

  if (storedPassword !== password) {
    return { success: false, error: 'Invalid email/username or password' };
  }

  // Update user status to online
  const updatedUser = { ...user, status: 'online' as const };
  const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
  saveUsers(updatedUsers);

  // Save auth state
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user: updatedUser, timestamp: Date.now() })
  );

  return { success: true, user: updatedUser };
};

// Logout user
export const logout = (): void => {
  if (typeof window === 'undefined') return;

  const user = getCurrentUser();
  if (user) {
    // Update user status to offline
    const users = getUsers();
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, status: 'offline' as const } : u
    );
    saveUsers(updatedUsers);
  }

  // Clear auth state
  localStorage.removeItem(STORAGE_KEY);
};

// Update user profile
export const updateUserProfile = (
  updates: Partial<Pick<User, 'fullName' | 'avatar' | 'status'>>
): { success: boolean; error?: string; user?: User } => {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window not available' };
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Not authenticated' };
  }

  // Update user
  const users = getUsers();
  const updatedUser = { ...currentUser, ...updates };
  const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
  saveUsers(updatedUsers);

  // Update auth state
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user: updatedUser, timestamp: Date.now() })
  );

  return { success: true, user: updatedUser };
};

// Get user by ID
export const getUserById = (userId: string): User | null => {
  const users = getUsers();
  return users.find((u) => u.id === userId) || null;
};

// Get all users (for mentions, assignments, etc.)
export const getAllUsers = (): User[] => {
  return getUsers();
};

// Check session validity (optional: add expiration)
export const isSessionValid = (): boolean => {
  if (typeof window === 'undefined') return false;

  const authData = localStorage.getItem(STORAGE_KEY);
  if (!authData) return false;

  try {
    const { timestamp } = JSON.parse(authData);
    const sessionDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
    return Date.now() - timestamp < sessionDuration;
  } catch (error) {
    return false;
  }
};
