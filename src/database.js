const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const os = require('os');

// Conditional database driver loading
let Database;
let isBetterSqlite3 = false;
let useJsonFallback = false;

try {
  if (os.platform() === 'win32') {
    // Try sqlite3 for Windows first
    try {
      Database = require('sqlite3').Database;
      console.log('Using sqlite3 driver for Windows');
    } catch (sqlite3Error) {
      console.warn('sqlite3 not available, trying better-sqlite3:', sqlite3Error.message);
      try {
        Database = require('better-sqlite3');
        isBetterSqlite3 = true;
        console.log('Using better-sqlite3 driver for Windows (fallback)');
      } catch (betterSqliteError) {
        console.warn('better-sqlite3 also not available, using JSON fallback:', betterSqliteError.message);
        useJsonFallback = true;
      }
    }
  } else {
    // Try better-sqlite3 for Mac/Linux first
    try {
      Database = require('better-sqlite3');
      isBetterSqlite3 = true;
      console.log('Using better-sqlite3 driver for Mac/Linux');
    } catch (betterSqliteError) {
      console.warn('better-sqlite3 not available, trying sqlite3:', betterSqliteError.message);
      try {
        Database = require('sqlite3').Database;
        console.log('Using sqlite3 driver for Mac/Linux (fallback)');
      } catch (sqlite3Error) {
        console.warn('sqlite3 also not available, using JSON fallback:', sqlite3Error.message);
        useJsonFallback = true;
      }
    }
  }
} catch (error) {
  console.error('Error loading database driver:', error);
  useJsonFallback = true;
}

if (useJsonFallback) {
  console.log('Using JSON file fallback for database storage');
}

