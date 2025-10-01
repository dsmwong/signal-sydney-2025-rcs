import { NextResponse } from 'next/server';
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const SyncGrant = AccessToken.SyncGrant;

export async function GET() {
  const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
  const apiKey = process.env.NEXT_PUBLIC_TWILIO_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_TWILIO_API_SECRET;
  const syncServiceSid = process.env.NEXT_PUBLIC_TWILIO_SYNC_SERVICE_SID;

  if (!accountSid || !apiKey || !apiSecret || !syncServiceSid) {
    return NextResponse.json(
      { error: 'Missing Twilio credentials' },
      { status: 500 }
    );
  }

  const identity = `user_${Date.now()}`;

  const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: 3600,
  });

  const syncGrant = new SyncGrant({
    serviceSid: syncServiceSid,
  });

  accessToken.addGrant(syncGrant);

  return NextResponse.json({
    token: accessToken.toJwt(),
    identity
  });
}
