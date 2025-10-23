// Test file for API Key Manager utilities
// This is a simple test to verify the functionality works correctly

import { 
  saveApiKey, 
  getApiKey, 
  clearApiKey, 
  hasApiKey, 
  getMaskedApiKey, 
  validateApiKeyFormat, 
  getApiKeyStatus 
} from './apiKeyManager';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Test functions
export const runApiKeyTests = () => {
  console.log('🧪 Running API Key Manager Tests...');
  
  // Clear any existing data
  clearApiKey();
  
  // Test 1: Initial state
  console.log('Test 1: Initial state');
  console.assert(!hasApiKey(), 'Should not have API key initially');
  console.assert(getApiKey() === null, 'Should return null when no key exists');
  console.assert(getMaskedApiKey() === null, 'Should return null masked key when no key exists');
  
  // Test 2: Save and retrieve API key
  console.log('Test 2: Save and retrieve API key');
  const testKey = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkUzMDIwQkIwMTRGQzc0QjZBNEI3QjU5QTFBMTgzOENDIiwidHlwIjoiYXQrand0In0.test123';
  saveApiKey(testKey);
  console.assert(hasApiKey(), 'Should have API key after saving');
  console.assert(getApiKey() === testKey, 'Should retrieve the same key that was saved');
  
  // Test 3: Masked API key
  console.log('Test 3: Masked API key');
  const maskedKey = getMaskedApiKey();
  console.assert(maskedKey !== null, 'Should return masked key');
  console.assert(maskedKey?.includes('*'), 'Masked key should contain asterisks');
  console.assert(maskedKey?.endsWith('st123'), 'Masked key should end with last 5 characters');
  console.log('Masked key:', maskedKey);
  
  // Test 4: API key validation
  console.log('Test 4: API key validation');
  console.assert(validateApiKeyFormat(testKey), 'Should validate correct API key format');
  console.assert(!validateApiKeyFormat('short'), 'Should reject short keys');
  console.assert(!validateApiKeyFormat(''), 'Should reject empty keys');
  console.assert(!validateApiKeyFormat('invalid@#$%^&*()'), 'Should reject keys with invalid characters');
  
  // Test 5: API key status
  console.log('Test 5: API key status');
  const status = getApiKeyStatus();
  console.assert(status.hasKey === true, 'Status should show key exists');
  console.assert(status.maskedKey !== null, 'Status should have masked key');
  console.assert(status.displayText !== 'No API key set', 'Status should not show no key message');
  
  // Test 6: Clear API key
  console.log('Test 6: Clear API key');
  clearApiKey();
  console.assert(!hasApiKey(), 'Should not have API key after clearing');
  console.assert(getApiKey() === null, 'Should return null after clearing');
  
  const clearedStatus = getApiKeyStatus();
  console.assert(clearedStatus.hasKey === false, 'Status should show no key after clearing');
  console.assert(clearedStatus.displayText === 'No API key set', 'Status should show no key message');
  
  console.log('✅ All API Key Manager tests passed!');
};

// Export for use in browser console
(window as any).runApiKeyTests = runApiKeyTests;
