ko.extenders.pluckable = function(target, option) {
  // Pluck an iterable by an observable field
  target.pluck = ko.computed(function() {
    return _(target()).map(function(i) { return i[option](); });
  });
};

ko.extenders.toggleable = function(target, option) {
  // Toggles for extension collections
  target.toggle = function(filterFn) {
    _(target()).chain().filter(filterFn).each(function(i) { i.toggle(); });
  };
  target.enable = function(filterFn) {
    _(target()).chain().filter(filterFn).each(function(i) { i.enable(); });
  };
  target.disable = function(filterFn) {
    _(target()).chain().filter(filterFn).each(function(i) { i.disable(); });
  };
};

ko.extenders.persistable = function(target, key) {
  // Persists a single observable (or observableArray) in cloud browser storage
  chrome.storage.sync.get(key, function(v) {
    if(chrome.runtime.lastError) {
      console.error('Failed to get storage value for key:', key, chrome.runtime.lastError);
      return;
    }

    // Set initial value from storage if present.
    if(v[key]) {
      target(v[key]);
    }

    // Subscribe to changes after initializing the value.
    target.subscribe(function(val) {
      var obj={};
      obj[key]=val;
      chrome.storage.sync.set(obj, function() {
        if(chrome.runtime.lastError) {
          console.error('Failed to set storage value for key:', key, chrome.runtime.lastError);
        }
      });
    });
  });
};

ko.extenders.countable = function(target, option) {
  target.count = ko.computed(function() {
    return target().length;
  });

  target.any = ko.computed(function() {
    return target().length > 0;
  });

  target.many = ko.computed(function() {
    return target().length > 1;
  });

  target.none = ko.computed(function() {
    return target().length == 0;
  });
};

const fadeOutMessage = function(id) {
  const el = document.getElementById(id);
  el.className = "visible";
  _.delay(function() { el.className = "fadeout"}, 2000);
};

const DismissalsCollection = function() {
  const self = this;

  self.dismissals = ko.observableArray();

  self.dismiss = function(id) {
    self.dismissals.push(id);
  };

  self.dismissed = function(id) {
    return (self.dismissals.indexOf(id) !== -1)
  };

  // Initializer
  chrome.storage.sync.get("dismissals", function(arr) {
    if(chrome.runtime.lastError) {
      console.error('Failed to get dismissals from storage:', chrome.runtime.lastError);
      return;
    }
    self.dismissals(arr);
    // Subscribe to observables after setting the initial value so we don't re-save the same thing.
    self.dismissals.subscribe(function(a) {
      chrome.storage.sync.set({dismissals: a}, function() {
        if(chrome.runtime.lastError) {
          console.error('Failed to save dismissals to storage:', chrome.runtime.lastError);
        }
      });
    });
  });
};

const OptionsCollection = function() {
  const self = this;

  // Options and defauts
  const defs = {
    showHeader   : true,
    groupApps    : true,
    appsFirst    : false,
    enabledFirst : false,
    searchBox    : true,
    showOptions  : true,
    keepAlwaysOn : false,
    showReserved : false
  };

  // Define observables.
  _(defs).each(function(def,key) {
    self[key] = ko.observable(def);
  });

  // Save values from all observables.
  self.save = function(callback) {
    chrome.storage.sync.set(
      _(defs).mapObject(function(val, key) { return self[key](); }), callback
    );
  };

  // Set observable values from Chrome Storage
  chrome.storage.sync.get(_(defs).keys(), function(v) {
    if(chrome.runtime.lastError) {
      console.error('Failed to get options from storage:', chrome.runtime.lastError);
      return;
    }
    _(v).each(function(val, key) {
      self[key](val);
    });
  });

};

const ProfileModel = function(name, items) {
  const self = this;

  const reserved_names = {
    "__always_on": "Always On"
  };

  self.name = ko.observable(name);
  self.items = ko.observableArray(items);

  self.reserved = ko.computed(function() {
    return self.name().startsWith("__");
  });

  self.hasItems = ko.computed(function() {
    return self.items().length > 0;
  });

  self.short_name = ko.computed(function() {
    return reserved_names[self.name()] || _.str.prune(self.name(),30);
  });

  return this;
};

