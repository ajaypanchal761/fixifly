import React, { useState, useEffect } from 'react';

const ApiTest = () => {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testApi = async (name: string, url: string) => {
    try {
      console.log(`Testing ${name}: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          success: response.ok,
          data: data,
          error: null
        }
      }));
    } catch (error) {
      console.error(`Error testing ${name}:`, error);
      setResults(prev => ({
        ...prev,
        [name]: {
          status: 'error',
          success: false,
          data: null,
          error: error.message
        }
      }));
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});
    
    const tests = [
      { name: 'Blogs API', url: 'http://localhost:5000/api/blogs' },
      { name: 'Products API', url: 'http://localhost:5000/api/products' },
      { name: 'Cards API', url: 'http://localhost:5000/api/cards/popular' },
      { name: 'Banners API', url: 'http://localhost:5000/api/banners' },
      { name: 'Health Check', url: 'http://localhost:5000/health' }
    ];

    for (const test of tests) {
      await testApi(test.name, test.url);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }
    
    setLoading(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      <button 
        onClick={runAllTests}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Tests'}
      </button>

      <div className="space-y-4">
        {Object.entries(results).map(([name, result]: [string, any]) => (
          <div key={name} className="border rounded p-4">
            <h3 className="font-semibold text-lg mb-2">{name}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.status}
                </span>
              </div>
              
              {result.error ? (
                <div className="bg-red-50 p-3 rounded">
                  <span className="font-medium text-red-800">Error:</span>
                  <p className="text-red-700 mt-1">{result.error}</p>
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded">
                  <span className="font-medium text-green-800">Success:</span>
                  <pre className="text-green-700 mt-1 text-sm overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiTest;