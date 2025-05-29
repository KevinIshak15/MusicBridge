'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Track = {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
};

type Props = {
  playlistName: string;
  tracks: Track[];
  selectedTracks: Set<string>;
  onToggleTrack: (id: string) => void;
  onTransfer: () => void;
  onClose: () => void;
  onToggleAll: () => void;
  allSelected: boolean;
  service: 'apple' | 'spotify';
  newPlaylistName: string;
  newPlaylistDescription: string;
  setNewPlaylistName: (value: string) => void;
  setNewPlaylistDescription: (value: string) => void;
};

export default function TrackModal({
  playlistName,
  tracks,
  selectedTracks,
  onToggleTrack,
  onTransfer,
  onClose,
  onToggleAll,
  allSelected,
  service,
  newPlaylistName,
  newPlaylistDescription,
  setNewPlaylistName,
  setNewPlaylistDescription,
}: Props) {
  const [nameError, setNameError] = useState('');

  const handleTransfer = () => {
    if (!newPlaylistName.trim()) {
      setNameError('Please enter a playlist name');
      return;
    }
    setNameError('');
    onTransfer();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative"
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">🎵 {playlistName}</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Playlist Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => {
                  setNewPlaylistName(e.target.value);
                  if (nameError) setNameError('');
                }}
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 text-gray-800 focus:ring-blue-500 focus:outline-none ${
                  nameError ? 'border-red-500' : ''
                }`}
                placeholder="Enter playlist name"
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-500">{nameError}</p>
              )}
              <label className="block text-sm font-semibold text-gray-700 mt-4 mb-1">Description</label>
              <textarea
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 text-gray-800 focus:ring-blue-500 focus:outline-none"
                placeholder="Optional description"
                rows={3}
              />
              <p className="mt-1 text-sm text-gray-500">If left empty, description will be &quot;Created by MusicBridge&quot;</p>
            </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {selectedTracks.size} / {tracks.length} tracks selected
            </p>
            <button
              onClick={onToggleAll}
              className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 shadow cursor-pointer"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-3">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`flex items-center p-3 border rounded-lg transition-all duration-200 ${
                  selectedTracks.has(track.id) ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <img
                  src={track.albumArt}
                  alt="art"
                  className="w-14 h-14 rounded mr-4 object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-base">{track.name}</p>
                  <p className="text-sm text-gray-500">{track.artist}</p>
                </div>
                <button
                  onClick={() => onToggleTrack(track.id)}
                  className={`ml-4 px-4 py-1 text-sm rounded-md border transition cursor-pointer ${
                    selectedTracks.has(track.id)
                      ? 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {selectedTracks.has(track.id) ? 'Remove' : 'Select'}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleTransfer}
            className={`mt-6 w-full bg-blue-600 text-white py-3 text-base font-medium rounded-lg hover:bg-blue-700 shadow cursor-pointer transition-colors ${
              !newPlaylistName.trim() ? 'opacity-50' : ''
            }`}
          >
            Transfer Selected to {service === 'apple' ? 'Spotify' : 'Apple Music'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
