/**
 * SecretPixel Local Enclave Storage Service
 * 
 * Provides client-side local enclave storage for operator preferences and
 * non-sensitive operational summaries without requiring any external database.
 * 
 * Strict Privacy & Microproject Invariants:
 * - NEVER persists secret messages, plaintexts, passwords, derived keys, ciphertext, or images.
 * - Zero external database dependencies (Supabase removed).
 * - Full offline operation for static GitHub Pages and standalone Python deployment.
 */

export interface Profile {
  id: string;
  display_name: string | null;
  clearance_level: 'Confidential' | 'Secret' | 'Top Secret';
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id?: string;
  user_id?: string;
  theme: 'light' | 'dark' | 'system';
  default_output_format: 'PNG';
  save_operation_history: boolean;
  engine_preference?: 'python' | 'client';
  created_at?: string;
  updated_at?: string;
}

export interface OperationHistoryRecord {
  id: string;
  user_id?: string | null;
  operation_type: 'encode' | 'extract' | 'decrypt' | 'verify';
  status: 'success' | 'failed' | 'cancelled';
  image_width?: number | null;
  image_height?: number | null;
  image_format?: 'PNG' | 'JPEG' | 'WEBP' | null;
  payload_size_bytes?: number | null;
  processing_duration_ms?: number | null;
  created_at: string;
}

export interface DatabaseStatus {
  isConfigured: boolean;
  isConnected: boolean;
  provider: 'python-in-memory-engine' | 'local-offline-storage';
  url: string | null;
  tablesVerified: string[];
}

const inMemoryStore = new Map<string, string>();

function safeStorageGet(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignore restricted storage
  }
  return inMemoryStore.get(key) || null;
}

function safeStorageSet(key: string, val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
      return;
    }
  } catch {
    // Ignore restricted storage
  }
  inMemoryStore.set(key, val);
}

function safeStorageRemove(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
      return;
    }
  } catch {
    // Ignore restricted storage
  }
  inMemoryStore.delete(key);
}

const LOCAL_STORAGE_KEY_PROFILE = 'secretpixel_operator_profile';
const LOCAL_STORAGE_KEY_PREFS = 'secretpixel_local_preferences';
const LOCAL_STORAGE_KEY_HISTORY = 'secretpixel_local_history';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  default_output_format: 'PNG',
  save_operation_history: true,
  engine_preference: 'python'
};

/**
 * Returns storage status indicating zero-database local enclave architecture.
 */
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  return {
    isConfigured: true,
    isConnected: true,
    provider: 'local-offline-storage',
    url: null,
    tablesVerified: ['local_preferences', 'operator_profile', 'operation_history']
  };
}

/**
 * Retrieves the current operator/user profile from local enclave storage.
 */
export async function getProfile(userId?: string): Promise<Profile | null> {
  try {
    const raw = safeStorageGet(LOCAL_STORAGE_KEY_PROFILE);
    if (raw) {
      return JSON.parse(raw) as Profile;
    }
  } catch {
    // Ignore
  }
  return {
    id: userId || 'local-operator',
    display_name: 'Security Operator',
    clearance_level: 'Top Secret',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Upserts operator profile information into local enclave storage.
 */
export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
  const existing = (await getProfile(profile.id)) || {
    id: profile.id,
    display_name: 'Security Analyst',
    clearance_level: 'Confidential' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const updated: Profile = {
    ...existing,
    display_name: profile.display_name ?? existing.display_name,
    clearance_level: profile.clearance_level ?? existing.clearance_level,
    updated_at: new Date().toISOString()
  };

  try {
    safeStorageSet(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(updated));
  } catch {
    // Fallback
  }

  return updated;
}

/**
 * Retrieves user interface preferences.
 */
export async function getUserPreferences(_userId?: string): Promise<UserPreferences> {
  try {
    const raw = safeStorageGet(LOCAL_STORAGE_KEY_PREFS);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Updates user interface preferences.
 */
export async function saveUserPreferences(
  preferences: Partial<UserPreferences>,
  _userId?: string
): Promise<UserPreferences> {
  const current = await getUserPreferences();
  const merged: UserPreferences = {
    ...current,
    ...preferences
  };

  try {
    safeStorageSet(LOCAL_STORAGE_KEY_PREFS, JSON.stringify(merged));
  } catch {
    // Storage restricted
  }

  return merged;
}

/**
 * Records a non-sensitive operation summary locally.
 * Validates that NO sensitive plaintext, password, key, or image data is ever recorded.
 */
export async function recordOperationHistory(
  record: Omit<OperationHistoryRecord, 'id' | 'created_at'>,
  userId?: string
): Promise<OperationHistoryRecord | null> {
  const safeRecord: OperationHistoryRecord = {
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId || 'local-operator',
    operation_type: record.operation_type,
    status: record.status,
    image_width: record.image_width ? Math.min(16384, Math.max(1, record.image_width)) : null,
    image_height: record.image_height ? Math.min(16384, Math.max(1, record.image_height)) : null,
    image_format: record.image_format || 'PNG',
    payload_size_bytes: record.payload_size_bytes != null ? Math.max(0, record.payload_size_bytes) : null,
    processing_duration_ms: record.processing_duration_ms != null ? Math.max(0, record.processing_duration_ms) : null,
    created_at: new Date().toISOString()
  };

  try {
    const raw = safeStorageGet(LOCAL_STORAGE_KEY_HISTORY);
    const existing: OperationHistoryRecord[] = raw ? JSON.parse(raw) : [];
    const updated = [safeRecord, ...existing.slice(0, 49)];
    safeStorageSet(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(updated));
  } catch {
    // Storage restricted
  }

  return safeRecord;
}

/**
 * Retrieves saved operation history records (most recent first).
 */
export async function getOperationHistory(limit = 20, _userId?: string): Promise<OperationHistoryRecord[]> {
  try {
    const raw = safeStorageGet(LOCAL_STORAGE_KEY_HISTORY);
    if (raw) {
      const list: OperationHistoryRecord[] = JSON.parse(raw);
      return list.slice(0, limit);
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Deletes all saved operation history records.
 */
export async function clearOperationHistory(_userId?: string): Promise<boolean> {
  try {
    safeStorageRemove(LOCAL_STORAGE_KEY_HISTORY);
  } catch {
    // Ignore
  }
  return true;
}

/**
 * Non-sensitive application configuration getter.
 */
export async function getAppSetting<T = unknown>(_key: string): Promise<T | null> {
  return null;
}
