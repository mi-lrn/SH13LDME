async function backup() {
    disableHomeButtons();
    await handleScanButtonClick();
    if (!window.scanCancelled) {
        //get the current registry configuration in the registry.json file
        const date = new Date(Date.now());
        const full_date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}_${String(date.getMinutes()).padStart(2, '0')}_${String(date.getSeconds()).padStart(2, '0')}`;
        //get the current timestamp
        try {
            await window.api.copyRegistry('registry.json', './backups', 'backup_' + full_date + '.json');
        }
        catch (err) {
            try {
                await window.api.logError('./log.txt', `Failed to Copy Backup: ${err}`);
            }
            catch (logerr) {
                await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
            }
            window.close();
        }
    }
    enableHomeButtons();
    //copy the registry.json file with all the scanned data to the backup folder named as the current timestamp
}
async function changeRegistry(no_user_selection, registry_dict){
    showTab("home");
    //send users back to the home page while the registry is being updated
    window.dualProgressMode = true;
    //enable both progress bars because everything needs to be rescanned after the registry is updated
    window.InProgress = true;
    disableHomeButtons();
    var applyButton;
    var floatingApplyButton;
    if (!no_user_selection) {
        applyButton = document.getElementById('apply-button');
        floatingApplyButton = document.getElementById('floating-apply-button');
        if (applyButton) {
            applyButton.classList.add('disabled');
        }
        if (floatingApplyButton) {
            floatingApplyButton.classList.add('disabled');
        }
        //disable buttons on other tab pages besides home
        for (const dropdown of dropdowns) {
            if (dropdown.value !== "Corrupted" && dropdown.value !== "") {
                registry_dict[dropdown.getAttribute('attached-data')] = parseInt(dropdown.value, 10);
            }
            else {
                registry_dict[dropdown.getAttribute('attached-data')] = dropdown.value;
            }
        };
    }
    //get all the required data in the right format if the endpoints were individually configured through user interaction (dropdowns) otherwise just use the passed in registry_dict
    for (const [key, obj] of Object.entries(registry_dict)) {
        if (JSON.parse(key).state !== "" && JSON.parse(key).state !== "Corrupted") {
            if (parseInt(JSON.parse(key).state, 10) === obj) {
                delete registry_dict[key];
            }
        }
        else {
            if (JSON.parse(key).state === obj.toString()) {
                delete registry_dict[key];
            }
        }
    }
    //remove all registry data that doesn't change from its previous state
    updateRegistryProgress(0, "Preparing to modify registry...");
    updateProgressUI();
    //show both the registry and scan progress bars
    const totalEndpoints = Object.keys(registry_dict).length;
    let processedEndpoints = 0;
    for (const [key, obj] of Object.entries(registry_dict)) {
        await (async (endpoint, newValue) => {
            //for every endpoint get the key (representing the full endpoint json structure) and the value representing the updated registry state
            if (newValue != "Corrupted") {
                processedEndpoints++;
                const progress = Math.round((processedEndpoints / totalEndpoints) * 100);
                updateRegistryProgress(progress, `Modifying registry: ${processedEndpoints}/${totalEndpoints} endpoints`);
                //update the registry progress bar depending on the amount of changed endpoints
                try {
                    var command;
                    if (endpoint.action === "add") {
                            command = `
                            $registryPath = '${endpoint.registrypath}'
                            $valueName = '${endpoint.registryvalue}'

                            $newValue = ${newValue}

                            try {
                                if (-not (Test-Path -Path $registryPath)) {
                                    New-Item -Path $registryPath -Force | Out-Null
                                    Write-Output "Registry path '$registryPath' created."
                                }
                                Set-ItemProperty -Path $registryPath -Name $valueName -Value $newValue -ErrorAction Stop
                                Write-Output "Registry value '$valueName' set to '$newValue'."
                            } catch {
                                Write-Output "$_"
                            }
                        `;
                        //update the registry powershell command for endpoints that require a change in registry DWORD value to achieve the desired effect (add)
                    }
                    else {
                        if (newValue === "") {
                            command = `
                            $registryPath = '${endpoint.registrypath}'
                            $valueName = '${endpoint.registryvalue}'

                            try {
                                if (-not (Test-Path -Path $registryPath)) {
                                    New-Item -Path $registryPath -Force | Out-Null
                                    Write-Output "Registry path '$registryPath' created."
                                }
                                Remove-ItemProperty -Path $registryPath -Name $valueName -ErrorAction Stop
                                Write-Output "Registry value '$valueName' has been deleted."
                            } catch {
                                Write-Output "$_"
                            }
                            `;
                        }
                        //update the registry powershell command for endpoints that require the deletion of a registry value to achieve the desired effect (delete)
                        else if (newValue === 0 && !endpoint.del_DWORD) {
                            command = `
                            $registryPath = '${endpoint.registrypath}'
                            $valueName = '${endpoint.registryvalue}'

                            try {
                                if (-not (Test-Path -Path $registryPath)) {
                                    New-Item -Path $registryPath -Force | Out-Null
                                    Write-Output "Registry path '$registryPath' created."
                                }
                                New-ItemProperty -Path $registryPath -Name $valueName -PropertyType String -ErrorAction Stop
                                Write-Output "New string registry value '$valueName' created."
                            } catch {
                                Write-Output "$_"
                            }
                            `;
                        }
                        //update the registry powershell command for endpoints that require the creation of a registry string value to achieve the desired effect (delete)
                        else if (endpoint.del_DWORD) {
                            command = `
                            $registryPath = '${endpoint.registrypath}'
                            $valueName = '${endpoint.registryvalue}'

                            $newValue = ${newValue}

                            try {
                                if (-not (Test-Path -Path $registryPath)) {
                                    New-Item -Path $registryPath -Force | Out-Null
                                    Write-Output "Registry path '$registryPath' created."
                                }
                                Set-ItemProperty -Path $registryPath -Name $valueName -Value $newValue -ErrorAction Stop
                                Write-Output "Registry value '$valueName' set to '$newValue'."
                            } catch {
                                Write-Output "$_"
                            }
                            `;
                        }
                        //update the registry powershell command for endpoints that require a change in registry DWORD value to achieve the desired effect (delete)
                    }
                    await window.api.powerShell(command, false);
                    //execute the configured powershell command to make registry changes
                } catch (err) { 
                    try {
                        await window.api.logError('./log.txt', `Failed to Run PowerShell Command: ${err}`);
                    }
                    catch (logerr) {
                        await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
                    }
                    window.close();
                }
            }
        })(JSON.parse(key), obj);
    }
    updateRegistryProgress(100, "Registry changes complete");
    window.InProgress = false;
    //signal the changing of progress bars to scanning
    await handleScanButtonClick()
    //only show the scanning progress bar and scan all the endpoints
    window.dualProgressMode = false;
    updateProgressUI();
    //end scan
    enableHomeButtons();
    //enable buttons on home page
    if (!no_user_selection) {
        const applyButton = document.getElementById('apply-button');
        const floatingApplyButton = document.getElementById('floating-apply-button');
        if (applyButton) {
            applyButton.classList.remove('disabled');
        }
        if (floatingApplyButton) {
            floatingApplyButton.classList.remove('disabled');
            floatingApplyButton.classList.remove('visible');
        }
    };
    //enable buttons on other tab pages besides home
}
function createEndpointElement(endpoint, isCategoryDisplay) {
    const endpointContainer = document.createElement('div');
    for (const key of Object.keys(endpoint.dependencies)) {
        if (!endpoint.dependencies[key].includes(regbyname[key].state)) {
            endpointContainer.className = 'endpoint-container disabled';
        }
    }
    if (endpointContainer.className === "") {
        endpointContainer.className = 'endpoint-container';
    }
    //check if the endpoint's required dependencies are in the correct state for endpoint use otherwise disable the endpoint
    const titleBox = document.createElement('div');
    titleBox.className = 'title';
    const titleContent = document.createElement('div');
    titleContent.className = 'title-content';
    const titleText = document.createElement('span');
    titleText.className = 'title-text';
    titleText.textContent = endpoint.name;
    const securityState = getEndpointSecurityState(endpoint);
    const statusDot = document.createElement('span');
    statusDot.className = `endpoint-status ${securityState}`;
    titleText.insertBefore(statusDot, titleText.firstChild);
    const statusIndicator = document.createElement('span');
    statusIndicator.className = `status-indicator status-${securityState}`;
    statusIndicator.textContent = securityState.toUpperCase();
    titleContent.appendChild(titleText);
    titleContent.appendChild(statusIndicator);
    titleBox.appendChild(titleContent);
    //assemble each endpoint's header along with a colored dot indicating its status
    const dropdown = document.createElement('select');
    dropdown.className = "dropdown";
    dropdown.setAttribute('attached-data', JSON.stringify(endpoint, null, 2));
    //attach each endpoints data to its associated dropdown
    const options = endpoint.states;
    Object.entries(options).forEach(([key, value]) => {
        if (key !== "Corrupted") {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = value;
            dropdown.appendChild(opt);
        }
    });
    //create options for each possible endpoint state
    dropdown.addEventListener('focus', function() {
        this.size = Object.keys(endpoint.states).length-1;
    });
    dropdown.addEventListener('blur', function() {
        this.size = 0;
    });
    dropdown.addEventListener('change', function() {
        this.size = 1;
        this.blur();
    });
    dropdown.addEventListener('change', function() {
        const container = this.closest('.endpoint-container');
        const endpoint = JSON.parse(this.getAttribute('attached-data') || '{}');
        endpoint.state = this.value;
        updateEndpointVisualState(container, endpoint);
        if (isCategoryDisplay === true) {
            let floatingApplyButton = document.getElementById('floating-apply-button');
            if (!floatingApplyButton) {
                floatingApplyButton = document.createElement('button');
                floatingApplyButton.textContent = 'Apply Changes';
                floatingApplyButton.className = 'floating-apply-button';
                floatingApplyButton.id = 'floating-apply-button';
                floatingApplyButton.onclick = async () => {
                    await changeRegistry(false, {});
                };
                document.body.appendChild(floatingApplyButton);
            }
            if (window.floatingButtonVisibility) {
                window.removeEventListener('scroll', window.floatingButtonVisibility);
                document.querySelector('.main-content')?.removeEventListener('scroll', window.floatingButtonVisibility);
            }
            setTimeout(() => {
                floatingApplyButton.classList.add('visible');
            }, 10);
            //for categories always show the apply changes button once an endpoint is changed
        }
        //setup the floating apply button for the categories page
    });
    //update colored status dot and endpoint theming depending on what state the user selects
    if (endpoint.state !== "corrupted") {
        dropdown.value = endpoint.state;
    }
    else {
        dropdown.value = endpoint.defaultkey;
    }
    dropdowns.push(dropdown);
    titleBox.appendChild(dropdown);
    //add a dropdown menu to the title box
    endpointContainer.appendChild(titleBox);
    //add the title box to the main endpoints container
    endpointContainer.classList.add(securityState);
    //add the initial endpoint box theming
    const descriptionBox = document.createElement('div');
    descriptionBox.className = 'description';
    const descriptionText = document.createElement('span');
    descriptionText.className = 'description-text';
    descriptionText.textContent = endpoint.description;
    descriptionBox.appendChild(descriptionText);
    //add the description to the description box
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'description-indicators';
    const scopeIndicator = document.createElement('div');
    scopeIndicator.className = 'registry-scope-indicator';
    var scope;
    if (endpoint.registrypath.startsWith('HKCU')) {
        scope = 'HKCU';
    }
    else {
        scope = 'HKLM';
    }
    const scopeIcon = document.createElement('div');
    scopeIcon.className = `registry-scope-icon ${scope.toLowerCase()}`;
    if (scope === 'HKCU') {
        scopeIcon.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
        `;
        //svg icon for current user (single person)
    } else {
        scopeIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2H0c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2h-4zM4 5h16v11H4V5z"/>
            </svg>
        `;
        //svg icon for local machine (computer)
    }
    const scopeTooltip = document.createElement('div');
    scopeTooltip.className = 'registry-scope-tooltip';
    const tooltipContent = scope === 'HKCU' ? 
        `<span style="color: var(--accent-secondary); font-weight: 600;">Current User - </span>
        <span>This endpoint applies only to the currently logged-in user. The system as a whole is unaffected.</span>` :
        `<span style="color: var(--accent-secondary); font-weight: 600;">System - </span>
        <span>This endpoint applies to the whole system independent of the current user. Settings for the current user will not affect this endpoint.</span>`;
    scopeTooltip.innerHTML = tooltipContent;
    scopeIndicator.appendChild(scopeIcon);
    scopeIndicator.appendChild(scopeTooltip);
    let tooltipTimeout;
    scopeIcon.addEventListener('mouseenter', () => {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        const iconRect = scopeIcon.getBoundingClientRect();
        const tooltipWidth = 280;
        const tooltipHeight = 70;
        const verticalOffset = 0;
        let tooltipTop = iconRect.top - tooltipHeight + verticalOffset;
        const tabsHeight = 80;
        let isRepositioned = false;
        if (tooltipTop < tabsHeight) {
            tooltipTop = tabsHeight + 10;
            isRepositioned = true;
        }
        document.body.appendChild(scopeTooltip);
        if (isRepositioned) {
            scopeTooltip.classList.add('repositioned');
        } else {
            scopeTooltip.classList.remove('repositioned');
        }
        scopeTooltip.style.cssText = `
            position: fixed;
            left: ${iconRect.right - tooltipWidth + 6}px;
            top: ${tooltipTop}px;
            width: ${tooltipWidth}px;
            opacity: 0;
            visibility: visible;
            transform: translateY(-5px);
        `;
        requestAnimationFrame(() => {
            scopeTooltip.style.opacity = '1';
            scopeTooltip.style.transform = 'translateY(0)';
        });
    });
    scopeIcon.addEventListener('mouseleave', () => {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
        }
        scopeTooltip.style.opacity = '0';
        scopeTooltip.style.transform = 'translateY(-5px)';
        tooltipTimeout = setTimeout(() => {
            scopeTooltip.style.visibility = 'hidden';
            if (scopeTooltip.parentNode) {
                scopeTooltip.parentNode.removeChild(scopeTooltip);
            }
            tooltipTimeout = null;
        }, 200);
    });
    indicatorsContainer.appendChild(scopeIndicator);
    //add a registry scope indicator for an endpoint along with tooltip functionality (HKCU/HKLM)
    if (endpoint.dependencies && Object.keys(endpoint.dependencies).length > 0) {
        const dependencyIndicator = document.createElement('div');
        dependencyIndicator.className = 'dependency-indicator';
        const dependencyIcon = document.createElement('div');
        dependencyIcon.className = 'dependency-icon';
        dependencyIcon.textContent = 'i';
        const dependencyTooltip = document.createElement('div');
        dependencyTooltip.className = 'dependency-tooltip';
        dependencyTooltip.innerHTML = `
            <span style="color: var(--accent-secondary); font-weight: 600;">Required Conditions - </span>
            <span>
                ${Object.keys(endpoint.dependencies).map(key => {const values = endpoint.dependencies[key].map(depKey => regbyname[key].states[depKey]); return `${key}: ${values.join(', ')}`;}).join('; ')}
            </span>
        `;
        //display the state(s) of each required endpoint dependency that will allow the current endpoint to work
        dependencyIndicator.appendChild(dependencyIcon);
        dependencyIndicator.appendChild(dependencyTooltip);
        let tooltipTimeout;
        dependencyIcon.addEventListener('mouseenter', () => {
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
            const iconRect = dependencyIcon.getBoundingClientRect();
            const tooltipWidth = 250;
            const dependencyCount = Object.keys(endpoint.dependencies).length;
            const tooltipHeight = dependencyCount > 3 ? 120 : 60;
            const verticalOffset = dependencyCount > 3 ? -14 : -24;
            let tooltipTop = iconRect.top - tooltipHeight + verticalOffset;
            const tabsHeight = 80;
            let isRepositioned = false;
            if (tooltipTop < tabsHeight) {
                tooltipTop = tabsHeight + 10;
                isRepositioned = true;
            }
            document.body.appendChild(dependencyTooltip);
            if (isRepositioned) {
                dependencyTooltip.classList.add('repositioned');
            } else {
                dependencyTooltip.classList.remove('repositioned');
            }
            dependencyTooltip.style.cssText = `
                position: fixed;
                left: ${iconRect.right - tooltipWidth + 6}px;
                top: ${tooltipTop}px;
                width: ${tooltipWidth}px;
                opacity: 0;
                visibility: visible;
                transform: translateY(-5px);
            `;
            requestAnimationFrame(() => {
                dependencyTooltip.style.opacity = '1';
                dependencyTooltip.style.transform = 'translateY(0)';
            });
        });
        dependencyIcon.addEventListener('mouseleave', () => {
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
            }
            dependencyTooltip.style.opacity = '0';
            dependencyTooltip.style.transform = 'translateY(-5px)';
            tooltipTimeout = setTimeout(() => {
                dependencyTooltip.style.visibility = 'hidden';
                tooltipTimeout = null;
            }, 200);
        });
        indicatorsContainer.appendChild(dependencyIndicator);
        //add a dependency indicator for an endpoint along with tooltip functionality if an endpoint has dependencies
    }
    descriptionBox.appendChild(indicatorsContainer);
    //add indicators to the description box
    endpointContainer.appendChild(descriptionBox);
    //add the endpoint description box to the endpoint box
    return endpointContainer;
}
//add full endpoint configuration functionality with a modern and easy to use interface
function createProgressModal() {
    if (window.progressModal) return window.progressModal;
    const modal = document.createElement('div');
    modal.className = 'progress-modal';
    modal.id = 'progress-modal';
    modal.innerHTML = `
        <div class="progress-card">
            <div class="progress-header">
                <div class="progress-title" id="progress-main-title">System Scan</div>
                <div class="progress-subtitle" id="progress-subtitle">Analyzing endpoints</div>
            </div>
            
            <!-- Registry Progress Section -->
            <div class="progress-section registry-section" id="registry-progress-section" style="display: none;">
                <div class="progress-label">
                    <div class="progress-label-text">
                        <span class="progress-status-icon pending" id="registry-status-icon"></span>
                        Registry Changes
                    </div>
                    <div class="progress-percentage registry" id="registry-progress-percentage">0%</div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill registry" id="registry-progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text" id="registry-progress-text">Preparing registry modifications...</div>
            </div>
            
            <!-- Scan Progress Section -->
            <div class="progress-section scan-section" id="scan-progress-section">
                <div class="progress-label">
                    <div class="progress-label-text">
                        <span class="progress-status-icon pending" id="scan-status-icon"></span>
                        Endpoint Scan
                    </div>
                    <div class="progress-percentage scan" id="scan-progress-percentage">0%</div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill scan" id="scan-progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text" id="scan-progress-text">Initializing scan...</div>
            </div>
            
            <div class="progress-controls">
                <button class="cancel-button" id="cancel-scan-btn">
                    <span>Cancel Scan</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const cancelButton = modal.querySelector('#cancel-scan-btn');
    cancelButton.addEventListener('click', handleCancelScan);
    window.progressModal = modal;
    return modal;
}
//create a progress modal to display progress bars
async function disableHomeButtons() {
    homeButton.classList.add('disabled');
    searchButton.classList.add('disabled');
    insecureButton.classList.add('disabled');
    secureButton.classList.add('disabled');
    optionalButton.classList.add('disabled');
    scanButton.classList.add('disabled');
    backupButton.classList.add('disabled');
    documentationButton.classList.add('disabled');
    backupImport.classList.add('disabled');
}
//disable buttons on home page
async function enableHomeButtons() {
    homeButton.classList.remove('disabled');
    searchButton.classList.remove('disabled');
    insecureButton.classList.remove('disabled');
    secureButton.classList.remove('disabled');
    optionalButton.classList.remove('disabled');
    scanButton.classList.remove('disabled');
    documentationButton.classList.remove('disabled');
    backupButton.classList.remove('disabled');
    backupImport.classList.remove('disabled');
}
//enable buttons on home page
function getEndpointSecurityState(endpoint) {
    if (endpoint.state === 'corrupted') return 'corrupted';
    const currentState = endpoint.state;
    const secureKey = endpoint.securekey;
    if (currentState === secureKey) return 'secure';
    return endpoint.section === 'optional' ? 'optional' : 'insecure';
}
//quick function to return the string state of an endpoint based on its numerical state
async function handleCancelScan() {
    if (!window.InProgress) {
        return;
    }
    //prevent spam
    const cancelButton = document.getElementById('cancel-scan-btn');
    if (cancelButton && cancelButton.disabled) {
        return;
    }
    window.scanCancelled = true;
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    if (progressBar) progressBar.style.display = 'none';
    if (progressPercentage) progressPercentage.style.display = 'none';
    updateScanProgress(window.scanProgressData.percentage, 'Scan cancelled');
    //indicate that a scan was cancelled
    if (cancelButton) {
        cancelButton.textContent = 'Cancelling...';
        cancelButton.disabled = true;
    }
    await resetReg();
    setTimeout(() => {
        hideProgressModal();
    }, 1000);
}
//handle the cancellation of scans and reset everything
async function handleScanButtonClick() {
    if (window.InProgress) {
        return;
    }
    //prevent multiple scans from being opened
    window.InProgress = true;
    window.scanCancelled = false;
    //update global scan variables
    updateProgressUI();
    //show single progress bar
    await resetReg();
    //reset the registry.json file
    try {
        var all_endpoints = [];
        for (const category of window.categories) {
            all_endpoints = all_endpoints.concat(category.endpoints);
        }
        //get all endpoints from endpoints.js by concatenating each category
        const validEndpoints = [];
        for (const endpoint of all_endpoints) {
            if (window.scanCancelled) break;
                if (endpoint.version_added <= version && (endpoint.version_removed == false || (typeof endpoint.version_removed != "boolean" && (endpoint.version_removed > version)))) {
                    validEndpoints.push(endpoint);
                }
        }
        //filter out endpoints that don't exist in the user's current windows version
        await processBatchedEndpoints(validEndpoints);
        //process endpoints in optimized batches
    } catch (err) {
        try {
            await window.api.logError('./log.txt', `Failed to Process Endpoints: ${err}`);
        } catch (logerr) {
            await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
        }
        window.close();
    } finally {
        window.InProgress = false;
        updateProgressUI();
        //end scan
    }
}
async function handleSearchInput(event) {
    const SEARCH_DEBOUNCE_DELAY = 200;
    const query = event.target.value.toLowerCase().trim();
    if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
    }
    if (query === window.lastSearchQuery) {
        return;
    }
    //don't search a query if it has already been searched
    window.searchTimeout = setTimeout(async () => {
        const searchTab = document.getElementById('search');
        if (searchTab.classList.contains('active')) {
            const searchBar = document.getElementById('search-bar');
            searchBar.classList.add("disabled");
            await populateEndpointsList("search", query);
            window.lastSearchQuery = query;
            searchBar.classList.remove("disabled");
        }
    }, SEARCH_DEBOUNCE_DELAY);
    //submit a search query every SEARCH_DEBOUNCE_DELAY milliseconds
}
//searches for endpoints in real time
function hideProgressModal() {
    if (window.progressModal) {
        window.progressModal.classList.remove('show');
        setTimeout(() => {
            const cancelBtn = window.progressModal.querySelector('#cancel-scan-btn');
            const scanSection = window.progressModal.querySelector('#scan-progress-section');
            const registrySection = window.progressModal.querySelector('#registry-progress-section');
            if (cancelBtn) {
                cancelBtn.textContent = 'Cancel Scan';
                cancelBtn.disabled = false;
                cancelBtn.style.display = 'flex';
            }
            if (scanSection) scanSection.classList.remove('active', 'completed');
            if (registrySection) registrySection.classList.remove('active', 'completed');
            window.dualProgressMode = false;
        }, 300);
    }
}
//hide the progress modal after a scan is finished or cancelled
async function importBackup() {
    disableHomeButtons();
    var file;
    try {
        file = await window.api.openFolder("./backups");
    }
    catch (err) {
        try {
            await window.api.logError('./log.txt', `Failed to Open Folder: ${err}`);
        }
        catch (logerr) {
            await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
        }
        window.close(); 
    }
    //prompt to select a backup file
    if (!file.endsWith('.json')) {
        enableHomeButtons();
        return;
    }
    //filter out invalid backups
    var regBackup;
    try {
        regBackup = await window.api.readRegistry(file);
    }
    catch (err) {
        try {
            await window.api.logError('./log.txt', `Failed to Read Backup: ${err}`);
        }
        catch (logerr) {
            await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
        }
        window.close();
    }
    //read the backup
    var registry_dict = {};
    //dictionary that will contain current endpoint data as the key with the backed up endpoint state as the value
    try {
        regBackup.forEach(endpoint => {
            if (endpoint.version_added <= version && (endpoint.version_removed === false || (typeof endpoint.version_removed != "boolean" && (endpoint.version_removed < version)))) {
                if (endpoint.state != "" && endpoint.state != "Corrupted") {
                    registry_dict[JSON.stringify(regbyname[endpoint.name], null, 2)] = parseInt(endpoint.state, 10);
                }
                else {
                    registry_dict[JSON.stringify(regbyname[endpoint.name], null, 2)] = endpoint.state;
                }
            }
            //only import the endpoints that exist in a user's current version of windows
        });
        await changeRegistry(true, registry_dict);
        //send the formatted registry data to the changeRegistry function for processing
    } catch (err) {
        try {
            await window.api.logError('./log.txt', `Invalid Endpoint In Backup: ${err}`);
        }
        catch (logerr) {
            await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
        }
        window.close();
    }
    enableHomeButtons();
    //enable buttons on home page
}
//imports endpoint data from a backup .json file
function openDocumentation() {
    window.api.openExternal('https://github.com/mi-lrn/SH13LDME/blob/main/README.md');
}
//open documentation github page
async function populateCategories() {
    const searchTab = document.getElementById('search');
    const searchResultsInfo = document.getElementById('search-results-info');
    if (searchResultsInfo) {
        searchResultsInfo.style.display = 'none';
    }
    //remove the search info display when displaying categories
    window.categories.forEach((category, index) => {
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-container'; 
        const status = category.getSecurityStatus(regbyname);
        //get the amount of endpoints secured out of the total number of endpoints in a category (this is a method defined in endpoints.js)
        const statusText = `${status.securedCount}/${status.totalCount} secured`;
        categoryContainer.innerHTML = `
            <div class="category-header">
                <div class="category-title">
                    <div class="category-name-section">
                        <span class="category-name">${category.name}</span>
                        <span class="category-status">${statusText}</span>
                    </div>
                    <button class="category-secure-button" onclick="secureCategory(${index})">
                        Secure All
                    </button>
                </div>
            </div>
            <div class="category-description">${category.description}</div>
            <div class="category-endpoints" id="category-endpoints-${index}">
            </div>
        `;
        if (status.isFullySecured) {
            categoryContainer.classList.add('fully-secured');
        } else {
            categoryContainer.classList.add('partially-secured');
        }
        //change styles depending on whether a category is fully secured or not
        const header = categoryContainer.querySelector('.category-header');
        header.addEventListener('click', (e) => {
            if (!e.target.classList.contains('category-secure-button')) {
                toggleCategoryDropdown(index);
            }
        });
        //if the category display header is clicked display all its child endpoints or retract all its child endpoints
        searchTab.appendChild(categoryContainer);
        //add each category box to the page container
    });
}
async function populateEndpointsList(tabId, query) {
    const endpointsContainer = document.getElementById(tabId);
    if (tabId != "search") {
        endpointsContainer.innerHTML = '';    
    }
    else {
        const searchBar = document.getElementById('search-bar');
        for (let i = endpointsContainer.childNodes.length - 1; i >= 0; i--) {
            const child = endpointsContainer.childNodes[i];
            if (child !== searchBar && child.id !== 'search-results-info') {
                endpointsContainer.removeChild(child);
            }
        }
    }
    //makes sure that if the search page is open the search bar and info display don't get removed
    const heading = document.createElement('h3');
    heading.textContent = `${tabId.charAt(0).toUpperCase() + tabId.slice(1)} Endpoints`;
    //set each tabs' title
    const applyChanges = document.createElement('button');
    applyChanges.textContent = 'Apply Changes';
    applyChanges.className = 'apply-button';
    applyChanges.id = 'apply-button';
    applyChanges.onclick = async () => {
        await changeRegistry(false, {});
    };
    let floatingApplyButton = document.getElementById('floating-apply-button');
    if (!floatingApplyButton) {
        floatingApplyButton = document.createElement('button');
        floatingApplyButton.textContent = 'Apply Changes';
        floatingApplyButton.className = 'floating-apply-button';
        floatingApplyButton.id = 'floating-apply-button';
        floatingApplyButton.onclick = applyChanges.onclick;
        document.body.appendChild(floatingApplyButton);
    }
    setupFloatingApplyButton(applyChanges, floatingApplyButton);
    heading.appendChild(applyChanges);
    //add an apply changes button next to the title in the heading that follows the user if they scroll past it
    endpointsContainer.appendChild(heading);
    //add the heading to the page container
    const endpoints = [];
    const reg = Object.values(regbyname);
    for (let i = 0; i < reg.length; i++) {
        if (reg[i].state === reg[i].securekey && tabId === "secure") {
            endpoints.push(reg[i]);
        } else if (reg[i].state !== reg[i].securekey && reg[i].section === "optional" && tabId === "optional") {
            endpoints.push(reg[i]);
        } else if (reg[i].state !== reg[i].securekey && reg[i].section === "insecure" && tabId === "insecure") {
            endpoints.push(reg[i]);
        } else if ((reg[i].name.toLowerCase().includes(query.toLowerCase()) || reg[i].description.toLowerCase().includes(query.toLowerCase())) && tabId === "search") {
            endpoints.push(reg[i]);
        }
    }
    //sort through the registry data for the endpoints that should be shown on a certain page
    endpoints.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });
    //sort the endpoints alphabetically
    if (tabId === "search") {
        let searchResultsInfo = document.getElementById('search-results-info');
        if (!searchResultsInfo) {
            searchResultsInfo = document.createElement('div');
            searchResultsInfo.id = 'search-results-info';
            searchResultsInfo.className = 'search-results-info';
            const searchBar = document.getElementById('search-bar');
            searchBar.parentNode.insertBefore(searchResultsInfo, searchBar.nextSibling);
        }
        //add search results information display
        if (query.trim() === '') {
            await populateCategories();
            return;
            //show categories instead of endpoints if there is no query in the search tab
        } else {
            if (searchResultsInfo) {
                searchResultsInfo.style.display = 'block';
            }
            const resultText = endpoints.length === 1 
                ? `Found ${endpoints.length} endpoint matching '${query}'`
                : `Found ${endpoints.length} endpoints matching '${query}'`;
            searchResultsInfo.textContent = resultText;
            searchResultsInfo.style.color = endpoints.length > 0 ? '#0c8b61' : '#ff6b6b';
            //show search results instead of categories if there is a query
        }
    }
    dropdowns = [];
    endpoints.forEach(endpoint => {
        endpointContainer = createEndpointElement(endpoint, false);
        endpointsContainer.appendChild(endpointContainer);
        //add the endpoint box to the page container
    });
    //create a new display with configurable options for each valid endpoint
}
//create all the category displays
async function processBatchedEndpoints(endpoints) {
    const totalEndpoints = endpoints.length;
    let completedEndpoints = 0;
    updateScanProgress(0, `Initializing scan of ${totalEndpoints} endpoints...`);
    const BULK_BATCH_SIZE = 15
    for (let i = 0; i < endpoints.length; i += BULK_BATCH_SIZE) {
        if (window.scanCancelled) {
            break;
        }
        const batch = endpoints.slice(i, i + BULK_BATCH_SIZE);
        try {
            const commandParameters = batch.map(endpoint => ({
                registrypath: endpoint.registrypath,
                registryvalue: endpoint.registryvalue
            }));
            //list of all the required command parameters
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('PowerShell Bulk Process is Hanging')), 10000)
            );
            const bulkCommand = `
                $results = @()
                ${commandParameters.map((cmd, index) => `
                try {
                    $registryPath = "${cmd.registrypath}"
                    $valueName = "${cmd.registryvalue}"
                    
                    if (-not (Test-Path -Path $registryPath)) {
                        New-Item -Path $registryPath -Force | Out-Null
                    }
                    $registryValue = Get-ItemProperty -Path $registryPath -Name $valueName -ErrorAction Stop
                    $results += @{
                        Index = ${index}
                        Value = "$($registryValue.$valueName)"
                        Error = $null
                    }
                } catch {
                    $results += @{
                        Index = ${index}
                        Value = $null
                        Error = "$_"
                    }
                }
                `).join('')}
                $results | ConvertTo-Json -Depth 3
            `;
            //make a bulk command based on all the mapped command parameters
            const bulkPromise = window.api.powerShell(bulkCommand, true);
            const results = await Promise.race([bulkPromise, timeoutPromise]);
            //process the bulk command and report hanging
            for (const result of results) {
                const endpoint = batch[result.Index];
                if (result.Error) {
                    if (result.Error.toLowerCase().includes(`not exist`)) {
                        if (endpoint.action === "add") {
                            endpoint.state = endpoint.defaultkey;
                        } else {
                            endpoint.state = "";
                        }
                    } else {
                        endpoint.state = "corrupted";
                    }
                } else if (Object.keys(endpoint.states).includes(result.Value) && (endpoint.action === "add" || (endpoint.action === "delete" && endpoint.del_DWORD))) {
                    endpoint.state = result.Value;
                } else if (result.Value === "" && endpoint.action === "delete" && !endpoint.del_DWORD) {
                    endpoint.state = "0";
                } else {
                    endpoint.state = "corrupted";
                }
                if (!window.scanCancelled && i + BULK_BATCH_SIZE >= endpoints.length) {
                    const endpointsData = [];
                    for (let j = 0; j < endpoints.length; j++) {
                        endpointsData.push({
                            name: endpoints[j].name,
                            registrypath: endpoints[j].registrypath,
                            registryvalue: endpoints[j].registryvalue,
                            description: endpoints[j].description,
                            state: endpoints[j].state,
                            section: endpoints[j].section,
                            states: endpoints[j].states,
                            action: endpoints[j].action,
                            del_DWORD: endpoints[j].del_DWORD,
                            securekey: endpoints[j].securekey,
                            defaultkey: endpoints[j].defaultkey,
                            version_added: endpoints[j].version_added,
                            version_removed: endpoints[j].version_removed,
                            dependencies: endpoints[j].dependencies
                        });
                    }
                    await window.api.writeRegistry("registry.json", endpointsData);
                    //write all endpoint data to the registry.json file
                }
            }
            //update endpoint's properties based on its state in the registry
            completedEndpoints += batch.length;
            const progress = Math.round((completedEndpoints / totalEndpoints) * 100);
            updateScanProgress(progress, `${completedEndpoints}/${totalEndpoints} endpoints scanned`);
            await new Promise(resolve => setTimeout(resolve, 100));
            //update progress bar based on the current amount of processed endpoints     
        } catch (err) {
            try {
                await window.api.logError('./log.txt', `Failed to Process Bulk Endpoints: ${err}`);
            } catch (logerr) {
                await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
            }
            window.close();
        }
    }
    if (!window.scanCancelled) {
        updateScanProgress(window.scanProgressData.percentage, `Scan completed! ${completedEndpoints}/${totalEndpoints} endpoints scanned.`);
        const cancelButton = document.getElementById('cancel-scan-btn');
        if (cancelButton) {
            cancelButton.style.display = 'none';
        }
        regbyname = {};
        var reg;
        try {
            reg = await window.api.readRegistry('registry.json');
        } catch (err) {
            try {
                await window.api.logError('./log.txt', `Failed to Read registry.json: ${err}`);
            } catch (logerr) {
                await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
            }
            window.close();
        }
        for (let i = 0; i < reg.length; i++) {
            regbyname[reg[i].name] = reg[i];
            //make a dictionary to store the state data with the endpoint names as keys
        }
        setTimeout(() => {
            hideProgressModal();
        }, 1000);
    }
    //set the progress bar to its completed state
}
//process endpoints in batches and write them to the registry.json file
async function resetReg() {
    try {
        await window.api.resetRegistry("registry.json");
    }
    catch (err) {
        try {
            await window.api.logError('./log.txt', `Failed to Reset registry.json: ${err}`);
        }
        catch (logerr) {
            await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
        }
        window.close();
    }
}
//reset the registry.json file
async function secureCategory(categoryIndex) {
    const category = window.categories[categoryIndex];
    var registry_dict = {};
    //dictionary that will contain current endpoint data as the key with the secure endpoint state as the value
    category.endpoints.forEach(endpoint => {
        if (endpoint.version_added <= version && (endpoint.version_removed === false || (typeof endpoint.version_removed != "boolean" && (endpoint.version_removed < version)))) {
            endpoint = regbyname[endpoint.name];
            if (endpoint.securekey !== "" && endpoint.securekey !== "Corrupted") {
                registry_dict[JSON.stringify(endpoint, null, 2)] = parseInt(endpoint.securekey, 10);
            }
            else {
                registry_dict[JSON.stringify(endpoint, null, 2)] = endpoint.securekey;
            }
        }
        //only consider the endpoints that exist in a user's current version of windows
    });
    await changeRegistry(true, registry_dict);
}
function setupFloatingApplyButton(originalButton, floatingButton) {
    if (window.floatingButtonVisibility) {
        window.removeEventListener('scroll', window.floatingButtonVisibility);
        document.querySelector('.main-content')?.removeEventListener('scroll', window.floatingButtonVisibility);
    }
    //make sure there are no duplicate event listeners
    function floatingButtonVisibility() {
        if (!originalButton || !floatingButton) return;
        const rect = originalButton.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (isVisible) {
            floatingButton.classList.remove('visible');
        } else {
            floatingButton.classList.add('visible');
        }
    }
    //shows or hides floatingButton depending on the scroll position
    window.floatingButtonVisibility = floatingButtonVisibility;
    window.addEventListener('scroll', window.floatingButtonVisibility);
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.addEventListener('scroll', window.floatingButtonVisibility);
    }
    //setup a check on the scroll position every time there is a scroll event and control the visibility of the floatingButton
    setTimeout(floatingButtonVisibility, 100);
}
//secure a whole category
function showDualProgressBars() {
    const modal = createProgressModal();
    const registrySection = modal.querySelector('#registry-progress-section');
    const scanSection = modal.querySelector('#scan-progress-section');
    const mainTitle = modal.querySelector('#progress-main-title');
    const subtitle = modal.querySelector('#progress-subtitle');
    registrySection.style.display = 'block';
    scanSection.style.display = 'block';
    mainTitle.textContent = 'Applying Changes';
    subtitle.textContent = 'Modifying registry';
    updateRegistryProgress(0, 'Preparing registry modifications...');
    updateScanProgress(0, 'Waiting for registry changes...');
    modal.classList.add('show');
    const cancelBtn = modal.querySelector('#cancel-scan-btn');
    cancelBtn.style.display = 'none';
}
//create a modal and configure it to display both the registry and scan progress bars starting at 0
function showScanProgressBar() {
    const modal = createProgressModal();
    const registrySection = modal.querySelector('#registry-progress-section');
    const scanSection = modal.querySelector('#scan-progress-section');
    const mainTitle = modal.querySelector('#progress-main-title');
    const subtitle = modal.querySelector('#progress-subtitle');
    window.dualProgressMode = false;
    registrySection.style.display = 'none';
    scanSection.style.display = 'block';
    mainTitle.textContent = 'System Scan';
    subtitle.textContent = 'Analyzing endpoints';
    updateScanProgress(0, 'Initializing scan...');
    modal.classList.add('show');
    const cancelBtn = modal.querySelector('#cancel-scan-btn');
    cancelBtn.textContent = 'Cancel Scan';
    cancelBtn.disabled = false;
    cancelBtn.style.display = 'flex';
}
//create a modal and configure it to display the scan progress bar starting at 0
function showTab(tabId) {
    const floatingButton = document.getElementById('floating-apply-button');
    if (floatingButton) {
        floatingButton.classList.remove('visible');
    }
    const tabs = document.querySelectorAll('.endpoints-tab');
    const buttons = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    //highlight new tab as active and remove active status from other tabs
    const mainContent = document.querySelector('.main-content');
    if (tabId === 'search' || tabId === 'secure' || tabId === 'optional' || tabId === 'insecure') {
        mainContent.classList.add('center-top');
    } else {
        mainContent.classList.remove('center-top');
    }
    //makes sure headers are at the top of the page
    document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
    if (tabId != "home" && tabId != "search") {
        populateEndpointsList(tabId, "");
    }
    else if (tabId === "search") {
        const searchBar = document.getElementById('search-bar');
        const currentQuery = searchBar ? searchBar.value : '';
        populateEndpointsList("search", currentQuery);
    }
    //shows categories when the search page is reloaded
}
//allows for switching tabs
function toggleCategoryDropdown(categoryIndex) {
    const endpointsDiv = document.getElementById(`category-endpoints-${categoryIndex}`);
    if (endpointsDiv.classList.contains('expanded')) {
        endpointsDiv.classList.remove('expanded');
        //stop showing endpoints for the selected category if they are currently visible
    } else {
        document.querySelectorAll('.category-endpoints.expanded').forEach(el => {
            el.classList.remove('expanded');
        });
        //close any other child endpoint displays for other categories
        const category = window.categories[categoryIndex];
        endpointsDiv.innerHTML = '';
        dropdowns = [];
        category.endpoints.forEach(endpoint => {
            if (endpoint.version_added <= version && (endpoint.version_removed === false || (typeof endpoint.version_removed != "boolean" && (endpoint.version_removed < version)))) {
                const endpointContainer = createEndpointElement(endpoint, true);
                endpointsDiv.appendChild(endpointContainer);
            }
        });
        endpointsDiv.classList.add('expanded');
        //show endpoints for the selected category if they are currently not visible and if they are compatible with the user's windows version
    }
}
//toggle detailed endpoint information for each category
function updateEndpointVisualState(container, endpoint) {
    if (!container || !endpoint) return;
    const securityState = getEndpointSecurityState(endpoint);
    container.className = `endpoint-container ${securityState}`;
    const statusDot = container.querySelector('.endpoint-status');
    if (statusDot) {
        statusDot.className = `endpoint-status ${securityState}`;
    }
    const statusIndicator = container.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.className = `status-indicator status-${securityState}`;
        statusIndicator.textContent = securityState.toUpperCase();
    }
}
//update each endpoint's ui theming based on its selected state
function updateProgressUI() {
    if (window.InProgress) {
        disableHomeButtons();
        scanButton.innerHTML = `
            <img src="assets/logo.png" alt="Shield Icon" class="shield-icon">
            <span class="button-text">Scanning...</span>
        `;
        const registryProgressText = document.getElementById('registry-progress-text');
        if (window.dualProgressMode && registryProgressText && registryProgressText.textContent.includes('complete')) {
            showScanProgressBar();
            //if the registry updates are finished only show the scanning progress bar
        } else if (window.dualProgressMode) {
            showDualProgressBars();
            //if the registry updates are not finished show both progress bars
        } else {
            showScanProgressBar();
            //in any other case only show the scanning progress bar
        }
    } else {
        scanButton.innerHTML = `
            <img src="assets/logo.png" alt="Shield Icon" class="shield-icon">
            <span class="button-text">Scan Now</span>
        `;
        if (!window.dualProgressMode) {
            enableHomeButtons();
        }
        //reset the scan button after all registry processing and endpoint scanning is done
    }
}
//change the progress modal to dual or single based on global variables
function updateRegistryProgress(percentage, text) {
    if (!window.progressModal) return;
    window.registryProgressData = { percentage, text };
    const section = window.progressModal.querySelector('#registry-progress-section');
    const fill = window.progressModal.querySelector('#registry-progress-fill');
    const percentageEl = window.progressModal.querySelector('#registry-progress-percentage');
    const textEl = window.progressModal.querySelector('#registry-progress-text');
    const statusIcon = window.progressModal.querySelector('#registry-status-icon');
    if (fill) fill.style.width = `${percentage}%`;
    if (percentageEl) percentageEl.textContent = `${percentage}%`;
    if (textEl) textEl.textContent = text;
    if (section && percentage > 0) {
        section.classList.add('active');
        if (statusIcon) {
            statusIcon.className = 'progress-status-icon registry-active';
        }
    }
    if (section && percentage >= 100) {
        section.classList.remove('active');
        const scanSection = window.progressModal.querySelector('#scan-progress-section');
        if (scanSection) {
            scanSection.style.display = 'block';
            updateScanProgress(0, 'Starting endpoint scan...');
            //indicate a switch to scanning after registry modifications complete
        }
    }
}
//update registry progress display on the modal
function updateScanProgress(percentage, text) {
    if (!window.progressModal) return;
    window.scanProgressData = {percentage, text};
    const section = window.progressModal.querySelector('#scan-progress-section');
    const fill = window.progressModal.querySelector('#scan-progress-fill');
    const percentageEl = window.progressModal.querySelector('#scan-progress-percentage');
    const textEl = window.progressModal.querySelector('#scan-progress-text');
    const statusIcon = window.progressModal.querySelector('#scan-status-icon');
    if (fill) fill.style.width = `${percentage}%`;
    if (percentageEl) percentageEl.textContent = `${percentage}%`;
    if (textEl) textEl.textContent = text;
    if (section && percentage > 0) {
        section.classList.add('active');
        if (statusIcon) {
            statusIcon.className = 'progress-status-icon active';
        }
    }
}
//update the scan progress display on the modal
var dropdowns = [];
//define a global dropdowns list that any function can access
var version;
//define a global version variable that any function can access
var regbyname;
//define a global variable that organizes registry data by endpoint name that any function can access
window.scanCancelled = false;
window.InProgress = false;
window.lastSearchQuery = '';
window.dualProgressMode = false;
window.progressModal = null;
window.scanProgressData = {percentage: 0, text: 'Initializing...'};
window.registryProgressData = {percentage: 0, text: 'Preparing...'};
//define global elements that are used to allow efficient searching and progress bar display
const homeButton = document.getElementById('home-button');
const searchButton = document.getElementById('search-button');
const secureButton = document.getElementById('secure-button');
const optionalButton = document.getElementById('optional-button');
const insecureButton = document.getElementById('insecure-button');
const scanButton = document.getElementById('scan-button');
const documentationButton = document.getElementById('button-documentation');
const backupButton = document.getElementById('button-backup');
const backupImport = document.getElementById('button-import');
//define global button elements that are on the home page
document.addEventListener('DOMContentLoaded', async () => {
    showTab('home');
    //set home tab as the default on program start
    disableHomeButtons()
    scanButton.classList.remove('disabled');
    //make sure all buttons are disabled besides the scan button because an initial scan has to be run to populate data
    windows_versions = [10240, 14393, 15063, 16299, 17134, 19041, 19043, 22000, 26100];
    //all major versions of windows 10 and 11 that these endpoints were either added or removed
    try {
        version = (await window.api.powerShell("[System.Environment]::OSVersion.Version.ToString()", false)).trim();
        //run a powershell command to get the current windows version
        if (version.startsWith("10.0.")) {
            version = (version.substring(5)).substring(0,5);
            //strip the version down to only the update specific part
            windows_versions = windows_versions.reverse();
            //reverse the version list so the for loop starts from the highest version and goes to the lowest
            for (const mversion of windows_versions) {
                if (parseInt(version, 10) >= mversion) {
                    version = mversion;
                    break;
                    //set the global version to the closest main version of windows
                }
            }
        }
        else {
            try {
                await window.api.logError('./log.txt', `This Product is Not Compatible With Your Version of Windows`);
            }
            catch (logerr) {
                await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: This Product is Not Compatible With Your Version of Windows`);
            }
            window.close();        
        }
    }
    catch (err) {
        try {
            await window.api.logError('./log.txt', `Failed to Run PowerShell Command: ${err}`);
        }
        catch (logerr) {
            await window.api.displayDialog('SH13LDME©', `Failed to Write This Error To Log File: ${err}`);
        }
        window.close();      
    }
    scanButton.addEventListener('click', handleScanButtonClick);
});
