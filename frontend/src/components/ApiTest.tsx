import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import apiService from '@/services/api';

const ApiTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testHealthCheck = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      console.log('Testing health check...');
      const result = await apiService.healthCheck();
      setTestResult(`✅ Health check successful: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setTestResult(`❌ Health check failed: ${error.message}`);
      console.error('Health check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testSendOTP = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      console.log('Testing send OTP...');
      const result = await apiService.sendOTP('9876543210');
      setTestResult(`✅ Send OTP successful: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setTestResult(`❌ Send OTP failed: ${error.message}`);
      console.error('Send OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={testHealthCheck} 
            disabled={isLoading}
            variant="outline"
          >
            Test Health Check
          </Button>
          <Button 
            onClick={testSendOTP} 
            disabled={isLoading}
            variant="outline"
          >
            Test Send OTP
          </Button>
        </div>
        
        {testResult && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>Backend URL:</strong> http://localhost:5000</p>
          <p><strong>Frontend URL:</strong> http://localhost:8080</p>
          <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiTest;
