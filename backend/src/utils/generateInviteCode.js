import crypto from 'crypto';

export const generateInviteCode = () => {
  // Generate a random 6-character string
  const randomBytes = crypto.randomBytes(4);
  const inviteCode = randomBytes.toString('hex').toUpperCase();
  return inviteCode;
}; 