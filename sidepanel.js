// Site Blocker - Side Panel Logic

document.addEventListener('DOMContentLoaded', () => {
  // Challenge gate elements
  const challengeOverlay = document.getElementById('challengeOverlay');
  const challengeQuestion = document.getElementById('challengeQuestion');
  const challengeAnswer = document.getElementById('challengeAnswer');
  const challengeSubmit = document.getElementById('challengeSubmit');
  const challengeError = document.getElementById('challengeError');
  const challengeNewQuestion = document.getElementById('challengeNewQuestion');

  // Current challenge state
  let currentAnswer = null;

  // Math question generators (kept accessible for most adults)
  function generateChallenge() {
    const generators = [
      // Easy multiplication
      () => {
        const a = Math.floor(Math.random() * 6) + 3;
        const b = Math.floor(Math.random() * 6) + 3;
        return { question: `What is ${a} \u00d7 ${b}?`, answer: a * b };
      },
      // Easy division
      () => {
        const b = Math.floor(Math.random() * 6) + 2;
        const result = Math.floor(Math.random() * 8) + 2;
        return { question: `What is ${b * result} \u00f7 ${b}?`, answer: result };
      },
      // Solve for x: x + a = b (small numbers)
      () => {
        const a = Math.floor(Math.random() * 15) + 3;
        const x = Math.floor(Math.random() * 20) + 5;
        return { question: `Solve for x: x + ${a} = ${x + a}`, answer: x };
      },
      // Square root of easy perfect squares
      () => {
        const squares = [4, 9, 16, 25, 36, 49, 64, 100];
        const n = squares[Math.floor(Math.random() * squares.length)];
        return { question: `What is the square root of ${n}?`, answer: Math.sqrt(n) };
      }
    ];
    const gen = generators[Math.floor(Math.random() * generators.length)];
    return gen();
  }

  function showChallenge() {
    const challenge = generateChallenge();
    currentAnswer = challenge.answer;
    challengeQuestion.textContent = challenge.question;
    challengeAnswer.value = '';
    challengeError.classList.add('hidden');
    challengeOverlay.classList.remove('hidden');
    setTimeout(() => challengeAnswer.focus(), 100);
  }

  function verifyChallenge() {
    const userAnswer = parseFloat(challengeAnswer.value);
    if (!isNaN(userAnswer) && userAnswer === currentAnswer) {
      challengeOverlay.classList.add('hidden');
      initMainUI();
    } else {
      challengeError.classList.remove('hidden');
      challengeAnswer.value = '';
      challengeAnswer.focus();
    }
  }

  // Challenge event listeners
  challengeSubmit.addEventListener('click', verifyChallenge);
  challengeAnswer.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyChallenge();
  });
  challengeAnswer.addEventListener('input', () => {
    challengeError.classList.add('hidden');
  });
  challengeNewQuestion.addEventListener('click', showChallenge);

  // Check if challenge is needed (only if sites are already blocked)
  async function checkChallenge() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSites' });
      if (response.success && response.blockedSites.length > 0) {
        showChallenge();
      } else {
        initMainUI();
      }
    } catch (error) {
      initMainUI();
    }
  }

  checkChallenge();

  function initMainUI() {
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

  } // end initMainUI
});
