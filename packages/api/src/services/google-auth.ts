/**
 * Google OAuth ID Token verification.
 * Verifies the ID token received from the client-side Google Sign-In
 * and extracts user profile information.
 */

interface GoogleTokenPayload {
  sub: string; // Google user ID (unique, stable)
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

/**
 * Verify a Google ID token by calling Google's tokeninfo endpoint.
 * This approach avoids needing the google-auth-library dependency
 * and works perfectly with Bun.
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
  // Use Google's tokeninfo endpoint for verification
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

  if (!response.ok) {
    throw new Error("Invalid Google ID token");
  }

  const payload = (await response.json()) as Record<string, string>;

  // Verify the audience matches our client ID
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId && payload.aud !== clientId) {
    throw new Error("Token audience mismatch");
  }

  if (payload.email_verified !== "true") {
    throw new Error("Email not verified");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    email_verified: true,
  };
}
