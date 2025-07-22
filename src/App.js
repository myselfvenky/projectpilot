import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import ProjectCard from './components/ProjectCard/ProjectCard';
import ProjectModal from './components/ProjectModal/ProjectModal';
import GitHubCloneModal from './components/GitHubCloneModal/GitHubCloneModal';
import Watermark from './components/Watermark/Watermark';
import { useProjects } from './hooks/useProjects';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedEditor, setSelectedEditor] = useState('vscode');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  // Drag and drop state
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Custom hooks
  const { 
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
  } = useProjects();

  const { 
    darkMode, 
    colorTheme, 
    toggleDarkMode, 
    cycleColorTheme 
  } = useTheme();

  // Filter projects based on search term
  useEffect(() => {
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.tags && project.tags.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProjects(filtered);
  }, [projects, searchTerm]);

  // Set default editor when available editors load
  useEffect(() => {
    if (availableEditors.length > 0) {
      const installedEditors = availableEditors.filter(e => e.isInstalled);
      if (installedEditors.length > 0) {
        setSelectedEditor(installedEditors[0].id);
      } else {
        setSelectedEditor(availableEditors[0].id);
      }
    }
  }, [availableEditors]);

  // Handle project form submission
  const handleProjectSubmit = async (projectData) => {
    const success = await saveProject(projectData);
    if (success) {
      await loadProjects();
      setShowAddForm(false);
      setEditingProject(null);
    } else {
      alert('Failed to save project. Please try again.');
    }
  };

  // Handle project editing
  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowAddForm(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowAddForm(false);
    setEditingProject(null);
  };

  // Handle GitHub clone modal
  const handleCloneModalClose = () => {
    setShowCloneModal(false);
  };

  // Handle GitHub clone submission
  const handleCloneSubmit = async (projectData) => {
    try {
      const success = await saveProject(projectData);
      if (success) {
        await loadProjects();
        setShowCloneModal(false);
        console.log('✅ Cloned project added successfully:', projectData.name);
      } else {
        alert('Failed to save cloned project. Please try again.');
      }
    } catch (error) {
      console.error('Error saving cloned project:', error);
      alert(`Failed to save cloned project: ${error.message}`);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, project, index) => {
    setDraggedProject({ project, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (!draggedProject || draggedProject.index === targetIndex) {
      setDraggedProject(null);
      setDragOverIndex(null);
      return;
    }

    const newProjects = [...filteredProjects];
    const draggedItem = newProjects[draggedProject.index];
    
    // Remove dragged item
    newProjects.splice(draggedProject.index, 1);
    
    // Insert at new position
    const insertIndex = draggedProject.index < targetIndex ? targetIndex - 1 : targetIndex;
    newProjects.splice(insertIndex, 0, draggedItem);
    
    // Update project order in database
    const success = await updateProjectsOrder(newProjects);
    if (!success) {
      console.error('Failed to update project order');
    }
    
    setDraggedProject(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDragOverIndex(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        darkMode={darkMode}
        colorTheme={colorTheme}
        onToggleDarkMode={toggleDarkMode}
        onCycleColorTheme={cycleColorTheme}
        onAddProject={() => setShowAddForm(true)}
        onCloneProject={() => setShowCloneModal(true)}
      />

      <main className="main">
        <div className="projects-container">
          {filteredProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No projects found</h3>
              <p>
                {projects.length === 0 
                  ? "Get started by adding your first project!" 
                  : "Try adjusting your search terms."}
              </p>
            </div>
          ) : (
            <div className="projects-grid">
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  availableEditors={availableEditors}
                  selectedEditor={selectedEditor}
                  onEdit={handleEditProject}
                  onDelete={deleteProject}
                  onOpen={(proj, editor) => openProject(proj, editor, selectedEditor)}
                  onOpenFolder={openFolder}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedProject?.project.id === project.id}
                  isDragOver={dragOverIndex === index}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <ProjectModal
        isOpen={showAddForm}
        editingProject={editingProject}
        availableEditors={availableEditors}
        onSubmit={handleProjectSubmit}
        onClose={handleModalClose}
        onSelectFolder={selectProjectFolder}
      />

      <GitHubCloneModal
        isOpen={showCloneModal}
        availableEditors={availableEditors}
        onSubmit={handleCloneSubmit}
        onClose={handleCloneModalClose}
        onSelectFolder={selectProjectFolder}
      />

      <Watermark />
    </div>
  );
}

export default App; 