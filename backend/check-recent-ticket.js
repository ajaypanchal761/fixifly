const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');
const Vendor = require('./models/Vendor');
const VendorWallet = require('./models/VendorWallet');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkRecentTicket() {
  try {
    console.log('🔧 Checking recent support ticket...');
    
    // Find the most recent support ticket for vendor 541
    const vendor = await Vendor.findOne({ vendorId: '541' });
    if (!vendor) {
      console.log('❌ Vendor not found');
      return;
    }
    
    console.log('Vendor:', {
      _id: vendor._id,
      vendorId: vendor.vendorId,
      firstName: vendor.firstName,
      lastName: vendor.lastName
    });
    
    // Find support tickets for this vendor
    const tickets = await SupportTicket.find({
      assignedTo: vendor._id
    }).sort({ updatedAt: -1 }).limit(5);
    
    console.log(`\n📋 Found ${tickets.length} tickets for vendor ${vendor.vendorId}:`);
    
    tickets.forEach((ticket, index) => {
      console.log(`\n${index + 1}. Ticket: ${ticket.ticketId}`);
      console.log(`   Subject: ${ticket.subject}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Payment Status: ${ticket.paymentStatus}`);
      console.log(`   Payment Method: ${ticket.paymentMode}`);
      console.log(`   Vendor Status: ${ticket.vendorStatus}`);
      console.log(`   Completion Data:`, ticket.completionData ? 'Present' : 'Missing');
      
      if (ticket.completionData) {
        console.log(`   Billing Amount: ₹${ticket.completionData.billingAmount || 'undefined'}`);
        console.log(`   Total Amount: ₹${ticket.completionData.totalAmount || 0}`);
        console.log(`   Spare Parts: ${ticket.completionData.spareParts?.length || 0} items`);
        console.log(`   Travel Amount: ₹${ticket.completionData.travelingAmount || ticket.completionData.travellingAmount || 0}`);
      }
      
      console.log(`   Created: ${ticket.createdAt}`);
      console.log(`   Updated: ${ticket.updatedAt}`);
    });
    
    // Check vendor wallet
    const vendorWallet = await VendorWallet.findOne({ vendorId: vendor.vendorId });
    if (vendorWallet) {
      console.log('\n💰 Vendor Wallet Status:');
      console.log(`  Current Balance: ₹${vendorWallet.currentBalance}`);
      console.log(`  Total Earnings: ₹${vendorWallet.totalEarnings}`);
      console.log(`  Total Transactions: ${vendorWallet.transactions.length}`);
      
      console.log('\n📋 Recent Transactions:');
      vendorWallet.transactions.slice(-3).forEach((tx, index) => {
        console.log(`  ${index + 1}. ${tx.type} - ₹${tx.amount} (${tx.description}) - ${tx.caseId || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking recent ticket:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the check
checkRecentTicket();
