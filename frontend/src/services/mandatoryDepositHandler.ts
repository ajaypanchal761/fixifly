// Mandatory Deposit Handler - Direct Fix
// This file handles the mandatory deposit requirement for vendors

export const handleMandatoryDepositError = (error: any) => {
  console.log('🔍 Checking for mandatory deposit error:', error);
  
  // Check if it's a mandatory deposit error
  if (error?.response?.data?.error === 'MANDATORY_DEPOSIT_REQUIRED' || 
      error?.message?.includes('Mandatory deposit')) {
    
    console.log('🚨🚨🚨 MANDATORY DEPOSIT ERROR DETECTED 🚨🚨🚨');
    alert('🚨 MANDATORY DEPOSIT REQUIRED 🚨\n\n₹2000 deposit needed to accept tasks.\n\nPlease make a deposit first in your earnings page.');
    
    return {
      success: false,
      error: 'MANDATORY_DEPOSIT_REQUIRED',
      message: 'Mandatory deposit of ₹2000 required to accept tasks',
      isMandatoryDepositError: true
    };
  }
  
  return null; // Not a mandatory deposit error
};

// Override the fetch function temporarily to catch mandatory deposit errors
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    
    // Check if it's a mandatory deposit error response
    if (response.status === 400) {
      const clonedResponse = response.clone();
      try {
        const data = await clonedResponse.json();
        if (data.error === 'MANDATORY_DEPOSIT_REQUIRED') {
          console.log('🚨🚨🚨 MANDATORY DEPOSIT ERROR DETECTED IN FETCH 🚨🚨🚨');
          alert('🚨 MANDATORY DEPOSIT REQUIRED 🚨\n\n₹2000 deposit needed to accept tasks.\n\nPlease make a deposit first in your earnings page.');
          
          // Return a successful response to prevent error handling
          return new Response(JSON.stringify({
            success: false,
            error: 'MANDATORY_DEPOSIT_REQUIRED',
            message: 'Mandatory deposit of ₹2000 required to accept tasks',
            isMandatoryDepositError: true
          }), {
            status: 200,
            statusText: 'OK',
            headers: response.headers
          });
        }
      } catch (e) {
        // If JSON parsing fails, continue with original response
      }
    }
    
    return response;
  } catch (error) {
    // If it's a network error (Failed to fetch), re-throw it properly
    // Don't try to fetch again as it will fail again
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw error; // Re-throw network errors
    }
    // For other errors, try original fetch
    return originalFetch(...args);
  }
};
