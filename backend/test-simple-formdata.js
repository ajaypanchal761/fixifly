const express = require('express');
const multer = require('multer');

const app = express();

// Simple multer setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  }
}).fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'serviceImages', maxCount: 9 }
]);

app.post('/test', upload, (req, res) => {
  console.log('=== Simple FormData Test ===');
  console.log('Body keys:', Object.keys(req.body));
  console.log('Has productData:', !!req.body.productData);
  console.log('productData value:', req.body.productData);
  console.log('Files:', req.files);
  console.log('============================');
  
  res.json({
    success: true,
    bodyKeys: Object.keys(req.body),
    hasProductData: !!req.body.productData,
    productData: req.body.productData
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
  console.log('Test with: curl -X POST -F "productData={\"test\":\"data\"}" http://localhost:3002/test');
});
