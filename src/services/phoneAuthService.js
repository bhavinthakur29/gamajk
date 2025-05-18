import { RecaptchaVerifier, PhoneAuthProvider, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Check if a user has verified phone number
 * @param {string} email - User's email
 * @returns {Promise<{hasPhone: boolean, phoneNumber: string|null, userId: string|null}>}
 */
export async function checkPhoneVerification(email) {
  try {
    // Query users collection to find user by email using Firebase v9 syntax
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { hasPhone: false, phoneNumber: null, userId: null };
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    return {
      hasPhone: !!userData.isPhoneVerified,
      phoneNumber: userData.phoneNumber || null,
      userId: userDoc.id
    };
  } catch (error) {
    console.error("Error checking phone verification:", error);
    return { hasPhone: false, phoneNumber: null, userId: null };
  }
}

/**
 * Initialize recaptcha verifier
 * @param {string} containerId - HTML element ID for recaptcha
 * @returns {RecaptchaVerifier}
 */
export function initRecaptchaVerifier(containerId) {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'normal',
      'callback': () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        // Handle expiration
      }
    });
  }
  return window.recaptchaVerifier;
}

/**
 * Send OTP to phone number
 * @param {string} phoneNumber - User's phone number
 * @returns {Promise<string>} - Verification ID
 */
export async function sendOTP(phoneNumber) {
  try {
    const verifier = initRecaptchaVerifier('recaptcha-container');
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return confirmationResult.verificationId;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  } finally {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  }
}

/**
 * Verify OTP code
 * @param {string} verificationId - Verification ID from sendOTP
 * @param {string} code - OTP code entered by user
 * @returns {Promise<boolean>}
 */
export async function verifyOTP(verificationId, code) {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    // In a real implementation, this would use the credential to initiate 
    // password reset, but for this demo we'll just return success
    return true;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
}

/**
 * Update password
 * @param {string} email - User's email
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export async function updatePassword(email, newPassword) {
  // This would actually call the Firebase Auth API to reset the password
  // but since this is just a demo and would need additional setup,
  // we'll just mock a successful response
  return Promise.resolve();
} 