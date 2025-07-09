# DevLaunch ⚡

A stunning, glassmorphic cross-platform desktop application for managing and launching your coding projects with style! Features beautiful UI, custom project icons, drag-and-drop reordering, and support for 23+ popular editors including VS Code, Cursor, Android Studio, and more.

![DevLaunch](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![Electron](https://img.shields.io/badge/Electron-28.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)

## ✨ Features

🎨 **Glassmorphic Design** - Stunning glass-like effects with backdrop blur and transparency

🎯 **23+ Editor Support** - VS Code, Cursor, WebStorm, Android Studio, IntelliJ suite, Sublime, Vim, Emacs, Xcode, and more

🎭 **Custom Project Icons** - Choose from 20+ beautiful icons to personalize your projects (Rocket, Star, Heart, Code, etc.)

🌓 **Dark/Light Modes** - Automatic system detection with manual toggle

🎨 **4 Color Themes** - Purple, Blue, Green, and Orange themes to match your style

🖱️ **Drag & Drop Reordering** - Intuitively rearrange your projects with beautiful animations

🔍 **Smart Search** - Quickly find projects by name, description, or tags

📁 **Advanced Project Management** - Add, edit, and organize projects with rich metadata

💾 **Auto-Save** - Projects are automatically saved locally with instant sync

🖥️ **Cross-Platform** - Works seamlessly on macOS, Windows, and Linux

⚡ **Lightning Fast** - One-click project launching in your preferred editor

🔒 **Secure** - Local data storage with no cloud dependencies

## Screenshots

### Main Interface
The clean, modern interface shows all your projects in an organized grid layout.

### Add/Edit Project Modal
Easy-to-use form for adding new projects or editing existing ones.

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Development Setup

1. **Clone the repository** (if you have it in a git repo, otherwise skip this step)
   ```bash
   git clone <your-repo-url>
   cd project-navigator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development mode**
   ```bash
   npm run dev
   ```
   This will start both the React development server and the Electron app.

### Building for Production

#### Build for all platforms
```bash
npm run build
```

#### Build for specific platforms
```bash
# macOS
npm run build-mac

# Windows
npm run build-win
```

The built applications will be available in the `dist/` folder.

## Usage

### Adding a Project

1. Click the **"Add Project"** button in the header
2. Fill in the project details:
   - **Name**: Your project name (required)
   - **Description**: Brief description of the project (optional)
   - **Path**: Select the project folder using the Browse button (required)
   - **Tags**: Comma-separated tags for easy searching (optional)
   - **Default Editor**: Choose your preferred editor from available options
3. Click **"Add Project"** to save

### Opening Projects

- **Primary Action**: Click the main "Open in [Editor]" button to open in the default editor
- **Alternative Editors**: Use the dropdown to open in different editors
- **File Manager**: Click the folder icon next to the path to open the project folder in your system's file manager

### Searching Projects

Use the search bar in the header to filter projects by:
- Project name
- Description
- Tags

### Managing Projects

- **Edit**: Click the edit icon (pencil) on any project card
- **Delete**: Click the delete icon (trash) and confirm deletion
- **View Path**: The full project path is displayed on each card

## Supported Editors

The application automatically detects which editors are installed on your system:

- **Visual Studio Code** (`code` command)
- **Cursor** (`cursor` command)
- **WebStorm** (`webstorm` command)
- **Android Studio** (`studio` command)
- **Sublime Text** (`subl` command)
- **Atom** (`atom` command)
- **Vim** (`vim` command)
- **Emacs** (`emacs` command)

### Adding Editor to PATH

For editors to be detected, their command-line tools must be available in your system's PATH:

#### Visual Studio Code
- **macOS/Linux**: Install "Shell Command: Install 'code' command in PATH" from VS Code Command Palette
- **Windows**: Add VS Code installation directory to PATH

#### Cursor
- **macOS/Linux**: Install shell command from Cursor settings
- **Windows**: Add Cursor installation directory to PATH

#### Other Editors
Refer to your editor's documentation for setting up command-line access.

## Data Storage

Projects are stored locally in:
- **macOS**: `~/Library/Application Support/devlaunch/projects.json`
- **Windows**: `%APPDATA%/devlaunch/projects.json`
- **Linux**: `~/.config/devlaunch/projects.json`

## 🎨 Customizing Icons & Favicon

### Adding a Custom Favicon

To replace the default favicon with your own:

1. **Prepare your icon files**:
   - `favicon.ico` (16x16, 32x32, 48x48 sizes)
   - `logo192.png` (192x192 for PWA)
   - `logo512.png` (512x512 for PWA)

2. **Place files in the public folder**:
   ```
   public/
   ├── favicon.ico
   ├── logo192.png
   └── logo512.png
   ```

3. **Update manifest.json** (already configured):
   ```json
   {
     "icons": [
       {
         "src": "favicon.ico",
         "sizes": "64x64 32x32 24x24 16x16",
         "type": "image/x-icon"
       },
       {
         "src": "logo192.png",
         "type": "image/png",
         "sizes": "192x192"
       },
       {
         "src": "logo512.png",
         "type": "image/png",
         "sizes": "512x512"
       }
     ]
   }
   ```

4. **For Electron app icons** (for building distributables):
   - Place platform-specific icons in a `build/` folder:
     ```
     build/
     ├── icon.icns     # macOS icon (512x512)
     ├── icon.ico      # Windows icon (256x256)
     └── icon.png      # Linux icon (512x512)
     ```

5. **Rebuild the app**:
   ```bash
   npm run react-build
   npm run build
   ```

### Creating High-Quality Icons

**Recommended tools**:
- **Figma** or **Sketch** for design
- **GIMP** or **Photoshop** for editing
- **IconKitchen** or **RealFaviconGenerator** for generating all sizes

**Icon specifications**:
- **Favicon**: 16x16, 32x32, 48x48 (ICO format)
- **App icons**: 512x512 (PNG), then convert to platform formats
- **Design tips**: Use bold, simple shapes that work at small sizes

### Available Project Icons

Choose from 20+ built-in project icons:
- 📁 **Folder** - General projects
- 🚀 **Rocket** - Launch projects, startups
- ⭐ **Star** - Featured projects
- ❤️ **Heart** - Personal favorites
- 🎯 **Target** - Goal-oriented projects
- 💼 **Briefcase** - Business projects
- 📚 **Book** - Learning projects
- 📷 **Camera** - Media projects
- 🎵 **Music** - Audio projects
- 🎮 **Game** - Gaming projects
- 🎨 **Palette** - Design projects
- 🖥️ **Monitor** - Desktop apps
- ☁️ **Cloud** - Cloud projects
- 🛡️ **Shield** - Security projects
- 🔑 **Key** - API/Authentication
- 🎁 **Gift** - Personal projects
- 💻 **Code** - Coding projects
- ⚡ **Terminal** - CLI tools
- ⚡ **Zap** - Performance projects
- 🌐 **Globe** - Web projects

## Development

### Project Structure
```
project-navigator/
├── src/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Preload script for security
│   ├── App.js           # Main React component
│   ├── App.css          # Application styles
│   ├── index.js         # React entry point
│   └── index.css        # Global styles
├── public/
│   └── index.html       # HTML template
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

### Scripts
- `npm start` - Start Electron app (production mode)
- `npm run dev` - Start development mode with hot reload
- `npm run react-start` - Start only React development server
- `npm run react-build` - Build React app for production
- `npm run build` - Build Electron app for current platform
- `npm run build-mac` - Build for macOS
- `npm run build-win` - Build for Windows

### Technologies Used
- **Electron** - Cross-platform desktop app framework
- **React** - User interface library
- **Lucide React** - Beautiful icons
- **Node.js** - Backend runtime for file operations and process spawning

## Troubleshooting

### Editor Not Opening
1. Ensure the editor is installed and working
2. Verify the editor's command-line tool is in your PATH
3. Try opening the editor from terminal/command prompt manually
4. Restart the Project Navigator app

### Projects Not Saving
1. Check file permissions in the application data directory
2. Ensure adequate disk space
3. Try running the app as administrator (Windows) or with appropriate permissions

### App Won't Start
1. Ensure Node.js and npm are properly installed
2. Delete `node_modules` and run `npm install` again
3. Check for any antivirus software blocking the app

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on your platform
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Roadmap

- [ ] Project templates and initialization
- [ ] Git integration and status display
- [ ] Project statistics and recent files
- [ ] Themes and customization options
- [ ] Project grouping and folders
- [ ] Export/import project configurations
- [ ] Terminal integration
- [ ] Plugin system for custom editors

---

**Happy Coding!** 🚀 