export const AppEnvironmentConfig = {
  // E-mail (Resend)
  get resend() {
    return {
      apiUrl: (process.env.RESEND_API_URL || 'https://api.resend.com/emails').trim(),
      apiKey: (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, ''),
      fromEmail: (process.env.RESEND_FROM_EMAIL || 'Voxy <onboarding@resend.dev>').trim(),
    };
  },

  // LiveKit (WebRTC / Voice Engine)
  get livekit() {
    return {
      url: (process.env.LIVEKIT_URL || 'wss://voxy-livekit.d4rkside.com.br').trim(),
      apiKey: (process.env.LIVEKIT_API_KEY || 'devkey').trim().replace(/^["']|["']$/g, ''),
      apiSecret: (process.env.LIVEKIT_API_SECRET || 'secret').trim().replace(/^["']|["']$/g, ''),
    };
  },

  // JWT Security
  get jwt() {
    return {
      secret: (process.env.JWT_SECRET || 'secretKey').trim(),
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d').trim(),
    };
  },

  // Storage (Cloudflare R2 / S3)
  get storage() {
    return {
      accountId: (process.env.R2_ACCOUNT_ID || '').trim(),
      accessKeyId: (process.env.R2_ACCESS_KEY_ID || '').trim().replace(/^["']|["']$/g, ''),
      secretAccessKey: (process.env.R2_SECRET_ACCESS_KEY || '').trim().replace(/^["']|["']$/g, ''),
      bucketName: (process.env.R2_BUCKET_NAME || 'voxy-storage').trim(),
      endpoint: (process.env.R2_ENDPOINT || '').trim(),
      publicBaseUrl: (process.env.R2_PUBLIC_URL || '').trim().replace(/\/$/, ''),
    };
  },

  // Database & Cache
  get databaseUrl() {
    return (process.env.DATABASE_URL || '').trim();
  },
  get redisUrl() {
    return (process.env.REDIS_URL || 'redis://localhost:6379').trim();
  },

  // App & Server
  get server() {
    return {
      port: Number(process.env.PORT) || 3000,
      host: (process.env.HOST || '0.0.0.0').trim(),
      retentionDays: Number(process.env.CHAT_RETENTION_DAYS ?? 60),
    };
  },
};
