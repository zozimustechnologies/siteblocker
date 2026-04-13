// Site Blocker - Background Service Worker

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Configure side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Rule ID counter - we use the index + 1 as rule ID
const RULE_ID_OFFSET = 1;

// Get the redirect URL for blocked pages
function getBlockedPageUrl() {
  return chrome.runtime.getURL('blocked.html');
}

// Create a blocking rule for a domain
function createBlockingRule(id, domain) {
  // Remove any leading www. for consistent matching
  const cleanDomain = domain.replace(/^www\./, '');
  
  return {
    id: id,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        url: getBlockedPageUrl()
      }
    },
    condition: {
      // Use requestDomains for reliable domain matching (includes subdomains)
      requestDomains: [cleanDomain],
      resourceTypes: ['main_frame', 'sub_frame']
    }
  };
}

// Update all blocking rules based on the current blocked sites list
async function syncBlockingRules() {
  try {
    // Get current state from storage
    const result = await chrome.storage.local.get(['blockedSites', 'masterEnabled']);
    const blockedSites = result.blockedSites || [];
    const masterEnabled = result.masterEnabled !== false; // Default to true

    // Get existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    // If master toggle is off, remove all rules
    if (!masterEnabled) {
      if (existingRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds
        });
      }
      return { success: true, activeRules: 0 };
    }

    // Create rules for enabled sites only
    const newRules = [];
    blockedSites.forEach((site, index) => {
      if (site.enabled) {
        newRules.push(createBlockingRule(index + RULE_ID_OFFSET, site.domain));
      }
    });

    // Remove all existing rules and add new ones
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules
    });

    return { success: true, activeRules: newRules.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Add a new site to the blocked list
async function addBlockedSite(domain) {
  try {
    const result = await chrome.storage.local.get(['blockedSites']);
    const blockedSites = result.blockedSites || [];

    // Check limit
    if (blockedSites.length >= 100) {
      return { success: false, error: 'Maximum 100 sites allowed' };
    }

    // Check for duplicates
    const normalizedDomain = domain.toLowerCase().trim();
    if (blockedSites.some(site => site.domain === normalizedDomain)) {
      return { success: false, error: 'Site already in list' };
    }

    // Add new site
    blockedSites.push({
      domain: normalizedDomain,
      enabled: true,
      addedAt: new Date().toISOString()
    });

    await chrome.storage.local.set({ blockedSites });
    await syncBlockingRules();

    return { success: true, site: blockedSites[blockedSites.length - 1] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Remove a site from the blocked list
async function removeBlockedSite(domain) {
  try {
    const result = await chrome.storage.local.get(['blockedSites']);
    let blockedSites = result.blockedSites || [];

    blockedSites = blockedSites.filter(site => site.domain !== domain);

    await chrome.storage.local.set({ blockedSites });
    await syncBlockingRules();

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Toggle a specific site's enabled state
async function toggleSite(domain, enabled) {
  try {
    const result = await chrome.storage.local.get(['blockedSites']);
    const blockedSites = result.blockedSites || [];

    const site = blockedSites.find(s => s.domain === domain);
    if (site) {
      site.enabled = enabled;
      await chrome.storage.local.set({ blockedSites });
      await syncBlockingRules();
      return { success: true };
    }

    return { success: false, error: 'Site not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Toggle master enabled state
async function toggleMaster(enabled) {
  try {
    await chrome.storage.local.set({ masterEnabled: enabled });
    await syncBlockingRules();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get all blocked sites and state
async function getBlockedSites() {
  try {
    const result = await chrome.storage.local.get(['blockedSites', 'masterEnabled']);
    return {
      success: true,
      blockedSites: result.blockedSites || [],
      masterEnabled: result.masterEnabled !== false
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Message listener for communication with side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleAsync = async () => {
    switch (message.action) {
      case 'addSite':
        return await addBlockedSite(message.domain);
      case 'removeSite':
        return await removeBlockedSite(message.domain);
      case 'toggleSite':
        return await toggleSite(message.domain, message.enabled);
      case 'toggleMaster':
        return await toggleMaster(message.enabled);
      case 'getSites':
        return await getBlockedSites();
      case 'syncRules':
        return await syncBlockingRules();
      default:
        return { success: false, error: 'Unknown action' };
    }
  };

  handleAsync().then(sendResponse);
  return true; // Keep message channel open for async response
});

// Initialize rules on extension startup
chrome.runtime.onStartup.addListener(() => {
  syncBlockingRules();
});

// Initialize rules on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  syncBlockingRules();
});

// Also sync immediately when service worker loads
syncBlockingRules();
