import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export type TransferHistory = {
  id?: string; // Firestore document ID
  userId: string;
  sourceService: 'spotify' | 'apple';
  destinationService: 'spotify' | 'apple';
  sourcePlaylistName: string;
  destinationPlaylistName: string;
  status: 'success' | 'failed';
  timestamp: Date;
  trackCount?: number;
  errorMessage?: string;
};

const transferHistoriesCollection = collection(db, 'transferHistories');

export const addTransferToHistory = async (transferDetails: Omit<TransferHistory, 'id' | 'timestamp'> & { timestamp?: Date }) => {
  try {
    const timestamp = transferDetails.timestamp || new Date();
    await addDoc(transferHistoriesCollection, {
      ...transferDetails,
      timestamp,
    });
  } catch (error) {
    console.error('Error adding transfer to history:', error);
  }
};

export const getTransferHistory = async (userId: string): Promise<TransferHistory[]> => {
  try {
    const q = query(transferHistoriesCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const history: TransferHistory[] = [];
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      const data = doc.data();
      history.push({
        id: doc.id,
        userId: data.userId,
        sourceService: data.sourceService,
        destinationService: data.destinationService,
        sourcePlaylistName: data.sourcePlaylistName,
        destinationPlaylistName: data.destinationPlaylistName,
        status: data.status,
        timestamp: data.timestamp.toDate(), // Convert Firestore Timestamp to Date
        trackCount: data.trackCount,
        errorMessage: data.errorMessage,
      });
    });
    // Sort by timestamp descending
    history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return history;
  } catch (error) {
    console.error('Error getting transfer history:', error);
    return [];
  }
};

// Note: Clearing history in Firestore is more complex than localStorage
// This function will delete all documents for a user one by one
export const clearTransferHistory = async (userId: string) => {
  try {
    const q = query(transferHistoriesCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error clearing transfer history:', error);
  }
};

export const formatTimestamp = (timestamp: Date): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return timestamp.toLocaleDateString(undefined, options);
}; 