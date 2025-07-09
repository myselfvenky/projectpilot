import React, { useState, useEffect } from 'react';
import { getEditorIcon, projectIconOptions } from '../../constants/icons';
import './ProjectModal.css';

const ProjectModal = ({ 
  isOpen, 
  editingProject, 
  availableEditors,
  onSubmit, 
  onClose,
  onSelectFolder 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    path: '',
    tags: '',
    defaultEditor: 'vscode',
    projectIcon: 'folder'
  });

  // Reset form when modal opens/closes or editing project changes
  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        setFormData({
          name: editingProject.name,
          description: editingProject.description,
          path: editingProject.path,
          tags: editingProject.tags || '',
          defaultEditor: editingProject.defaultEditor || 'vscode',
          projectIcon: editingProject.projectIcon || 'folder'
        });
      } else {
        setFormData({
          name: '',
          description: '',
          path: '',
          tags: '',
          defaultEditor: 'vscode',
          projectIcon: 'folder'
        });
      }
    }
  }, [isOpen, editingProject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.path.trim()) {
      alert('Please provide both name and path for the project');
      return;
    }

    const projectData = {
      id: editingProject ? editingProject.id : Date.now().toString(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      path: formData.path.trim(),
      tags: formData.tags.trim(),
      defaultEditor: formData.defaultEditor,
      projectIcon: formData.projectIcon,
      createdAt: editingProject ? editingProject.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sortOrder: editingProject ? editingProject.sortOrder : 0
    };

    onSubmit(projectData);
  };

  const handleSelectFolder = async () => {
    const selectedPath = await onSelectFolder();
    if (selectedPath) {
      setFormData(prev => ({ ...prev, path: selectedPath }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Project description (optional)"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Project Path *</label>
            <div className="path-input-group">
              <input
                type="text"
                value={formData.path}
                onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                placeholder="Select project folder"
                required
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSelectFolder}
              >
                Browse
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label>Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Tags (comma separated)"
            />
          </div>
          
          <div className="form-group">
            <label>Project Icon</label>
            <div className="icon-selector">
              {projectIconOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`icon-option ${formData.projectIcon === option.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, projectIcon: option.id }))}
                  title={option.name}
                >
                  {option.icon}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Default Editor</label>
            <div className="select-with-icon">
              <div className="select-icon">
                {getEditorIcon(formData.defaultEditor)}
              </div>
              <select
                value={formData.defaultEditor}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultEditor: e.target.value }))}
              >
                {availableEditors.map(editor => (
                  <option key={editor.id} value={editor.id}>
                    {editor.name}{!editor.isInstalled ? ' (Not Installed)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingProject ? 'Update Project' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal; 