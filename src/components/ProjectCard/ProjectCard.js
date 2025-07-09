import React from 'react';
import { Edit, Trash2, FolderOpen, ExternalLink, GripVertical } from 'lucide-react';
import { getProjectIcon, getEditorIcon } from '../../constants/icons';
import './ProjectCard.css';

const ProjectCard = ({ 
  project, 
  index,
  availableEditors,
  selectedEditor,
  onEdit, 
  onDelete, 
  onOpen, 
  onOpenFolder,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver
}) => {
  const handleEditorChange = (editorId) => {
    onOpen(project, editorId);
  };

  const cardClasses = [
    'project-card',
    isDragging && 'dragging',
    isDragOver && 'drag-over'
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      draggable
      onDragStart={(e) => onDragStart(e, project, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className="project-header">
        <div className="project-title-section">
          <div className="project-main-icon">
            {getProjectIcon(project.projectIcon || 'folder')}
          </div>
          <div className="project-info">
            <h3 className="project-name">{project.name}</h3>
            <div className="project-editor-badge">
              {getEditorIcon(project.defaultEditor || 'vscode')}
              <span className="editor-name">
                {availableEditors.find(e => e.id === (project.defaultEditor || 'vscode'))?.name || 'Editor'}
              </span>
            </div>
          </div>
        </div>
        <div className="project-actions">
          <button
            className="btn-icon"
            onClick={() => onEdit(project)}
            title="Edit project"
          >
            <Edit size={16} />
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(project.id)}
            title="Delete project"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {project.description && (
        <p className="project-description">{project.description}</p>
      )}

      <div className="project-path">
        <span className="path-text" title={project.path}>
          {project.path}
        </span>
        <button
          className="btn-icon"
          onClick={() => onOpenFolder(project.path)}
          title="Open in file manager"
        >
          <FolderOpen size={14} />
        </button>
      </div>

      {project.tags && (
        <div className="project-tags">
          {project.tags.split(',').map((tag, i) => (
            <span key={i} className="tag">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="project-footer">
        <button
          className="btn btn-primary"
          onClick={() => onOpen(project)}
        >
          <ExternalLink className="icon" />
          Open in {availableEditors.find(e => e.id === (project.defaultEditor || selectedEditor))?.name || 'Editor'}
        </button>
        
        <div className="editor-dropdown">
          <select
            className="editor-select"
            value={project.defaultEditor || selectedEditor}
            onChange={(e) => handleEditorChange(e.target.value)}
            title="Open in different editor"
          >
            {availableEditors.map(editor => (
              <option key={editor.id} value={editor.id} disabled={!editor.isInstalled}>
                {editor.name}{!editor.isInstalled ? ' (Not Installed)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 