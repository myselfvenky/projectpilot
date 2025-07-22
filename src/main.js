const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const os = require('os');
const ProjectDatabase = require('./database');

let mainWindow;
let projectDb;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Window bounds management
function getSavedWindowBounds() {
  const defaultBounds = {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    hasValidBounds: false
  };

  try {
    const userDataPath = app.getPath('userData');
    const boundsPath = path.join(userDataPath, 'window-bounds.json');
    
    if (fs.existsSync(boundsPath)) {
      const savedBounds = JSON.parse(fs.readFileSync(boundsPath, 'utf8'));
      
      // Validate bounds are reasonable and on screen
      if (savedBounds.width > 400 && savedBounds.height > 300) {
        return {
          ...savedBounds,
          hasValidBounds: true
        };
      }
    }
  } catch (error) {

    
    console.log('Could not load saved window bounds:', error.message);
  }

  return defaultBounds;
}

function saveWindowBounds() {
  if (!mainWindow) return;
  
  try {
    const bounds = mainWindow.getBounds();
    const userDataPath = app.getPath('userData');
    const boundsPath = path.join(userDataPath, 'window-bounds.json');
    
    fs.writeFileSync(boundsPath, JSON.stringify(bounds), 'utf8');
  } catch (error) {
    console.log('Could not save window bounds:', error.message);
  }
}

function createWindow() {
  // Get saved window bounds or use defaults
  const savedBounds = getSavedWindowBounds();
  
  mainWindow = new BrowserWindow({
    ...savedBounds,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false // Disable developer tools
    },
    movable: true, // Note: correct spelling is 'movable' not 'moveable'
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    // Use default title bar for better dragging experience
    titleBarStyle: 'default',
    // Ensure we have a proper title bar
    frame: true,
    show: false,
    // Ensure window is always visible on screen
    center: !savedBounds.hasValidBounds,
    // Set window title
    title: 'Project Pilot'
  });

  // Load the app
  if (isDev) {
    const port = process.env.PORT || 4000;
    console.log(`Loading React app from http://localhost:${port}`);
    mainWindow.loadURL(`http://localhost:${port}`);
    // Removed openDevTools() to disable developer tools
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus the window to ensure it's in front
    mainWindow.focus();
    
    // Log window properties for debugging
    console.log('Window created with bounds:', mainWindow.getBounds());
    console.log('Window is movable:', mainWindow.isMovable());
    console.log('Window is resizable:', mainWindow.isResizable());
  });

  // Disable context menu (prevents right-click access to developer tools)
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  // Handle new window events - redirect to external browser
  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });

  // Disable keyboard shortcuts that could open developer tools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Disable F12 (commonly used for dev tools)
    if (input.key === 'F12') {
      event.preventDefault();
    }
    
    // Disable Ctrl+Shift+I / Cmd+Option+I (dev tools)
    if ((input.control && input.shift && input.key === 'I') || 
        (input.meta && input.alt && input.key === 'I')) {
      event.preventDefault();
    }
    
    // Disable Ctrl+Shift+J / Cmd+Option+J (console)
    if ((input.control && input.shift && input.key === 'J') || 
        (input.meta && input.alt && input.key === 'J')) {
      event.preventDefault();
    }
    
    // Disable Ctrl+U / Cmd+U (view source)
    if ((input.control && input.key === 'U') || 
        (input.meta && input.key === 'U')) {
      event.preventDefault();
    }
  });

  // Save window bounds when moved or resized
  mainWindow.on('moved', saveWindowBounds);
  mainWindow.on('resized', saveWindowBounds);
  
  mainWindow.on('closed', () => {
    saveWindowBounds(); // Save final position before closing
    mainWindow = null;
    
    // Force quit the application when main window is closed
    app.quit();
  });
}

