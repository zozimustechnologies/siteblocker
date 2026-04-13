// Site Blocker - Settings Page Logic

document.addEventListener('DOMContentLoaded', () => {
  const mathChallengeToggle = document.getElementById('mathChallengeToggle');
  const settingsStatus = document.getElementById('settingsStatus');

  // Load current settings
  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(['mathChallengeEnabled']);
      // Default to true if not set
      mathChallengeToggle.checked = result.mathChallengeEnabled !== false;
    } catch (error) {
      mathChallengeToggle.checked = true;
    }
  }

  // Save setting when toggled
  mathChallengeToggle.addEventListener('change', async () => {
    try {
      await chrome.storage.local.set({ mathChallengeEnabled: mathChallengeToggle.checked });
      showStatus(mathChallengeToggle.checked ? 'Math challenge enabled' : 'Math challenge disabled');
    } catch (error) {
      showStatus('Failed to save setting');
    }
  });

  function showStatus(message) {
    settingsStatus.textContent = message;
    settingsStatus.classList.remove('hidden');
    setTimeout(() => {
      settingsStatus.classList.add('hidden');
    }, 2000);
  }

  loadSettings();
});
