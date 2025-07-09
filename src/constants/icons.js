import { 
  Code, Terminal, Zap, Smartphone, FileText, Atom, Box, 
  Cpu, Database, Globe, Layers, Paintbrush, Coffee, Braces, Hash,
  Folder, Rocket, Star, Heart, Target, Briefcase, Book, Camera, 
  Music, Palette as PaletteIcon, Monitor, Cloud, Shield, Key, Gift 
} from 'lucide-react';

// Editor icon mapping
export const getEditorIcon = (editorId) => {
  const iconMap = {
    'vscode': <Code className="editor-icon" />,
    'cursor': <Zap className="editor-icon" />,
    'webstorm': <Globe className="editor-icon" />,
    'androidstudio': <Smartphone className="editor-icon" />,
    'sublime': <FileText className="editor-icon" />,
    'atom': <Atom className="editor-icon" />,
    'xcode': <Box className="editor-icon" />,
    'intellij': <Cpu className="editor-icon" />,
    'pycharm': <Database className="editor-icon" />,
    'rubymine': <Layers className="editor-icon" />,
    'phpstorm': <Paintbrush className="editor-icon" />,
    'clion': <Coffee className="editor-icon" />,
    'rider': <Braces className="editor-icon" />,
    'datagrip': <Hash className="editor-icon" />,
    'vim': <Terminal className="editor-icon" />,
    'emacs': <Terminal className="editor-icon" />,
    'nano': <Terminal className="editor-icon" />,
    'notepadpp': <FileText className="editor-icon" />,
    'brackets': <Code className="editor-icon" />,
    'eclipse': <Database className="editor-icon" />,
    'netbeans': <Globe className="editor-icon" />,
    'kate': <FileText className="editor-icon" />,
    'gedit': <FileText className="editor-icon" />
  };
  return iconMap[editorId] || <Code className="editor-icon" />;
};

// Project icon mapping
export const getProjectIcon = (iconId) => {
  const iconMap = {
    'folder': <Folder className="project-icon" />,
    'rocket': <Rocket className="project-icon" />,
    'star': <Star className="project-icon" />,
    'heart': <Heart className="project-icon" />,
    'target': <Target className="project-icon" />,
    'briefcase': <Briefcase className="project-icon" />,
    'book': <Book className="project-icon" />,
    'camera': <Camera className="project-icon" />,
    'music': <Music className="project-icon" />,
    'palette': <PaletteIcon className="project-icon" />,
    'monitor': <Monitor className="project-icon" />,
    'cloud': <Cloud className="project-icon" />,
    'shield': <Shield className="project-icon" />,
    'key': <Key className="project-icon" />,
    'gift': <Gift className="project-icon" />,
    'code': <Code className="project-icon" />,
    'terminal': <Terminal className="project-icon" />,
    'zap': <Zap className="project-icon" />,
    'globe': <Globe className="project-icon" />
  };
  return iconMap[iconId] || <Folder className="project-icon" />;
};

// Available project icons for selection
export const projectIconOptions = [
  { id: 'folder', name: 'Folder', icon: <Folder /> },
  { id: 'rocket', name: 'Rocket', icon: <Rocket /> },
  { id: 'star', name: 'Star', icon: <Star /> },
  { id: 'heart', name: 'Heart', icon: <Heart /> },
  { id: 'target', name: 'Target', icon: <Target /> },
  { id: 'briefcase', name: 'Business', icon: <Briefcase /> },
  { id: 'book', name: 'Learning', icon: <Book /> },
  { id: 'camera', name: 'Media', icon: <Camera /> },
  { id: 'music', name: 'Audio', icon: <Music /> },
  { id: 'palette', name: 'Design', icon: <PaletteIcon /> },
  { id: 'monitor', name: 'Desktop', icon: <Monitor /> },
  { id: 'cloud', name: 'Cloud', icon: <Cloud /> },
  { id: 'shield', name: 'Security', icon: <Shield /> },
  { id: 'key', name: 'API/Auth', icon: <Key /> },
  { id: 'gift', name: 'Personal', icon: <Gift /> },
  { id: 'code', name: 'Code', icon: <Code /> },
  { id: 'terminal', name: 'CLI', icon: <Terminal /> },
  { id: 'zap', name: 'Performance', icon: <Zap /> },
  { id: 'globe', name: 'Web', icon: <Globe /> }
]; 