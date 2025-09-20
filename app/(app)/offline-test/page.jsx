'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { testOfflineStorage, testOfflineSales, clearTestData } from '@/lib/offline-test';

export default function OfflineTestPage() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTest = async (testName, testFn) => {
    setTesting(true);
    addLog(`Starting ${testName}...`);
    
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [testName]: result }));
      addLog(`${testName} ${result ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      setResults(prev => ({ ...prev, [testName]: false }));
      addLog(`${testName} ERROR: ${error.message}`);
    }
    
    setTesting(false);
  };

  const runAllTests = async () => {
    setLogs([]);
    setResults({});
    
    await runTest('Storage Test', testOfflineStorage);
    await runTest('Sales Test', testOfflineSales);
  };

  const clearData = async () => {
    setTesting(true);
    addLog('Clearing test data...');
    
    try {
      await clearTestData();
      addLog('Test data cleared successfully');
      setResults({});
    } catch (error) {
      addLog(`Clear failed: ${error.message}`);
    }
    
    setTesting(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 Offline Functionality Test</h1>
        <p className="text-muted-foreground">
          Test PouchDB offline storage and functionality
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={runAllTests}
                disabled={testing}
                className="w-full"
              >
                {testing ? 'Testing...' : 'Run All Tests'}
              </Button>
              
              <Button 
                onClick={() => runTest('Storage Test', testOfflineStorage)}
                disabled={testing}
                variant="outline"
                className="w-full"
              >
                Test Storage Only
              </Button>
              
              <Button 
                onClick={() => runTest('Sales Test', testOfflineSales)}
                disabled={testing}
                variant="outline"
                className="w-full"
              >
                Test Sales Only
              </Button>
              
              <Button 
                onClick={clearData}
                disabled={testing}
                variant="destructive"
                className="w-full"
              >
                Clear Test Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(results).map(([test, passed]) => (
                <div key={test} className="flex justify-between items-center">
                  <span>{test}</span>
                  <Badge variant={passed ? "default" : "destructive"}>
                    {passed ? "PASSED" : "FAILED"}
                  </Badge>
                </div>
              ))}
              
              {Object.keys(results).length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No tests run yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Test Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📖 Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Basic Offline Test</h4>
            <p className="text-sm text-muted-foreground">
              Click "Run All Tests" to verify PouchDB is working and can store data locally.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">2. Network Offline Test</h4>
            <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
              <li>Open browser Dev Tools (F12)</li>
              <li>Go to Network tab</li>
              <li>Set throttling to "Offline"</li>
              <li>Run tests again - they should still work!</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">3. Storage Inspection</h4>
            <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
              <li>Open Dev Tools → Application tab</li>
              <li>Expand IndexedDB in sidebar</li>
              <li>Look for "agroplus_" databases</li>
              <li>Verify test data is stored locally</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">4. POS System Test</h4>
            <p className="text-sm text-muted-foreground">
              Once tests pass, go to <code>/pos</code> and make sales while offline!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
