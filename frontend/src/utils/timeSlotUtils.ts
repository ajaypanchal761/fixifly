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
 * Check if a time slot is available (slot start time should be after current time)
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
  
  // Check if slot start time is after current time
  const timeDifference = slotTimeInMinutes - currentTimeInMinutes;
  
  // Slot is available if it starts at least 1 hour (60 minutes) after current time
  // Example: If current time is 4:00 PM, slots starting from 5:00 PM onwards will be available
  // This ensures users have enough time to complete booking and vendor can prepare
  return timeDifference >= 60; // 1 hour = 60 minutes buffer
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
 * Get available time slots - only returns slots that are available (filters out past slots)
 * @param timeSlots - Array of time slot strings
 * @param selectedDate - Selected date (YYYY-MM-DD format)
 * @returns Array of time slots with disabled property (only available slots are returned)
 */
export const getAvailableTimeSlots = (timeSlots: string[], selectedDate: string) => {
  // Filter out slots that are not available (past slots)
  const availableSlots = timeSlots.filter(slot => isTimeSlotAvailable(slot, selectedDate));
  
  // Return only available slots (all enabled)
  return availableSlots.map(slot => ({
    value: slot,
    label: slot,
    disabled: false
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

/**
 * Format hour and minute to 12-hour format with AM/PM
 * @param hour - Hour in 24-hour format (0-23)
 * @param minute - Minute (0-59)
 * @returns Formatted time string (e.g., "5:00 PM")
 */
const formatTime12Hour = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
};

/**
 * Generate dynamic time slots for entire day (24 hours) starting from morning
 * For today: shows slots from current time + 1 hour onwards
 * For future dates: shows slots from 9 AM onwards
 * @param selectedDate - Selected date (YYYY-MM-DD format)
 * @param slotDurationHours - Duration of each slot in hours (default: 2)
 * @param maxSlots - Maximum number of slots to generate (default: 12 for full day)
 * @returns Array of dynamically generated time slot strings
 */
export const generateDynamicTimeSlots = (
  selectedDate: string,
  slotDurationHours: number = 2,
  maxSlots: number = 12
): string[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0); // Normalize to start of day
  
  const now = new Date();
  
  const slots: string[] = [];
  
  // Compare dates properly (ignoring time)
  const isToday = selected.getTime() === today.getTime();
  
  // If selected date is not today, start from 9:00 AM and show slots for entire day
  if (!isToday) {
    let startHour = 9;
    let slotCount = 0;
    
    // Generate slots from 9 AM to 9 PM (12 hours = 6 slots of 2 hours each)
    while (slotCount < maxSlots && startHour + slotDurationHours <= 21) {
      const startTime = formatTime12Hour(startHour, 0);
      const endHour = startHour + slotDurationHours;
      const endTime = formatTime12Hour(endHour, 0);
      slots.push(`${startTime} - ${endTime}`);
      startHour += slotDurationHours;
      slotCount++;
    }
    
    return slots;
  }
  
  // For today's date, generate slots starting from current time + 1 hour
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Calculate minimum start time (current time + 1 hour, rounded to next hour)
  let minStartHour = currentHour + 1;
  let minStartMinute = 0;
  
  // If current minute is > 0, round up to next hour
  if (currentMinute > 0) {
    minStartHour += 1;
  }
  
  // Handle hour overflow
  if (minStartHour >= 24) {
    // If it's already late (past 11 PM), return empty slots
    return [];
  }
  
  // Ensure we don't start too late (max 10 PM start for 2-hour slots)
  const maxStartHour = 22 - slotDurationHours;
  if (minStartHour > maxStartHour) {
    // If it's already late, return empty slots
    return [];
  }
  
  // Start generating slots directly from minimum start time (current time + 1 hour, rounded up)
  let startHour = minStartHour;
  let startMinute = 0;
  let slotCount = 0;
  
  // Generate slots for entire day (from start hour to 9 PM)
  while (slotCount < maxSlots && startHour + slotDurationHours <= 21) {
    // Calculate end time for this slot
    let endHour = startHour + slotDurationHours;
    let endMinute = startMinute;
    
    const startTime = formatTime12Hour(startHour, startMinute);
    const endTime = formatTime12Hour(endHour, endMinute);
    slots.push(`${startTime} - ${endTime}`);
    slotCount++;
    
    // Move to next slot (2 hours later)
    startHour += slotDurationHours;
  }
  
  return slots;
};
