import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68c48cebc97d8c313adb5b5e", 
  requiresAuth: true // Ensure authentication is required for all operations
});
