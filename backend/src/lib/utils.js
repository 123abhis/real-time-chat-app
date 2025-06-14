import jwt from "jsonwebtoken";
import CryptoJS from 'crypto-js';
import Filter from 'bad-words';

const filter = new Filter();

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};

// Encryption functions
export const encryptMessage = (message, password) => {
    return CryptoJS.AES.encrypt(message, password).toString();
};

export const decryptMessage = (encryptedMessage, password) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, password);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        
        // Check if decryption was successful
        if (!decrypted) {
            throw new Error('Decryption failed');
        }
        
        return decrypted;
    } catch (error) {
        throw new Error('Failed to decrypt message: ' + error.message);
    }
};

// Bad words filtering
export const filterBadWords = (text) => {
    return filter.clean(text);
};

export const hasBadWords = (text) => {
    return filter.isProfane(text);
};
