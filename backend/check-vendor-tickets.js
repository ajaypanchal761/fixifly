const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');
const Vendor = require('./models/Vendor');

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://ajay761:ajay%401102@cluster0.okjqrni.mongodb.net/FixFly', {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
});

async function checkVendorTickets() {
  try {
    console.log('Checking vendor assigned tickets...');
    
    // Wait for connection
    await new Promise((resolve) => {
      mongoose.connection.once('open', () => {
        console.log('Connected to MongoDB Atlas');
        resolve();
      });
    });
    
    // Find vendor Krishna Panchal
    const vendor = await Vendor.findOne({ 
      firstName: 'Krishna',
      lastName: 'Panchal'
    });
    
    if (!vendor) {
      console.log('Vendor Krishna Panchal not found');
      return;
    }
    
    console.log('Found vendor:', {
      id: vendor._id,
      name: `${vendor.firstName} ${vendor.lastName}`,
      email: vendor.email
    });
    
    // Find all tickets assigned to this vendor
    const assignedTickets = await SupportTicket.find({ 
      assignedTo: vendor._id 
    });
    
    console.log(`\nVendor ${vendor.firstName} ${vendor.lastName} has ${assignedTickets.length} assigned tickets:`);
    
    assignedTickets.forEach((ticket, index) => {
      console.log(`\n${index + 1}. Ticket Details:`);
      console.log(`   - Ticket ID: ${ticket.ticketId}`);
      console.log(`   - Subject: ${ticket.subject}`);
      console.log(`   - Customer: ${ticket.userName}`);
      console.log(`   - Customer Email: ${ticket.userEmail}`);
      console.log(`   - Customer Phone: ${ticket.userPhone}`);
      console.log(`   - Status: ${ticket.status}`);
      console.log(`   - Priority: ${ticket.priority}`);
      console.log(`   - Vendor Status: ${ticket.vendorStatus}`);
      console.log(`   - Assigned At: ${ticket.assignedAt}`);
      console.log(`   - Assigned By: ${ticket.assignedBy}`);
      console.log(`   - Description: ${ticket.description}`);
      console.log(`   - Case ID: ${ticket.caseId}`);
    });
    
    // Check if TK000001 is in the list
    const tk000001 = assignedTickets.find(t => t.ticketId === 'TK000001');
    if (tk000001) {
      console.log('\n✅ Ticket TK000001 is properly assigned to vendor!');
      console.log('Vendor should be able to see this ticket in their dashboard.');
    } else {
      console.log('\n❌ Ticket TK000001 is NOT assigned to vendor!');
    }
    
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkVendorTickets();