app.whenReady().then(async () => {
  // Initialize database with fallback handling
  try {
    projectDb = new ProjectDatabase();
    await projectDb.init();
    console.log('Database initialized successfully');
    
    // Log which storage system is being used
    const stats = projectDb.getStats();
    if (stats.storageType) {
      console.log(`Using storage type: ${stats.storageType}`);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Don't prevent the app from starting even if database fails
    console.log('App will continue without database functionality');
  }
  
  createWindow();
  
  // Register global shortcuts for window management
  try {
    // Cmd/Ctrl + Shift + C to center window
    globalShortcut.register('CommandOrControl+Shift+C', () => {
      if (mainWindow) {
        mainWindow.center();
        mainWindow.focus();
      }
    });
    
    // Cmd/Ctrl + Shift + R to reset window size and position
    globalShortcut.register('CommandOrControl+Shift+R', () => {
      if (mainWindow) {
        mainWindow.setBounds({
          width: 1200,
          height: 800,
          x: undefined,
          y: undefined
        });
        mainWindow.center();
        mainWindow.focus();
        saveWindowBounds();
      }
    });
    
    console.log('Window management shortcuts registered');
  } catch (error) {
    console.error('Failed to register shortcuts:', error);
  }
});

app.on('window-all-closed', () => {
  // Close database connection
  if (projectDb) {
    projectDb.close();
  }
  
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  
  // Always quit the application when all windows are closed
  // (removed macOS exception - force quit on all platforms)
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Ensure database is closed properly
  if (projectDb) {
    projectDb.close();
  }
  
  // Clean up global shortcuts
  globalShortcut.unregisterAll();
  
  // Force process termination after cleanup
  setTimeout(() => {
    process.exit(0);
  }, 100);
});

// IPC Handlers

// Load projects
ipcMain.handle('load-projects', async () => {
  try {
    if (!projectDb) {
      console.error('Database not initialized - returning empty array');
      return [];
    }
    if (!projectDb.isConnected()) {
      console.error('Database not connected - returning empty array');
      return [];
    }
    const projects = await projectDb.getAllProjects();
    console.log(`Loaded ${projects.length} projects successfully`);
    return projects;
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
});

// Save a single project
ipcMain.handle('save-project', async (event, project) => {
  try {
    if (!projectDb) {
      console.error('Database not initialized');
      return { success: false, error: 'Database not initialized' };
    }
    if (!projectDb.isConnected()) {
      console.error('Database not connected');
      return { success: false, error: 'Database not connected' };
    }
    
    const result = await projectDb.saveProject(project);
    console.log(`Project saved successfully: ${project.name}`);
    return { success: true, result };
  } catch (error) {
    console.error('Error saving project:', error);
    return { success: false, error: error.message };
  }
});

// Delete a project
ipcMain.handle('delete-project', async (event, projectId) => {
  try {
    if (!projectDb) {
      console.error('Database not initialized');
      return { success: false, error: 'Database not initialized' };
    }
    
    const result = await projectDb.deleteProject(projectId);
    return { success: true, result };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
});

// Update projects order (for drag and drop)
ipcMain.handle('update-projects-order', async (event, projects) => {
  try {
    if (!projectDb) {
      console.error('Database not initialized');
      return { success: false, error: 'Database not initialized' };
    }
    
    await projectDb.updateProjectsOrder(projects);
    return { success: true };
  } catch (error) {
    console.error('Error updating projects order:', error);
    return { success: false, error: error.message };
  }
});

// Get database statistics
ipcMain.handle('get-db-stats', () => {
  try {
    if (!projectDb) {
      return { totalProjects: 0 };
    }
    
    const stats = projectDb.getStats();
    return stats;
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { totalProjects: 0 };
  }
});

// Center window on screen
ipcMain.handle('center-window', async () => {
  try {
    if (mainWindow) {
      mainWindow.center();
      mainWindow.focus();
      return { success: true };
    }
    return { success: false, error: 'No main window found' };
  } catch (error) {
    console.error('Error centering window:', error);
    return { success: false, error: error.message };
  }
});

// Reset window size and position
ipcMain.handle('reset-window', async () => {
  try {
    if (mainWindow) {
      mainWindow.setBounds({
        width: 1200,
        height: 800,
        x: undefined,
        y: undefined
      });
      mainWindow.center();
      mainWindow.focus();
      saveWindowBounds();
      return { success: true };
    }
    return { success: false, error: 'No main window found' };
  } catch (error) {
    console.error('Error resetting window:', error);
    return { success: false, error: error.message };
  }
});

// Enable window movement (debug helper)
ipcMain.handle('enable-window-movement', async () => {
  try {
    if (mainWindow) {
      mainWindow.setMovable(true);
      mainWindow.setResizable(true);
      console.log('Window movement enabled - movable:', mainWindow.isMovable(), 'resizable:', mainWindow.isResizable());
      return { 
        success: true, 
        movable: mainWindow.isMovable(),
        resizable: mainWindow.isResizable()
      };
    }
    return { success: false, error: 'No main window found' };
  } catch (error) {
    console.error('Error enabling window movement:', error);
    return { success: false, error: error.message };
  }
});

// Open external link in default browser
ipcMain.handle('open-external', async (event, url) => {
  try {
    console.log(`🔗 IPC Handler received request to open URL: ${url}`);
    console.log(`🖥️ Platform: ${process.platform}`);
    
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }
    
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log(`🚀 Attempting to open URL: ${url}`);
    
    // shell.openExternal should open in the OS default browser
    await shell.openExternal(url);
    console.log('✅ Successfully opened URL in default browser');
    return { success: true };
  } catch (error) {
    console.error('❌ Error opening external link with shell.openExternal:', error);
    
    // Fallback: try OS-specific commands for default browser
    try {
      let command;
      let args;
      
      if (process.platform === 'darwin') {
        // macOS: use 'open' command which opens in default browser
        command = 'open';
        args = [url];
      } else if (process.platform === 'win32') {
        // Windows: use 'start' command
        command = 'cmd';
        args = ['/c', 'start', url];
      } else {
        // Linux: use 'xdg-open' command
        command = 'xdg-open';
        args = [url];
      }
      
      console.log(`🔄 Fallback: trying ${command} with args:`, args);
      
      return new Promise((resolve) => {
        const { spawn } = require('child_process');
        
        // Windows-specific spawn options
        let spawnOptions = { detached: true, stdio: 'ignore' };
        if (process.platform === 'win32') {
          spawnOptions = {
            ...spawnOptions,
            shell: true,
            windowsHide: true
          };
        }
        
        const child = spawn(command, args, spawnOptions);
        
        child.on('error', (spawnError) => {
          console.error(`Fallback spawn error:`, spawnError);
          resolve({ success: false, error: `Primary: ${error.message}, Fallback: ${spawnError.message}` });
        });
        
        child.on('spawn', () => {
          console.log('✅ Successfully opened URL with fallback method');
          child.unref();
          resolve({ success: true });
        });
        
        // Timeout fallback
        setTimeout(() => {
          if (!child.killed) {
            child.unref();
            resolve({ success: true });
          }
        }, 2000); // Increased timeout for Windows
      });
      
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      return { success: false, error: `Primary: ${error.message}, Fallback: ${fallbackError.message}` };
    }
  }
});

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Project Folder'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false };
  } catch (error) {
    console.error('Error selecting folder:', error);
    return { success: false, error: error.message };
  }
});

