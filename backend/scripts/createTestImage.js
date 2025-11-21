const fs = require('fs');
const path = require('path');

// Create a simple 1x1 pixel PNG image
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, // width: 1
  0x00, 0x00, 0x00, 0x01, // height: 1
  0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
  0x90, 0x77, 0x53, 0xDE, // CRC
  0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
  0x49, 0x44, 0x41, 0x54, // IDAT
  0x08, 0x1D, 0x01, 0x0D, 0x00, 0xF2, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, // compressed data
  0x00, 0x00, 0x00, 0x00, // CRC
  0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
]);

// Write to file
const testImagePath = path.join(__dirname, 'test-image.png');
fs.writeFileSync(testImagePath, pngData);

console.log('✅ Test image created at:', testImagePath);
console.log('📊 Image size:', pngData.length, 'bytes');

// Test if the file is valid
try {
  const readData = fs.readFileSync(testImagePath);
  console.log('✅ Image file is readable');
  console.log('📊 Read size:', readData.length, 'bytes');
  console.log('📊 Files match:', Buffer.compare(pngData, readData) === 0);
} catch (error) {
  console.error('❌ Error reading image file:', error.message);
}
