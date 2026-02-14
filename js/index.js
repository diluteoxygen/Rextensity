document.addEventListener("DOMContentLoaded", function() {

  const SearchViewModel = function() {
    const self = this;
    self.q = ko.observable("");

    // TODO: Add more search control here.
  };

  const SwitchViewModel = function(exts, profiles, opts) {
    const self = this;

    const init = [];

    self.exts = exts;
    self.profiles = profiles;
    self.opts = opts;
    self.toggled = ko.observableArray().extend({persistable: "toggled"});

    self.any = ko.computed(function() {
      return self.toggled().length > 0;
    });

    self.toggleStyle = ko.pureComputed(function() {
      return (self.any()) ? 'fa-toggle-off' : 'fa-toggle-on'
    });

    const disableFilterFn = function(item) {
      // Filter out Always On extensions when disabling, if option is set.
      if(!self.opts.keepAlwaysOn()) return true;
      return !_(self.profiles.always_on().items()).contains(item.id());
    };

    self.flip = function() {
      if(self.any()) {
        // Re-enable
        _(self.toggled()).each(function(id) {
          // Old disabled extensions may be removed
          try{ 
            self.exts.find(id).enable();
          } catch(e) {
            console.error('Failed to enable extension:', id, e);
          }
        });
        self.toggled([]);
      } else {
        // Disable
        self.toggled(self.exts.enabled.pluck());
        self.exts.enabled.disable(disableFilterFn);
      };
    };

  };

  const RextensityViewModel = function() {
    const self = this;

    self.profiles = new ProfileCollectionModel();
    self.exts = new ExtensionCollectionModel();
    self.opts = new OptionsCollection();
    self.dismissals = new DismissalsCollection();
    self.switch = new SwitchViewModel(self.exts, self.profiles, self.opts);
    self.search = new SearchViewModel();
    self.activeProfile = ko.observable().extend({persistable: "activeProfile"});

    const filterFn = function(i) {
      // Filtering function for search box
      if(!self.opts.searchBox()) return true;
      if(!self.search.q()) return true;
      return i.name().toUpperCase().indexOf(self.search.q().toUpperCase()) !== -1;
    };

    const filterProfileFn = function(i) {
      // Only show public profiles in the list
      return self.opts.showReserved() || !i.reserved();
    }

    const nameSortFn = function(i) {
      return i.name().toUpperCase();
    };

    const statusSortFn = function(i) {
      return !i.status();
    };

    self.openChromeExtensions = function() {
      openTab("chrome://extensions");
    };

    self.launchApp = function(app) {
      chrome.management.launchApp(app.id());
    };

    self.launchOptions = function(ext) {
      chrome.tabs.create({url: ext.optionsUrl(), active: true});
    };

    self.listedExtensions = ko.computed(function() {
      // Sorted/Filtered list of extensions
      return (self.opts.enabledFirst()) ?
        _(self.exts.extensions()).chain().sortBy(nameSortFn).sortBy(statusSortFn).filter(filterFn).value() :
        _(self.exts.extensions()).filter(filterFn);
    }).extend({countable: null});

    self.listedApps = ko.computed(function() {
      // Sorted/Filtered list of apps
      return _(self.exts.apps()).filter(filterFn);
    }).extend({countable: null});

    self.listedItems = ko.computed(function() {
      // Sorted/Filtered list of all items
      return _(self.exts.items()).filter(filterFn);
    }).extend({countable: null});

    self.listedProfiles = ko.computed(function() {
      return _(self.profiles.items()).filter(filterProfileFn);
    }).extend({countable: null});

    self.emptyItems = ko.pureComputed(function() {
      return self.listedApps.none() && self.listedExtensions.none();
    });

    self.setProfile = function(p) {
      self.activeProfile(p.name());
      // Profile items, plus always-on items
      const ids = _.union(p.items(), self.profiles.always_on().items());
      const to_enable = _.intersection(self.exts.disabled.pluck(),ids);
      const to_disable = _.difference(self.exts.enabled.pluck(), ids);
      _(to_enable).each(function(id) { self.exts.find(id).enable() });
      _(to_disable).each(function(id) { self.exts.find(id).disable() });
    };

    self.unsetProfile = function() {
      self.activeProfile(undefined);
    };

    self.toggleExtension = function(e) {
      e.toggle();
      self.unsetProfile();
    }

    // Private helper functions
    const openTab = function (url) {
      chrome.tabs.create({url: url});
      close();
    };

    const close = function() {
      window.close();
    };

    // View helpers
    const visitedProfiles = ko.computed(function() {
      return (self.dismissals.dismissed("profile_page_viewed") || self.profiles.any());
    });

  };

  _.defer(function() {
    const vm = new RextensityViewModel();
    ko.bindingProvider.instance = new ko.secureBindingsProvider({});
    ko.applyBindings(vm, document.body);
  });

  // Workaround for Chrome bug https://bugs.chromium.org/p/chromium/issues/detail?id=307912
  window.setTimeout(function() { document.getElementById('workaround-307912').style.display = 'block'; }, 0);
});
