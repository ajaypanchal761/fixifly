const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugTicketData() {
  try {
    console.log('🔧 Debugging ticket TK000004 data...');
    
    // Get the ticket
    const ticket = await SupportTicket.findOne({ ticketId: 'TK000004' });
    if (!ticket) {
      console.log('❌ Ticket not found');
      return;
    }
    
    console.log('📋 Ticket Completion Data:');
    console.log(JSON.stringify(ticket.completionData, null, 2));
    
    console.log('\n🔍 Direct Property Access:');
    console.log('billingAmount:', ticket.completionData.billingAmount);
    console.log('totalAmount:', ticket.completionData.totalAmount);
    console.log('spareParts:', ticket.completionData.spareParts);
    console.log('travelingAmount:', ticket.completionData.travelingAmount);
    
    // Try to set billing amount directly
    console.log('\n🔧 Setting billing amount directly...');
    ticket.completionData.billingAmount = 700;
    await ticket.save();
    
    // Verify the change
    const updatedTicket = await SupportTicket.findOne({ ticketId: 'TK000004' });
    console.log('Updated billingAmount:', updatedTicket.completionData.billingAmount);
    
  } catch (error) {
    console.error('❌ Error debugging ticket data:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the debug
debugTicketData();
