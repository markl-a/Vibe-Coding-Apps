#!/usr/bin/env node
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'NODE_ENV'];
const minSecretLength = 32;

function validateEnv() {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < minSecretLength) {
    console.error('❌ JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET?.includes('your') || process.env.JWT_SECRET?.includes('example')) {
      console.error('❌ JWT_SECRET appears to be a placeholder value');
      process.exit(1);
    }
  }

  console.log('✅ Environment variables validated successfully');
}

validateEnv();
