// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloud_name: 'dxglr5zz1',
  api_key: '744576776911953',
  api_secret: 'HtVzMp5VJC3j4BvXBupWeq_HddE',
  upload_preset: 'ml_default' // You may want to create a specific preset for UBA files
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
    formData.append('api_key', CLOUDINARY_CONFIG.api_key);
    formData.append('timestamp', Math.round((new Date()).getTime() / 1000));

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/auto/upload`,
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