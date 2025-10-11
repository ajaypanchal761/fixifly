import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadImageToCloudinaryAdmin } from '@/utils/imageUpload';
import { useToast } from '@/hooks/use-toast';

interface NotificationImageUploadProps {
  onImageSelect: (image: {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  } | null) => void;
  selectedImage?: {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  } | null;
  disabled?: boolean;
}

const NotificationImageUpload: React.FC<NotificationImageUploadProps> = ({
  onImageSelect,
  selectedImage,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, or WebP image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Cloudinary with notification-specific folder
      const uploadResult = await uploadImageToCloudinaryAdmin(file, {
        folder: 'fixifly/notification-images',
        transformation: [
          { width: 800, height: 600, crop: 'fit' },
          { quality: 'auto' }
        ],
        type: 'notification'
      });

      const imageData = {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height
      };
      
      console.log('🖼️ Image uploaded successfully:', imageData);
      onImageSelect(imageData);

      toast({
        title: "Image uploaded successfully",
        description: "Your notification image has been uploaded",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleRemoveImage = () => {
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="notification-image">Notification Image (Optional)</Label>
      
      {selectedImage ? (
        <div className="relative">
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Selected Image</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                disabled={disabled || isUploading}
                className="h-5 w-5 p-0 text-gray-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <img
                src={selectedImage.secure_url}
                alt="Notification preview"
                className="w-12 h-12 object-cover rounded border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 truncate">
                  {selectedImage.width} × {selectedImage.height}
                </p>
                <p className="text-xs text-gray-500">
                  Will display in notifications
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClickUpload}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center space-y-1">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <p className="text-xs text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <div className="p-1 bg-gray-100 rounded-full">
                <ImageIcon className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WebP up to 5MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || isUploading}
                className="mt-1 h-7 px-2 text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                Choose
              </Button>
            </div>
          )}
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Adding an image will make your notification more engaging and visible to users.
      </p>
    </div>
  );
};

export default NotificationImageUpload;
