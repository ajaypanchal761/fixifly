const express = require('express');
const multer = require('multer');

// Simple test server to debug FormData
const app = express();

// Don't use express.json() for this test
// app.use(express.json());

// Test multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10
  }
}).fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'serviceImages', maxCount: 9 }
]);

app.post('/test-upload', upload, (req, res) => {
  console.log('=== FormData Debug ===');
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body));
  console.log('Body productData:', req.body.productData);
  console.log('Files:', req.files);
  console.log('========================');
  
  res.json({
    success: true,
    bodyKeys: Object.keys(req.body),
    hasProductData: !!req.body.productData,
    filesCount: req.files ? Object.keys(req.files).length : 0
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log('Test with: curl -X POST -F "productData={\"test\":\"data\"}" -F "productImage=@test.jpg" http://localhost:3001/test-upload');
});