// Open project in editor
ipcMain.handle('open-project', async (event, projectPath, editorId) => {
  try {
    // Check if path exists
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    const editors = [
      { 
        id: 'vscode', 
        name: 'Visual Studio Code', 
        command: 'code',
        macApp: 'Visual Studio Code'
      },
      { 
        id: 'cursor', 
        name: 'Cursor', 
        command: 'cursor',
        macApp: 'Cursor'
      },
      { 
        id: 'webstorm', 
        name: 'WebStorm', 
        command: 'webstorm',
        macApp: 'WebStorm'
      },
      { 
        id: 'androidstudio', 
        name: 'Android Studio', 
        command: 'studio',
        macApp: 'Android Studio'
      },
      { 
        id: 'sublime', 
        name: 'Sublime Text', 
        command: 'subl',
        macApp: 'Sublime Text'
      },
      { 
        id: 'atom', 
        name: 'Atom', 
        command: 'atom',
        macApp: 'Atom'
      },
      { 
        id: 'xcode', 
        name: 'Xcode', 
        command: 'xed',
        macApp: 'Xcode'
      },
      { 
        id: 'intellij', 
        name: 'IntelliJ IDEA', 
        command: 'idea',
        macApp: 'IntelliJ IDEA'
      },
      { 
        id: 'vim', 
        name: 'Vim', 
        command: 'vim'
      },
      { 
        id: 'emacs', 
        name: 'Emacs', 
        command: 'emacs'
      }
    ];

    const editor = editors.find(e => e.id === editorId.toLowerCase());
    if (!editor) {
      throw new Error(`Unsupported editor: ${editorId}`);
    }

    let options = { detached: true, stdio: 'ignore' };

    // Try different launch methods based on platform
    if (process.platform === 'darwin' && editor.macApp) {
      // On macOS, try using 'open' command first
      try {
        return new Promise((resolve) => {
          const child = spawn('open', ['-a', editor.macApp, projectPath], options);
          
          child.on('error', (error) => {
            console.log(`Failed to open with 'open' command, trying command line: ${error.message}`);
            // Continue to command line approach
            resolve(null);
          });
          
          child.on('spawn', () => {
            console.log(`Successfully opened project with macOS 'open' command`);
            child.unref();
            resolve({ success: true });
          });
          
          // Timeout to continue to command line if no response
          setTimeout(() => {
            if (!child.killed) {
              child.unref();
              resolve({ success: true });
            }
          }, 1000);
        }).then(result => {
          if (result) return result;
          // If null returned, continue to command line approach below
        });
      } catch (error) {
        console.log(`Failed to open with 'open' command, trying command line: ${error.message}`);
      }
    }

    // Try command line approach with proper error handling
    return new Promise((resolve, reject) => {
      try {
        const command = editor.command;
        const args = [projectPath];
        
        // Windows-specific spawn options
        let spawnOptions = { detached: true, stdio: 'ignore' };
        
        // On Windows, we need to handle .cmd and .bat files differently
        if (process.platform === 'win32') {
          spawnOptions = {
            ...spawnOptions,
            shell: true, // Important for Windows to handle .cmd/.bat files
            windowsHide: true // Hide the command window
          };
        }
        
        console.log(`Attempting to spawn ${command} with args:`, args, 'on platform:', process.platform);
        
        const child = spawn(command, args, spawnOptions);
        
        // Handle spawn errors properly
        child.on('error', (error) => {
          console.error(`Error spawning ${editor.name}:`, error);
          if (error.code === 'ENOENT') {
            resolve({ 
              success: false, 
              error: `${editor.name} command '${command}' not found in PATH. Please install ${editor.name} and ensure its command-line tool is available, or try a different editor.` 
            });
          } else {
            resolve({ 
              success: false, 
              error: `Failed to launch ${editor.name}: ${error.message}` 
            });
          }
        });

        // Handle successful spawn
        child.on('spawn', () => {
          console.log(`Successfully spawned ${editor.name} for project: ${projectPath}`);
          child.unref();
          resolve({ success: true });
        });

        // Handle process close/exit (for better Windows compatibility)
        child.on('close', (code) => {
          if (code !== null && code !== 0) {
            console.warn(`${editor.name} process exited with code ${code}`);
            // Don't treat non-zero exit codes as failures for editors
            // as some editors return non-zero codes even when successful
          }
        });

        // Set a timeout to resolve successfully if no error occurs within reasonable time
        setTimeout(() => {
          if (!child.killed) {
            child.unref();
            resolve({ success: true });
          }
        }, 2000); // Increased timeout for Windows

      } catch (error) {
        console.error(`Failed to spawn ${editor.name}:`, error);
        resolve({ 
          success: false, 
          error: `Failed to launch ${editor.name}: ${error.message}` 
        });
      }
    });

  } catch (error) {
    console.error('Error opening project:', error);
    return { success: false, error: error.message };
  }
});

