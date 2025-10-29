/**
 * Image upload utility for uploading images to Cloudinary
 */
import axios from 'axios';

// Normalize API base (ensure it includes /api exactly once)
const configuredBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';
const API_BASE_URL = (() => {
  try {
    let base = configuredBase.trim();
    if (base.endsWith('/')) base = base.slice(0, -1);
    if (!/\/api$/i.test(base)) base = `${base}/api`;
    return base;
  } catch {
    return 'http://localhost:5000/api';
  }
})();
console.info('[imageUpload] Using API base:', API_BASE_URL);

// Create axios instance for uploads
const uploadApi = axios.create({
  baseURL: `${API_BASE_URL}/upload`,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add request interceptor to include auth token
uploadApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface UploadResponse {
  success: boolean;
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

interface UploadOptions {
  folder?: string;
  transformation?: any[];
  quality?: string;
  fetch_format?: string;
}

/**
 * Upload image file to Cloudinary (for regular users)
 * @param file - File object to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export const uploadImageToCloudinary = async (
  file: File,
  options: UploadOptions = {}
): Promise<UploadResponse> => {
  try {
    // Validate file
    const validationResult = validateImageFile(file);
    if (!validationResult.valid) {
      throw new Error(validationResult.error);
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Set default options for AMC device photos
    const defaultOptions = {
      folder: 'fixifly/amc-device-photos',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'auto' },
        { quality: 'auto' }
      ],
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    // Add options to form data
    Object.entries(defaultOptions).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'transformation' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Upload to backend endpoint that handles Cloudinary upload
    const response = await uploadApi.post('/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Upload failed');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Image upload error:', error);
    console.error('[imageUpload] Request details:', {
      url: `${API_BASE_URL}/upload/image`,
      method: 'POST'
    });
    
    // Handle axios errors
    if (error.response) {
      const errorMessage = error.response.data?.message || 'Upload failed';
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error(error.message || 'Upload failed');
    }
  }
};

/**
 * Upload image file to Cloudinary (for admin users)
 * @param file - File object to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export const uploadImageToCloudinaryAdmin = async (
  file: File,
  options: UploadOptions = {}
): Promise<UploadResponse> => {
  try {
    // Validate file
    const validationResult = validateImageFile(file);
    if (!validationResult.valid) {
      throw new Error(validationResult.error);
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Set default options for admin uploads
    const defaultOptions = {
      folder: 'fixifly/notification-images',
      transformation: [
        { width: 800, height: 600, crop: 'fit' },
        { quality: 'auto' }
      ],
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    // Add options to form data
    Object.entries(defaultOptions).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'transformation' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Create axios instance for admin uploads
    const adminUploadApi = axios.create({
      baseURL: `${API_BASE_URL}/admin/upload`,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Add request interceptor to include admin auth token
    adminUploadApi.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('adminToken');
        console.log('🔑 Admin token check:', {
          hasToken: !!token,
          tokenLength: token ? token.length : 0,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
        });
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.error('❌ No admin token found in localStorage');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Upload to admin backend endpoint
    const response = await adminUploadApi.post('/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Upload failed');
    }

    return response.data.data;
  } catch (error: any) {
    console.error('Admin image upload error:', error);
    console.error('[imageUpload] Admin request details:', {
      url: `${API_BASE_URL}/admin/upload/image`,
      method: 'POST'
    });
    
    // Handle axios errors
    if (error.response) {
      const errorMessage = error.response.data?.message || 'Upload failed';
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error(error.message || 'Upload failed');
    }
  }
};

/**
 * Validate image file
 * @param file - File to validate
 * @returns Validation result
 */
const validateImageFile = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return {
      valid: false,
      error: 'No file provided'
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 5MB'
    };
  }

  return {
    valid: true,
    error: null
  };
};

/**
 * Generate optimized image URL from Cloudinary public ID
 * @param publicId - Cloudinary public ID
 * @param transformations - Image transformations
 * @returns Optimized URL
 */
export const generateOptimizedImageUrl = (
  publicId: string,
  transformations: any = {}
): string => {
  const defaultTransformations = {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto'
  };

  const finalTransformations = { ...defaultTransformations, ...transformations };
  
  // Construct Cloudinary URL
  const baseUrl = 'https://res.cloudinary.com';
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
  
  const transformationString = Object.entries(finalTransformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');
  
  return `${baseUrl}/${cloudName}/image/upload/${transformationString}/${publicId}`;
};

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const matches = url.match(/\/v\d+\/(.+)\./);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Failed to extract public ID from URL:', error);
    return null;
  }
};
