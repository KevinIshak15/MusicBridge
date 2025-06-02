'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { TransferHistory, getTransferHistory } from '@/lib/transferHistory';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

// Define the shape of the context data
interface TransferHistoryContextType {
  transferHistory: TransferHistory[];
  refreshHistory: () => Promise<void>;
  isLoadingHistory: boolean;
}

// Create the context with default values
const TransferHistoryContext = createContext<TransferHistoryContextType | undefined>(undefined);

// Define the provider component props
interface TransferHistoryProviderProps {
  children: ReactNode;
}

export const TransferHistoryProvider = ({ children }: TransferHistoryProviderProps) => {
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('[MusicBridge] Auth state changed:', user?.uid);
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Function to fetch history for the current user
  const fetchHistory = useCallback(async (user: User) => {
    if (!user) return;
    
    console.log('[MusicBridge] Fetching history for user:', user.uid);
    setIsLoadingHistory(true);
    try {
      const history = await getTransferHistory(user.uid);
      console.log('[MusicBridge] Fetched transfer history:', history);
      setTransferHistory(history);
    } catch (error) {
      console.error('[MusicBridge] Error fetching transfer history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Effect to fetch history when the user changes
  useEffect(() => {
    if (currentUser) {
      console.log('[MusicBridge] Current user changed, fetching history for:', currentUser.uid);
      fetchHistory(currentUser);
    } else {
      console.log('[MusicBridge] No current user, clearing history');
      setTransferHistory([]);
      setIsLoadingHistory(false);
    }
  }, [currentUser, fetchHistory]);

  // Function to be exposed to refresh history manually
  const refreshHistory = useCallback(async () => {
    if (currentUser) {
      console.log('[MusicBridge] Manually refreshing history for:', currentUser.uid);
      await fetchHistory(currentUser);
    }
  }, [currentUser, fetchHistory]);

  return (
    <TransferHistoryContext.Provider value={{ transferHistory, refreshHistory, isLoadingHistory }}>
      {children}
    </TransferHistoryContext.Provider>
  );
};

// Custom hook to consume the context
export const useTransferHistory = () => {
  const context = useContext(TransferHistoryContext);
  if (context === undefined) {
    throw new Error('useTransferHistory must be used within a TransferHistoryProvider');
  }
  return context;
}; 