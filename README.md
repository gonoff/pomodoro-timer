# Pomodoro Focus

A modern Pomodoro timer desktop application with a Spotify-inspired design, built with Electron.

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **JavaScript (ES6+)**: Core programming language
- **HTML/CSS**: UI rendering
- **Module Pattern**: For code organization
- **LocalStorage**: User preferences storage

## Features

- **Pomodoro Timer**: Work and break sessions with customizable durations
- **Schedule Management**: Import task schedules from CSV files
- **Task Priorities**: Support for high/medium/low priority tasks
- **Wellness Prompts**: Helpful reminders during breaks
- **Productivity Stats**: Track completed sessions and focus time
- **Theme Toggle**: Dark and light mode
- **Auto-start**: Option to automatically start next task after a break

## Directory Structure

```
pomodoro-timer/
├── data/                    # Persistent data storage
│   └── settings.json        # User settings
├── dist/                    # Compiled distribution 
├── main.js                  # Main Electron process
├── preload.js               # Preload script for secure IPC
├── package.json             # Dependencies and scripts
├── src/                     # Application source
│   ├── assets/              # Assets like sounds
│   ├── css/                 # Stylesheets
│   │   └── styles.css       # Main styles
│   ├── index.html           # Main HTML
│   ├── renderer.js          # Main renderer process
│   └── js/                  # JavaScript modules
│       ├── timer.js         # Timer functionality
│       ├── settings.js      # Settings management
│       ├── csv.js           # CSV import/parsing
│       ├── ui.js            # UI management
│       └── wellness.js      # Wellness prompts
└── schedule.csv             # Sample schedule
```

## Recent Improvements

1. **Auto-start next task**
   - Added checkbox in settings
   - Implemented logic to automatically start next task after breaks

2. **Wellness prompts during breaks**
   - Added wellness.js with prompts for stretching, eye exercises, and more
   - Displays context-aware wellness tips during break sessions

3. **Priority levels for tasks**
   - Added support for marking tasks as high, medium, or low priority
   - CSV format: `[High] Task name,25` to set priority
   - Visual indicators with color coding

4. **Theme toggle**
   - Implemented dark/light theme switching
   - Saved theme preference to localStorage
   - Theme-aware UI with CSS variables

## Usage

### Development

```bash
# Install dependencies
npm install

# Run the app
npm start
```

### Building

```bash
# Package the app
npm run package
```

## CSV Format

The application accepts CSV files with the following format:

```
Starting Time,09:00
Task Name,Duration (minutes)
[High] Critical design review,45
[Medium] Update client website,30
Customer support emails,25
```

- First row: Starting time in HH:MM format
- Second row: Header for data columns
- Subsequent rows: Task name and duration in minutes
- Optional priority: [High], [Medium], or [Low] at the beginning of task name

## Next Steps

- **Mobile Companion App**: Sync across devices
- **Weekly/Monthly Reports**: Extended productivity analytics
- **Team Mode**: Shared Pomodoro sessions
- **Task Categories**: Group tasks by project or category
- **Integration with Task Apps**: Connect with Todoist, Trello, etc.
- **Global Keyboard Shortcuts**: Control timer from any application
