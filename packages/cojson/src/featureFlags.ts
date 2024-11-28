const featureFlags = {
  RetryUnavailableCoValues: true,
};

export function isFeatureEnabled(feature: keyof typeof featureFlags) {
  return featureFlags[feature];
}

export function setFeatureFlag(
  feature: keyof typeof featureFlags,
  enabled: boolean,
) {
  featureFlags[feature] = enabled;
}

export default featureFlags;
