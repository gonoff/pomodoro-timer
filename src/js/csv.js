export default class CSVManager {
  constructor() {
    this.schedule = {
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      tasks: [],
      currentTaskIndex: 0
    };
  }

  async importCSV() {
    try {
      const result = await window.electronAPI.selectCSVFile();
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const csvData = result.content;
      return this.parseCSV(csvData);
    } catch (error) {
      console.error('Error importing CSV:', error);
      return { success: false, error: error.message };
    }
  }

  parseCSV(csvContent) {
    try {
      // Reset the schedule
      this.schedule = {
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        tasks: [],
        currentTaskIndex: 0
      };

      // Split by lines and clean up
      const lines = csvContent
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (lines.length < 3) {
        throw new Error('Invalid CSV format. Need at least a starting time line, header line, and one task.');
      }
      
      // Parse the starting time from the first line
      const startTimeMatch = lines[0].match(/Starting Time,(\d+:\d+)/i);
      if (startTimeMatch && startTimeMatch[1]) {
        this.schedule.startTime = startTimeMatch[1];
      }

      // Skip the header lines
      const dataLines = lines.slice(2); // Skip "Starting Time" and header row
      
      let currentTime = this.parseTime(this.schedule.startTime);
      
      // Parse each task line
      for (const line of dataLines) {
        // Skip empty lines
        if (!line.trim()) continue;
        
        const [name, durationStr] = this.splitCSVLine(line);
        
        if (!name || !durationStr) {
          console.warn('Invalid line in CSV:', line);
          continue;
        }
        
        const duration = parseInt(durationStr, 10);
        if (isNaN(duration) || duration <= 0) {
          console.warn('Invalid duration in CSV:', durationStr);
          continue;
        }
        
        const startTime = this.formatTime(currentTime);
        
        // Calculate end time by adding the duration (in minutes)
        const endTime = new Date(currentTime);
        endTime.setMinutes(endTime.getMinutes() + duration);
        
        // Check for priority in the task name (e.g. "[High] Task name")
        let priority = 'medium';
        let taskName = name.trim();
        
        const priorityMatch = taskName.match(/^\[(high|medium|low)\]\s+(.*)/i);
        if (priorityMatch) {
          priority = priorityMatch[1].toLowerCase();
          taskName = priorityMatch[2].trim();
        }
        
        this.schedule.tasks.push({
          name: taskName,
          duration,
          completed: false,
          startTime,
          endTime: this.formatTime(endTime),
          priority: priority
        });
        
        // Add break time (5 minutes by default) unless it's the last task
        if (dataLines.indexOf(line) < dataLines.length - 1) {
          currentTime = new Date(endTime);
          currentTime.setMinutes(currentTime.getMinutes() + 5); // 5-minute break
        } else {
          currentTime = endTime;
        }
      }
      
      // If no tasks were added, throw an error
      if (this.schedule.tasks.length === 0) {
        throw new Error('No valid tasks found in the CSV file.');
      }
      
      return { success: true, schedule: this.schedule };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return { success: false, error: error.message || 'Unknown parsing error' };
    }
  }

  // Enhanced CSV line splitter to handle quoted values and different delimiters
  splitCSVLine(line) {
    // Check if the line contains quotes
    if (line.includes('"')) {
      const result = [];
      let inQuotes = false;
      let currentValue = '';
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      result.push(currentValue);
      return result;
    } else {
      // Simple split for basic CSV format
      return line.split(',');
    }
  }

  // Helper to parse time string into Date object
  parseTime(timeStr) {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('Invalid time format:', timeStr);
        // Default to 9 AM
        return new Date(new Date().setHours(9, 0, 0, 0));
      }
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      console.error('Error parsing time:', error);
      // Default to 9 AM
      return new Date(new Date().setHours(9, 0, 0, 0));
    }
  }

  // Helper to format Date object to time string
  formatTime(date) {
    try {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '00:00';
    }
  }

  getSchedule() {
    return { ...this.schedule };
  }
  
  // Get total focus time from schedule
  getTotalFocusTime() {
    return this.schedule.tasks.reduce((total, task) => total + task.duration, 0);
  }
  
  // Get completed focus time from schedule
  getCompletedFocusTime() {
    return this.schedule.tasks
      .filter(task => task.completed)
      .reduce((total, task) => total + task.duration, 0);
  }
}