class ProjectDatabase {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.projects = [];
    this.dataPath = null;
    this.useJsonFallback = useJsonFallback; // Store fallback state in instance
  }

  // Initialize the database
  async init() {
    try {
      const userDataPath = app.getPath('userData');
      
      if (this.useJsonFallback) {
        // JSON fallback
        this.dataPath = path.join(userDataPath, 'devlaunch-projects.json');
        console.log('JSON Database path:', this.dataPath);
        this.loadProjects();
        console.log('Connected to JSON database');
      } else {
        // SQLite database
        this.dbPath = path.join(userDataPath, 'devlaunch.db');
        console.log('SQLite Database path:', this.dbPath);

        if (isBetterSqlite3) {
          this.db = new Database(this.dbPath);
          console.log('Connected to SQLite database with better-sqlite3');
          this.createTables();
        } else {
          await this.initSqlite3();
          console.log('Connected to SQLite database with sqlite3');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      // If SQLite fails, fallback to JSON
      console.log('Falling back to JSON storage due to initialization error');
      this.useJsonFallback = true;
      this.dataPath = path.join(app.getPath('userData'), 'devlaunch-projects.json');
      this.loadProjects();
      return true;
    }
  }

  // Initialize sqlite3 (callback-based)
  initSqlite3() {
    return new Promise((resolve, reject) => {
      this.db = new Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  // JSON fallback methods
  loadProjects() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        this.projects = JSON.parse(data);
        console.log(`Loaded ${this.projects.length} projects from JSON database`);
      } else {
        this.projects = [];
        console.log('No existing projects file found, starting with empty JSON database');
      }
    } catch (error) {
      console.error('Error loading projects from JSON:', error);
      this.projects = [];
    }
  }

  saveProjects() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const data = JSON.stringify(this.projects, null, 2);
      fs.writeFileSync(this.dataPath, data, 'utf8');
      console.log(`Saved ${this.projects.length} projects to JSON database`);
    } catch (error) {
      console.error('Error saving projects to JSON:', error);
      throw error;
    }
  }

  // Create the projects table (SQLite only)
  createTables() {
    if (this.useJsonFallback) return Promise.resolve();

    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        path TEXT NOT NULL,
        tags TEXT,
        defaultEditor TEXT,
        projectIcon TEXT DEFAULT 'folder',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        sortOrder INTEGER DEFAULT 0
      )
    `;

    if (isBetterSqlite3) {
      try {
        this.db.exec(createProjectsTable);
        console.log('Projects table created/verified with better-sqlite3');
      } catch (error) {
        console.error('Error creating projects table:', error);
        throw error;
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(createProjectsTable, (err) => {
          if (err) {
            console.error('Error creating projects table:', err);
            reject(err);
          } else {
            console.log('Projects table created/verified with sqlite3');
            resolve();
          }
        });
      });
    }
  }

  // Get all projects
  getAllProjects() {
    if (!this.isConnected()) {
      console.error('Database not connected');
      return Promise.resolve([]);
    }

    if (this.useJsonFallback) {
      try {
        const sortedProjects = [...this.projects].sort((a, b) => {
          const aOrder = a.sortOrder || 0;
          const bOrder = b.sortOrder || 0;
          
          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        console.log(`Fetched ${sortedProjects.length} projects from JSON database`);
        return Promise.resolve(sortedProjects);
      } catch (error) {
        console.error('Error fetching projects from JSON:', error);
        return Promise.resolve([]);
      }
    } else if (isBetterSqlite3) {
      try {
        const query = 'SELECT * FROM projects ORDER BY sortOrder ASC, createdAt DESC';
        const rows = this.db.prepare(query).all();
        console.log(`Fetched ${rows.length} projects from database`);
        return Promise.resolve(rows);
      } catch (error) {
        console.error('Error fetching projects:', error);
        return Promise.resolve([]);
      }
    } else {
      return new Promise((resolve) => {
        const query = 'SELECT * FROM projects ORDER BY sortOrder ASC, createdAt DESC';
        this.db.all(query, (err, rows) => {
          if (err) {
            console.error('Error fetching projects:', err);
            resolve([]);
          } else {
            console.log(`Fetched ${rows.length} projects from database`);
            resolve(rows);
          }
        });
      });
    }
  }

  // Save a project (insert or update)
  async saveProject(project) {
    if (!this.isConnected()) {
      throw new Error('Database not connected');
    }

    if (this.useJsonFallback) {
      try {
        const existingIndex = this.projects.findIndex(p => p.id === project.id);
        
        if (existingIndex !== -1) {
          // Update existing project
          this.projects[existingIndex] = {
            ...this.projects[existingIndex],
            ...project,
            updatedAt: project.updatedAt || new Date().toISOString()
          };
        } else {
          // Insert new project
          const newProject = {
            ...project,
            createdAt: project.createdAt || new Date().toISOString(),
            updatedAt: project.updatedAt || new Date().toISOString(),
            sortOrder: project.sortOrder || 0
          };
          this.projects.push(newProject);
        }
        
        this.saveProjects();
        console.log('Project saved to JSON:', project.id);
        return { id: project.id, changes: 1 };
      } catch (error) {
        console.error('Error saving project to JSON:', error);
        throw error;
      }
    } else {
      try {
        const existingProject = await this.getProjectById(project.id);
        
        if (existingProject) {
          return await this.updateProject(project);
        } else {
          return await this.insertProject(project);
        }
      } catch (error) {
        console.error('Error saving project:', error);
        throw error;
      }
    }
  }

  // Get project by ID
  getProjectById(projectId) {
    if (this.useJsonFallback) {
      const result = this.projects.find(p => p.id === projectId);
      return Promise.resolve(result);
    } else if (isBetterSqlite3) {
      try {
        const result = this.db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
        return Promise.resolve(result);
      } catch (error) {
        console.error('Error getting project by ID:', error);
        return Promise.resolve(null);
      }
    } else {
      return new Promise((resolve) => {
        this.db.get('SELECT id FROM projects WHERE id = ?', [projectId], (err, row) => {
          if (err) {
            console.error('Error getting project by ID:', err);
            resolve(null);
          } else {
            resolve(row);
          }
        });
      });
    }
  }

  // Insert a new project (SQLite only)
  insertProject(project) {
    if (this.useJsonFallback) {
      // This is handled in saveProject for JSON
      return Promise.resolve({ id: project.id, changes: 1 });
    }

    const query = `
      INSERT INTO projects (
        id, name, description, path, tags, defaultEditor, 
        projectIcon, createdAt, updatedAt, sortOrder
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      project.id,
      project.name,
      project.description || '',
      project.path,
      project.tags || '',
      project.defaultEditor || 'vscode',
      project.projectIcon || 'folder',
      project.createdAt,
      project.updatedAt,
      project.sortOrder || 0
    ];

    if (isBetterSqlite3) {
      try {
        const stmt = this.db.prepare(query);
        const result = stmt.run(...params);
        console.log('Project inserted with ID:', project.id);
        return Promise.resolve({ id: project.id, changes: result.changes });
      } catch (error) {
        console.error('Error inserting project:', error);
        return Promise.reject(error);
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(query, params, function(err) {
          if (err) {
            console.error('Error inserting project:', err);
            reject(err);
          } else {
            console.log('Project inserted with ID:', project.id);
            resolve({ id: project.id, changes: this.changes });
          }
        });
      });
    }
  }

  // Update an existing project (SQLite only)
  updateProject(project) {
    if (this.useJsonFallback) {
      // This is handled in saveProject for JSON
      return Promise.resolve({ id: project.id, changes: 1 });
    }

    const query = `
      UPDATE projects SET 
        name = ?, description = ?, path = ?, tags = ?, 
        defaultEditor = ?, projectIcon = ?, updatedAt = ?, sortOrder = ?
      WHERE id = ?
    `;

    const params = [
      project.name,
      project.description || '',
      project.path,
      project.tags || '',
      project.defaultEditor || 'vscode',
      project.projectIcon || 'folder',
      project.updatedAt,
      project.sortOrder || 0,
      project.id
    ];

    if (isBetterSqlite3) {
      try {
        const stmt = this.db.prepare(query);
        const result = stmt.run(...params);
        console.log('Project updated:', project.id);
        return Promise.resolve({ id: project.id, changes: result.changes });
      } catch (error) {
        console.error('Error updating project:', error);
        return Promise.reject(error);
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(query, params, function(err) {
          if (err) {
            console.error('Error updating project:', err);
            reject(err);
          } else {
            console.log('Project updated:', project.id);
            resolve({ id: project.id, changes: this.changes });
          }
        });
      });
    }
  }

  // Delete a project
  deleteProject(projectId) {
    if (this.useJsonFallback) {
      try {
        const initialLength = this.projects.length;
        this.projects = this.projects.filter(p => p.id !== projectId);
        const changes = initialLength - this.projects.length;
        
        if (changes > 0) {
          this.saveProjects();
        }
        
        console.log('Project deleted from JSON:', projectId);
        return Promise.resolve({ id: projectId, changes });
      } catch (error) {
        console.error('Error deleting project from JSON:', error);
        return Promise.reject(error);
      }
    } else {
      const query = 'DELETE FROM projects WHERE id = ?';

      if (isBetterSqlite3) {
        try {
          const stmt = this.db.prepare(query);
          const result = stmt.run(projectId);
          console.log('Project deleted:', projectId);
          return Promise.resolve({ id: projectId, changes: result.changes });
        } catch (error) {
          console.error('Error deleting project:', error);
          return Promise.reject(error);
        }
      } else {
        return new Promise((resolve, reject) => {
          this.db.run(query, [projectId], function(err) {
            if (err) {
              console.error('Error deleting project:', err);
              reject(err);
            } else {
              console.log('Project deleted:', projectId);
              resolve({ id: projectId, changes: this.changes });
            }
          });
        });
      }
    }
  }

  // Update project order for drag and drop
  updateProjectsOrder(projectsWithOrder) {
    if (this.useJsonFallback) {
      try {
        projectsWithOrder.forEach((project, index) => {
          const existingProject = this.projects.find(p => p.id === project.id);
          if (existingProject) {
            existingProject.sortOrder = index;
          }
        });

        this.saveProjects();
        console.log('Project order updated successfully in JSON');
        return Promise.resolve(true);
      } catch (error) {
        console.error('Error updating project order in JSON:', error);
        return Promise.reject(error);
      }
    } else if (isBetterSqlite3) {
      try {
        const updateStmt = this.db.prepare('UPDATE projects SET sortOrder = ? WHERE id = ?');
        
        const updateTransaction = this.db.transaction((projects) => {
          projects.forEach((project, index) => {
            updateStmt.run(index, project.id);
          });
        });

        updateTransaction(projectsWithOrder);
        console.log('Project order updated successfully');
        return Promise.resolve(true);
      } catch (error) {
        console.error('Error updating project order:', error);
        return Promise.reject(error);
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.serialize(() => {
          this.db.run('BEGIN TRANSACTION');
          
          let completed = 0;
          let hasError = false;
          
          projectsWithOrder.forEach((project, index) => {
            this.db.run('UPDATE projects SET sortOrder = ? WHERE id = ?', [index, project.id], (err) => {
              if (err && !hasError) {
                hasError = true;
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              completed++;
              if (completed === projectsWithOrder.length && !hasError) {
                this.db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    reject(commitErr);
                  } else {
                    console.log('Project order updated successfully');
                    resolve(true);
                  }
                });
              }
            });
          });
        });
      });
    }
  }

  // Close database connection
  close() {
    if (this.useJsonFallback) {
      try {
        this.saveProjects(); // Save any pending changes
        console.log('JSON database connection closed');
      } catch (error) {
        console.error('Error closing JSON database:', error);
      }
    } else if (this.db) {
      try {
        if (isBetterSqlite3) {
          this.db.close();
        } else {
          this.db.close();
        }
        console.log('SQLite database connection closed');
        this.db = null;
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
  }

  // Check if database is connected
  isConnected() {
    if (this.useJsonFallback) {
      return this.dataPath !== null;
    } else if (isBetterSqlite3) {
      return this.db !== null && this.db.open;
    } else {
      return this.db !== null;
    }
  }

  // Get database statistics
  getStats() {
    if (this.useJsonFallback) {
      return {
        totalProjects: this.projects.length,
        dataPath: this.dataPath,
        storageType: 'JSON'
      };
    } else if (isBetterSqlite3) {
      try {
        const result = this.db.prepare('SELECT COUNT(*) as count FROM projects').get();
        return { totalProjects: result.count, storageType: 'SQLite (better-sqlite3)' };
      } catch (error) {
        console.error('Error getting database stats:', error);
        return { totalProjects: 0, storageType: 'SQLite (better-sqlite3)' };
      }
    } else {
      return new Promise((resolve) => {
        this.db.get('SELECT COUNT(*) as count FROM projects', (err, row) => {
          if (err) {
            console.error('Error getting database stats:', err);
            resolve({ totalProjects: 0, storageType: 'SQLite (sqlite3)' });
          } else {
            resolve({ totalProjects: row.count, storageType: 'SQLite (sqlite3)' });
          }
        });
      });
    }
  }
}

module.exports = ProjectDatabase; 