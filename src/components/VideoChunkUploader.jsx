import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { API_CONFIG } from '@/config/api';
import { authStorage } from '@/utils/authStorage';
import { toast } from '@/utils/toast';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

export function LessonVideoUploader({ lessonId, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file || !lessonId) return;

      const token = authStorage.getToken();
      if (!token) {
        toast.error('You must be logged in to upload video.');
        return;
      }

      setIsUploading(true);
      setProgress(0);

      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const dzuuid = uuidv4();
      const baseUrl = API_CONFIG.baseUrl.replace(/\/$/, '');
      const uploadUrl = `${baseUrl}/dashboard/lesson/upload-chunk`;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk, file.name);
        formData.append('lesson_id', lessonId);
        formData.append('dzuuid', dzuuid);
        formData.append('dzchunkindex', chunkIndex);
        formData.append('dztotalchunkcount', totalChunks);

        try {
          const response = await axios.post(uploadUrl, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
            },
          });

          const currentProgress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
          setProgress(currentProgress);

          if (response.status === 201) {
            const finalPath = response.data?.path || response.data?.video_url || response.data;
            if (finalPath && typeof onComplete === 'function') {
              onComplete(finalPath);
            }
            toast.success('Video upload complete');
          }
        } catch (error) {
          console.error(`Error uploading chunk ${chunkIndex + 1}`, error);
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            'Upload failed. Please try again.';
          toast.error(msg);
          setIsUploading(false);
          return;
        }
      }

      setIsUploading(false);
    },
    [lessonId, onComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mov', '.mkv'] },
    maxFiles: 1,
  });

  return (
    <div className="mt-4">
      <div
        {...getRootProps()}
        className="rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-light)] px-4 py-6 text-center cursor-pointer hover:border-[var(--color-accent)] transition-colors"
      >
        <input {...getInputProps()} />
        <p className="text-sm text-gray-700">
          {isDragActive
            ? 'Drop the video file here...'
            : 'Drag & drop a video file here, or click to select file'}
        </p>
      </div>

      {isUploading && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-1">Uploading... {progress}%</p>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

