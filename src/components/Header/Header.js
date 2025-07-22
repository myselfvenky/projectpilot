import React from 'react';
import { Plus, Zap, Monitor, Move, ExternalLink, Stethoscope, GitBranch } from 'lucide-react';
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
  onAddProject,
  onCloneProject 
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

  const handleRunDiagnostics = async () => {
    try {
      console.log('🔍 Running system diagnostics...');
      const diagnostics = await window.electronAPI.runDiagnostics();
      
      // Format diagnostics for display
      let report = `🔍 SYSTEM DIAGNOSTICS REPORT\n\n`;
      report += `Platform: ${diagnostics.platform} (${diagnostics.arch})\n`;
      report += `Node: ${diagnostics.nodeVersion}\n`;
      report += `Electron: ${diagnostics.electronVersion}\n`;
      report += `User: ${diagnostics.userInfo.username}\n\n`;
      
      report += `📋 COMMAND AVAILABILITY:\n`;
      Object.entries(diagnostics.commands).forEach(([cmd, available]) => {
        report += `  ${cmd}: ${available ? '✅ AVAILABLE' : '❌ NOT FOUND'}\n`;
      });
      
      report += `\n🧪 SPAWN TEST: ${diagnostics.spawnTest.success ? '✅ PASSED' : '❌ FAILED'}`;
      if (!diagnostics.spawnTest.success) {
        report += ` - ${diagnostics.spawnTest.error}`;
      }
      
      if (diagnostics.errors.length > 0) {
        report += `\n\n⚠️ ERRORS:\n`;
        diagnostics.errors.forEach(error => {
          report += `  • ${error}\n`;
        });
      }
      
      // Show suggestions based on platform
      if (diagnostics.platform === 'win32') {
        report += `\n💡 WINDOWS TROUBLESHOOTING:\n`;
        if (!diagnostics.commands.code) {
          report += `  • VS Code not found in PATH\n`;
          report += `  • Install VS Code and add to PATH\n`;
          report += `  • Or use File Explorer to open projects\n`;
        }
        report += `  • Make sure editors are installed properly\n`;
        report += `  • Restart Project Pilot after installing editors\n`;
      }
      
      console.log('Diagnostics report:', diagnostics);
      alert(report);
    } catch (error) {
      console.error('Diagnostics error:', error);
      alert(`Failed to run diagnostics: ${error.message}`);
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
          {/* <button
            className="btn-icon theme-btn"
            onClick={handleRunDiagnostics}
            name="Run system diagnostics"
            title="Run system diagnostics (helpful for troubleshooting)"
          >
            <Stethoscope className="icon" />
          </button> */}
          <button
            className="btn-icon theme-btn"
            onClick={handleCenterWindow}
            name="Center window on screen"
            title="Center window on screen"
          >
            <Monitor className="icon" />
          </button>
          <button
            className="btn btn-secondary"
            onClick={onCloneProject}
            title="Clone repository from GitHub"
          >
            <GitBranch className="icon" />
            Clone from GitHub
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