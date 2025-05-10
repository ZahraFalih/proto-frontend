import CryptoJS from 'crypto-js';

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloud_name: 'dxglr5zz1',
  api_key: '744576776911953',
  api_secret: 'HtVzMp5VJC3j4BvXBupWeq_HddE'
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
    const timestamp = Math.round((new Date()).getTime() / 1000);
    
    // Prepare parameters for signature
    const params = {
      timestamp: timestamp,
      folder: `Uploads/UBA/${pageId}`,
      resource_type: 'raw'
    };

    // Generate signature
    const signature = generateSignature(params);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloud_name);
    formData.append('api_key', CLOUDINARY_CONFIG.api_key);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', `Uploads/UBA/${pageId}`);
    formData.append('resource_type', 'raw');

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