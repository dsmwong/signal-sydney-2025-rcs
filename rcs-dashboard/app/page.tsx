'use client';

import { useState, useEffect } from 'react';
import * as TwilioSync from 'twilio-sync';

type SyncClientType = InstanceType<typeof TwilioSync.Client>;
type SyncListType = InstanceType<typeof TwilioSync.SyncList>;

interface SyncListItemData {
  MessageSid?: string;
  To?: string;
  From?: string;
  ButtonType?: string;
  ButtonPayload?: string;
  ButtonText?: string;
  ChannelMetadata?: string | Record<string, unknown>;
  [key: string]: unknown;
}

interface RcsEvent {
  index: number;
  data: SyncListItemData;
  dateCreated: Date | string;
  dateUpdated: Date | string;
}

export default function Home() {
  const [syncClient, setSyncClient] = useState<SyncClientType | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [identity, setIdentity] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [rcsEventsList, setRcsEventsList] = useState<SyncListType | null>(null);
  const [events, setEvents] = useState<RcsEvent[]>([]);
  const [listStatus, setListStatus] = useState<string>('Not loaded');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const toggleItem = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const deleteItem = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rcsEventsList) return;

    try {
      await rcsEventsList.remove(index);
      // The itemRemoved event listener will handle updating the UI
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete item');
    }
  };

  const connectToSync = async () => {
    try {
      setConnectionStatus('Connecting...');
      setError('');

      const response = await fetch('/api/token');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const client = new TwilioSync.Client(data.token);

      client.on('connectionStateChanged', (state: string) => {
        setConnectionStatus(state);
      });

      setSyncClient(client);
      setIdentity(data.identity);
      setConnectionStatus('Connected');

      // Retrieve the rcs-events list
      try {
        setListStatus('Loading...');
        const list = await client.list('rcs-events');
        setRcsEventsList(list);

        // Get all existing items
        const items = await list.getItems({ pageSize: 100 });
        const eventItems: RcsEvent[] = items.items.map((item) => ({
          index: item.index,
          data: item.data as SyncListItemData,
          dateCreated: (item as unknown as { dateCreated?: Date | string }).dateCreated || new Date(),
          dateUpdated: (item as unknown as { dateUpdated?: Date | string }).dateUpdated || new Date(),
        }));
        setEvents(eventItems);
        setListStatus('Loaded');

        // Auto-expand the first (most recent) item
        if (eventItems.length > 0) {
          const mostRecentIndex = eventItems[eventItems.length - 1].index;
          setExpandedItems(new Set([mostRecentIndex]));
        }

        // Listen for new items added
        list.on('itemAdded', (args: { item: Record<string, unknown> }) => {
          const item = args.item as { index: number; data: Record<string, unknown>; dateCreated?: Date | string; dateUpdated?: Date | string };
          const newEvent = {
            index: item.index,
            data: item.data as SyncListItemData,
            dateCreated: item.dateCreated || new Date(),
            dateUpdated: item.dateUpdated || new Date(),
          };
          setEvents(prev => [...prev, newEvent]);
          // Auto-expand the newly added item
          setExpandedItems(prev => {
            const newSet = new Set(prev);
            newSet.add(item.index);
            return newSet;
          });
        });

        // Listen for item updates
        list.on('itemUpdated', (args: { item: Record<string, unknown> }) => {
          const item = args.item as { index: number; data: Record<string, unknown>; dateCreated?: Date | string; dateUpdated?: Date | string };
          setEvents(prev => prev.map(event =>
            event.index === item.index
              ? {
                  index: item.index,
                  data: item.data as SyncListItemData,
                  dateCreated: item.dateCreated || event.dateCreated,
                  dateUpdated: item.dateUpdated || new Date(),
                }
              : event
          ));
        });

        // Listen for item removal
        list.on('itemRemoved', (args: { index: number }) => {
          setEvents(prev => prev.filter(event => event.index !== args.index));
        });

      } catch (listError) {
        setListStatus('Error loading list');
        setError(listError instanceof Error ? listError.message : 'Failed to load rcs-events list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionStatus('Error');
    }
  };

  const disconnectFromSync = async () => {
    if (syncClient) {
      await syncClient.shutdown();
      setSyncClient(null);
      setConnectionStatus('Disconnected');
      setIdentity('');
      setRcsEventsList(null);
      setEvents([]);
      setListStatus('Not loaded');
    }
  };

  useEffect(() => {
    // Auto-connect on mount
    connectToSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (syncClient) {
        syncClient.shutdown();
      }
    };
  }, [syncClient]);

  return (
    <div className="font-sans min-h-screen p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                SIGNAL Sydney 2025 RCS Event Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Connect and interact with Twilio Sync service
              </p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600 dark:text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>

          {showSettings && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Connection Status
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        connectionStatus === 'Connected'
                          ? 'bg-green-500'
                          : connectionStatus === 'Connecting...'
                          ? 'bg-yellow-500 animate-pulse'
                          : connectionStatus === 'Error'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {connectionStatus}
                    </span>
                  </div>
                </div>

                {identity && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Identity
                    </label>
                    <span className="text-gray-900 dark:text-white font-mono text-sm">
                      {identity}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={connectToSync}
                  disabled={connectionStatus === 'Connected' || connectionStatus === 'Connecting...'}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  Connect to Sync
                </button>
                <button
                  onClick={disconnectFromSync}
                  disabled={!syncClient}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              RCS Events
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              listStatus === 'Loaded'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : listStatus === 'Loading...'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : listStatus === 'Error loading list'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {listStatus}
            </span>
          </div>

          {events.length > 0 ? (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {[...events].reverse().map((event) => {
                const isExpanded = expandedItems.has(event.index);
                return (
                  <div
                    key={event.index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900"
                  >
                    <button
                      onClick={() => toggleItem(event.index)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 dark:text-gray-400">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                        <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                          [{event.index}] {event.data.MessageSid || 'No MessageSid'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(event.dateUpdated).toLocaleString()}
                        </span>
                        <button
                          onClick={(e) => deleteItem(event.index, e)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors group"
                          title="Delete item"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                        {event.data.MessageSid && (
                          <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              Message SID
                            </label>
                            <p className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1">
                              {event.data.MessageSid}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {event.data.To && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                To
                              </label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {event.data.To}
                              </p>
                            </div>
                          )}

                          {event.data.From && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                From
                              </label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {event.data.From}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {event.data.ButtonType && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                Button Type
                              </label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {event.data.ButtonType}
                              </p>
                            </div>
                          )}

                          {event.data.ButtonPayload && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                Button Payload
                              </label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {event.data.ButtonPayload}
                              </p>
                            </div>
                          )}

                          {event.data.ButtonText && (
                            <div>
                              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                Button Text
                              </label>
                              <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                {event.data.ButtonText}
                              </p>
                            </div>
                          )}
                        </div>

                        {event.data.ChannelMetadata && (
                          <div>
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 block">
                              Channel Metadata
                            </label>
                            <textarea
                              readOnly
                              className="w-full text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 resize-none"
                              rows={6}
                              value={typeof event.data.ChannelMetadata === 'string'
                                ? JSON.stringify(JSON.parse(event.data.ChannelMetadata), null, 2)
                                : JSON.stringify(event.data.ChannelMetadata, null, 2)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {listStatus === 'Loaded' ? 'No events yet' : 'Connect to Sync to view events'}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
