/**
 * Utility functions for time slot management
 */

export interface TimeSlot {
  value: string;
  label: string;
  startTime: string; // Format: "HH:MM"
  endTime: string;   // Format: "HH:MM"
}

/**
 * Check if a time slot is available (at least 2 hours after current time)
 * @param timeSlot - The time slot to check
 * @param selectedDate - The selected date (YYYY-MM-DD format)
 * @returns true if the time slot is available, false otherwise
 */
export const isTimeSlotAvailable = (timeSlot: string, selectedDate: string): boolean => {
  const today = new Date();
  const selected = new Date(selectedDate);
  
  // If the selected date is not today, the slot is available
  if (selected.toDateString() !== today.toDateString()) {
    return true;
  }
  
  // Get current time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Parse time slot to get start time
  const startTime = parseTimeSlot(timeSlot);
  if (!startTime) {
    return false;
  }
  
  // Calculate time difference in minutes
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const slotTimeInMinutes = startTime.hour * 60 + startTime.minute;
  
  // Check if slot is at least 2 hours (120 minutes) after current time
  const timeDifference = slotTimeInMinutes - currentTimeInMinutes;
  
  return timeDifference >= 120; // 2 hours = 120 minutes
};

/**
 * Parse time slot string to extract start time
 * @param timeSlot - Time slot string (e.g., "9:00 AM - 11:00 AM", "morning")
 * @returns Object with hour and minute, or null if parsing fails
 */
const parseTimeSlot = (timeSlot: string): { hour: number; minute: number } | null => {
  // Handle different time slot formats
  
  // Format: "9:00 AM - 11:00 AM"
  if (timeSlot.includes(' - ')) {
    const startTime = timeSlot.split(' - ')[0];
    return parseTimeString(startTime);
  }
  
  // Format: "morning", "afternoon", "evening"
  switch (timeSlot.toLowerCase()) {
    case 'morning':
      return { hour: 9, minute: 0 };
    case 'afternoon':
      return { hour: 12, minute: 0 };
    case 'evening':
      return { hour: 17, minute: 0 };
    default:
      return null;
  }
};

/**
 * Parse time string to hour and minute
 * @param timeString - Time string (e.g., "9:00 AM", "2:30 PM")
 * @returns Object with hour and minute, or null if parsing fails
 */
const parseTimeString = (timeString: string): { hour: number; minute: number } | null => {
  const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) {
    return null;
  }
  
  let hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return { hour, minute };
};

/**
 * Get available time slots with disabled state for unavailable slots
 * @param timeSlots - Array of time slot strings
 * @param selectedDate - Selected date (YYYY-MM-DD format)
 * @returns Array of time slots with disabled property
 */
export const getAvailableTimeSlots = (timeSlots: string[], selectedDate: string) => {
  return timeSlots.map(slot => ({
    value: slot,
    label: slot,
    disabled: !isTimeSlotAvailable(slot, selectedDate)
  }));
};

/**
 * Get time slot display text with disabled indicator
 * @param timeSlot - Time slot string
 * @param isDisabled - Whether the slot is disabled
 * @returns Formatted display text
 */
export const getTimeSlotDisplayText = (timeSlot: string, isDisabled: boolean): string => {
  if (isDisabled) {
    return `${timeSlot} (Too Soon)`;
  }
  return timeSlot;
};
