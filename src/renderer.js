import PomodoroTimer from './js/timer.js';
import SettingsManager from './js/settings.js';
import TaskManager from './js/task-manager.js';
import UIManager from './js/ui.js';

class App {
  constructor() {
    this.settingsManager = new SettingsManager();
    this.ui = new UIManager();
    this.taskManager = new TaskManager();
    
    this.init();
  }

  async init() {
    // Load settings first
    const settings = await this.settingsManager.loadSettings();
    this.settingsManager.updateSettingsForm();
    
    // Initialize timer with settings
    this.timer = new PomodoroTimer(settings);
    
    // Set up timer callbacks
    this.timer.setCallbacks({
      onTick: (time, isWorkSession, currentTask, totalSeconds, elapsedSeconds) => {
        this.ui.updateTimerDisplay(time, isWorkSession, currentTask, totalSeconds, elapsedSeconds);
      },
      onComplete: (isWorkSession, currentTask, focusMinutes, playSound) => {
        this.ui.updateTimerControls(false, false);
        
        // Update stats
        if (isWorkSession) {
          // Work session completed
          this.ui.updateStats(true, focusMinutes, true);
          
          // Show wellness prompt when starting a break
          this.ui.showWellnessPrompt();
        } else {
          // Hide wellness prompt when break ends
          this.ui.hideWellnessPrompt();
        }
        
        // Update schedule display
        this.ui.renderSchedule(this.taskManager.getSchedule());
        
        // Play completion sound if enabled
        if (playSound) {
          this.ui.playCompletionSound(isWorkSession);
        }
        
        // Show notification
        const message = isWorkSession 
          ? `Great work! Time for a break.`
          : 'Break time is over. Ready to focus!';
        
        const icon = isWorkSession ? 'task_alt' : 'psychology';
        this.ui.showCustomNotification(message, icon);
      },
      onProgress: (progress, isWorkSession) => {
        // We can use this callback for future enhancements
      }
    });
    
    // Load any saved schedule
    const loadResult = await this.taskManager.loadTasks();
    if (loadResult.success) {
      this.ui.renderSchedule(loadResult.schedule);
      this.timer.setTasks(loadResult.schedule.tasks);
    }
    
    // Initialize UI with default timer values
    this.ui.updateTimerDisplay(
      this.timer.formatTime(), 
      true, 
      null, 
      this.timer.totalSeconds, 
      this.timer.elapsedSeconds
    );
    this.ui.updateTimerControls(false, false);
    
    this.setupEventListeners();
    
    // Show welcome notification after a short delay
    setTimeout(() => {
      this.ui.showCustomNotification('Welcome to Pomodoro Focus! Ready to be productive?', 'psychology');
    }, 1500);
  }

