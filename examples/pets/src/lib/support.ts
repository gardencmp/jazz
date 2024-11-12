export const supportsWebAuthn =
  typeof PublicKeyCredential != "undefined" &&
  typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !=
    "undefined" &&
  (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
