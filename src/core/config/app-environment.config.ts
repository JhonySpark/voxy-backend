export const AppEnvironmentConfig = {
  // E-mail (Resend)
  resend: {
    apiUrl: process.env.RESEND_API_URL || 'https://api.resend.com/emails',
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'Voxy <onboarding@resend.dev>',
  },

  // LiveKit (WebRTC / Voice Engine)
  livekit: {
    url: process.env.LIVEKIT_URL || 'wss://voxy-livekit.d4rkside.com.br',
    apiKey: process.env.LIVEKIT_API_KEY || 'devkey',
    apiSecret: process.env.LIVEKIT_API_SECRET || 'secret',
  },

  // JWT Security
  jwt: {
    secret: process.env.JWT_SECRET || 'secretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Storage (Cloudflare R2 / S3)
  storage: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || 'voxy-storage',
    endpoint: process.env.R2_ENDPOINT || '',
    publicBaseUrl: (process.env.R2_PUBLIC_URL || '').replace(/\/$/, ''),
  },

  // Database & Cache
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // App & Server
  server: {
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
    retentionDays: Number(process.env.CHAT_RETENTION_DAYS ?? 60),
  },
} as const;
