import { useState } from 'react';
import { toast } from 'sonner';
import { profileAPI } from '../api/profile';

export interface UseAvatarUploadOptions {
  onSuccess?: (avatarUrl: string) => void;
  onError?: (error: string) => void;
  maxSizeInMB?: number;
}

export function useAvatarUpload(options: UseAvatarUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const { onSuccess, onError, maxSizeInMB = 2 } = options;

  const uploadAvatar = async (file: File): Promise<string | null> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = 'Please select a valid image file';
      toast.error(error);
      onError?.(error);
      return null;
    }

    // Validate file size
    const maxSize = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSize) {
      const error = `File size must be less than ${maxSizeInMB}MB`;
      toast.error(error);
      onError?.(error);
      return null;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Upload to backend
      const result = await profileAPI.setAvatar(base64Data);
      
      toast.success('Avatar updated successfully!');
      onSuccess?.(result.avatar_url);
      
      return result.avatar_url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload avatar';
      console.error('Avatar upload error:', error);
      toast.error(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  return {
    uploadAvatar,
    handleFileSelect,
    isUploading,
  };
}
