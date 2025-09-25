const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');
const Vendor = require('./models/Vendor');
const Admin = require('./models/Admin');

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://ajay761:ajay%401102@cluster0.okjqrni.mongodb.net/FixFly', {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
});

async function assignVendorToTicket() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    
    // Wait for connection
    await new Promise((resolve) => {
      mongoose.connection.once('open', () => {
        console.log('Connected to MongoDB Atlas');
        resolve();
      });
    });
    
    console.log('Assigning vendor to ticket TK000001...');
    
    // Find the specific ticket
    const ticket = await SupportTicket.findOne({ ticketId: 'TK000001' });
    if (!ticket) {
      console.log('Ticket TK000001 not found');
      return;
    }
    
    console.log('Found ticket:', {
      id: ticket.ticketId,
      subject: ticket.subject,
      currentAssignedTo: ticket.assignedTo,
      vendorStatus: ticket.vendorStatus
    });
    
    // Find an active vendor
    const vendor = await Vendor.findOne({ isActive: true });
    if (!vendor) {
      console.log('No active vendor found');
      return;
    }
    
    console.log('Found vendor:', {
      id: vendor._id,
      name: `${vendor.firstName} ${vendor.lastName}`,
      email: vendor.email
    });
    
    // Find an admin
    const admin = await Admin.findOne();
    if (!admin) {
      console.log('No admin found');
      return;
    }
    
    console.log('Found admin:', {
      id: admin._id,
      name: admin.name,
      email: admin.email
    });
    
    // Assign vendor to ticket
    console.log('Assigning vendor to ticket...');
    await ticket.assignVendor(vendor._id, admin._id, 'Manual assignment for testing');
    
    console.log('Assignment completed!');
    console.log('Updated ticket:', {
      id: ticket.ticketId,
      assignedTo: ticket.assignedTo,
      vendorStatus: ticket.vendorStatus,
      assignedAt: ticket.assignedAt,
      assignedBy: ticket.assignedBy
    });
    
    // Verify assignment
    const updatedTicket = await SupportTicket.findOne({ ticketId: 'TK000001' });
    console.log('Verification - Updated ticket:', {
      id: updatedTicket.ticketId,
      assignedTo: updatedTicket.assignedTo,
      vendorStatus: updatedTicket.vendorStatus,
      assignedAt: updatedTicket.assignedAt
    });
    
    // Check if vendor can see the ticket
    const vendorTickets = await SupportTicket.find({ assignedTo: vendor._id });
    console.log(`Vendor ${vendor.firstName} ${vendor.lastName} now has ${vendorTickets.length} assigned tickets:`);
    vendorTickets.forEach(t => {
      console.log(`- ${t.ticketId}: ${t.subject} (Status: ${t.vendorStatus})`);
    });
    
  } catch (error) {
    console.error('Assignment failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

assignVendorToTicket();
