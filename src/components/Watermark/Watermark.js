import React from 'react';
import { Heart } from 'lucide-react';
import './Watermark.css';

const Watermark = () => {
  const handleLinkClick = async (e) => {
    e.preventDefault();
    const url = 'https://www.venkyscode.com/psquare';
    
    console.log('🔗 Watermark link clicked!');
    console.log('📱 Available APIs:', {
      electronAPI: !!window.electronAPI,
      openExternal: !!(window.electronAPI && window.electronAPI.openExternal),
      require: !!window.require
    });
    
    try {
      // Method 1: Try Electron IPC
      if (window.electronAPI && window.electronAPI.openExternal) {
        console.log('🚀 Method 1: Trying Electron IPC...');
        const result = await window.electronAPI.openExternal(url);
        console.log('📊 IPC Result:', result);
        
        if (result && result.success) {
          console.log('✅ Method 1 SUCCESS: Opened via Electron IPC');
          return;
        } else {
          console.error('❌ Method 1 FAILED:', result?.error || 'Unknown error');
        }
      } else {
        console.warn('⚠️ Method 1 SKIPPED: Electron API not available');
      }
      
      // Method 2: Try direct shell access (if nodeIntegration is enabled)
      if (window.require) {
        console.log('🚀 Method 2: Trying direct shell access...');
        try {
          const { shell } = window.require('electron');
          await shell.openExternal(url);
          console.log('✅ Method 2 SUCCESS: Opened via direct shell');
          return;
        } catch (shellError) {
          console.error('❌ Method 2 FAILED:', shellError);
        }
      } else {
        console.warn('⚠️ Method 2 SKIPPED: require not available');
      }
      
      // Method 3: Force external browser (shouldn't work in Electron but let's try)
      console.log('🚀 Method 3: Trying window.open...');
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (opened) {
        console.log('✅ Method 3 SUCCESS: Opened via window.open');
      } else {
        console.error('❌ Method 3 FAILED: window.open returned null');
      }
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in handleLinkClick:', error);
      
      // Emergency fallback
      console.log('🆘 EMERGENCY: Trying basic window.open...');
      window.open(url);
    }
  };

  return (
    <footer className="watermark">
      <div className="watermark-content">
        <span className="watermark-text">Made with</span>
        <Heart className="watermark-heart" />
        <span className="watermark-text">by</span>
        <button 
          className="watermark-link"
          onClick={handleLinkClick}
          title="Visit venkyscode.com"
        >
          Venkyscode
        </button>
      </div>
    </footer>
  );
};

export default Watermark; 