  setupEventListeners() {
    // Timer controls
    document.getElementById('startBtn').addEventListener('click', () => {
      this.timer.start();
      this.ui.updateTimerControls(true, false);
    });
    
    document.getElementById('pauseBtn').addEventListener('click', () => {
      this.timer.pause();
      this.ui.updateTimerControls(true, true);
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.timer.reset();
      this.ui.updateTimerControls(false, false);
    });
    
    document.getElementById('skipBtn').addEventListener('click', () => {
      this.timer.skipToNext();
      this.ui.updateTimerControls(false, false);
    });
    
    // Import/Export/Clear
    document.getElementById('importBtn').addEventListener('click', async () => {
      const result = await this.taskManager.importCSV();
      
      if (result.success) {
        this.ui.renderSchedule(result.schedule);
        this.timer.setTasks(result.schedule.tasks);
        
        // Calculate total work time for daily goal
        let totalWorkMinutes = 0;
        result.schedule.tasks.forEach(task => {
          totalWorkMinutes += task.duration;
        });
        
        // Update notification message based on schedule length
        let message = 'Schedule imported successfully!';
        if (result.schedule.tasks.length > 0) {
          const hours = Math.floor(totalWorkMinutes / 60);
          const mins = totalWorkMinutes % 60;
          const timeStr = hours > 0 ? 
            `${hours}h ${mins}m` : 
            `${mins}m`;
          
          message += ` ${result.schedule.tasks.length} tasks planned for ${timeStr}.`;
        }
        
        this.ui.showCustomNotification(message, 'event_available');
      } else {
        this.ui.showCustomNotification(`Failed to import: ${result.error}`, 'error', true);
      }
    });
    
    document.getElementById('exportBtn').addEventListener('click', async () => {
      const result = this.taskManager.exportToCSV();
      
      if (result.success) {
        const exportResult = await window.electronAPI.exportTasksToCSV(result.content);
        
        if (exportResult.success) {
          this.ui.showCustomNotification('Schedule exported successfully!', 'save', false);
        } else {
          this.ui.showCustomNotification(`Failed to export: ${exportResult.error}`, 'error', true);
        }
      } else {
        this.ui.showCustomNotification(`Failed to generate CSV: ${result.error}`, 'error', true);
      }
    });
    
    document.getElementById('clearScheduleBtn').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all tasks? This cannot be undone.')) {
        const result = this.taskManager.clearTasks();
        
        if (result.success) {
          this.ui.renderSchedule(result.schedule);
          this.timer.setTasks([]);
          this.ui.showCustomNotification('Schedule cleared successfully!', 'delete', false);
        } else {
          this.ui.showCustomNotification(`Failed to clear schedule: ${result.error}`, 'error', true);
        }
      }
    });
    
    // Task form
    document.getElementById('scheduleStartTime').addEventListener('change', (e) => {
      const startTime = e.target.value;
      const result = this.taskManager.setStartTime(startTime);
      
      if (result.success) {
        this.ui.renderSchedule(result.schedule);
        this.timer.setTasks(result.schedule.tasks);
      } else {
        this.ui.showCustomNotification(`Failed to set start time: ${result.error}`, 'error', true);
      }
    });
    
    // Listen for task action events
    document.addEventListener('delete-task', (e) => {
      const { index } = e.detail;
      const result = this.taskManager.deleteTask(index);
      
      if (result.success) {
        this.ui.renderSchedule(result.schedule);
        this.timer.setTasks(result.schedule.tasks);
        this.ui.showCustomNotification('Task deleted successfully!', 'delete', false);
      } else {
        this.ui.showCustomNotification(`Failed to delete task: ${result.error}`, 'error', true);
      }
    });
    
    document.addEventListener('edit-task', (e) => {
      const { index } = e.detail;
      const task = this.taskManager.getSchedule().tasks[index];
      
      if (!task) {
        this.ui.showCustomNotification('Task not found!', 'error', true);
        return;
      }
      
      // Fill the form with task details
      document.getElementById('taskNameInput').value = task.name;
      document.getElementById('taskDurationInput').value = task.duration;
      document.getElementById('taskPrioritySelect').value = task.priority || 'medium';
      
      // Add a temporary update button
      const addTaskBtn = document.getElementById('addTaskBtn');
      addTaskBtn.textContent = 'Update Task';
      addTaskBtn.classList.add('secondary');
      
      // Store the task index for update
      addTaskBtn.dataset.editIndex = index;
      
      // Scroll to the form
      document.querySelector('.task-form-container').scrollIntoView({ behavior: 'smooth' });
    });
    
    document.addEventListener('move-task', (e) => {
      const { oldIndex, newIndex } = e.detail;
      const result = this.taskManager.reorderTasks(oldIndex, newIndex);
      
      if (result.success) {
        this.ui.renderSchedule(result.schedule);
        this.timer.setTasks(result.schedule.tasks);
      } else {
        this.ui.showCustomNotification(`Failed to move task: ${result.error}`, 'error', true);
      }
    });
    
    document.getElementById('addTaskBtn').addEventListener('click', (e) => {
      const nameInput = document.getElementById('taskNameInput');
      const durationInput = document.getElementById('taskDurationInput');
      const prioritySelect = document.getElementById('taskPrioritySelect');
      const addTaskBtn = e.target.closest('#addTaskBtn');
      
      const name = nameInput.value.trim();
      const duration = parseInt(durationInput.value, 10);
      const priority = prioritySelect.value;
      
      if (!name) {
        this.ui.showCustomNotification('Task name is required!', 'error', true);
        nameInput.focus();
        return;
      }
      
      if (isNaN(duration) || duration <= 0) {
        this.ui.showCustomNotification('Duration must be a positive number!', 'error', true);
        durationInput.focus();
        return;
      }
      
      let result;
      
      // Check if we're in edit mode
      if (addTaskBtn.dataset.editIndex) {
        const index = parseInt(addTaskBtn.dataset.editIndex, 10);
        const updatedTask = { name, duration, priority };
        result = this.taskManager.updateTask(index, updatedTask);
        
        // Reset button
        addTaskBtn.textContent = 'Add Task';
        addTaskBtn.classList.remove('secondary');
        delete addTaskBtn.dataset.editIndex;
      } else {
        // Add new task
        result = this.taskManager.addTask(name, duration, priority);
      }
      
      if (result.success) {
        // Clear the form
        nameInput.value = '';
        durationInput.value = '25';
        prioritySelect.value = 'medium';
        
        // Update UI
        this.ui.renderSchedule(result.schedule);
        this.timer.setTasks(result.schedule.tasks);
        
        // Focus back on the name input for quick entry of multiple tasks
        nameInput.focus();
        
        const message = addTaskBtn.dataset.editIndex ? 'Task updated successfully!' : 'Task added successfully!';
        this.ui.showCustomNotification(message, 'add_task', false);
      } else {
        this.ui.showCustomNotification(`Failed to ${addTaskBtn.dataset.editIndex ? 'update' : 'add'} task: ${result.error}`, 'error', true);
      }
    });
    
    // Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
      const newSettings = this.settingsManager.getSettingsFromForm();
      const success = await this.settingsManager.saveSettings(newSettings);
      
      if (success) {
        this.timer.updateSettings(newSettings);
        this.ui.showCustomNotification('Settings saved successfully!', 'settings');
        this.ui.showTab('timer');
      } else {
        this.ui.showCustomNotification('Failed to save settings.', 'error', true);
      }
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Space bar - Start/Pause
      if (e.code === 'Space' && this.ui.timerTab.classList.contains('active')) {
        e.preventDefault(); // Prevent page scroll
        
        if (this.timer.isRunning && !this.timer.isPaused) {
          this.timer.pause();
          this.ui.updateTimerControls(true, true);
        } else if (this.timer.isPaused || !this.timer.isRunning) {
          this.timer.start();
          this.ui.updateTimerControls(true, false);
        }
      }
      
      // Escape - Reset timer
      if (e.code === 'Escape' && this.ui.timerTab.classList.contains('active')) {
        if (this.timer.isRunning) {
          this.timer.reset();
          this.ui.updateTimerControls(false, false);
        }
      }
    });
  }
}

// Add confetti effect for celebrations
function createConfetti() {
  const confettiCount = 100;
  const container = document.querySelector('body');
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.animationDelay = Math.random() * 3 + 's';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    
    container.appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}

// Confetti styling for celebrations
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
  .confetti {
    position: fixed;
    width: 10px;
    height: 10px;
    background-color: #f00;
    top: -10px;
    z-index: 1000;
    animation: fall 5s linear forwards;
    pointer-events: none;
  }
  
  @keyframes fall {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }
`;
document.head.appendChild(confettiStyle);

// Add to window for access from UI callbacks
window.createConfetti = createConfetti;

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});