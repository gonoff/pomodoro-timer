export default class SettingsManager {
    constructor() {
      this.defaultSettings = {
        defaultWorkDuration: 25,
        breakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        soundEnabled: true,
        autoStartNextTask: true  // New setting for auto-start
      };
      
      this.settings = { ...this.defaultSettings };
    }
  
    async loadSettings() {
      try {
        const result = await window.electronAPI.loadSettings();
        if (result.success) {
          this.settings = { ...this.defaultSettings, ...result.settings };
        } else {
          console.warn('Failed to load settings:', result.error);
          // Use default settings if loading fails
          this.settings = { ...this.defaultSettings };
        }
        return this.settings;
      } catch (error) {
        console.error('Error loading settings:', error);
        return this.defaultSettings;
      }
    }
  
    async saveSettings(newSettings) {
      try {
        this.settings = { ...this.settings, ...newSettings };
        const result = await window.electronAPI.saveSettings(this.settings);
        return result.success;
      } catch (error) {
        console.error('Error saving settings:', error);
        return false;
      }
    }
  
    getSettings() {
      return { ...this.settings };
    }
  
    // Update UI form with current settings
    updateSettingsForm() {
      document.getElementById('workDuration').value = this.settings.defaultWorkDuration;
      document.getElementById('breakDuration').value = this.settings.breakDuration;
      document.getElementById('longBreakDuration').value = this.settings.longBreakDuration;
      document.getElementById('longBreakInterval').value = this.settings.longBreakInterval;
      document.getElementById('soundEnabled').checked = this.settings.soundEnabled;
      document.getElementById('autoStartNextTask').checked = this.settings.autoStartNextTask;
    }
  
    // Get settings from the form
    getSettingsFromForm() {
      return {
        defaultWorkDuration: parseInt(document.getElementById('workDuration').value, 10),
        breakDuration: parseInt(document.getElementById('breakDuration').value, 10),
        longBreakDuration: parseInt(document.getElementById('longBreakDuration').value, 10),
        longBreakInterval: parseInt(document.getElementById('longBreakInterval').value, 10),
        soundEnabled: document.getElementById('soundEnabled').checked,
        autoStartNextTask: document.getElementById('autoStartNextTask').checked
      };
    }
  }