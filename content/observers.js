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

var GFsidebarAccountsObserver =
{
  register: function()
  {
    this.prefs = Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefService)
        .getBranch('gamefox.');
    this.prefs.QueryInterface(Ci.nsIPrefBranch2);
    this.prefs.addObserver('accounts', this, false);
    window.addEventListener('unload', this.unregister, false);
  },

  unregister: function()
  {
    GFsidebarAccountsObserver.prefs.removeObserver('accounts', GFsidebarAccountsObserver);
  },

  observe: function()
  {
    GFsidebar.populateAccounts();
  }
};

var GFuserlistObserver =
{
  register: function()
  {
    this.prefs = Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefService)
        .getBranch('gamefox.');
    this.prefs.QueryInterface(Ci.nsIPrefBranch2);
    this.prefs.addObserver('userlist.serialized', this, false);
    window.addEventListener('unload', this.unregister, false);
  },

  unregister: function()
  {
    GFuserlistObserver.prefs.removeObserver('userlist.serialized', GFuserlistObserver);
  },

  observe: function()
  {
    GFuserlist.updateUsers();
  }
};
