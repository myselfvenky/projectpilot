import React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import './ThemeControls.css';

const ThemeControls = ({ darkMode, colorTheme, onToggleDarkMode, onCycleColorTheme }) => {
  return (
    <div className="theme-controls">
      <div className="color-theme-selector">
        <button
          className="btn-icon theme-btn"
          onClick={onCycleColorTheme}
          name="Change color theme"
          title="Change color theme"
        >
          <Palette className="icon" />
        </button>
      </div>
      <button
        className="btn-icon theme-btn"
        onClick={onToggleDarkMode}
        name={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? <Sun className="icon" /> : <Moon className="icon" />}
      </button>
    </div>
  );
};

export default ThemeControls; 