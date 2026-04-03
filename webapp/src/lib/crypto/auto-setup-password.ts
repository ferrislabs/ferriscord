export function autoSetupPasswordKey(userId: string): string {
  return `ferriscord_e2ee_auto_password_${userId}`
}

export function e2eeSecretsAcknowledgedKey(userId: string): string {
  return `ferriscord_e2ee_secrets_acknowledged_${userId}`
}
