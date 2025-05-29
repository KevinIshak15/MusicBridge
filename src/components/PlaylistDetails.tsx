import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

type PlaylistDetailsProps = {
  playlist: {
    id: string;
    name: string;
    images: { url: string }[];
    description?: string;
    tracks?: {
      total: number;
    };
    owner?: {
      display_name: string;
    };
  };
  onClose: () => void;
  service: 'spotify' | 'apple';
};

export default function PlaylistDetails({ playlist, onClose, service }: PlaylistDetailsProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{playlist.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <img
                src={playlist.images[0]?.url}
                alt={playlist.name}
                className="w-full rounded-lg shadow-lg"
              />
            </div>

            <div className="w-full md:w-2/3">
              <div className="space-y-4">
                {playlist.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">Description</h3>
                    <p className="text-gray-700">{playlist.description}</p>
                  </div>
                )}

                {playlist.tracks && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">Tracks</h3>
                    <p className="text-gray-700">{playlist.tracks.total} songs</p>
                  </div>
                )}

                {playlist.owner && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">Created by</h3>
                    <p className="text-gray-700">{playlist.owner.display_name}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Source</h3>
                  <p className="text-gray-700">{service === 'spotify' ? 'Spotify' : 'Apple Music'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 