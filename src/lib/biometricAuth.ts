/**
 * Triggers the device's NATIVE biometric prompt (Touch ID / Windows Hello /
 * Android fingerprint) via the WebAuthn API — no custom UI/animation.
 *
 * Resolves:
 *   - true  → the user verified with biometrics (or the device has no platform
 *             authenticator, so we don't block the demo on such machines)
 *   - false → the user cancelled or verification failed
 *
 * Works on localhost and HTTPS (WebAuthn requires a secure context).
 */
export async function authenticateWithBiometrics(userLabel = 'PanamaCompra User'): Promise<boolean> {
  if (typeof window === 'undefined' || !('PublicKeyCredential' in window)) {
    return true; // WebAuthn unavailable — don't block the flow
  }

  // Only gate when a platform (built-in biometric) authenticator exists.
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) return true;
  } catch {
    return true;
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'PanamaCompra', id: window.location.hostname },
        user: { id: userId, name: userLabel, displayName: userLabel },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'discouraged',
        },
        attestation: 'none',
        timeout: 60_000,
      },
    });
    return credential !== null;
  } catch {
    // NotAllowedError (cancelled / timed out) and other failures → not authenticated.
    return false;
  }
}
