// Migration from localStorage settings to Chrome Storage sync.

// Helper: remove sync'd storage for testing
// chrome.storage.sync.remove(['migration','profiles', 'showHeader', 'groupApps', 'appsFirst', 'enabledFirst', 'searchBox', 'dismissals', 'toggled']);

// Get the right boolean value.
// Hack to override default string-only localStorage implementation
// http://stackoverflow.com/questions/3263161/cannot-set-boolean-values-in-localstorage
function boolean(value) {
  if (value === "true")
    return true;
  else if (value === "false")
    return false;
  else
    return Boolean(value);
}

function migrate_to_chrome_storage() {
  chrome.storage.sync.get("migration", function(v) {
    if(chrome.runtime.lastError) {
      console.error('Failed to check migration status:', chrome.runtime.lastError);
      return;
    }
    
    // Only initialize defaults if migration hasn't been done.
    if(v.migration) {
      console.log("Storage already initialized or migration completed");
    }
    else {
      console.log("Initializing Chrome Storage with default values");

      // Note: In Manifest V3, localStorage is not available in service workers.
      // For new installs, we set default values.
      // For upgrades from V2 where migration didn't happen, data is inaccessible.
      const data = {
        dismissals:   [],
        profiles:     {},
        showHeader:   true,
        groupApps:    true,
        appsFirst:    false,
        enabledFirst: false,
        searchBox:    true,
        migration:    "1.4.0"
      };
      
      chrome.storage.sync.set(data, function() {
        if(chrome.runtime.lastError) {
          console.error('Failed to set initial storage data:', chrome.runtime.lastError);
          return;
        }
        console.log('Storage initialized successfully');
      });
    }
  });
}

// Listeners for the event page / service worker
chrome.runtime.onInstalled.addListener(function(details) {
  if(details.reason === 'install') {
    // New install - initialize with default values
    migrate_to_chrome_storage();
  } else if(details.reason === 'update') {
    // Check if storage has been initialized
    chrome.storage.sync.get("migration", function(v) {
      if(chrome.runtime.lastError) {
        console.error('Failed to check migration status during update:', chrome.runtime.lastError);
        return;
      }
      if(!v.migration) {
        // Storage not initialized - set defaults
        // Note: For V2->V3 upgrades, localStorage data is inaccessible in service workers
        migrate_to_chrome_storage();
      }
    });
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(function(command) {
  if (command === 'toggle-all') {
    // Get current state from storage
    chrome.storage.sync.get(['toggled', 'keepAlwaysOn'], function(result) {
      if(chrome.runtime.lastError) {
        console.error('Failed to get toggle state:', chrome.runtime.lastError);
        return;
      }
      
      const toggled = result.toggled || [];
      const keepAlwaysOn = result.keepAlwaysOn || false;
      
      // Get all extensions
      chrome.management.getAll(function(extensions) {
        if(chrome.runtime.lastError) {
          console.error('Failed to get extensions:', chrome.runtime.lastError);
          return;
        }
        
        // Get Always On profile if keepAlwaysOn is enabled
        let alwaysOnIds = [];
        if (keepAlwaysOn) {
          chrome.storage.sync.get('profiles', function(p) {
            if (!chrome.runtime.lastError && p.profiles && p.profiles.__always_on) {
              alwaysOnIds = p.profiles.__always_on;
            }
            performToggle(extensions, toggled, alwaysOnIds);
          });
        } else {
          performToggle(extensions, toggled, alwaysOnIds);
        }
      });
    });
  }
});

function performToggle(extensions, toggled, alwaysOnIds) {
  if (toggled.length > 0) {
    // Re-enable previously disabled extensions
    toggled.forEach(function(id) {
      try {
        chrome.management.setEnabled(id, true);
      } catch(e) {
        console.error('Failed to enable extension:', id, e);
      }
    });
    // Clear toggled list
    chrome.storage.sync.set({toggled: []});
  } else {
    // Disable all enabled extensions (except Always On if applicable)
    const enabledIds = [];
    extensions.forEach(function(ext) {
      if (ext.enabled && ext.mayDisable && ext.name !== 'Rextensity' && ext.type !== 'theme') {
        // Skip if in Always On profile
        if (alwaysOnIds.indexOf(ext.id) === -1) {
          enabledIds.push(ext.id);
          try {
            chrome.management.setEnabled(ext.id, false);
          } catch(e) {
            console.error('Failed to disable extension:', ext.id, e);
          }
        }
      }
    });
    // Save disabled list
    chrome.storage.sync.set({toggled: enabledIds});
  }
}