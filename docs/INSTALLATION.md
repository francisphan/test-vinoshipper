## Installation Instructions

### macOS

#### Apple Silicon (M1/M2/M3/M4)
1. Download `Peyto_<version>_aarch64.dmg`
2. Open the downloaded DMG file
3. Drag Peyto to your Applications folder
4. Right-click the app and select "Open" (first time only, due to macOS security)

#### Intel Mac
1. Download `Peyto_<version>_x64.dmg`
2. Open the downloaded DMG file
3. Drag Peyto to your Applications folder
4. Right-click the app and select "Open" (first time only, due to macOS security)

### Windows

1. Download `Peyto_<version>_x64_en-US.msi` (recommended) or `Peyto_<version>_x64-setup.exe`
2. Double-click the installer
3. Follow the installation wizard
4. Launch Peyto from the Start Menu

**Note:** Windows may show a security warning. Click "More info" → "Run anyway" to proceed.

### Linux (Ubuntu/Debian)

#### Option 1: DEB Package (Recommended)
```bash
# Download the .deb file, then:
sudo dpkg -i peyto_<version>_amd64.deb

# If you encounter dependency issues:
sudo apt-get install -f
```

#### Option 2: AppImage
```bash
# Download the .AppImage file, then:
chmod +x peyto_<version>_amd64.AppImage
./peyto_<version>_amd64.AppImage
```

---

## System Requirements

- **macOS**: 10.13 (High Sierra) or later
- **Windows**: Windows 10 or later
- **Linux**: Ubuntu 20.04+ or equivalent

## Getting Started

After installation, launch Peyto and configure your Vinoshipper credentials to start managing your wine inventory.

For support or issues, please visit our [GitHub Issues](https://github.com/francisphan/Peyto/issues) page.
