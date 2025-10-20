import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testJobItemsTable, testJobCardsTable, createTestJobItem, checkJobItemsConstraints, testForeignKeys, applyForeignKeys } from '@/api/test-db-connection';
import { fixJobItemsRLS } from '@/api/fix-database';

export function DatabaseTest() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const result = await testJobItemsTable();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const testJobCards = async () => {
    setIsLoading(true);
    try {
      const result = await testJobCardsTable();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const createTest = async () => {
    setIsLoading(true);
    try {
      const result = await createTestJobItem();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const fixRLS = async () => {
    setIsLoading(true);
    try {
      const result = await fixJobItemsRLS();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const checkConstraints = async () => {
    setIsLoading(true);
    try {
      const result = await checkJobItemsConstraints();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const testForeignKeysHandler = async () => {
    setIsLoading(true);
    try {
      const result = await testForeignKeys();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const applyForeignKeysHandler = async () => {
    setIsLoading(true);
    try {
      const result = await applyForeignKeys();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={runTest} disabled={isLoading}>
            Test job_items Table
          </Button>
          <Button onClick={testJobCards} disabled={isLoading} variant="secondary">
            Test job_cards Table
          </Button>
          <Button onClick={createTest} disabled={isLoading} variant="outline">
            Create Test Item
          </Button>
          <Button onClick={checkConstraints} disabled={isLoading} variant="secondary">
            Check Constraints
          </Button>
          <Button onClick={testForeignKeysHandler} disabled={isLoading} variant="outline">
            Test Foreign Keys
          </Button>
          <Button onClick={applyForeignKeysHandler} disabled={isLoading} variant="outline">
            Apply Foreign Keys
          </Button>
          <Button onClick={fixRLS} disabled={isLoading} variant="destructive">
            Fix RLS Policies
          </Button>
        </div>
        
        {testResult && (
          <div className="p-6 bg-gray-100 rounded-lg border-2 border-gray-300">
            <h3 className="font-bold text-lg mb-4 text-gray-800">Test Result:</h3>
            <div className="bg-white p-4 rounded border">
              <pre className="text-base font-mono leading-relaxed overflow-auto max-h-96 whitespace-pre-wrap break-words text-black bg-gray-50">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
