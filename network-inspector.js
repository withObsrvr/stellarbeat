// This script will intercept the subscription API request to log what data is actually being sent
// Copy and paste this into your browser console when you're on the subscription page
// Note: You'll need to enable "Preserve log" in the browser console to see the results

// Save the original fetch function
const originalFetch = window.fetch;

// Override fetch to log requests to the subscription endpoint
window.fetch = function(url, options) {
  if (url.includes('/subscription')) {
    console.log('🔍 Intercepted subscription request:');
    console.log('URL:', url);
    console.log('Method:', options?.method);
    console.log('Headers:', options?.headers);
    
    // Parse and display the request body
    if (options?.body) {
      try {
        const body = JSON.parse(options.body);
        console.log('Body:', body);
        
        // Analyze the format of eventSourceIds
        if (body.eventSourceIds) {
          console.log('EventSourceIds format:', body.eventSourceIds.map(item => {
            const type = typeof item;
            if (type === 'string') {
              return `String: ${item}`;
            } else if (type === 'object') {
              return `Object: ${JSON.stringify(item)}`;
            } else {
              return `Unknown (${type}): ${item}`;
            }
          }));
        }
      } catch (e) {
        console.log('Body (unparseable):', options.body);
      }
    }
    
    // Create a colored marker to make it easy to find this request
    console.log('%c 🔍 End of intercepted request 🔍', 'background: #4CAF50; color: white; padding: 2px 5px;');
  }
  
  // Call the original fetch function
  return originalFetch.apply(this, arguments).then(response => {
    // Only log if it's the subscription endpoint
    if (url.includes('/subscription')) {
      console.log('🔍 Intercepted subscription response:');
      console.log('Status:', response.status);
      
      // Clone the response so we can read the body without consuming it
      const clonedResponse = response.clone();
      
      // Return the original response after logging
      return clonedResponse.text().then(text => {
        try {
          const data = JSON.parse(text);
          console.log('Response data:', data);
        } catch (e) {
          console.log('Response text:', text);
        }
        console.log('%c 🔍 End of intercepted response 🔍', 'background: #2196F3; color: white; padding: 2px 5px;');
        
        return response;
      });
    }
    
    return response;
  });
};

console.log('%c Network inspector installed! Subscription API calls will be logged.', 
           'background: #4CAF50; color: white; font-weight: bold; padding: 5px;');