// Open folder in file manager
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder does not exist: ${folderPath}`);
    }
    
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    console.error('Error opening folder:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to check if a file/directory exists
const checkPath = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Helper function to check paths with wildcards
const checkPathWithWildcard = (pattern) => {
  try {
    if (!pattern.includes('*')) {
      return checkPath(pattern);
    }
    
    const path = require('path');
    const parentDir = path.dirname(pattern);
    const filePattern = path.basename(pattern);
    
    if (!fs.existsSync(parentDir)) return false;
    
    const files = fs.readdirSync(parentDir);
    const regex = new RegExp(filePattern.replace(/\*/g, '.*'));
    
    return files.some(file => regex.test(file));
  } catch (error) {
    return false;
  }
};

// Helper function to check command availability
const checkCommand = async (command) => {
  try {
    await new Promise((resolve, reject) => {
      const checkCmd = process.platform === 'win32' ? 'where' : 'which';
      const execOptions = process.platform === 'win32' ? { shell: true, windowsHide: true } : {};
      
      exec(`${checkCmd} ${command}`, execOptions, (error, stdout) => {
        if (error || !stdout.trim()) {
          reject(error || new Error(`Command ${command} not found`));
        } else {
          resolve();
        }
      });
    });
    return true;
  } catch (error) {
    console.log(`Command '${command}' not found:`, error.message);
    return false;
  }
};

// Helper function to check if editor is installed
const checkEditorInstallation = async (editor) => {
  // First try command-line detection
  const commandExists = await checkCommand(editor.command);
  if (commandExists) return true;

  // Platform-specific detection
  if (process.platform === 'darwin') {
    // macOS: Check common app locations
    const macPaths = [
      `/Applications/${editor.appName || editor.name}.app`,
      `/Applications/${editor.name}.app`,
      `${os.homedir()}/Applications/${editor.appName || editor.name}.app`,
      `${os.homedir()}/Applications/${editor.name}.app`,
      ...(editor.macPaths || [])
    ];

    for (const appPath of macPaths) {
      if (checkPath(appPath)) return true;
    }
  } else if (process.platform === 'win32') {
    // Windows: Check common installation paths
    const winPaths = [
      `C:\\Program Files\\${editor.name}`,
      `C:\\Program Files (x86)\\${editor.name}`,
      `${os.homedir()}\\AppData\\Local\\${editor.name}`,
      `${os.homedir()}\\AppData\\Local\\Programs\\${editor.name}`,
      ...(editor.winPaths || [])
    ];

    for (const appPath of winPaths) {
      if (appPath.includes('*')) {
        if (checkPathWithWildcard(appPath)) return true;
      } else {
        if (checkPath(appPath)) return true;
      }
    }
  } else {
    // Linux: Check common paths
    const linuxPaths = [
      `/usr/bin/${editor.command}`,
      `/usr/local/bin/${editor.command}`,
      `/opt/${editor.name}`,
      `/snap/bin/${editor.command}`,
      `${os.homedir()}/.local/bin/${editor.command}`,
      ...(editor.linuxPaths || [])
    ];

    for (const appPath of linuxPaths) {
      if (checkPath(appPath)) return true;
    }
  }

  return false;
};

// Get all editors with installation status
ipcMain.handle('get-available-editors', async () => {
  const editors = [
    { 
      id: 'vscode', 
      name: 'Visual Studio Code', 
      command: 'code',
      appName: 'Visual Studio Code',
      macPaths: ['/Applications/Visual Studio Code.app'],
      winPaths: ['C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Programs\\Microsoft VS Code']
    },
    { 
      id: 'cursor', 
      name: 'Cursor', 
      command: 'cursor',
      macPaths: ['/Applications/Cursor.app'],
      winPaths: ['C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Programs\\cursor']
    },
    { 
      id: 'webstorm', 
      name: 'WebStorm', 
      command: 'webstorm',
      macPaths: ['/Applications/WebStorm.app'],
      winPaths: ['C:\\Program Files\\JetBrains\\WebStorm*']
    },
    { 
      id: 'androidstudio', 
      name: 'Android Studio', 
      command: 'studio',
      macPaths: ['/Applications/Android Studio.app'],
      winPaths: ['C:\\Program Files\\Android\\Android Studio']
    },
    { 
      id: 'sublime', 
      name: 'Sublime Text', 
      command: 'subl',
      macPaths: ['/Applications/Sublime Text.app'],
      winPaths: ['C:\\Program Files\\Sublime Text*']
    },
    { 
      id: 'atom', 
      name: 'Atom', 
      command: 'atom',
      macPaths: ['/Applications/Atom.app'],
      winPaths: ['C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\atom']
    },
    { 
      id: 'vim', 
      name: 'Vim', 
      command: 'vim'
    },
    { 
      id: 'emacs', 
      name: 'Emacs', 
      command: 'emacs'
    },
    { 
      id: 'xcode', 
      name: 'Xcode', 
      command: 'xed',
      macPaths: ['/Applications/Xcode.app']
    },
    { 
      id: 'intellij', 
      name: 'IntelliJ IDEA', 
      command: 'idea',
      macPaths: ['/Applications/IntelliJ IDEA.app', '/Applications/IntelliJ IDEA CE.app'],
      winPaths: ['C:\\Program Files\\JetBrains\\IntelliJ IDEA*']
    },
    { 
      id: 'phpstorm', 
      name: 'PhpStorm', 
      command: 'phpstorm',
      macPaths: ['/Applications/PhpStorm.app'],
      winPaths: ['C:\\Program Files\\JetBrains\\PhpStorm*']
    },
    { 
      id: 'pycharm', 
      name: 'PyCharm', 
      command: 'pycharm',
      macPaths: ['/Applications/PyCharm.app', '/Applications/PyCharm CE.app'],
      winPaths: ['C:\\Program Files\\JetBrains\\PyCharm*']
    },
    { 
      id: 'rubymine', 
      name: 'RubyMine', 
      command: 'rubymine',
      macPaths: ['/Applications/RubyMine.app'],
      winPaths: ['C:\\Program Files\\JetBrains\\RubyMine*']
    },
    { 
      id: 'goland', 
      name: 'GoLand', 
      command: 'goland',
      macPaths: ['/Applications/GoLand.app'],
      winPaths: ['C:\\Program Files\\JetBrains\\GoLand*']
    },
    { 
      id: 'clion', 
      name: 'CLion', 
      command: 'clion',
      macPaths: ['/Applications/CLion.app'],
      winPaths: ['C:\\Program Files\\JetBrains\\CLion*']
    },
    { 
      id: 'rider', 
      name: 'Rider', 
      command: 'rider',
      macPaths: ['/Applications/Rider.app'],
      winPaths: ['C:\\Program Files\\JetBrains\\JetBrains Rider*']
    },
    { 
      id: 'fleet', 
      name: 'Fleet', 
      command: 'fleet',
      macPaths: ['/Applications/Fleet.app'],
      winPaths: ['C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\JetBrains\\Fleet']
    },
    { 
      id: 'nova', 
      name: 'Nova', 
      command: 'nova',
      macPaths: ['/Applications/Nova.app']
    },
    { 
      id: 'brackets', 
      name: 'Brackets', 
      command: 'brackets',
      macPaths: ['/Applications/Brackets.app'],
      winPaths: ['C:\\Program Files (x86)\\Brackets']
    },
    { 
      id: 'notepad++', 
      name: 'Notepad++', 
      command: 'notepad++',
      winPaths: ['C:\\Program Files\\Notepad++', 'C:\\Program Files (x86)\\Notepad++']
    },
    { 
      id: 'code-insiders', 
      name: 'VS Code Insiders', 
      command: 'code-insiders',
      macPaths: ['/Applications/Visual Studio Code - Insiders.app'],
      winPaths: ['C:\\Users\\' + os.userInfo().username + '\\AppData\\Local\\Programs\\Microsoft VS Code Insiders']
    },
    { 
      id: 'typora', 
      name: 'Typora', 
      command: 'typora',
      macPaths: ['/Applications/Typora.app'],
      winPaths: ['C:\\Program Files\\Typora']
    },
    { 
      id: 'zed', 
      name: 'Zed', 
      command: 'zed',
      macPaths: ['/Applications/Zed.app']
    }
  ];

  // Check which editors are installed
  const editorsWithStatus = [];
  
  for (const editor of editors) {
    const isInstalled = await checkEditorInstallation(editor);
    editorsWithStatus.push({
      ...editor,
      isInstalled
    });
  }

  console.log('Detected editors:', editorsWithStatus.filter(e => e.isInstalled).map(e => e.name));
  return editorsWithStatus;
}); 

// Diagnostic handler for troubleshooting Windows issues
ipcMain.handle('run-diagnostics', async () => {
  console.log('🔍 Running system diagnostics...');
  
  const diagnostics = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    userInfo: os.userInfo(),
    env: {
      PATH: process.env.PATH,
      USERPROFILE: process.env.USERPROFILE,
      APPDATA: process.env.APPDATA,
      LOCALAPPDATA: process.env.LOCALAPPDATA
    },
    commands: {},
    errors: []
  };
  
  // Test common commands
  const commandsToTest = ['code', 'cursor', 'cmd', 'where', 'git'];
  
  for (const cmd of commandsToTest) {
    try {
      const available = await checkCommand(cmd);
      diagnostics.commands[cmd] = available;
      console.log(`Command '${cmd}': ${available ? 'AVAILABLE' : 'NOT FOUND'}`);
    } catch (error) {
      diagnostics.commands[cmd] = false;
      diagnostics.errors.push(`Error checking '${cmd}': ${error.message}`);
      console.error(`Error checking '${cmd}':`, error);
    }
  }
  
  // Test spawn operation
  try {
    console.log('🧪 Testing spawn operation...');
    const testResult = await new Promise((resolve) => {
      const { spawn } = require('child_process');
      
      let spawnOptions = { detached: true, stdio: 'ignore' };
      if (process.platform === 'win32') {
        spawnOptions = {
          ...spawnOptions,
          shell: true,
          windowsHide: true
        };
      }
      
      const child = spawn('echo', ['test'], spawnOptions);
      
      child.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });
      
      child.on('spawn', () => {
        child.unref();
        resolve({ success: true });
      });
      
      setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, 5000);
    });
    
    diagnostics.spawnTest = testResult;
    console.log('Spawn test result:', testResult);
  } catch (error) {
    diagnostics.spawnTest = { success: false, error: error.message };
    diagnostics.errors.push(`Spawn test error: ${error.message}`);
    console.error('Spawn test error:', error);
  }
  
  console.log('🔍 Diagnostics complete');
  return diagnostics;
}); 

// Clone repository from GitHub
ipcMain.handle('clone-repository', async (event, { url, destinationPath, projectName }) => {
  try {
    console.log(`🌀 Starting clone: ${url} -> ${destinationPath}/${projectName}`);
    
    // Validate inputs
    if (!url || !destinationPath || !projectName) {
      throw new Error('Missing required parameters: url, destinationPath, or projectName');
    }
    
    // Check if destination path exists
    if (!fs.existsSync(destinationPath)) {
      throw new Error(`Destination path does not exist: ${destinationPath}`);
    }
    
    // Check if git is available
    const gitAvailable = await checkCommand('git');
    if (!gitAvailable) {
      throw new Error('Git is not installed or not available in PATH. Please install Git first.');
    }
    
    // Create full project path
    const projectPath = path.join(destinationPath, projectName);
    
    // Check if project directory already exists
    if (fs.existsSync(projectPath)) {
      throw new Error(`Directory already exists: ${projectPath}. Please choose a different name or remove the existing directory.`);
    }
    
    console.log(`📁 Cloning to: ${projectPath}`);
    
    // Execute git clone
    return new Promise((resolve, reject) => {
      const args = ['clone', url, projectPath];
      
      // Platform-specific spawn options
      let spawnOptions = { 
        cwd: destinationPath,
        stdio: ['ignore', 'pipe', 'pipe'] // Capture stdout and stderr
      };
      
      if (process.platform === 'win32') {
        spawnOptions.shell = true;
        spawnOptions.windowsHide = true;
      }
      
      console.log(`🚀 Executing: git ${args.join(' ')}`);
      
      const gitProcess = spawn('git', args, spawnOptions);
      
      let stdout = '';
      let stderr = '';
      
      gitProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`Git stdout: ${data.toString().trim()}`);
      });
      
      gitProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log(`Git stderr: ${data.toString().trim()}`);
      });
      
      gitProcess.on('error', (error) => {
        console.error('Git process error:', error);
        reject(new Error(`Failed to start git process: ${error.message}`));
      });
      
      gitProcess.on('close', (code) => {
        console.log(`Git process exited with code: ${code}`);
        
        if (code === 0) {
          // Success - verify the directory was created
          if (fs.existsSync(projectPath)) {
            console.log('✅ Repository cloned successfully');
            resolve({
              success: true,
              projectPath: projectPath,
              output: stdout
            });
          } else {
            reject(new Error('Clone completed but project directory was not created'));
          }
        } else {
          // Error - parse git error message
          let errorMessage = 'Git clone failed';
          
          if (stderr.includes('not found') || stderr.includes('does not exist')) {
            errorMessage = 'Repository not found. Please check the URL and try again.';
          } else if (stderr.includes('Permission denied') || stderr.includes('access denied')) {
            errorMessage = 'Permission denied. You may need to authenticate or check repository access.';
          } else if (stderr.includes('Network is unreachable') || stderr.includes('timeout')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (stderr.includes('already exists')) {
            errorMessage = 'Directory already exists. Please choose a different name.';
          } else if (stderr) {
            errorMessage = `Git error: ${stderr.trim()}`;
          }
          
          reject(new Error(errorMessage));
        }
      });
      
      // Set timeout for long-running clones
      setTimeout(() => {
        if (!gitProcess.killed) {
          gitProcess.kill();
          reject(new Error('Clone operation timed out after 5 minutes. The repository may be too large.'));
        }
      }, 300000); // 5 minutes timeout
    });
    
  } catch (error) {
    console.error('Clone repository error:', error);
    return { success: false, error: error.message };
  }
}); 