import CryptoJS from 'crypto-js';

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloud_name: 'dxglr5zz1',
  upload_preset: 'uba_upload' // The preset you created in Cloudinary dashboard
};

// Function to generate signature for Cloudinary upload
const generateSignature = (params) => {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  // Create string to sign
  const stringToSign = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // Create signature using SHA-1
  const signature = CryptoJS.SHA1(stringToSign + CLOUDINARY_CONFIG.api_secret).toString();
  return signature;
};

// Function to upload file to Cloudinary
export const uploadToCloudinary = async (file, pageId) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
    formData.append('folder', `Uploads/UBA/${pageId}`);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloud_name);

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/raw/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload error details:', errorData);
      throw new Error(`Failed to upload to Cloudinary: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      public_id: data.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}; 