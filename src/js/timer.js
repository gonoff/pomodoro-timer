export default class PomodoroTimer {
  constructor(settings) {
    this.settings = settings;
    this.timerInterval = null;
    this.seconds = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.currentTaskIndex = 0;
    this.isWorkSession = true;
    this.tasks = [];
    this.sessions = {
      completed: 0,
      totalFocusTime: 0
    };
    this.totalSeconds = 0; // For progress tracking
    this.elapsedSeconds = 0; // For progress tracking
    this.callbacks = {
      onTick: () => {},
      onComplete: () => {},
      onProgress: () => {} // New callback for progress updates
    };
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  setTasks(tasks) {
    this.tasks = tasks;
    this.currentTaskIndex = 0;
    this.isWorkSession = true;
    this.resetTimer();
    
    // Auto-start next task if enabled
    if (this.settings.autoStartNextTask) {
      // Short timeout to allow UI to update first
      setTimeout(() => this.start(), 500);
    }
  }

  getCurrentTask() {
    return this.tasks[this.currentTaskIndex] || null;
  }

  getNextTask() {
    return this.tasks[this.currentTaskIndex + 1] || null;
  }

  updateSettings(settings) {
    this.settings = settings;
  }

  resetTimer() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.isPaused = false;
    
    // Set duration based on current session type and task
    if (this.isWorkSession) {
      // For work sessions
      if (this.tasks.length > 0) {
        // If tasks exist, use task duration
        const currentTask = this.getCurrentTask();
        this.seconds = (currentTask?.duration || this.settings.defaultWorkDuration) * 60;
      } else {
        // No tasks, use default work duration
        this.seconds = this.settings.defaultWorkDuration * 60;
      }
    } else {
      // For break sessions
      // Calculate if this should be a long break
      const isLongBreak = 
        this.settings.longBreakInterval > 0 && 
        (this.currentTaskIndex + 1) % this.settings.longBreakInterval === 0;
      
      this.seconds = isLongBreak 
        ? this.settings.longBreakDuration * 60 
        : this.settings.breakDuration * 60;
    }
    
    this.totalSeconds = this.seconds;
    this.elapsedSeconds = 0;
    
    // Call the callback with timer information
    this.callbacks.onTick(
      this.formatTime(), 
      this.isWorkSession, 
      this.getCurrentTask(),
      this.totalSeconds,
      this.elapsedSeconds
    );
  }

  start() {
    if (this.isRunning && !this.isPaused) return;
    
    if (this.isPaused) {
      this.isPaused = false;
    } else {
      this.isRunning = true;
    }
    
    const startTime = Date.now() - ((this.totalSeconds - this.seconds) * 1000);
    
    this.timerInterval = setInterval(() => {
      this.seconds--;
      this.elapsedSeconds = this.totalSeconds - this.seconds;
      
      // Update progress calculation
      const progress = (this.elapsedSeconds / this.totalSeconds) * 100;
      this.callbacks.onProgress?.(progress, this.isWorkSession);
      
      if (this.seconds <= 0) {
        this.completeSession();
      } else {
        this.callbacks.onTick(
          this.formatTime(), 
          this.isWorkSession, 
          this.getCurrentTask(),
          this.totalSeconds,
          this.elapsedSeconds
        );
      }
    }, 1000);
  }

  pause() {
    if (!this.isRunning) return;
    
    clearInterval(this.timerInterval);
    this.isPaused = true;
  }

  reset() {
    this.resetTimer();
  }

  skipToNext() {
    this.completeSession();
  }

  completeSession() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    
    // Calculate focus time for this session
    const sessionMinutes = Math.round(this.totalSeconds / 60);
    
    // Update sessions stats if this was a work session
    if (this.isWorkSession) {
      this.sessions.completed++;
      this.sessions.totalFocusTime += sessionMinutes;
      
      // Update task status
      if (this.tasks.length > 0) {
        const currentTask = this.getCurrentTask();
        if (currentTask) {
          currentTask.completed = true;
        }
      }
    }
    
    // Play sound alert if enabled
    if (this.settings.soundEnabled) {
      // Use the callback to play the appropriate sound
      this.callbacks.onComplete?.(this.isWorkSession, this.getCurrentTask(), sessionMinutes, true);
    } else {
      // Still call the callback but don't play sound
      this.callbacks.onComplete?.(this.isWorkSession, this.getCurrentTask(), sessionMinutes, false);
    }
    
    // Toggle between work and break sessions
    if (this.isWorkSession) {
      // Work session completed
      this.isWorkSession = false;
    } else {
      // Break session completed
      this.isWorkSession = true;
      if (this.currentTaskIndex < this.tasks.length - 1) {
        this.currentTaskIndex++;
      }
    }
    
    this.resetTimer();
    
    // Auto-start next task if enabled
    if (this.settings.autoStartNextTask) {
      // Short timeout to allow UI to update first
      setTimeout(() => this.start(), 1000);
    }
  }

  formatTime() {
    const minutes = Math.floor(this.seconds / 60);
    const seconds = this.seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  getSessionStats() {
    return { ...this.sessions };
  }
}