/**
 * API utility functions for handling requests with automatic retries
 */

/**
 * Fetch with automatic retry functionality
 * @param {string} url - The URL to fetch
 * @param {Object} options - The fetch options
 * @param {number} [maxRetries=2] - Maximum number of retries
 * @param {number} [retryDelay=500] - Delay between retries in ms
 * @returns {Promise} - The fetch response
 */
export const fetchWithRetry = async (url, options, maxRetries = 2, retryDelay = 500) => {
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Log only on retry attempts, not the first try
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries} for: ${url}`);
      }
      
      const response = await fetch(url, options);
      
      // If response is not ok, throw an error to trigger retry
      if (!response.ok) {
        const errorMessage = `Request failed with status ${response.status}`;
        const errorResponse = await response.text().catch(() => 'No response text');
        console.error(`${errorMessage}: ${errorResponse}`);
        throw new Error(errorMessage);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
      
      // Don't wait if this was the last attempt
      if (attempt < maxRetries) {
        // Use exponential backoff for retries
        const backoffDelay = retryDelay * Math.pow(1.5, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  // If we got here, all retries failed
  console.error(`All ${maxRetries + 1} request attempts failed for: ${url}`);
  throw lastError;
};

/**
 * Parse JSON response with error handling
 * @param {Response} response - The fetch response
 * @returns {Promise<Object>} - The parsed JSON data
 */
export const parseJsonResponse = async (response) => {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('Error parsing JSON response:', error);
    throw new Error('Invalid JSON response');
  }
}; 