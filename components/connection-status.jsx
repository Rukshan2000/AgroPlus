'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import dbManager, { getSyncStatus, manualSync } from '@/lib/pouchdb';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    activeSyncs: [],
    databases: []
  });
  const [syncProgress, setSyncProgress] = useState({});
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    // Check initial online status
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync events
    const handleSyncChange = (event) => {
      const { dbName, info } = event.detail;
      setSyncProgress(prev => ({
        ...prev,
        [dbName]: {
          status: 'syncing',
          docs: info.docs_written || 0,
          pending: info.pending || 0
        }
      }));
      setLastSyncTime(new Date());
    };

    const handleSyncPaused = (event) => {
      const { dbName } = event.detail;
      setSyncProgress(prev => ({
        ...prev,
        [dbName]: {
          ...prev[dbName],
          status: 'paused'
        }
      }));
    };

    const handleSyncActive = (event) => {
      const { dbName } = event.detail;
      setSyncProgress(prev => ({
        ...prev,
        [dbName]: {
          ...prev[dbName],
          status: 'active'
        }
      }));
    };

    const handleSyncError = (event) => {
      const { dbName, error } = event.detail;
      setSyncProgress(prev => ({
        ...prev,
        [dbName]: {
          ...prev[dbName],
          status: 'error',
          error: error.message
        }
      }));
    };

    window.addEventListener('db-sync-change', handleSyncChange);
    window.addEventListener('db-sync-paused', handleSyncPaused);
    window.addEventListener('db-sync-active', handleSyncActive);
    window.addEventListener('db-sync-error', handleSyncError);

    // Update sync status periodically
    const updateSyncStatus = () => {
      setSyncStatus(getSyncStatus());
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('db-sync-change', handleSyncChange);
      window.removeEventListener('db-sync-paused', handleSyncPaused);
      window.removeEventListener('db-sync-active', handleSyncActive);
      window.removeEventListener('db-sync-error', handleSyncError);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const syncPromises = syncStatus.databases.map(dbName => manualSync(dbName));
      await Promise.allSettled(syncPromises);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'syncing':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'syncing':
        return <CheckCircle className="h-4 w-4" />;
      case 'paused':
        return <Clock className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Online/Offline Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Network:</span>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Active Syncs:</span>
          <Badge variant="outline">
            {syncStatus.activeSyncs.length} / {syncStatus.databases.length}
          </Badge>
        </div>

        {/* Last Sync Time */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last Sync:</span>
          <span className="text-sm font-medium">
            {formatTime(lastSyncTime)}
          </span>
        </div>

        {/* Database Sync Status */}
        {syncStatus.databases.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Database Status:</h4>
            {syncStatus.databases.map(dbName => {
              const progress = syncProgress[dbName];
              const isActive = syncStatus.activeSyncs.includes(dbName);
              
              return (
                <div key={dbName} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(progress?.status)}`} />
                      <span className="text-sm capitalize">{dbName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(progress?.status)}
                      <Badge variant={isActive ? "default" : "secondary"} size="sm">
                        {progress?.status || (isActive ? 'active' : 'idle')}
                      </Badge>
                    </div>
                  </div>
                  
                  {progress?.pending > 0 && (
                    <div className="space-y-1">
                      <Progress 
                        value={progress.docs ? ((progress.docs / (progress.docs + progress.pending)) * 100) : 0} 
                        className="h-1"
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {progress.docs || 0} / {(progress.docs || 0) + progress.pending} docs
                      </div>
                    </div>
                  )}
                  
                  {progress?.error && (
                    <div className="text-xs text-red-500 truncate">
                      {progress.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Manual Sync Button */}
        <Button 
          onClick={handleManualSync}
          disabled={!isOnline || isManualSyncing}
          className="w-full"
          size="sm"
        >
          {isManualSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Manual Sync
            </>
          )}
        </Button>

        {/* Offline Mode Notice */}
        {!isOnline && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Working offline. Changes will sync when connection is restored.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for header/navbar
export function ConnectionStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeSyncs, setActiveSyncs] = useState(0);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateSyncCount = () => {
      const status = getSyncStatus();
      setActiveSyncs(status.activeSyncs.length);
    };

    updateSyncCount();
    const interval = setInterval(updateSyncCount, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      
      {activeSyncs > 0 && (
        <Badge variant="outline" size="sm">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          {activeSyncs}
        </Badge>
      )}
      
      <Badge variant={isOnline ? "default" : "destructive"} size="sm">
        {isOnline ? "Online" : "Offline"}
      </Badge>
    </div>
  );
}
