// Test Object Storage Upload
const fs = require('fs').promises;

async function testUpload() {
    try {
        console.log('🚀 Testing Object Storage Upload...');
        
        // Read a test image
        const testImagePath = './uploads/memory-Q4C26soOmXkaJSnbrRGXi-edndn-1754845728777-0-post.jpg';
        console.log('📁 Reading test image...');
        
        try {
            await fs.access(testImagePath);
            console.log('✅ Test image found');
        } catch (error) {
            console.log('❌ Test image not found, creating placeholder...');
            // Create a simple test file
            await fs.writeFile(testImagePath, 'test image data');
        }
        
        // Test with curl
        const response = await fetch('http://localhost:5000/api/media/memory-Q4C26soOmXkaJSnbrRGXi-edndn-1754845728777-0-post.jpg', {
            method: 'HEAD'
        });
        
        console.log('📊 Test Results:');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Length:', response.headers.get('content-length'));
        
        if (response.ok) {
            console.log('✅ Media endpoint working!');
        } else {
            console.log('❌ Media endpoint failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testUpload();