document.addEventListener("DOMContentLoaded", function() {
  const OptionsViewModel = function() {
    const self = this;
    self.options = new OptionsCollection();

    self.save = function() {
      self.options.save(function() {
        fadeOutMessage("save-result");
      });
    };

    self.close = function() { window.close(); }
  };

  const vm = new OptionsViewModel();

  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
  ko.applyBindings(vm, document.getElementById('options'));
});