var GFtagTreeObserver =
{
  register: function()
  {
    this.prefs = Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefService)
        .getBranch('gamefox.');
    this.prefs.QueryInterface(Ci.nsIPrefBranch2);
    this.prefs.addObserver('tags', this, false);
    window.addEventListener('unload', this.unregister, false);
  },

  unregister: function()
  {
    GFtagTreeObserver.prefs.removeObserver('tags', GFtagTreeObserver);
  },

  observe: function()
  {
    GFtags.populate(2);
  }
};
