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

// Boolean value from storage with a default
function b(idx, def) {
  // Note: In Manifest V3 service workers, localStorage is not available
  // This function is kept for backwards compatibility but won't be called
  // as migration should have already happened in V2
  return def;
}

function migrate_to_chrome_storage() {
  chrome.storage.sync.get("migration", function(v) {
    if(chrome.runtime.lastError) {
      console.error('Failed to check migration status:', chrome.runtime.lastError);
      return;
    }
    
    // Only migrate if another migration hasn't been done in a different computer.
    if(v["migration"]) {
      console.log("Migration from localStorage already happened in another computer");
    }
    else {
      console.log("Migrate localStorage data to Chrome Storage Sync");

      // Note: In Manifest V3, localStorage is not available in service workers
      // Migration from localStorage should have already happened in V2
      // Setting default empty values for new installs
      var data = {
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
          console.error('Failed to set initial migration data:', chrome.runtime.lastError);
          return;
        }
        console.log('Initial migration data set successfully');
      });
    }
  });
}

// Listeners for the event page / service worker
chrome.runtime.onInstalled.addListener(function(details) {
  if(details["reason"] == 'install') {
    // New install - set up defaults
    migrate_to_chrome_storage();
  } else if(details["reason"] == 'update') {
    // Check if migration is needed
    chrome.storage.sync.get("migration", function(v) {
      if(!v["migration"]) {
        // Migration not yet done, but we're in V3 now
        // Set defaults for new users
        migrate_to_chrome_storage();
      }
    });
  }
});