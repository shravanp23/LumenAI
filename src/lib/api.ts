import { UserProfile, Conversation, ProcessedVideo, ChatMessage, RAGQueryResult, AppAnalytics } from '../types';

const TOKEN_KEY = 'lumen_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    removeAuthToken();
    // Dispatch custom event to notify auth context
    window.dispatchEvent(new CustomEvent('lumen_unauthorized'));
  }

  return response;
}

// AUTH API CALLS
export async function apiRegister(name: string, email: string, pass: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: pass })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to register account.');
  setAuthToken(data.token);
  return data;
}

export async function apiLogin(email: string, pass: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid email or password.');
  setAuthToken(data.token);
  return data;
}

export async function apiGoogleLogin(email?: string, name?: string, avatar?: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, avatar })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Google login failed.');
  setAuthToken(data.token);
  return data;
}

export async function apiGetCurrentUser(): Promise<UserProfile | null> {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetchWithAuth('/api/auth/me');
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export async function apiForgotPassword(email: string): Promise<string> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to request password reset.');
  return data.message;
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<string> {
  const res = await fetchWithAuth('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to change password.');
  return data.message;
}

// CONVERSATION & VIDEO API CALLS
export async function apiGetConversations(): Promise<Conversation[]> {
  const res = await fetchWithAuth('/api/conversations');
  if (!res.ok) throw new Error('Failed to load conversation history.');
  const data = await res.json();
  return data.conversations || [];
}

export async function apiCreateConversation(title?: string, videoId?: string): Promise<Conversation> {
  const res = await fetchWithAuth('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ title, videoId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create conversation.');
  return data.conversation;
}

export async function apiRenameConversation(id: string, title: string): Promise<Conversation> {
  const res = await fetchWithAuth(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to rename conversation.');
  return data.conversation;
}

export async function apiDeleteConversation(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/conversations/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete conversation.');
}

export async function apiProcessYoutubeVideo(url: string): Promise<{ video: ProcessedVideo; conversation: Conversation }> {
  const res = await fetchWithAuth('/api/youtube/process', {
    method: 'POST',
    body: JSON.stringify({ url })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Please enter a valid YouTube URL.');
  return data;
}

export async function apiGetVideos(): Promise<ProcessedVideo[]> {
  const res = await fetchWithAuth('/api/videos');
  if (!res.ok) return [];
  const data = await res.json();
  return data.videos || [];
}

export async function apiDeleteVideo(videoId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/videos/${videoId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete video.');
}

export async function apiSendChatMessage(
  message: string,
  videoId?: string,
  conversationId?: string
): Promise<{ conversation: Conversation; message: ChatMessage; result: RAGQueryResult }> {
  const res = await fetchWithAuth('/api/chat/query', {
    method: 'POST',
    body: JSON.stringify({ message, videoId, conversationId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'LumenAI is temporarily unavailable. Please try again.');
  return data;
}

export async function apiGetAnalytics(): Promise<AppAnalytics | null> {
  const res = await fetchWithAuth('/api/analytics');
  if (!res.ok) return null;
  return await res.json();
}
