import { X, CheckCircle, XCircle, Filter, RefreshCw } from 'lucide-react';
import { TransferHistory, formatTimestamp } from '@/lib/transferHistory';
import { useState, useEffect } from 'react';
import { useTransferHistory } from '@/context/TransferHistoryContext';

type TransferHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type FilterType = 'all' | 'success' | 'failed';
type ServiceFilter = 'all' | 'spotify' | 'apple';

export default function TransferHistoryModal({ isOpen, onClose }: TransferHistoryModalProps) {
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const { transferHistory, isLoadingHistory, refreshHistory } = useTransferHistory();

  // Refresh history when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('[MusicBridge] Modal opened, refreshing history');
      refreshHistory();
    }
  }, [isOpen, refreshHistory]);

  const filteredHistory = transferHistory.filter(transfer => {
    if (statusFilter !== 'all' && transfer.status !== statusFilter) return false;
    if (serviceFilter !== 'all' && 
        transfer.sourceService !== serviceFilter && 
        transfer.destinationService !== serviceFilter) return false;
    return true;
  });

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if the click was directly on the overlay
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Transfer History</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshHistory}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Refresh History"
                disabled={isLoadingHistory}
              >
                <RefreshCw size={20} className={isLoadingHistory ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                className="px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterType)}
              >
                <option value="all">All Status</option>
                <option value="success">Successful</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <select
                className="px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value as ServiceFilter)}
              >
                <option value="all">All Services</option>
                <option value="spotify">Spotify</option>
                <option value="apple">Apple Music</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No transfer history found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((transfer) => (
                <div
                  key={transfer.id}
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                    isLoadingHistory ? 'animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {transfer.sourcePlaylistName} → {transfer.destinationPlaylistName}
                        </h3>
                        {transfer.status === 'success' ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <XCircle size={20} className="text-red-500" />
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {transfer.sourceService} → {transfer.destinationService} • {transfer.trackCount} tracks
                      </div>
                      {transfer.errorMessage && (
                        <div className="mt-1 text-sm text-red-500">
                          Error: {transfer.errorMessage}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimestamp(transfer.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 