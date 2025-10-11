// Simple test to demonstrate the new time slot logic
import { isTimeSlotAvailable, getAvailableTimeSlots } from './timeSlotUtils.js';

// Mock current time to be 1:30 PM (13:30)
const mockCurrentTime = new Date();
mockCurrentTime.setHours(13, 30, 0, 0); // 1:30 PM

console.log('=== Time Slot Availability Test ===');
console.log('Current Time:', mockCurrentTime.toLocaleTimeString());
console.log('Today Date:', mockCurrentTime.toISOString().split('T')[0]);
console.log('');

const timeSlots = [
  "9:00 AM - 11:00 AM",   // Should be disabled (too soon - only 1.5 hours away)
  "11:00 AM - 1:00 PM",   // Should be disabled (too soon - only 0.5 hours away)  
  "1:00 PM - 3:00 PM",    // Should be disabled (too soon - starts in 0.5 hours)
  "3:00 PM - 5:00 PM",    // Should be available (starts in 1.5 hours)
  "5:00 PM - 7:00 PM",    // Should be available (starts in 3.5 hours)
  "7:00 PM - 9:00 PM"     // Should be available (starts in 5.5 hours)
];

const today = mockCurrentTime.toISOString().split('T')[0];

console.log('Time Slot Availability:');
timeSlots.forEach(slot => {
  const isAvailable = isTimeSlotAvailable(slot, today);
  console.log(`${slot}: ${isAvailable ? '✅ Available' : '❌ Too Soon'}`);
});

console.log('');
console.log('Available Slots Array:');
const availableSlots = getAvailableTimeSlots(timeSlots, today);
availableSlots.forEach(slot => {
  console.log(`${slot.label}: ${slot.disabled ? 'Disabled' : 'Available'}`);
});


