import * as TwilioSync from 'twilio-sync';

type SyncClientType = InstanceType<typeof TwilioSync.Client>;

let syncClient: SyncClientType | null = null;

export async function getTwilioSyncClient(token: string): Promise<SyncClientType> {
  if (!syncClient) {
    syncClient = new TwilioSync.Client(token);
  }
  return syncClient;
}

export async function closeTwilioSyncClient(): Promise<void> {
  if (syncClient) {
    await syncClient.shutdown();
    syncClient = null;
  }
}
