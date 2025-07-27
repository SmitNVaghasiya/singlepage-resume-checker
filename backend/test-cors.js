const https = require('https');

// Test CORS configuration
const testCors = async () => {
  const backendUrl = 'https://singlepage-resume-checker-backend.vercel.app';
  const frontendOrigin = 'https://singlepage-resume-checker.vercel.app';
  
  console.log('Testing CORS configuration...');
  console.log(`Backend URL: ${backendUrl}`);
  console.log(`Frontend Origin: ${frontendOrigin}`);
  
  // Test OPTIONS request (preflight)
  const optionsRequest = () => {
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'singlepage-resume-checker-backend.vercel.app',
        path: '/api/auth/login',
        method: 'OPTIONS',
        headers: {
          'Origin': frontendOrigin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      }, (res) => {
        console.log('\n=== OPTIONS Request (Preflight) ===');
        console.log(`Status: ${res.statusCode}`);
        console.log('CORS Headers:');
        console.log(`  Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
        console.log(`  Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods']}`);
        console.log(`  Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers']}`);
        console.log(`  Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials']}`);
        
        if (res.headers['access-control-allow-origin'] === frontendOrigin) {
          console.log('✅ CORS preflight successful!');
        } else {
          console.log('❌ CORS preflight failed!');
        }
        
        resolve();
      });
      
      req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
        reject(error);
      });
      
      req.end();
    });
  };
  
  // Test health endpoint
  const testHealth = () => {
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'singlepage-resume-checker-backend.vercel.app',
        path: '/api/health',
        method: 'GET',
        headers: {
          'Origin': frontendOrigin
        }
      }, (res) => {
        console.log('\n=== GET Request (Health Check) ===');
        console.log(`Status: ${res.statusCode}`);
        console.log('CORS Headers:');
        console.log(`  Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin']}`);
        console.log(`  Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials']}`);
        
        if (res.headers['access-control-allow-origin'] === frontendOrigin) {
          console.log('✅ CORS headers present!');
        } else {
          console.log('❌ CORS headers missing or incorrect!');
        }
        
        resolve();
      });
      
      req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
        reject(error);
      });
      
      req.end();
    });
  };
  
  try {
    await optionsRequest();
    await testHealth();
    console.log('\n🎉 CORS test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testCors(); 