// lib/auth-config.js
export const authOptions = {
    // Add the necessary configuration for session management
    session: {
      maxAge: 60 * 60 * 24 * 14, // 2 weeks
      updateAge: 24 * 60 * 60, // 24 hours
    },
    // You can add more auth configuration here as needed
  };