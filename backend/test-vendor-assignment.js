const mongoose = require('mongoose');
const SupportTicket = require('./models/SupportTicket');
const Vendor = require('./models/Vendor');
const Admin = require('./models/Admin');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixifly', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testVendorAssignment() {
  try {
    console.log('Testing vendor assignment system...');
    
    // Find a vendor
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
    
    // Find a support ticket
    const ticket = await SupportTicket.findOne({ assignedTo: null });
    if (!ticket) {
      console.log('No unassigned support ticket found');
      return;
    }
    
    console.log('Found ticket:', {
      id: ticket.ticketId,
      subject: ticket.subject,
      status: ticket.status,
      currentAssignedTo: ticket.assignedTo
    });
    
    // Test assignment
    console.log('Testing assignment...');
    await ticket.assignVendor(vendor._id, admin._id, 'Test assignment');
    
    console.log('Assignment successful!');
    console.log('Updated ticket:', {
      id: ticket.ticketId,
      assignedTo: ticket.assignedTo,
      vendorStatus: ticket.vendorStatus,
      assignedAt: ticket.assignedAt,
      assignedBy: ticket.assignedBy
    });
    
    // Test vendor fetch
    console.log('Testing vendor fetch...');
    const vendorTickets = await SupportTicket.find({ assignedTo: vendor._id });
    console.log('Vendor tickets found:', vendorTickets.length);
    
    vendorTickets.forEach(t => {
      console.log('- Ticket:', t.ticketId, 'Status:', t.vendorStatus);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testVendorAssignment();
