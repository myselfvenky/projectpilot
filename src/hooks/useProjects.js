import { useState, useEffect } from 'react';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableEditors, setAvailableEditors] = useState([]);

  // Load projects from database
  const loadProjects = async () => {
    try {
      const loadedProjects = await window.electronAPI.loadProjects();
      setProjects(loadedProjects);
      console.log('Loaded projects from database:', loadedProjects?.length || 0);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load available editors
  const loadAvailableEditors = async () => {
    try {
      const editors = await window.electronAPI.getAvailableEditors();
      setAvailableEditors(editors);
    } catch (error) {
      console.error('Failed to load available editors:', error);
    }
  };

  // Save a single project
  const saveProject = async (project) => {
    try {
      const result = await window.electronAPI.saveProject(project);
      if (!result.success) {
        console.error('Failed to save project:', result.error);
        return false;
      }
      console.log('Project saved successfully:', project.name);
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  };

  // Delete a project
  const deleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const result = await window.electronAPI.deleteProject(projectId);
        if (result.success) {
          console.log('Project deleted successfully');
          await loadProjects(); // Reload projects
          return true;
        } else {
          alert('Failed to delete project: ' + result.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project');
        return false;
      }
    }
    return false;
  };

  // Open project in editor
  const openProject = async (project, editor = null, selectedEditor) => {
    try {
      const editorToUse = editor || project.defaultEditor || selectedEditor;
      const editorInfo = availableEditors.find(e => e.id === editorToUse);
      
      if (!editorInfo?.isInstalled) {
        alert(`${editorInfo?.name || 'Editor'} is not installed on your system. Please install it first or choose a different editor.`);
        return;
      }
      
      const result = await window.electronAPI.openProject(project.path, editorToUse);
      if (!result.success) {
        alert(`Failed to open project: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to open project:', error);
      alert('Failed to open project');
    }
  };

  // Open project folder
  const openFolder = async (projectPath) => {
    try {
      const result = await window.electronAPI.openFolder(projectPath);
      if (!result.success) {
        alert(`Failed to open folder: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
      alert('Failed to open folder');
    }
  };

  // Update projects order
  const updateProjectsOrder = async (reorderedProjects) => {
    try {
      const result = await window.electronAPI.updateProjectsOrder(reorderedProjects);
      if (result.success) {
        await loadProjects(); // Reload to get updated order
        return true;
      } else {
        console.error('Failed to update project order:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Failed to update project order:', error);
      return false;
    }
  };

  // Select project folder
  const selectProjectFolder = async () => {
    try {
      const result = await window.electronAPI.selectFolder();
      if (result.success) {
        return result.path;
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
    return null;
  };

  // Initialize data on mount
  useEffect(() => {
    loadProjects();
    loadAvailableEditors();
  }, []);

  return {
    projects,
    loading,
    availableEditors,
    loadProjects,
    saveProject,
    deleteProject,
    openProject,
    openFolder,
    updateProjectsOrder,
    selectProjectFolder
  };
}; 