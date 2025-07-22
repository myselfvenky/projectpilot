const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Project data operations
  loadProjects: () => ipcRenderer.invoke('load-projects'),
  saveProject: (project) => ipcRenderer.invoke('save-project', project),
  deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),
  updateProjectsOrder: (projects) => ipcRenderer.invoke('update-projects-order', projects),
  getDbStats: () => ipcRenderer.invoke('get-db-stats'),
  
  // File system operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openProject: (projectPath, editor) => ipcRenderer.invoke('open-project', projectPath, editor),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  
  // Editor operations
  getAvailableEditors: () => ipcRenderer.invoke('get-available-editors'),
  
  // Window management
  centerWindow: () => ipcRenderer.invoke('center-window'),
  resetWindow: () => ipcRenderer.invoke('reset-window'),
  enableWindowMovement: () => ipcRenderer.invoke('enable-window-movement'),
  
  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // GitHub clone operations
  cloneRepository: (cloneData) => ipcRenderer.invoke('clone-repository', cloneData),
  
  // Diagnostics
  runDiagnostics: () => ipcRenderer.invoke('run-diagnostics')
}); 