'use client';

import { useState, useEffect } from 'react';
import { uploadToFirebaseStorage } from '@/lib/upload';

interface MediaPickerProps {
  onPicked: (url: string | null) => void;
  currentImage?: string | null;
  aspect?: [number, number];
}

export default function MediaPicker({ onPicked, currentImage = null, aspect = [4, 3] }: MediaPickerProps) {
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<string | null>(currentImage ?? null);

  useEffect(() => {
    setImage(currentImage ?? null);
  }, [currentImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToFirebaseStorage(file, 'poll-media');
      setImage(url);
      onPicked(url);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-2">
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition
        bg-gray-100 dark:bg-white/8
        hover:bg-gray-200 dark:hover:bg-white/12
        text-gray-700 dark:text-gray-300
        border border-gray-200 dark:border-white/12
        text-sm font-medium">
        <span>{image ? 'Change Image' : 'Add Image'}</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {uploading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
          Uploading…
        </p>
      )}

      {image && !uploading && (
        <div className="mt-2 relative inline-block">
          <img
            src={image}
            alt="preview"
            className="rounded-lg max-h-40 object-cover border border-gray-200 dark:border-white/10 shadow-sm"
          />
          <button
            type="button"
            onClick={() => { setImage(null); onPicked(null); }}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow hover:bg-red-600 transition"
            title="Remove image"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}