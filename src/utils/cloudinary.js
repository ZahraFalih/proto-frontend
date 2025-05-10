// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloud_name: 'dxglr5zz1',
  api_key: '744576776911953',
  api_secret: 'HtVzMp5VJC3j4BvXBupWeq_HddE'
};

// Function to upload file to Cloudinary
export const uploadToCloudinary = async (file, pageId) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloud_name);
    formData.append('folder', `Uploads/UBA/${pageId}`);
    formData.append('resource_type', 'raw'); // Specify that we're uploading a raw file

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