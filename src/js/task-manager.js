export default class TaskManager {
  constructor() {
    this.schedule = {
      date: new Date().toISOString().split('T')[0],
      startTime: "09:00",
      tasks: [],
      currentTaskIndex: 0
    };
    
    // Load tasks if they exist
    this.loadTasks();
  }

  // TASK MANAGEMENT METHODS
  
  // Add a new task to the schedule
  addTask(name, duration, priority = 'medium') {
    if (!name || !duration) {
      return { success: false, error: 'Task name and duration are required' };
    }
    
    if (isNaN(duration) || duration <= 0) {
      return { success: false, error: 'Duration must be a positive number' };
    }
    
    try {
      // Calculate start and end times based on existing tasks
      let startTime;
      if (this.schedule.tasks.length === 0) {
        // First task starts at schedule start time
        startTime = this.parseTime(this.schedule.startTime);
      } else {
        // Subsequent tasks start after the previous task plus break
        const lastTask = this.schedule.tasks[this.schedule.tasks.length - 1];
        const lastEndTime = this.parseTime(lastTask.endTime);
        startTime = new Date(lastEndTime);
        startTime.setMinutes(startTime.getMinutes() + 5); // 5-minute break
      }
      
      // Calculate end time
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + parseInt(duration, 10));
      
      // Create new task
      const newTask = {
        name: name.trim(),
        duration: parseInt(duration, 10),
        completed: false,
        startTime: this.formatTime(startTime),
        endTime: this.formatTime(endTime),
        priority: priority
      };
      
      // Add the task to our schedule
      this.schedule.tasks.push(newTask);
      
      // Save tasks
      this.saveTasks();
      
      return { success: true, schedule: this.schedule };
    } catch (error) {
      console.error('Error adding task:', error);
      return { success: false, error: error.message || 'Failed to add task' };
    }
  }
  
  // Delete a task at the specified index
  deleteTask(index) {
    if (index < 0 || index >= this.schedule.tasks.length) {
      return { success: false, error: 'Invalid task index' };
    }
    
    try {
      // Remove the task
      this.schedule.tasks.splice(index, 1);
      
      // Recalculate times for subsequent tasks
      this.recalculateTaskTimes();
      
      // If we deleted the current task, adjust the index
      if (index === this.schedule.currentTaskIndex && this.schedule.currentTaskIndex > 0) {
        this.schedule.currentTaskIndex--;
      }
      
      // Save tasks
      this.saveTasks();
      
      return { success: true, schedule: this.schedule };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message || 'Failed to delete task' };
    }
  }
  
  // Update a task at the specified index
  updateTask(index, updatedTask) {
    if (index < 0 || index >= this.schedule.tasks.length) {
      return { success: false, error: 'Invalid task index' };
    }
    
    if (!updatedTask.name || !updatedTask.duration) {
      return { success: false, error: 'Task name and duration are required' };
    }
    
    try {
      // Update the task
      this.schedule.tasks[index] = {
        ...this.schedule.tasks[index],
        name: updatedTask.name.trim(),
        duration: parseInt(updatedTask.duration, 10),
        priority: updatedTask.priority || 'medium'
      };
      
      // Recalculate times for this and subsequent tasks
      this.recalculateTaskTimes();
      
      // Save tasks
      this.saveTasks();
      
      return { success: true, schedule: this.schedule };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: error.message || 'Failed to update task' };
    }
  }
  
  // Move a task up or down in the list
  reorderTasks(oldIndex, newIndex) {
    if (
      oldIndex < 0 || 
      oldIndex >= this.schedule.tasks.length ||
      newIndex < 0 ||
      newIndex >= this.schedule.tasks.length
    ) {
      return { success: false, error: 'Invalid task index' };
    }
    
    try {
      // Remove the task from its original position
      const task = this.schedule.tasks.splice(oldIndex, 1)[0];
      
      // Insert it at the new position
      this.schedule.tasks.splice(newIndex, 0, task);
      
      // Recalculate times
      this.recalculateTaskTimes();
      
      // Adjust current task index if needed
      if (oldIndex === this.schedule.currentTaskIndex) {
        this.schedule.currentTaskIndex = newIndex;
      } else if (
        oldIndex < this.schedule.currentTaskIndex && 
        newIndex >= this.schedule.currentTaskIndex
      ) {
        this.schedule.currentTaskIndex--;
      } else if (
        oldIndex > this.schedule.currentTaskIndex && 
        newIndex <= this.schedule.currentTaskIndex
      ) {
        this.schedule.currentTaskIndex++;
      }
      
      // Save tasks
      this.saveTasks();
      
      return { success: true, schedule: this.schedule };
    } catch (error) {
      console.error('Error reordering tasks:', error);
      return { success: false, error: error.message || 'Failed to reorder tasks' };
    }
  }
  
  // Recalculate start and end times for all tasks
  recalculateTaskTimes() {
    if (this.schedule.tasks.length === 0) return;
    
    let currentTime = this.parseTime(this.schedule.startTime);
    
    for (let i = 0; i < this.schedule.tasks.length; i++) {
      const task = this.schedule.tasks[i];
      
      // Set start time
      task.startTime = this.formatTime(currentTime);
      
      // Calculate end time
      const endTime = new Date(currentTime);
      endTime.setMinutes(endTime.getMinutes() + task.duration);
      task.endTime = this.formatTime(endTime);
      
      // Update current time for next task (add break except after last task)
      if (i < this.schedule.tasks.length - 1) {
        currentTime = new Date(endTime);
        currentTime.setMinutes(currentTime.getMinutes() + 5); // 5-minute break
      } else {
        currentTime = endTime;
      }
    }
  }
  
  // Set the starting time for the schedule
  setStartTime(startTime) {
    try {
      // Validate time format
      const time = this.parseTime(startTime);
      if (!time) throw new Error('Invalid time format');
      
      // Update schedule start time
      this.schedule.startTime = startTime;
      
      // Recalculate all task times
      this.recalculateTaskTimes();
      
      // Save tasks
      this.saveTasks();
      
      return { success: true, schedule: this.schedule };
    } catch (error) {
      console.error('Error setting start time:', error);
      return { success: false, error: error.message || 'Failed to set start time' };
    }
  }
  
  // Clear all tasks
  clearTasks() {
    try {
      this.schedule.tasks = [];
      this.schedule.currentTaskIndex = 0;
      
      // Save empty task list
      this.saveTasks();
      
      return { success: true, schedule: this.schedule };
    } catch (error) {
      console.error('Error clearing tasks:', error);
      return { success: false, error: error.message || 'Failed to clear tasks' };
    }
  }
  
  // PERSISTENCE METHODS
  
  // Save tasks to localStorage
  async saveTasks() {
    try {
      // First try to use Electron IPC if available
      if (window.electronAPI && window.electronAPI.saveTasks) {
        const result = await window.electronAPI.saveTasks(this.schedule);
        return result;
      }
      
      // Fallback to localStorage
      localStorage.setItem('pomodoroSchedule', JSON.stringify(this.schedule));
      return { success: true };
    } catch (error) {
      console.error('Error saving tasks:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Load tasks from localStorage
  async loadTasks() {
    try {
      // First try to use Electron IPC if available
      if (window.electronAPI && window.electronAPI.loadTasks) {
        const result = await window.electronAPI.loadTasks();
        if (result.success && result.schedule) {
          this.schedule = result.schedule;
          return { success: true, schedule: this.schedule };
        }
      }
      
      // Fallback to localStorage
      const savedSchedule = localStorage.getItem('pomodoroSchedule');
      if (savedSchedule) {
        this.schedule = JSON.parse(savedSchedule);
        return { success: true, schedule: this.schedule };
      }
      
      return { success: false, error: 'No saved schedule found' };
    } catch (error) {
      console.error('Error loading tasks:', error);
      return { success: false, error: error.message };
    }
  }
  
  // IMPORT/EXPORT METHODS
  
  // Import from CSV file (keep original function for backward compatibility)
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
  
  // Export schedule to CSV
  exportToCSV() {
    try {
      // Create CSV content
      let csvContent = `Starting Time,${this.schedule.startTime}\n`;
      csvContent += 'Task Name,Duration (minutes)\n';
      
      // Add each task
      this.schedule.tasks.forEach(task => {
        const taskName = task.priority !== 'medium' ? 
          `[${task.priority}] ${task.name}` : 
          task.name;
        csvContent += `${taskName},${task.duration}\n`;
      });
      
      return { success: true, content: csvContent };
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      return { success: false, error: error.message };
    }
  }

  // Parse CSV content (keep original function for backward compatibility)
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
      
      // Save the imported tasks
      this.saveTasks();
      
      return { success: true, schedule: this.schedule };
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return { success: false, error: error.message || 'Unknown parsing error' };
    }
  }

  // HELPER METHODS
  
  // Split CSV line and handle quoted values
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

  // Parse time string into Date object
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

  // Format Date object to time string
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

  // Get schedule
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