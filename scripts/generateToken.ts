// scripts/generateToken.ts
require('dotenv').config();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Check required environment variables
const teamId = process.env.APPLE_MUSIC_TEAM_ID;
const keyId = process.env.APPLE_MUSIC_KEY_ID;

if (!teamId || !keyId) {
  console.error(" Missing APPLE_MUSIC_TEAM_ID or APPLE_MUSIC_KEY_ID in .env.local");
  process.exit(1);
}

// Read private key
const privateKeyPath = path.join(__dirname, '../auth/AuthKey_63KNG35K7G.p8');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Create JWT token
const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  issuer: teamId,
  header: {
    alg: 'ES256',
    kid: keyId,
  },
});

// Output token
console.log('\n Apple Music Developer Token:\n');
console.log(token);
