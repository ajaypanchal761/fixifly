const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');
const VendorWallet = require('./models/VendorWallet');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixTicketWallet() {
  try {
    console.log('🔧 Fixing ticket TK000004 wallet credit...');
    
    // Get the ticket
    const ticket = await SupportTicket.findOne({ ticketId: 'TK000004' });
    if (!ticket) {
      console.log('❌ Ticket not found');
      return;
    }
    
    console.log('📋 Ticket Details:');
    console.log(`  Ticket ID: ${ticket.ticketId}`);
    console.log(`  Assigned To: ${ticket.assignedTo}`);
    console.log(`  Status: ${ticket.status}`);
    console.log(`  Payment Status: ${ticket.paymentStatus}`);
    
    // Get vendor wallet using the assigned vendor ID
    const vendorWallet = await VendorWallet.findOne({ vendorId: ticket.assignedTo });
    if (!vendorWallet) {
      console.log('❌ Vendor wallet not found for vendor:', ticket.assignedTo);
      return;
    }
    
    console.log('\n💰 Current Wallet Status:');
    console.log(`  Current Balance: ₹${vendorWallet.currentBalance}`);
    console.log(`  Total Earnings: ₹${vendorWallet.totalEarnings}`);
    
    if (ticket.completionData) {
      const completionData = ticket.completionData;
      const billingAmount = parseFloat(completionData.billingAmount) || 0;
      const spareAmount = completionData.spareParts?.reduce((sum, part) => {
        return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
      }, 0) || 0;
      const travellingAmount = parseFloat(completionData.travelingAmount || completionData.travellingAmount || '0') || 0;
      
      console.log('\n📊 Earning Calculation:');
      console.log(`  Billing: ₹${billingAmount}, Spare: ₹${spareAmount}, Travel: ₹${travellingAmount}`);
      
      // Calculate expected earning: (Billing - Spare - Travel) * 50% + Spare + Travel
      const expectedEarning = (billingAmount - spareAmount - travellingAmount) * 0.5 + spareAmount + travellingAmount;
      console.log(`  Expected Vendor Earning: ₹${expectedEarning}`);
      
      // Add earning to wallet
      const earningResult = await vendorWallet.addEarning({
        caseId: ticket.ticketId,
        billingAmount,
        spareAmount,
        travellingAmount,
        bookingAmount: 0,
        paymentMethod: 'online',
        gstIncluded: completionData.includeGST || false,
        description: `Support ticket earning - ${ticket.ticketId}`
      });
      
      console.log('\n✅ Vendor Earning Added:');
      console.log(`  Earning Amount: ₹${earningResult.amount}`);
      console.log(`  Expected: ₹${expectedEarning}`);
      console.log(`  Match: ${earningResult.amount === expectedEarning ? '✅' : '❌'}`);
      
      // Check final wallet balance
      const updatedWallet = await VendorWallet.findOne({ vendorId: ticket.assignedTo });
      console.log('\n💰 Updated Wallet Status:');
      console.log(`  New Balance: ₹${updatedWallet.currentBalance}`);
      console.log(`  New Total Earnings: ₹${updatedWallet.totalEarnings}`);
      
      if (earningResult.amount === expectedEarning) {
        console.log('\n🎉 SUCCESS: Vendor earning has been credited!');
        console.log(`   Expected: ₹${expectedEarning}`);
        console.log(`   Actual: ₹${earningResult.amount}`);
      } else {
        console.log('\n❌ ERROR: Earning calculation mismatch!');
        console.log(`   Expected: ₹${expectedEarning}`);
        console.log(`   Actual: ₹${earningResult.amount}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing ticket wallet:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixTicketWallet();
