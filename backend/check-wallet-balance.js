const mongoose = require('mongoose');
const VendorWallet = require('./models/VendorWallet');

async function checkWallet() {
  try {
    await mongoose.connect('mongodb+srv://ajay761:ajay%401102@cluster0.okjqrni.mongodb.net/FixFly');
    
    // Find all vendor wallets
    const wallets = await VendorWallet.find({});
    console.log('Found wallets:', wallets.length);
    wallets.forEach(w => {
      console.log('Vendor ID:', w.vendorId, 'Balance:', w.currentBalance);
    });
    
    // Find vendor wallet with correct ID
    const wallet = await VendorWallet.findOne({ vendorId: '541' });
    if (wallet) {
      console.log('Current wallet balance:', wallet.currentBalance);
      console.log('Total earnings:', wallet.totalEarnings);
      console.log('Recent transactions:');
      wallet.transactions.slice(-5).forEach(t => {
        console.log('-', t.type, t.amount, t.description, t.caseId, t.billingAmount, t.gstAmount);
      });
    } else {
      console.log('Wallet not found for vendor 541');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWallet();
