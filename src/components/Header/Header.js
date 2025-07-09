import React from 'react';
import { Plus, Zap, Monitor, Move, ExternalLink } from 'lucide-react';
import SearchBar from '../SearchBar/SearchBar';
import ThemeControls from '../ThemeControls/ThemeControls';
import './Header.css';

const Header = ({ 
  searchTerm, 
  onSearchChange, 
  darkMode, 
  colorTheme, 
  onToggleDarkMode, 
  onCycleColorTheme,
  onAddProject 
}) => {
  const handleCenterWindow = async () => {
    try {
      await window.electronAPI.centerWindow();
    } catch (error) {
      console.error('Failed to center window:', error);
    }
  };

  const handleEnableMovement = async () => {
    try {
      const result = await window.electronAPI.enableWindowMovement();
      console.log('Window movement status:', result);
      if (result.success) {
        alert(`Window movement enabled!\nMovable: ${result.movable}\nResizable: ${result.resizable}`);
      }
    } catch (error) {
      console.error('Failed to enable window movement:', error);
    }
  };

  const handleTestLink = async () => {
    console.log('🧪 Testing external link...');
    try {
      if (window.electronAPI && window.electronAPI.openExternal) {
        const result = await window.electronAPI.openExternal('https://www.venkyscode.com/psquare');
        console.log('Test result:', result);
        alert(`Link test result: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.error || ''}`);
      } else {
        alert('Electron API not available for testing');
      }
    } catch (error) {
      console.error('Link test error:', error);
      alert(`Link test error: ${error.message}`);
    }
  };
  return (
    <header className="header">
      <div className="header-content">
        <h1>
          <Zap className="icon app-logo" />
          Project Pilot
        </h1>
        <div className="header-actions">
          <SearchBar 
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
          />
          <ThemeControls
            darkMode={darkMode}
            colorTheme={colorTheme}
            onToggleDarkMode={onToggleDarkMode}
            onCycleColorTheme={onCycleColorTheme}
          />
          <button
            className="btn-icon theme-btn"
            onClick={handleCenterWindow}
            name="Center window on screen"
            title="Center window on screen"
          >
            <Monitor className="icon" />
          </button>
          <button
            className="btn btn-primary"
            onClick={onAddProject}
          >
            <Plus className="icon" />
            Add Project
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 