const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');
const VendorWallet = require('./models/VendorWallet');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixTicketTK000004() {
  try {
    console.log('🔧 Fixing ticket TK000004...');
    
    // Get the ticket
    const ticket = await SupportTicket.findOne({ ticketId: 'TK000004' });
    if (!ticket) {
      console.log('❌ Ticket not found');
      return;
    }
    
    console.log('📋 Current Ticket Status:');
    console.log(`  Ticket ID: ${ticket.ticketId}`);
    console.log(`  Status: ${ticket.status}`);
    console.log(`  Payment Status: ${ticket.paymentStatus}`);
    console.log(`  Vendor Status: ${ticket.vendorStatus}`);
    console.log(`  Billing Amount: ₹${ticket.completionData?.billingAmount || 'undefined'}`);
    
    if (ticket.completionData) {
      // Calculate billing amount: Total - Spare - Travel
      const totalAmount = ticket.completionData.totalAmount || 0;
      const spareAmount = ticket.completionData.spareParts?.reduce((sum, part) => {
        return sum + (parseFloat(part.amount.replace(/[₹,]/g, '')) || 0);
      }, 0) || 0;
      const travelAmount = parseFloat(ticket.completionData.travelingAmount || ticket.completionData.travellingAmount || '0') || 0;
      
      const billingAmount = totalAmount - spareAmount - travelAmount;
      
      console.log('\n🧮 Billing Amount Calculation:');
      console.log(`  Total Amount: ₹${totalAmount}`);
      console.log(`  Spare Amount: ₹${spareAmount}`);
      console.log(`  Travel Amount: ₹${travelAmount}`);
      console.log(`  Calculated Billing Amount: ₹${billingAmount}`);
      
      // Update the completion data with the correct billing amount
      ticket.completionData.billingAmount = billingAmount;
      
      // Update ticket status to Resolved since payment is collected
      ticket.status = 'Resolved';
      ticket.resolvedAt = new Date();
      
      // Save the ticket
      await ticket.save();
      
      console.log('\n✅ Ticket Updated:');
      console.log(`  Billing Amount: ₹${ticket.completionData.billingAmount}`);
      console.log(`  Status: ${ticket.status}`);
      console.log(`  Resolved At: ${ticket.resolvedAt}`);
    }
    
    // Now credit the vendor wallet
    console.log('\n💰 Crediting Vendor Wallet...');
    
    const vendorWallet = await VendorWallet.findOne({ vendorId: ticket.assignedTo });
    if (!vendorWallet) {
      console.log('❌ Vendor wallet not found');
      return;
    }
    
    console.log('Current wallet balance:', vendorWallet.currentBalance);
    
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
    }
    
  } catch (error) {
    console.error('❌ Error fixing ticket TK000004:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixTicketTK000004();
