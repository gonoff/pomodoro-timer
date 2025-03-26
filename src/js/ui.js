import WellnessPrompts from './wellness.js';

export default class UIManager {
  constructor() {
    // Tab navigation elements
    this.timerTab = document.getElementById('timerTab');
    this.scheduleTab = document.getElementById('scheduleTab');
    this.settingsTab = document.getElementById('settingsTab');
    
    this.timerTabBtn = document.getElementById('timerTabBtn');
    this.scheduleTabBtn = document.getElementById('scheduleTabBtn');
    this.settingsTabBtn = document.getElementById('settingsTabBtn');
    
    // Timer elements
    this.taskNameEl = document.getElementById('taskName');
    this.sessionTypeEl = document.getElementById('sessionType');
    this.timerDisplayEl = document.getElementById('timerDisplay');
    this.timerProgressCircle = document.getElementById('timerProgressCircle');
    
    this.startBtn = document.getElementById('startBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.skipBtn = document.getElementById('skipBtn');
    
    // Schedule elements
    this.importBtn = document.getElementById('importBtn');
    this.scheduleList = document.getElementById('scheduleList');
    
    // Settings elements
    this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    // Theme toggle
    this.themeToggle = document.getElementById('themeToggle');
    
    // Notifications
    this.notification = document.getElementById('notification');
    this.notificationIcon = document.getElementById('notificationIcon');
    this.notificationMessage = document.getElementById('notificationMessage');
    
    // Productivity stats
    this.sessionsCompletedValue = document.getElementById('sessionsCompletedValue');
    this.focusTimeValue = document.getElementById('focusTimeValue');
    this.tasksCompletedValue = document.getElementById('tasksCompletedValue');
    this.progressBar = document.getElementById('progressBar');
    
    // Sounds
    this.workCompleteSound = document.getElementById('workCompleteSound');
    this.breakCompleteSound = document.getElementById('breakCompleteSound');
    this.buttonClickSound = document.getElementById('buttonClickSound');
    
    // Wellness prompts
    this.wellnessPrompt = document.getElementById('wellnessPrompt');
    this.wellnessManager = new WellnessPrompts();
    
    // Initial stats
    this.stats = {
      sessionsCompleted: 0,
      focusTimeMinutes: 0,
      tasksCompleted: 0,
      dailyGoalMinutes: 120 // Default goal: 2 hours of focus time
    };
    
    this.setupTabNavigation();
    this.setupThemeToggle();
    this.setupButtonSounds();
  }
  
  // Show a wellness prompt during breaks
  showWellnessPrompt() {
    if (!this.wellnessPrompt) return;
    
    // Get a random wellness prompt
    const prompt = this.wellnessManager.getRandomPromptAny();
    
    // Create content with a category icon
    let icon = '';
    switch (prompt.category) {
      case 'stretch': icon = '🧘‍♀️'; break;
      case 'eyes': icon = '👁️'; break;
      case 'breathing': icon = '🫁'; break;
      case 'hydration': icon = '💧'; break;
      case 'posture': icon = '🪑'; break;
      default: icon = '💪';
    }
    
    this.wellnessPrompt.innerHTML = `
      <div class="wellness-prompt-content">
        <span class="wellness-icon">${icon}</span>
        <span>${prompt.text}</span>
      </div>
    `;
    
    // Reset classes and add the category class
    this.wellnessPrompt.className = 'wellness-prompt';
    this.wellnessPrompt.classList.add(prompt.category);
    
    // Show the prompt with a slight delay for animation
    setTimeout(() => {
      this.wellnessPrompt.classList.add('show');
    }, 300);
  }
  
  // Hide the wellness prompt
  hideWellnessPrompt() {
    if (!this.wellnessPrompt) return;
    this.wellnessPrompt.classList.remove('show');
  }

  setupTabNavigation() {
    this.timerTabBtn.addEventListener('click', () => {
      this.playButtonSound();
      this.showTab('timer');
    });
    
    this.scheduleTabBtn.addEventListener('click', () => {
      this.playButtonSound();
      this.showTab('schedule');
    });
    
    this.settingsTabBtn.addEventListener('click', () => {
      this.playButtonSound();
      this.showTab('settings');
    });
  }
  
  setupThemeToggle() {
    // Check if there is a saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);
    
    // Update toggle button state
    if (savedTheme === 'light') {
      this.themeToggle.classList.add('active');
      this.themeToggle.querySelector('.material-icons-round').textContent = 'light_mode';
    }
    
    this.themeToggle.addEventListener('click', () => {
      this.playButtonSound();
      this.themeToggle.classList.toggle('active');
      
      // Toggle theme
      const newTheme = this.themeToggle.classList.contains('active') ? 'light' : 'dark';
      this.setTheme(newTheme);
      
      // Animation for theme toggle icon
      this.themeToggle.querySelector('.material-icons-round').textContent = 
        newTheme === 'light' ? 'light_mode' : 'dark_mode';
      
      this.showCustomNotification(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme activated`, 'settings', false);
    });
  }
  
  // Set theme on document and save preference
  setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }
  
  setupButtonSounds() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('click', () => this.playButtonSound());
    });
  }
  
  playButtonSound() {
    if (this.buttonClickSound) {
      this.buttonClickSound.currentTime = 0;
      this.buttonClickSound.play().catch(error => console.error('Error playing sound:', error));
    }
  }

  showTab(tabName) {
    // First, remove active class to reset
    this.timerTab.classList.remove('active');
    this.scheduleTab.classList.remove('active');
    this.settingsTab.classList.remove('active');
    
    this.timerTabBtn.classList.remove('active');
    this.scheduleTabBtn.classList.remove('active');
    this.settingsTabBtn.classList.remove('active');
    
    // Add a small delay before showing the new tab for a smooth transition
    setTimeout(() => {
      // Show selected tab
      switch (tabName) {
        case 'timer':
          this.timerTab.classList.add('active');
          this.timerTabBtn.classList.add('active');
          break;
        case 'schedule':
          this.scheduleTab.classList.add('active');
          this.scheduleTabBtn.classList.add('active');
          break;
        case 'settings':
          this.settingsTab.classList.add('active');
          this.settingsTabBtn.classList.add('active');
          break;
      }
    }, 50);
  }

  // Update timer display with circular progress
  updateTimerDisplay(time, isWorkSession, currentTask, totalSeconds = null, elapsedSeconds = null) {
    // Note: Wellness prompts are managed by session transitions, not timer updates
    // Update the timer text
    this.timerDisplayEl.textContent = time;
    
    // Apply the appropriate styling based on session type
    if (isWorkSession) {
      this.sessionTypeEl.textContent = 'Work Session';
      this.sessionTypeEl.className = 'session-indicator work';
      this.taskNameEl.textContent = currentTask ? currentTask.name : 'Work Time';
      this.timerDisplayEl.className = 'timer work';
    } else {
      this.sessionTypeEl.textContent = 'Break Time';
      this.sessionTypeEl.className = 'session-indicator break';
      this.taskNameEl.textContent = 'Take a break';
      this.timerDisplayEl.className = 'timer break';
    }
    
    // Update circular progress indicator if we have the total and elapsed seconds
    if (totalSeconds !== null && elapsedSeconds !== null) {
      const progress = (elapsedSeconds / totalSeconds) * 100;
      const progressColor = isWorkSession ? 'var(--primary)' : 'var(--break)';
      this.timerProgressCircle.style.background = 
        `conic-gradient(${progressColor} ${progress}%, transparent ${progress}%)`;
      
      // Add pulsing animation when timer is active
      if (elapsedSeconds > 0 && elapsedSeconds < totalSeconds) {
        this.timerDisplayEl.classList.add('active-timer');
      } else {
        this.timerDisplayEl.classList.remove('active-timer');
      }
    }
  }

  // Timer button states with improved visual feedback
  updateTimerControls(isRunning, isPaused) {
    if (isRunning) {
      this.startBtn.disabled = !isPaused;
      this.pauseBtn.disabled = isPaused;
      this.resetBtn.disabled = false;
      
      // Change button appearance based on state
      if (isPaused) {
        this.startBtn.classList.add('primary');
        this.pauseBtn.classList.remove('primary');
      } else {
        this.startBtn.classList.remove('primary');
        this.pauseBtn.classList.add('primary');
      }
    } else {
      this.startBtn.disabled = false;
      this.pauseBtn.disabled = true;
      this.resetBtn.disabled = true;
      
      // Reset button styles
      this.startBtn.classList.add('primary');
      this.pauseBtn.classList.remove('primary');
    }
  }

  // Render schedule list with animations
  renderSchedule(schedule) {
    if (!schedule || !schedule.tasks || schedule.tasks.length === 0) {
      this.scheduleList.innerHTML = `
        <p class="empty-state">No tasks added yet. Add a task above or import a schedule.</p>
      `;
      return;
    }
    
    let html = '';
    
    for (let i = 0; i < schedule.tasks.length; i++) {
      const task = schedule.tasks[i];
      const isActive = i === schedule.currentTaskIndex;
      const isCompleted = task.completed;
      
      // Get task priority (default to medium if not specified)
      const priority = task.priority || 'medium';
      
      html += `
        <div class="task-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" 
             data-index="${i}"
             style="animation-delay: ${i * 0.05}s; animation: fadeIn 0.3s ease forwards;">
          <span class="task-duration">${task.duration} min</span>
          <h3><span class="task-priority ${priority}"></span>${task.name}</h3>
          <div class="task-time">${task.startTime} - ${task.endTime}</div>
          <div class="task-actions">
            <button class="task-action-btn task-edit-btn" title="Edit Task" data-index="${i}">
              <span class="material-icons-round">edit</span>
            </button>
            <button class="task-action-btn task-delete-btn" title="Delete Task" data-index="${i}">
              <span class="material-icons-round">delete</span>
            </button>
            <button class="task-action-btn task-move-up-btn" title="Move Up" data-index="${i}" ${i === 0 ? 'disabled' : ''}>
              <span class="material-icons-round">arrow_upward</span>
            </button>
            <button class="task-action-btn task-move-down-btn" title="Move Down" data-index="${i}" ${i === schedule.tasks.length - 1 ? 'disabled' : ''}>
              <span class="material-icons-round">arrow_downward</span>
            </button>
          </div>
        </div>
      `;
    }
    
    this.scheduleList.innerHTML = html;
    
    // Add event listeners to the task action buttons
    this.setupTaskActionButtons();
    
    // Update progress bar
    this.updateProgressFromSchedule(schedule);
  }

  // Set up event listeners for task action buttons
  setupTaskActionButtons() {
    // Edit task buttons
    const editButtons = this.scheduleList.querySelectorAll('.task-edit-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(button.dataset.index, 10);
        this.editTask(index);
      });
    });
    
    // Delete task buttons
    const deleteButtons = this.scheduleList.querySelectorAll('.task-delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(button.dataset.index, 10);
        this.deleteTask(index);
      });
    });
    
    // Move Up buttons
    const moveUpButtons = this.scheduleList.querySelectorAll('.task-move-up-btn');
    moveUpButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(button.dataset.index, 10);
        if (index > 0) {
          this.moveTask(index, index - 1);
        }
      });
    });
    
    // Move Down buttons
    const moveDownButtons = this.scheduleList.querySelectorAll('.task-move-down-btn');
    moveDownButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(button.dataset.index, 10);
        this.moveTask(index, index + 1);
      });
    });
  }
  
  // Edit a task (show edit form)
  editTask(index) {
    document.dispatchEvent(new CustomEvent('edit-task', { detail: { index } }));
  }
  
  // Delete a task
  deleteTask(index) {
    if (confirm('Are you sure you want to delete this task?')) {
      document.dispatchEvent(new CustomEvent('delete-task', { detail: { index } }));
    }
  }
  
  // Move a task
  moveTask(oldIndex, newIndex) {
    document.dispatchEvent(new CustomEvent('move-task', { 
      detail: { oldIndex, newIndex } 
    }));
  }
  showCustomNotification(message, icon = 'info', isError = false) {
    this.notificationMessage.textContent = message;
    this.notificationIcon.textContent = icon;
    
    this.notification.className = 'notification';
    if (isError) {
      this.notification.classList.add('error');
    } else {
      this.notification.classList.add('success');
    }
    
    // Show the notification
    this.notification.classList.add('show');
    
    // Hide it after 3 seconds
    setTimeout(() => {
      this.notification.classList.remove('show');
    }, 3000);
  }
  
  // Backwards compatibility for existing code
  showNotification(message, isError = false) {
    const icon = isError ? 'error' : 'check_circle';
    this.showCustomNotification(message, icon, isError);
  }

  // Update productivity stats
  updateStats(sessionCompleted = false, focusMinutes = 0, taskCompleted = false) {
    if (sessionCompleted) {
      this.stats.sessionsCompleted++;
    }
    
    if (focusMinutes > 0) {
      this.stats.focusTimeMinutes += focusMinutes;
    }
    
    if (taskCompleted) {
      this.stats.tasksCompleted++;
    }
    
    // Update the UI
    this.sessionsCompletedValue.textContent = this.stats.sessionsCompleted;
    
    // Format focus time
    const hours = Math.floor(this.stats.focusTimeMinutes / 60);
    const mins = this.stats.focusTimeMinutes % 60;
    this.focusTimeValue.textContent = hours > 0 ? 
      `${hours}h ${mins}m` : 
      `${mins}m`;
    
    this.tasksCompletedValue.textContent = this.stats.tasksCompleted;
    
    // Update progress bar
    const progressPercentage = Math.min(
      (this.stats.focusTimeMinutes / this.stats.dailyGoalMinutes) * 100, 
      100
    );
    this.progressBar.style.width = `${progressPercentage}%`;
    
    // Add celebration animation if daily goal reached
    if (progressPercentage >= 100) {
      this.celebrateGoalReached();
    }
  }

  // Calculate progress based on completed tasks in the schedule
  updateProgressFromSchedule(schedule) {
    if (!schedule || !schedule.tasks || schedule.tasks.length === 0) {
      return;
    }
    
    // Calculate total work minutes and completed work minutes
    let totalMinutes = 0;
    let completedMinutes = 0;
    
    schedule.tasks.forEach(task => {
      totalMinutes += task.duration;
      if (task.completed) {
        completedMinutes += task.duration;
      }
    });
    
    // Update daily goal based on schedule
    this.stats.dailyGoalMinutes = totalMinutes;
    
    // Calculate progress percentage
    const progressPercentage = totalMinutes > 0 ? 
      (completedMinutes / totalMinutes) * 100 : 0;
    
    // Update progress bar
    this.progressBar.style.width = `${progressPercentage}%`;
    
    // Update stats
    this.stats.focusTimeMinutes = completedMinutes;
    const hours = Math.floor(completedMinutes / 60);
    const mins = completedMinutes % 60;
    this.focusTimeValue.textContent = hours > 0 ? 
      `${hours}h ${mins}m` : 
      `${mins}m`;
  }

  // Celebration animation when daily goal is reached
  celebrateGoalReached() {
    // We could add confetti or a special notification here
    this.showCustomNotification('Daily goal reached! Great job! 🎉', 'emoji_events', false);
  }

  // Play sounds based on completion type
  playCompletionSound(isWorkSession) {
    if (isWorkSession) {
      // Work session completed
      if (this.workCompleteSound) {
        this.workCompleteSound.currentTime = 0;
        this.workCompleteSound.play().catch(error => console.error('Error playing sound:', error));
      }
    } else {
      // Break completed
      if (this.breakCompleteSound) {
        this.breakCompleteSound.currentTime = 0;
        this.breakCompleteSound.play().catch(error => console.error('Error playing sound:', error));
      }
    }
  }
}