const ProfileCollectionModel = function() {
  const self = this;

  self.items = ko.observableArray();
  self.localProfiles = ko.observable(undefined).extend({persistable: "localProfiles"});

  self.any = ko.computed(function() {
    return self.items().length > 0;
  });

  self.add = function(name,items) {
    items = items || [];
    return self.items.push(new ProfileModel(name,items));
  }

  self.find = function(name) {
    return _(self.items()).find(function(i) { return i.name() == name});
  }

  self.find_or_create = function(name) {
    return self.find(name) || (new ProfileModel(name, []));
  };

  self.always_on = function() {
    return self.find_or_create("__always_on");
  };

  self.remove = function(profile) {
    self.items.remove(profile);
  }

  self.exists = function(name) {
    return !_(self.find(name)).isUndefined();
  }

  self.save = function(callback) {
    const r = {};

    _(self.items()).each(function(i) {
      if (i.name()) {
        r[i.name()] = _(i.items()).uniq();
      }
    });

    // Try sync storage first. If it fails, store the Profiles locally.
    chrome.storage.sync.set({profiles: r}, function(val) {
      if(chrome.runtime.lastError) {
        self.localProfiles(true);
        chrome.storage.local.set({profiles: r}, callback);
      }
      else {
        self.localProfiles(false);
        callback(val);
      }
    });

  };

  chrome.storage.sync.get("localProfiles", function(v) {
    if(chrome.runtime.lastError) {
      console.error('Failed to get localProfiles setting from storage:', chrome.runtime.lastError);
      return;
    }
    
    // Pull profiles from sync or local storage as appropriate.
    const storage = (v.localProfiles) ? chrome.storage.local : chrome.storage.sync;

    const sortFn = function(el) {
      // Add heading space to reserved profiles to sort at top.
      return (el.startsWith("__") ? " " : "") + el.toUpperCase();
    };

    storage.get("profiles", function(p) {
      if(chrome.runtime.lastError) {
        console.error('Failed to get profiles from storage:', chrome.runtime.lastError);
        return;
      }
      // Defensive: ensure p.profiles exists, otherwise use empty object
      p = (p && p.profiles) ? p.profiles : {};
      const k = _(p).chain().keys().sortBy(sortFn).value();
      _(k).each(function(name) {
        self.items.push(new ProfileModel(name, p[name]));
      });
    });

  })

  return this;
}

const ExtensionModel = function(e) {
  const self = this;

  const item = e;

  // Get the smallest available icon.
  const smallestIcon = function(icons) {
    const smallest = _(icons).chain().pluck('size').min().value();
    const icon = _(icons).find({size: smallest});
    return (icon && icon.url) || '';
  };

  self.id = ko.observable(item.id);
  self.name = ko.observable(item.name);
  self.type = item.type;
  self.mayDisable = item.mayDisable;
  self.isApp = ko.observable(item.isApp);
  self.icon = smallestIcon(item.icons);
  self.status = ko.observable(item.enabled);
  self.optionsUrl = ko.observable(item.optionsUrl);
  self.installType = ko.observable(item.installType);

  self.disabled = ko.pureComputed(function() {
    return !self.status();
  });

  self.is_development = ko.pureComputed(function() {
    return self.installType() == 'development';
  });

  self.short_name = ko.computed(function() {
    return _.str.prune(self.name(),40);
  })

  self.toggle = function() {
    self.status(!self.status());
  };

  self.enable = function() {
    self.status(true);
  };

  self.disable = function() {
    self.status(false);
  }

  self.status.subscribe(function(value) {
    chrome.management.setEnabled(self.id(), value);
  });

};

const ExtensionCollectionModel = function() {
  const self = this;

  self.items = ko.observableArray();

  const typeFilter = function(types) {
    const all = self.items();
    return all.filter(function(item) {
      return _(types).includes(item.type);
    });
  };

  self.extensions = ko.computed(function() {
    return _(typeFilter(['extension'])).filter(function(i) { return i.mayDisable });
  }).extend({pluckable: 'id', toggleable: null});

  self.apps = ko.computed(function() {
    return typeFilter(["hosted_app", "packaged_app", "legacy_packaged_app"]);
  }).extend({pluckable: 'id', toggleable: null});

  // Enabled extensions
  self.enabled = ko.pureComputed(function() {
    return _(self.extensions()).filter( function(i) { return i.status(); });
  }).extend({pluckable: 'id', toggleable: null});

  // Disabled extensions
  self.disabled = ko.pureComputed(function() {
    return _(self.extensions()).filter( function(i) { return !i.status(); });
  }).extend({pluckable: 'id', toggleable: null});

  // Find a single extension model by ud
  self.find = function(id) {
    return _(self.items()).find(function(i) { return i.id()==id });
  };

  // Initialize
  chrome.management.getAll(function(results) {
    if(chrome.runtime.lastError) {
      console.error('Failed to get extension list from chrome.management:', chrome.runtime.lastError);
      return;
    }
    _(results).chain()
      .sortBy(function(i) { return i.name.toUpperCase(); })
      .each(function(i){
        if (i.name != "Rextensity" && i.type != 'theme') {
          self.items.push(new ExtensionModel(i));
        }
      });
  });

};