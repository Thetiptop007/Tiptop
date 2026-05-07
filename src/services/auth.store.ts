import { useSyncExternalStore } from 'react';

export type AuthRole = 'admin' | 'customer' | null;

export type AuthUser = {
  _id?: string;
  id?: string;
  name?: string | { first?: string; last?: string };
  email?: string | { address?: string; isVerified?: boolean };
  phone?: string | { number?: string; isVerified?: boolean };
  role?: string | null;
  isActive?: boolean;
};

export type AuthState = {
  user: AuthUser | null;
  role: AuthRole;
  isAuthResolved: boolean;
};

type AuthStoreListener = () => void;

const listeners = new Set<AuthStoreListener>();

let state: AuthState = {
  user: null,
  role: null,
  isAuthResolved: false,
};

const log = (label: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [AUTH-STORE] ${label}`, data || '');
};

const emit = () => {
  log('emit() - notifying listeners', { listenerCount: listeners.size });
  listeners.forEach((listener) => listener());
};

export const authStore = {
  getState(): AuthState {
    return state;
  },
  setState(next: Partial<AuthState>) {
    const oldState = { ...state };
    state = {
      ...state,
      ...next,
    };
    log('setState() called', { 
      oldState, 
      newState: state,
      changes: next 
    });
    emit();
  },
  reset() {
    log('reset() called');
    state = {
      user: null,
      role: null,
      isAuthResolved: false,
    };
    emit();
  },
  subscribe(listener: AuthStoreListener) {
    log('subscribe() called', { currentListeners: listeners.size });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      log('unsubscribe() called', { remainingListeners: listeners.size });
    };
  },
};

export const useAuthStore = (): AuthState => {
  return useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState);
};
