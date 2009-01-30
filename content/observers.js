/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009 Michael Ryan, Brian Marshall
 *
 * This file is part of GameFOX.
 *
 * GameFOX is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * GameFOX is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with GameFOX.  If not, see <http://www.gnu.org/licenses/>.
 */

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

var GFsidebarFavoritesObserver =
{
  register: function()
  {
    this.prefs = Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefService)
        .getBranch('gamefox.');
    this.prefs.QueryInterface(Ci.nsIPrefBranch2);
    this.prefs.addObserver('favorites.serialized', this, false);
    window.addEventListener('unload', this.unregister, false);
  },

  unregister: function()
  {
    GFsidebarFavoritesObserver.prefs.removeObserver('favorites.serialized', GFsidebarFavoritesObserver);
  },

  observe: function()
  {
    GFfavorites.populateFavorites(document,
        document.getElementById('favorites-menu'));
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
    GFhighlightingOptions.updateUsers();
  }
};

var GFtrackedTreeObserver =
{
  register: function()
  {
    this.prefs = Cc['@mozilla.org/preferences-service;1']
      .getService(Ci.nsIPrefService)
      .getBranch('gamefox.');
    this.prefs.QueryInterface(Ci.nsIPrefBranch2);
    this.prefs.addObserver('tracked', this, false);
    window.addEventListener('unload', this.unregister, false);
  },

  unregister: function()
  {
    GFtrackedTreeObserver.prefs.removeObserver('tracked', GFtrackedTreeObserver);
  },

  observe: function()
  {
    gTrackedWindow.init();
  }
};
