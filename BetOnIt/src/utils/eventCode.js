// Generate a unique 6-character event code
export const generateEventCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Validate event code format
export const isValidEventCode = (code) => {
  return /^[A-Z0-9]{6}$/.test(code);
};