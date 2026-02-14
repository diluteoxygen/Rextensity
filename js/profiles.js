document.addEventListener("DOMContentLoaded", function() {

  const ProfilesViewModel = function() {
    const self = this;

    self.ext = new ExtensionCollectionModel();
    self.profiles = new ProfileCollectionModel();
    self.current_profile = ko.observable();
    self.add_name = ko.observable("");

    self.current_name = ko.pureComputed(function() {
      return (self.current_profile()) ? self.current_profile().name() : null;
    });

    self.editable = ko.computed(function() {
      return self.current_profile() || false;
    });

    self.select = function(data) {
      self.current_profile(data);
    };

    self.selectAlwaysOn = function(data) {
      self.selectReserved(data, "always_on");
    }

    self.selectReserved = function(data, n) {
      self.add_name("__"+n);
      self.add();
    };

    self.selectByIndex = function(idx) {
      self.current_profile(self.profiles.items()[idx]);
    };

    self.add = function() {
      const n = self.add_name();
      const enabled = self.ext.enabled.pluck();
      if(n) {
        const p = self.profiles.find(n);
        if(!p) {
          // Warning! slice or the array reference will mix up between all instances.
          self.profiles.add(n,enabled.slice());
          self.selectByIndex(self.profiles.items().length-1);
        }
        else {
          self.current_profile(p);
        }
        self.add_name("");
      }
    };

    self.remove = function(profile) {
      const c = (profile == self.current_profile());
      if(confirm("Are you sure you want to remove this profile?")) {
        self.profiles.remove(profile);
        if(c) self.selectByIndex(0); // Select first one if removing the current.
      }
    };

    self.save = function() {
      self.profiles.save(function() {
        fadeOutMessage("save-result");
      });
    };

    self.close = function() { window.close(); }

    self.toggleAll = function() {
      const exts = _(self.ext.extensions()).map(function(i) { return i.id(); });
      self.current_profile().items(exts);
    };

    self.toggleNone = function() {
      if(self.current_profile()) self.current_profile().items([]);
    };

    self.exportProfiles = function() {
      // Create export data structure
      const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        profiles: {}
      };

      // Collect all profiles (excluding reserved ones for clarity)
      _(self.profiles.items()).each(function(profile) {
        if (profile.name()) {
          exportData.profiles[profile.name()] = profile.items();
        }
      });

      // Convert to JSON
      const jsonStr = JSON.stringify(exportData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rextensity-profiles-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    self.triggerImport = function() {
      // Trigger the hidden file input
      document.getElementById('import-file').click();
    };

    self.importProfiles = function(vm, event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          // Parse JSON
          const importData = JSON.parse(e.target.result);
          
          // Validate structure
          if (!importData.profiles || typeof importData.profiles !== 'object') {
            self.showImportError('Invalid file format. Expected profiles object.');
            return;
          }

          // Check version compatibility
          if (importData.version && importData.version !== "1.0") {
            console.warn('Import file version mismatch:', importData.version);
          }

          let importedCount = 0;
          let skippedCount = 0;

          // Import profiles
          _(importData.profiles).each(function(items, name) {
            // Skip if profile already exists
            if (self.profiles.exists(name)) {
              skippedCount++;
              console.log('Profile already exists, skipping:', name);
            } else {
              // Validate items is an array
              if (Array.isArray(items)) {
                self.profiles.add(name, items);
                importedCount++;
              } else {
                console.warn('Invalid profile data for:', name);
                skippedCount++;
              }
            }
          });

          // Save imported profiles
          self.profiles.save(function() {
            self.showImportSuccess(`Imported ${importedCount} profile(s). ${skippedCount > 0 ? `Skipped ${skippedCount} duplicate(s).` : ''}`);
            // Select first profile
            if (self.profiles.items().length > 0) {
              self.selectByIndex(0);
            }
          });

        } catch (error) {
          console.error('Import error:', error);
          self.showImportError('Failed to parse JSON file: ' + error.message);
        }

        // Reset file input
        event.target.value = '';
      };

      reader.onerror = function() {
        self.showImportError('Failed to read file.');
        event.target.value = '';
      };

      reader.readAsText(file);
    };

    self.showImportSuccess = function(message) {
      const successEl = document.getElementById('import-result');
      const errorEl = document.getElementById('import-error');
      errorEl.className = 'hidden';
      successEl.innerHTML = '<i class="fa fa-check"></i> ' + (message || 'Import successful!');
      successEl.className = 'visible';
      setTimeout(function() {
        successEl.className = 'hidden';
      }, 5000);
    };

    self.showImportError = function(message) {
      const successEl = document.getElementById('import-result');
      const errorEl = document.getElementById('import-error');
      const errorMsg = document.getElementById('import-error-message');
      successEl.className = 'hidden';
      errorMsg.textContent = message || 'Import failed.';
      errorEl.className = 'visible';
      setTimeout(function() {
        errorEl.className = 'hidden';
      }, 5000);
    };

    try {
      (new DismissalsCollection()).dismiss("profile_page_viewed");
      self.selectByIndex(0);
    }
    catch(e) {
      console.log('No profiles available to select:', e);
    }

  };

  const vm = new ProfilesViewModel();

  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
  ko.applyBindings(vm, document.getElementById('profiles'));

});