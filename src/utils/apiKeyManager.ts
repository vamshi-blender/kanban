// API Key Management Utilities
// Handles secure storage, retrieval, and display of user API keys

const API_KEY_STORAGE_KEY = 'kanban_user_api_key';

/**
 * Saves the user's API key to localStorage
 * @param apiKey - The API key to store
 */
export const saveApiKey = (apiKey: string): void => {
  try {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key provided');
    }
    
    // Trim whitespace and validate the key is not empty
    const trimmedKey = apiKey.trim();
    if (trimmedKey.length === 0) {
      throw new Error('API key cannot be empty');
    }
    
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    console.log('API key saved successfully');
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
};

/**
 * Retrieves the user's API key from localStorage
 * @returns The stored API key or null if not found
 */
export const getApiKey = (): string | null => {
  try {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    return apiKey && apiKey.trim().length > 0 ? apiKey.trim() : null;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return null;
  }
};

/**
 * Removes the user's API key from localStorage
 */
export const clearApiKey = (): void => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    console.log('API key cleared successfully');
  } catch (error) {
    console.error('Error clearing API key:', error);
    throw error;
  }
};

/**
 * Checks if a user API key is currently stored
 * @returns True if an API key exists, false otherwise
 */
export const hasApiKey = (): boolean => {
  const apiKey = getApiKey();
  return apiKey !== null && apiKey.length > 0;
};

/**
 * Creates a masked version of the API key for display purposes
 * Shows only the last 4-5 characters for security
 * @param apiKey - The API key to mask (optional, will use stored key if not provided)
 * @returns Masked API key string or null if no key available
 */
export const getMaskedApiKey = (apiKey?: string): string | null => {
  try {
    const keyToMask = apiKey || getApiKey();
    
    if (!keyToMask || keyToMask.length === 0) {
      return null;
    }
    
    // Show last 4-5 characters based on key length
    const visibleChars = keyToMask.length > 20 ? 5 : 4;
    const lastChars = keyToMask.slice(-visibleChars);
    
    // Create appropriate number of asterisks
    const maskLength = Math.min(keyToMask.length - visibleChars, 8); // Cap at 8 asterisks for readability
    const mask = '*'.repeat(maskLength);
    
    return `${mask}${lastChars}`;
  } catch (error) {
    console.error('Error creating masked API key:', error);
    return null;
  }
};

/**
 * Validates if an API key has a reasonable format
 * This is a basic validation - actual validation happens on API calls
 * @param apiKey - The API key to validate
 * @returns True if the key appears to have a valid format
 */
export const validateApiKeyFormat = (apiKey: string): boolean => {
  try {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    const trimmedKey = apiKey.trim();
    
    // Basic validation: should be at least 20 characters and contain alphanumeric characters
    if (trimmedKey.length < 20) {
      return false;
    }
    
    // Check if it contains only valid characters (letters, numbers, dots, hyphens, underscores)
    const validCharPattern = /^[a-zA-Z0-9._-]+$/;
    return validCharPattern.test(trimmedKey);
  } catch (error) {
    console.error('Error validating API key format:', error);
    return false;
  }
};

/**
 * Gets the current API key status for UI display
 * @returns Object containing key status information
 */
export const getApiKeyStatus = () => {
  const hasKey = hasApiKey();
  const maskedKey = hasKey ? getMaskedApiKey() : null;
  
  return {
    hasKey,
    maskedKey,
    displayText: hasKey ? maskedKey : 'No API key set'
  };
};
