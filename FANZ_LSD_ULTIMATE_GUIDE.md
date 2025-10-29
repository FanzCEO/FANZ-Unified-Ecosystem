# 🚀 FANZ LSD Ultimate Development Guide

*Complete reference for your supercharged terminal environment*

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Basic Commands](#-basic-commands) 
- [FANZ-Specific Tools](#-fanz-specific-tools)
- [Development Workflow](#-development-workflow)
- [Advanced Features](#-advanced-features)
- [Pro Features](#-pro-features)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

**Essential Commands to Try Right Now:**

```bash
fanz          # Complete project dashboard
ltree         # Beautiful project tree view
lservices     # Browse your microservices
lbig          # Find largest files/folders
fanz-help     # Complete command reference
```

---

## 📁 Basic Commands

### Core Listing Commands
| Command | Description | Example |
|---------|-------------|---------|
| `l` | Quick listing with colors & icons | `l` |
| `ll` | Long format listing | `ll` |
| `la` | Long listing with hidden files | `la` |
| `lt` | Sort by modification time | `lt` |
| `ls` | Enhanced ls with directories first | `ls` |

### Development-Focused Aliases
| Command | Description | Example |
|---------|-------------|---------|
| `lcode` | Clean listing (no node_modules, .git, etc.) | `lcode` |
| `ltree` | Tree view (depth 2) | `ltree` |
| `ltree3` | Tree view (depth 3) | `ltree3` |
| `lg` | List with git status | `lg` |
| `lsize` | Sort by size with totals | `lsize` |

---

## 🎯 FANZ-Specific Tools

### Project Navigation
| Command | Description | Example |
|---------|-------------|---------|
| `lservices` | Browse microservices | `lservices` |
| `lapis` | API-related directories | `lapis` |
| `lfrontend` | Frontend source files | `lfrontend` |
| `lfanz-services` | Find FANZ services | `lfanz-services` |
| `lplatforms` | Tree view of platforms & services | `lplatforms` |

### File Type Filtering  
| Command | Description | Example |
|---------|-------------|---------|
| `lts` | TypeScript/JavaScript files | `lts` |
| `lmd` | Markdown files | `lmd` |
| `ldocker` | Docker/compose files | `ldocker` |
| `lconfigs` | Configuration files (json, yaml, etc.) | `lconfigs` |
| `lscripts` | Executable scripts | `lscripts` |

---

## 🔧 Development Workflow

### Size & Analysis
| Command | Description | Example |
|---------|-------------|---------|
| `lbig` | Show 20 largest files/directories | `lbig` |
| `ldisk` | Disk usage tree view | `ldisk` |
| `lrecent` | 10 most recently modified files | `lrecent` |
| `ldisk-summary` | Complete disk usage analysis | `ldisk-summary` |

### Git Integration
| Command | Description | Example |
|---------|-------------|---------|
| `lgit-modified` | Git modified files | `lgit-modified` |
| `lgit-recent` | Recent git changes | `lgit-recent` |
| `lchanged` | Show only changed files | `lchanged` |

---

## ⚡ Advanced Features

### Tool Combinations
| Command | Description | Example |
|---------|-------------|---------|
| `lfind` | Find and list with fd + lsd | `lfind` |
| `lgrep` | Search content with ripgrep + lsd | `lgrep "searchterm"` |
| `lfanz-configs` | Find FANZ config files | `lfanz-configs` |
| `lapi-files` | API TypeScript/JS files | `lapi-files` |

---

## 🏆 Pro Features

### FANZ Dashboard System
| Command | Description | Example |
|---------|-------------|---------|
| `fanz` | Complete project dashboard | `fanz` |
| `fanz-health` | Project health check | `fanz-health` |
| `fanz-help` | Complete command reference | `fanz-help` |

### Service Management
| Command | Description | Example |
|---------|-------------|---------|
| `goto <service>` | Navigate to service directory | `goto fanz-gpt` |
| `sinfo <service>` | Service information | `sinfo fanz-media-core` |
| `envcheck` | Development environment check | `envcheck` |

### Configuration Management
| Command | Description | Example |
|---------|-------------|---------|
| `backup_lsd_config` | Backup your setup | `backup_lsd_config` |
| `restore_lsd_config <timestamp>` | Restore from backup | `restore_lsd_config 20250927_012909` |

---

## ⚙️ Configuration

### Config Files
- **LSD Config**: `~/.config/lsd/config.yaml`
- **Shell Aliases**: `~/.zshrc` (LSD sections)
- **Backups**: `~/.config/lsd/backups/`

### Custom Settings
```yaml
# ~/.config/lsd/config.yaml
classic: false
blocks: [permission, user, group, size, date, name, git]
icons:
  theme: fancy
sorting:
  dir-grouping: first
ignore-globs:
  - ".DS_Store"
  - "*.tmp" 
  - "*.log"
```

---

## 📊 Your FANZ Project Stats

- **Total Size**: 4.4GB
- **Files**: 304,815
- **Directories**: 33,864
- **Services**: 15 total (10 FANZ services)
- **Branch**: sync/2025-09-26

### Core FANZ Services
- fanz-age-verification
- fanz-central-command  
- fanz-compliance
- fanz-content-compliance
- fanz-finance
- fanz-gpt
- fanz-media-core
- fanz-permissions
- fanz-record-keeping
- fanz-social

---

## 🔍 Troubleshooting

### Common Issues

**Q: Colors not showing?**
```bash
# Check color support
echo $COLORTERM
# Force colors
export COLORTERM=truecolor
```

**Q: Icons not displaying?**  
```bash
# Check terminal font (needs Nerd Font)
lsd --icon=never  # Disable icons temporarily
```

**Q: Aliases not working?**
```bash
# Reload configuration
source ~/.zshrc
# Check if alias exists
alias | grep lcode
```

**Q: Git status not showing?**
```bash
# Ensure you're in a git repository  
git status
# Check git integration
lg
```

### Backup & Recovery

**Create Backup:**
```bash
backup_lsd_config
```

**Restore from Backup:**
```bash
# List available backups
ls ~/.config/lsd/backups/
# Restore specific backup
restore_lsd_config 20250927_012909
```

---

## 💡 Pro Tips

1. **Use `fanz` daily** - Your project dashboard shows everything important
2. **Navigate with `goto`** - Instantly jump to any service
3. **Check health with `fanz-health`** - Monitor project status
4. **Use `lbig` regularly** - Keep track of disk usage
5. **Combine with other tools** - `lcode | grep -i api` for targeted searches

---

## 🎯 Development Workflow Examples

### Daily Development Routine
```bash
# Start your day
fanz                    # Project overview
fanz-health            # Health check
lrecent                # What changed recently

# Working on services  
goto fanz-gpt          # Navigate to service
sinfo fanz-media-core  # Check service details
lapis                  # Browse API structure

# Analysis & cleanup
lbig                   # Check disk usage
lconfigs               # Review configurations
lgit-modified          # See git changes
```

### Project Discovery
```bash
# Understanding the codebase
ltree                  # Project structure
lservices              # Browse services
lfanz-services         # Focus on FANZ services
lplatforms             # Platform overview
```

---

## 🌟 What You've Achieved

✅ **Modern Terminal Experience** - Beautiful, fast file listings  
✅ **40+ Custom Commands** - Tailored for FANZ development  
✅ **Intelligent Project Tools** - Service navigation and analysis  
✅ **Git Integration** - See status alongside files  
✅ **Professional Workflow** - Dashboard, health checks, backups  
✅ **Future-Proof Setup** - Backed up and easily recoverable

Your terminal is now a **powerful development command center** specifically designed for the FANZ Unified Ecosystem!

---

*Generated: 2025-09-27*  
*Setup: LSD v1.1.5 + 40+ custom aliases + FANZ dashboard system*