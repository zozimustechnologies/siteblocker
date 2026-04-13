// Site Blocker - Side Panel Logic

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const masterToggle = document.getElementById('masterToggle');
  const masterStatus = document.getElementById('masterStatus');
  const siteInput = document.getElementById('siteInput');
  const addSiteBtn = document.getElementById('addSiteBtn');
  const inputError = document.getElementById('inputError');
  const siteCounter = document.getElementById('siteCounter');
  const statusMessage = document.getElementById('statusMessage');
  const emptyState = document.getElementById('emptyState');
  const sitesList = document.getElementById('sitesList');

  // State
  let blockedSites = [];
  let masterEnabled = true;

  // Initialize
  loadSites();

  // Event Listeners
  masterToggle.addEventListener('change', handleMasterToggle);
  addSiteBtn.addEventListener('click', handleAddSite);
  siteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddSite();
  });
  siteInput.addEventListener('input', () => {
    hideError();
  });

  // Load sites from storage
  async function loadSites() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSites' });
      if (response.success) {
        blockedSites = response.blockedSites;
        masterEnabled = response.masterEnabled;
        updateUI();
      }
    } catch (error) {
      showStatus('Failed to load sites', 'error');
    }
  }

  // Update all UI elements
  function updateUI() {
    // Master toggle
    masterToggle.checked = masterEnabled;
    masterStatus.textContent = masterEnabled ? 'ON' : 'OFF';
    masterStatus.className = `master-status ${masterEnabled ? 'on' : 'off'}`;

    // Counter
    siteCounter.textContent = `${blockedSites.length}/100 sites`;

    // Sites list
    if (blockedSites.length === 0) {
      emptyState.classList.remove('hidden');
      sitesList.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      sitesList.classList.remove('hidden');
      renderSitesList();
    }
  }

  // Render the blocked sites list using safe DOM APIs
  function renderSitesList() {
    sitesList.textContent = '';

    blockedSites.forEach(site => {
      const li = document.createElement('li');
      li.className = 'site-item' + (site.enabled ? '' : ' disabled');
      li.dataset.domain = site.domain;

      const info = document.createElement('div');
      info.className = 'site-info';
      const span = document.createElement('span');
      span.className = 'site-domain';
      span.textContent = site.domain;
      info.appendChild(span);

      const actions = document.createElement('div');
      actions.className = 'site-actions';

      const label = document.createElement('label');
      label.className = 'toggle-switch site-toggle';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = site.enabled;
      checkbox.addEventListener('change', () => handleSiteToggle(site.domain, checkbox.checked));
      const slider = document.createElement('span');
      slider.className = 'toggle-slider';
      label.appendChild(checkbox);
      label.appendChild(slider);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.title = 'Remove site';
      deleteBtn.textContent = '\u00d7';
      deleteBtn.addEventListener('click', () => handleDeleteSite(site.domain));

      actions.appendChild(label);
      actions.appendChild(deleteBtn);

      li.appendChild(info);
      li.appendChild(actions);
      sitesList.appendChild(li);
    });
  }

  // Handle master toggle change
  async function handleMasterToggle() {
    const enabled = masterToggle.checked;
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'toggleMaster', 
        enabled 
      });
      if (response.success) {
        masterEnabled = enabled;
        masterStatus.textContent = enabled ? 'ON' : 'OFF';
        masterStatus.className = `master-status ${enabled ? 'on' : 'off'}`;
        showStatus(enabled ? 'Blocking enabled' : 'Blocking disabled', 'success');
      }
    } catch (error) {
      masterToggle.checked = !enabled; // Revert
      showStatus('Failed to toggle blocking', 'error');
    }
  }

  // Handle add site
  async function handleAddSite() {
    const input = siteInput.value.trim();
    
    if (!input) {
      showError('Please enter a domain');
      return;
    }

    const domain = extractDomain(input);
    
    if (!domain) {
      showError('Invalid domain format');
      return;
    }

    if (blockedSites.length >= 100) {
      showError('Maximum 100 sites allowed');
      return;
    }

    try {
      addSiteBtn.disabled = true;
      const response = await chrome.runtime.sendMessage({ 
        action: 'addSite', 
        domain 
      });
      
      if (response.success) {
        blockedSites.push(response.site);
        siteInput.value = '';
        updateUI();
        showStatus(`${domain} added to blocklist`, 'success');
      } else {
        showError(response.error || 'Failed to add site');
      }
    } catch (error) {
      showError('Failed to add site');
    } finally {
      addSiteBtn.disabled = false;
    }
  }

  // Handle site toggle
  async function handleSiteToggle(domain, enabled) {
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'toggleSite', 
        domain, 
        enabled 
      });
      
      if (response.success) {
        const site = blockedSites.find(s => s.domain === domain);
        if (site) site.enabled = enabled;
        updateUI();
      }
    } catch (error) {
      showStatus('Failed to toggle site', 'error');
      loadSites(); // Reload to sync state
    }
  }

  // Handle delete site
  async function handleDeleteSite(domain) {
    try {
      const response = await chrome.runtime.sendMessage({ 
        action: 'removeSite', 
        domain 
      });
      
      if (response.success) {
        blockedSites = blockedSites.filter(s => s.domain !== domain);
        updateUI();
        showStatus(`${domain} removed`, 'success');
      }
    } catch (error) {
      showStatus('Failed to remove site', 'error');
    }
  }

  // Extract domain from input (handles URLs and plain domains)
  function extractDomain(input) {
    let domain = input.toLowerCase().trim();
    
    // Remove protocol if present
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Remove path, query, hash
    domain = domain.split('/')[0].split('?')[0].split('#')[0];
    
    // Basic domain validation
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
    
    if (!domainRegex.test(domain)) {
      return null;
    }
    
    return domain;
  }

  // Show input error
  function showError(message) {
    inputError.textContent = message;
    inputError.classList.remove('hidden');
    siteInput.classList.add('error');
  }

  // Hide input error
  function hideError() {
    inputError.classList.add('hidden');
    siteInput.classList.remove('error');
  }

  // Show status message
  function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.classList.remove('hidden');
    
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 3000);
  }

});
