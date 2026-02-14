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