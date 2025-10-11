import React, { useState } from 'react';
import { getAvailableTimeSlots, getTimeSlotDisplayText } from '@/utils/timeSlotUtils';

const TimeSlotDemo = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const timeSlots = [
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM", 
    "1:00 PM - 3:00 PM",
    "3:00 PM - 5:00 PM",
    "5:00 PM - 7:00 PM",
    "7:00 PM - 9:00 PM"
  ];

  const availableSlots = getAvailableTimeSlots(timeSlots, selectedDate);

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Time Slot Demo</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Available Time Slots:</label>
        <div className="space-y-2">
          {availableSlots.map((slot) => (
            <div
              key={slot.value}
              className={`p-2 rounded border ${
                slot.disabled 
                  ? 'bg-gray-100 text-gray-400 border-gray-200' 
                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {getTimeSlotDisplayText(slot.label, slot.disabled)}
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Current Time:</strong> {new Date().toLocaleTimeString()}</p>
        <p><strong>Selected Date:</strong> {selectedDate}</p>
        <p className="mt-2">
          <em>Time slots less than 2 hours from now are disabled and marked with "(Too Soon)"</em>
        </p>
      </div>
    </div>
  );
};

export default TimeSlotDemo;
