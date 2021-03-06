/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012
 * Abdullah A, Toad King, Andrianto Effendy, Brian Marshall, Michael Ryan
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

/**
 * GameFOX startup and update functions
 * @namespace
 */
var gamefox =
{
  init: function()
  {
    window.removeEventListener('load', gamefox.init, false);
    document.getElementById('appcontent').addEventListener(
        'DOMContentLoaded', gamefox_page.onload, false);
    document.getElementById('contentAreaContextMenu').addEventListener(
        'popupshowing', gamefox_context.displayMenu, false);

    gamefox.startup();
  },

  startup: function()
  {
    try
    {
      Cu.import('resource://gre/modules/AddonManager.jsm');
      AddonManager.getAddonByID(gamefox_lib.extensionID, gamefox.update);
    }
    catch (e if e.result === Cr.NS_ERROR_FILE_NOT_FOUND)
    {
      gamefox.update({ version: Cc['@mozilla.org/extensions/manager;1']
          .getService(Ci.nsIExtensionManager)
          .getItemForID(gamefox_lib.extensionID).version });
    }

    // disable favorites
    if (!gamefox_lib.prefs.getBoolPref('favorites.enabled'))
      gamefox_lib.prefs.clearUserPref('favorites.serialized');

    // post key
    gamefox_quickpost.updatePostKey();
    var postKeyObserver = new gamefox_cookie_observer(gamefox_quickpost
        .keyObserver);
    postKeyObserver.register();
    new gamefox_pref_observer('accounts.current', gamefox_quickpost
        .keyObserver);
  },

  update: function(addon)
  {
    var comparator = Cc['@mozilla.org/xpcom/version-comparator;1']
      .getService(Ci.nsIVersionComparator);
    var lastVersion = gamefox_lib.version;
    var version = addon.version;
    gamefox_lib.version = version;

    // upgrade, downgrade, first run or dev version
    if (comparator.compare(version, lastVersion) != 0
        || (gamefox_lib.isDev() && !gamefox_lib.isNightly()))
    {
      gamefox.upgrade(comparator, lastVersion);

      // first run
      if (lastVersion == '')
      {
        gamefox.importMsgsPerPage();
        gamefox.addToolbarButton();
      }

      // new nightly/dev install
      if (gamefox_lib.isDev() && !gamefox_lib.isDev(lastVersion))
        window.setTimeout(function() {
          gamefox_lib.newTab('chrome://gamefox/content/nightly.html', 0);
        }, 10);

      // change log for new stable release
      else if (!gamefox_lib.isDev() && lastVersion != ''
          && gamefox_lib.prefs.getBoolPref('showReleaseNotes'))
        window.setTimeout(function() {
          gamefox_lib.newTab(
            'http://beyondboredom.net/gamefox/changes?version=' + version, 0);
        }, 10);

      gamefox_css.init();
    }

    gamefox_css.reload();
  },

  /**
   * Make modifications to preferences to upgrade from one version of GameFOX
   * to another.
   *
   * @param {nsIVersionComparator} comparator
   * @param {String} version
   *        Current (upgrading to) GameFOX version
   * @return {void}
   */
  upgrade: function(comparator, version)
  {
    /* 0.8 */
    if (comparator.compare('0.8', version) > 0)
    {
      gamefox.addToolbarButton();

      // New CSS category: extras
      var css = gamefox_css.list;
      if (!css.extras)
        css.extras = {};
      gamefox_lib.setString('theme.css.serialized', JSON.stringify(css));
    }
  },

  importMsgsPerPage: function()
  {
    var request = new XMLHttpRequest();
    request.open('GET', gamefox_lib.domain + gamefox_lib.path + 'settings.php'
        );
    gamefox_lib.forceAllowThirdPartyCookie(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText.indexOf('Board Display Settings') == -1)
          return; // not logged in

        var msgsPerPage = gamefox_utils.parseHTMLSelect(request.responseText,
            'messagepage');
        if (msgsPerPage)
          gamefox_lib.prefs.setIntPref('msgsPerPage', msgsPerPage);
      }
    }

    request.send(null);
  },

  addToolbarButton: function()
  {
    if (Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULAppInfo)
        .ID == '{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}')
      return; // Don't add the button for SeaMonkey

    var navBar = document.getElementById('nav-bar');
    if (navBar.currentSet.indexOf(',gamefox-button-options') != -1)
      return;

    var newSet = navBar.currentSet + ',gamefox-button-options';
    navBar.currentSet = newSet;
    navBar.setAttribute('currentset', newSet);
    document.persist('nav-bar', 'currentset');
  }
};

window.addEventListener('load', gamefox.init, false);
