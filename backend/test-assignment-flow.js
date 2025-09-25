const axios = require('axios');

// Test vendor assignment flow
async function testVendorAssignment() {
  try {
    console.log('Testing vendor assignment flow...');
    
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const adminLoginResponse = await axios.post(`${API_BASE_URL}/admin/login`, {
      email: 'admin@fixifly.com',
      password: 'admin123'
    });
    
    const adminToken = adminLoginResponse.data.token;
    console.log('Admin logged in successfully');
    
    // Step 2: Get all support tickets
    console.log('Step 2: Fetching support tickets...');
    const ticketsResponse = await axios.get(`${API_BASE_URL}/support-tickets/admin/all`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const tickets = ticketsResponse.data.data.tickets;
    console.log(`Found ${tickets.length} support tickets`);
    
    // Step 3: Get vendors
    console.log('Step 3: Fetching vendors...');
    const vendorsResponse = await axios.get(`${API_BASE_URL}/admin/vendors`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const vendors = vendorsResponse.data.data.vendors;
    console.log(`Found ${vendors.length} vendors`);
    
    if (tickets.length === 0 || vendors.length === 0) {
      console.log('No tickets or vendors found for testing');
      return;
    }
    
    // Step 4: Assign vendor to first ticket
    const ticket = tickets[0];
    const vendor = vendors[0];
    
    console.log('Step 4: Assigning vendor to ticket...');
    console.log('Ticket:', ticket.id, ticket.subject);
    console.log('Vendor:', vendor._id, `${vendor.firstName} ${vendor.lastName}`);
    
    const assignmentResponse = await axios.put(`${API_BASE_URL}/support-tickets/admin/${ticket.id}`, {
      assignedTo: vendor._id,
      scheduledDate: new Date().toISOString(),
      scheduledTime: '10:00 AM',
      scheduleNotes: 'Test assignment'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Assignment response:', assignmentResponse.data);
    
    if (assignmentResponse.data.success) {
      console.log('✅ Vendor assigned successfully!');
      
      // Step 5: Login as vendor and check assigned tickets
      console.log('Step 5: Logging in as vendor...');
      const vendorLoginResponse = await axios.post(`${API_BASE_URL}/vendor/login`, {
        email: vendor.email,
        password: 'vendor123' // Default password
      });
      
      const vendorToken = vendorLoginResponse.data.token;
      console.log('Vendor logged in successfully');
      
      // Step 6: Check vendor's assigned tickets
      console.log('Step 6: Checking vendor assigned tickets...');
      const vendorTicketsResponse = await axios.get(`${API_BASE_URL}/support-tickets/vendor/assigned`, {
        headers: {
          'Authorization': `Bearer ${vendorToken}`
        }
      });
      
      const vendorTickets = vendorTicketsResponse.data.data.tickets;
      console.log(`Vendor has ${vendorTickets.length} assigned tickets`);
      
      if (vendorTickets.length > 0) {
        console.log('✅ Vendor can see assigned tickets!');
        vendorTickets.forEach(t => {
          console.log(`- Ticket: ${t.id}, Status: ${t.vendorStatus}`);
        });
      } else {
        console.log('❌ Vendor cannot see assigned tickets');
      }
      
    } else {
      console.log('❌ Assignment failed:', assignmentResponse.data.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testVendorAssignment();
