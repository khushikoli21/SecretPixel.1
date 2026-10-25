import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ActivityEvent, createActivityEvent } from '../services/activityService';

export type { ActivityEvent };

export interface WorkspaceStatus {
  coverImage: {
    name: string;
    width: number;
    height: number;
    sizeBytes: number;
  } | null;
  estimatedPayloadBytes: number;
  maxCapacityBytes: number | null;
  payloadPrepared: boolean;
  stegoImageReady: boolean;
  processingState: 'idle' | 'encrypting' | 'extracting' | 'verifying';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface SecurityContextType {
  activities: ActivityEvent[];
  workspaceStatus: WorkspaceStatus;
  toasts: ToastMessage[];
  logActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  updateWorkspaceStatus: (statusUpdate: Partial<WorkspaceStatus>) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const defaultWorkspaceStatus: WorkspaceStatus = {
  coverImage: null,
  estimatedPayloadBytes: 0,
  maxCapacityBytes: null,
  payloadPrepared: false,
  stegoImageReady: false,
  processingState: 'idle'
};

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus>(defaultWorkspaceStatus);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const logActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    const newEvent = createActivityEvent(event);
    // Keep max 15 most recent activities in session memory
    setActivities((prev) => [newEvent, ...prev.slice(0, 14)]);
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const updateWorkspaceStatus = useCallback((statusUpdate: Partial<WorkspaceStatus>) => {
    setWorkspaceStatus((prev) => ({
      ...prev,
      ...statusUpdate
    }));
  }, []);

  return (
    <SecurityContext.Provider
      value={{
        activities,
        workspaceStatus,
        toasts,
        logActivity,
        clearActivities,
        updateWorkspaceStatus,
        showToast,
        removeToast
      }}
    >
      {children}

      {/* Global Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-white border-emerald-300 text-emerald-900 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'bg-white border-rose-300 text-rose-900 shadow-rose-500/10'
                : 'bg-white border-violet-300 text-violet-900 shadow-violet-500/10'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-800 text-xs ml-2 font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </SecurityContext.Provider>
  );
};

export function useSecurityContext(): SecurityContextType {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
}
