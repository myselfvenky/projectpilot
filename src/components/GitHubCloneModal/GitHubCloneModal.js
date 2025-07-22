import React, { useState, useEffect } from 'react';
import { getEditorIcon, projectIconOptions } from '../../constants/icons';
import { GitBranch, Download, Folder, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import './GitHubCloneModal.css';

const GitHubCloneModal = ({ 
  isOpen, 
  availableEditors,
  onSubmit, 
  onClose,
  onSelectFolder 
}) => {
  const [formData, setFormData] = useState({
    url: '',
    destinationPath: '',
    projectName: '',
    description: '',
    tags: '',
    defaultEditor: 'vscode',
    projectIcon: 'folder'
  });
  
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState('');
  const [urlError, setUrlError] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        url: '',
        destinationPath: '',
        projectName: '',
        description: '',
        tags: '',
        defaultEditor: 'vscode',
        projectIcon: 'folder'
      });
      setIsCloning(false);
      setCloneProgress('');
      setUrlError('');
    }
  }, [isOpen]);

  // Auto-extract project name from GitHub URL
  useEffect(() => {
    if (formData.url && !urlError) {
      const extracted = extractProjectInfoFromUrl(formData.url);
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          projectName: extracted.name,
          description: extracted.description
        }));
      }
    }
  }, [formData.url, urlError]);

  const extractProjectInfoFromUrl = (url) => {
    try {
      // Support various GitHub URL formats
      const patterns = [
        /github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?$/,
        /github\.com\/([^\/]+)\/([^\/]+)$/,
        /^([^\/]+)\/([^\/\.]+)$/  // shorthand: user/repo
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          const [, owner, repo] = match;
          return {
            name: repo,
            description: `Cloned from ${owner}/${repo}`,
            owner,
            repo
          };
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const validateGitHubUrl = (url) => {
    if (!url) return '';
    
    // Check if it's a valid GitHub URL format
    const isValidFormat = 
      url.includes('github.com') || 
      /^[a-zA-Z0-9\-_]+\/[a-zA-Z0-9\-_\.]+$/.test(url); // shorthand format
    
    if (!isValidFormat) {
      return 'Please enter a valid GitHub URL or use format: user/repository';
    }
    
    return '';
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, url }));
    setUrlError(validateGitHubUrl(url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.url.trim()) {
      alert('Please provide a GitHub repository URL');
      return;
    }
    
    if (!formData.destinationPath.trim()) {
      alert('Please select a destination folder');
      return;
    }
    
    if (urlError) {
      alert('Please fix the URL error before cloning');
      return;
    }

    setIsCloning(true);
    setCloneProgress('Preparing to clone...');

    try {
      // Format the URL for git clone
      let cloneUrl = formData.url;
      if (!cloneUrl.startsWith('http')) {
        cloneUrl = `https://github.com/${cloneUrl}`;
      }
      if (!cloneUrl.endsWith('.git')) {
        cloneUrl += '.git';
      }

      setCloneProgress('Cloning repository...');
      
      // Call the backend to clone the repository
      const cloneResult = await window.electronAPI.cloneRepository({
        url: cloneUrl,
        destinationPath: formData.destinationPath,
        projectName: formData.projectName
      });

      if (!cloneResult.success) {
        throw new Error(cloneResult.error || 'Clone failed');
      }

      setCloneProgress('Repository cloned! Adding to projects...');

      // Create project data
      const projectData = {
        id: Date.now().toString(),
        name: formData.projectName || 'Cloned Project',
        description: formData.description,
        path: cloneResult.projectPath,
        tags: formData.tags.trim(),
        defaultEditor: formData.defaultEditor,
        projectIcon: formData.projectIcon,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sortOrder: 0,
        source: 'github-clone',
        originalUrl: formData.url
      };

      setCloneProgress('Complete!');
      
      // Submit the project
      await onSubmit(projectData);
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Clone failed:', error);
      alert(`Failed to clone repository: ${error.message}`);
      setIsCloning(false);
      setCloneProgress('');
    }
  };

  const handleSelectFolder = async () => {
    const selectedPath = await onSelectFolder();
    if (selectedPath) {
      setFormData(prev => ({ ...prev, destinationPath: selectedPath }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={!isCloning ? onClose : undefined}>
      <div className="modal github-clone-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <GitBranch className="icon" />
          <h2>Clone from GitHub</h2>
        </div>
        
        {isCloning ? (
          <div className="clone-progress">
            <div className="progress-content">
              <Loader className="spinner" />
              <p>{cloneProgress}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>GitHub Repository URL *</label>
              <input
                type="text"
                value={formData.url}
                onChange={handleUrlChange}
                placeholder="https://github.com/user/repository or user/repository"
                required
                className={urlError ? 'error' : ''}
              />
              {urlError && (
                <div className="input-error">
                  <AlertCircle className="icon-small" />
                  {urlError}
                </div>
              )}
              <div className="input-hint">
                You can enter a full GitHub URL or just use the format: username/repository
              </div>
            </div>
            
            <div className="form-group">
              <label>Destination Folder *</label>
              <div className="path-input-group">
                <input
                  type="text"
                  value={formData.destinationPath}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationPath: e.target.value }))}
                  placeholder="Select where to clone the repository"
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSelectFolder}
                >
                  <Folder className="icon-small" />
                  Browse
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                placeholder="Auto-detected from repository name"
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Project description (auto-generated)"
                rows="2"
              />
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
                disabled={!!urlError}
              >
                <Download className="icon-small" />
                Clone & Add Project
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GitHubCloneModal; 