<div align="center" markdown="1">
   <img width="1829" height="469" alt="SH13LDME WEBSITE" src="https://github.com/user-attachments/assets/6b2091d9-c7b1-4f08-92f1-72663bc225b9" />
</div>

# SH13LDME©

[![LATEST RELEASE | V1](https://img.shields.io/badge/LATEST%20RELEASE-V1-22caa0?style=for-the-badge&logo=shield&logoColor=white)](https://github.com/mi-lrn/SH13LDME/releases)
[![WEBSITE](https://img.shields.io/badge/-WEBSITE-05513D?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAAXNSR0IArs4c6QAAASlQTFRFAAAAAAAAAAAAABEAABAQAA8PAA0NAA0NABMJABISABcPAB4SAB4SAB4YAB0XABwXAzIlAzEkAzYjAzopAz8tAz4sAkQuAkQxAkUwAkczAkYyAkw2Aks2Ak84Akw1Ak02Ak02BFQ8BFY8BFs/A11BA19CA15CA2FDA2BFA2RHA2dIBG9OBHFPBHJPBHZSBHdSBHlVBHdTBH5YBIRcBIVeBYlfBIhfBIlfBIhfBohfBYxiBY1iBYxjBY1jBY5jBY9kBZJmBZNnBZRoBZVoBZVoBZZpBZZpBZdpBZdqBphqBphrBplrBppsB51uCKBwCaJxCaRyCaRzCqVzC6h1C6h2C6l2DKt3DKx4DK15Da96DrJ8DrN9DrR9DrR+D7Z/D7d/D7eAELiAELmB/sN0BwAAAEZ0Uk5TAAIGDxARExQbHSEqKyssLUxOUVhhY2lpb29xdnd3eHp7iImRkpaam5ylpra3t8PDxMXN2Nri4+Pl5+np7O3u7/f3+/v8/gaH0aYAAAGPSURBVEjH7ZbHUsMwFEUxNfTee+81AUInJBwCGEKPTbf+/yNYRCaWYwuzCgvuxrLeOxqNx3Pvq6goo6pX0unVmt8QbQDQHp1YQGo+ItCa4luplghAfaLQfHdbeCbq9f2V3UfyeFsIWy4PuyqDu2vnNrYz7n1MRwghHNN9T29uzNb5if7i/TmzhZTt2WVAJWLFSjYvPMpni5WYgiy629dvwqe3a7e2rCBJIPf07IhAOc9POSCpIDuAJTSygJ1/5B/568gWkNcheWBLQeLAow55BOIKsgzkdEgOWFKQQcDUISYwpCAtADoEoFlBDICXcOIVwFBdaQ+4CkeugF2f9XUCfIYRnwCdfrs81X0AEzgt8eRhgPtg4gFgpNTHU9LwS2UDHAdYfwME/2gWAA1BcdELwK2fuAGgJzhipgC4ePcC7+cATIaF2IR0/283d6Trj4cHX4cbGR9CCPHhxkSHdkTYl12XlnUplwdVPySyNwEB6Ps5xY1pLzBjRJoVjNGTQv/JmBF9JGlcy2TWm8o5eH0BVzXPw29EpQgAAAAASUVORK5CYII=)](https://www.sh13ld.me/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/mi-lrn/SH13LDME/blob/main/LICENSE)

**An all-in-one security and privacy editor for Windows 10 & 11**

Created by **mi-lrn** and **async-wei**

## Overview

SH13LDME© is an open-source, comprehensive Windows privacy and security configuration tool that provides an intuitive interface for managing Windows registry settings that may not be easily available to non-technical users.

<div align="center" markdown="1">
   <img width="780" height="552" alt="SH13LDME HOME SCREEN" src="https://github.com/user-attachments/assets/31e594fe-f16b-4b74-90cd-5a0bb83492d1" />
</div>

#### Did this app help you? Please consider starring this repository!

![GitHub Repo stars](https://img.shields.io/github/stars/mi-lrn/SH13LDME)

## Key Features

- **Registry Scanning**: Automatically scans the current state of the registry endpoints
- **Backup & Restore**: Creates and restores endpoint backups
- **Dependency Management**: Automatically handles endpoint dependencies
- **User Friendly**: Even inexperienced users can use the app

> [!Important]
> This app is built on electron which may not be ideal for certain users. We understand the performance concerns, but this app is not meant to be run constantly. We have also taken security into consideration and have disabled almost all remote content in the app.

## System Requirements

- **Operating System**: Windows 10 or Windows 11
- **Privileges**: Administrator rights required

## Installation

> [!Warning]
> Modifying Windows registry settings can affect system stability and functionality. This app has gone through extensive testing to make sure it does not break OS functionality, but use it at your own risk. Always create backups, and test changes in a controlled environment before applying to production systems!

1. Download the latest release from the GitHub releases page
2. Run the installer as Administrator
3. Follow the installation wizard
4. Launch SH13LDME© as Administrator

## Getting Started

### Initial Scan

1. Click the **"Scan Now"** button on the home page
2. Wait for the scan to complete

### Configuring Endpoints

1. After scanning, use the navigation tabs to browse endpoints:
   - **Search Endpoints**: Search for specific endpoints and view categories
   - **Secure Endpoints**: View already secured endpoints
   - **Optional Endpoints**: View endpoints that are optional to secure based on user preference
   - **Insecure Endpoints**: View endpoints that are recommended to secure
2. For each endpoint, use the dropdown menu to select your desired configuration
3. Click **"Apply Changes"** to implement your selections

> [!Tip]
> Click on the title of a category on the **Search Endpoints** page to view the included endpoints!

> [!Important]
> This app may not configure all Windows Defender endpoints as this focuses on endpoints that can't be configured in the default UI. We also have not included endpoints that could possibly break system functionality. If you want more security, and your hardware allows it, we suggest configuring Controlled Folder Access, Tamper Protection, SmartScreen, Memory Integrity, Kernel-mode Hardware Enforced Stack Protection, Memory Access Protection, Firmware Protection, and Local Security Authority Protection. These endpoints may be added in future updates.

## Backup and Restore

### Creating Backups

1. Click the **backup icon** in the bottom-right corner
2. Backups are automatically saved with timestamps in the `./backups` folder
3. Backup files contain all the endpoint states configured by the app
4. Backup files can be renamed to whatever you want

### Restoring from Backup

1. Click the **import backup icon** in the bottom-right corner
2. Select a `.json` backup file from the `./backups` folder
3. The app will automatically apply the changes needed to reach the `.json` file
4. A new endpoint scan will be performed to verify the changes

## State Indicators

- 🟢 **Green**: Secure endpoint state
- 🔴 **Red**: Insecure endpoint state 
- 🟡 **Yellow**: Optional endpoint state
- ⚫ **Gray**: Unknown/Corrupted endpoint state

> [!Note]
> Corrupted states can be fixed by simply hitting the **"Apply Changes"** button!

> [!Tip]
> Secure states are the single state that we decided gives the best privacy, security, or combination of both than the other states. The secure state may not be the best for everyone! Choose whatever option suites you the best.

## Dependencies

Some endpoints have dependencies on others. For example:
- Many advanced Windows Defender features require MAPS (Microsoft Advanced Protection Service) to be enabled to function

> [!Note] 
> SH13LDME© automatically checks and displays these dependencies with informational tooltips located on the bottom right of certain endpoint boxes. Endpoints will be grayed out until all required dependencies are met to avoid system screwups! Some endpoints may require the 'not secure' state of other endpoints. This is because some endpoints emcompass the scope of several lesser endpoints, for example, securing 'System Telemetry' will automatically disallow any collection of 'Inking And Typing Data', so that endpoint will not be available to configure as long as 'System Telemetry' is already secure.

## Registry Scopes

Endpoints operate at different registry levels:

- **System**: System-wide endpoints affecting all users
- **Current User**: Endpoints specific to the current user account

Icons at the bottom right of endpoint boxes indicate the scope of each setting with helpful tooltips explaining the impact.

## Troubleshooting

- Make sure Windows Defender or another antivirus isn't blocking the app from running. The app is not malware and is open source, you can compile it yourself if you have security doubts.
- If the application keeps crashing, that means a fatal error is occuring; check the log in the Program Files sh13ldme folder for details.
- If the application can't write to the log, make sure that the folder isn't included in the Protected Folders section of Windows Defender's ransomware protection.
- Some endpoint changes may require a restart to take effect.

If you find a bug, please post it in the issues tab, and someone will try to help you out. Include the relevant log and system information.

> [!Important]
> Group Policy changes will overwrite changes made by this app. If Group Policy has already been configured on your computer, it is not recommended use this program.

### Log File

SH13LDME© maintains error logs in `log.txt` in the application directory. Check this file for detailed error information if issues occur.

## File Structure

```
SH13LDME/
├── assets/          # Application icons and images
├── backups/         # Backups storage location (generated)
├── main.js          # Backend logic and processing
├── renderer.js      # UI logic and application processing
├── preload.js       # Exposes system APIs to the frontend
├── endpoints.js     # Endpoint definitions and categories
├── styles.css       # Application styling
├── index.html       # Application structure
├── registry.json    # Current endpoint states (generated)
└── log.txt          # Error logging (generated)
```

## Contributing

- If you want to add a new endpoint, just create a new issue tagged as a feature request with information about the endpoint you want to add.
- If you understand the endpoints.js endpoint format, you can create a pull request instead.
- If you want to make any changes to the code, create a pull request and describe the changes you made. Our code is definitely not the best, so any improvements would be great!

## Compiling From Source

1. Install nodejs
2. Download this project as a zip file and extract it
3. In the project folder, run `npm ci` to install all the required packages
4. Then, type `npm run build` to generate the .exe setup files

## Coming Soon

- App Debloating
- Firewall Telemetry Blocking
- More Endpoints
