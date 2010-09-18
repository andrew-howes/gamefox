/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2005, 2006, 2007, 2008, 2009, 2010
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

var gamefox =
{
  init: function()
  {
    window.removeEventListener('load', gamefox.init, false);
    document.getElementById('appcontent').addEventListener(
        'DOMContentLoaded', gamefox_page.process, false);
    document.getElementById('contentAreaContextMenu').addEventListener(
        'popupshowing', gamefox_context.displayMenu, false);

    if (gamefox_lib.prefs.getBoolPref('tracked.enabled'))
      gamefox_lib.timer.initWithCallback(
          { notify: gamefox_tracked.timedUpdate }, 30000,
          Ci.nsITimer.TYPE_REPEATING_SLACK);

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

    // disable or update tracked topics
    if (!gamefox_lib.prefs.getBoolPref('tracked.enabled'))
    {
      gamefox_lib.prefs.clearUserPref('tracked.list');
      gamefox_lib.prefs.clearUserPref('tracked.rssUrl');
      gamefox_lib.prefs.clearUserPref('tracked.lastAccount');
    }
    else if (gamefox_lib.isLoggedIn())
      gamefox_tracked.timedUpdate();

    // disable favorites
    if (!gamefox_lib.prefs.getBoolPref('favorites.enabled'))
      gamefox_lib.prefs.clearUserPref('favorites.serialized');
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
      gamefox.doMigration(comparator, lastVersion);

      // first run
      if (lastVersion == '')
      {
        gamefox.importMsgsPerPage();
        window.setTimeout(gamefox_lib.openOptionsDialog, 10, true);
      }

      // new nightly/dev install
      if (gamefox_lib.isDev() && !gamefox_lib.isDev(lastVersion))
        window.setTimeout(gamefox_lib.newTab, 10,
            'chrome://gamefox/content/nightly.html', 0);

      // updated nightly install
      else if (gamefox_lib.isNightly()
          && gamefox_lib.prefs.getBoolPref('nightlyChangeLog'))
        window.setTimeout(gamefox_lib.newTab, 10,
            'http://beyondboredom.net/projects/gamefox/nightlychanges.php', 0);

      // release notes for new stable release
      else if (!gamefox_lib.isDev() && lastVersion != ''
          && gamefox_lib.prefs.getBoolPref('showReleaseNotes'))
        window.setTimeout(gamefox_lib.newTab, 10,
            'http://beyondboredom.net/projects/gamefox/releasenotes/' + version +
            '.html', 0);

      gamefox_css.init();
    }

    gamefox_css.reload();
  },

  doMigration: function(comparator, version)
  {
    /* 0.6.11 */
    if (comparator.compare('0.6.11', version) > 0)
    {
      // Convert prefs to JSON
      var jsonPrefs = new Array('favorites.serialized', 'signature.serialized',
          'theme.css.serialized', 'userlist.serialized', 'accounts', 'tags',
          'tracked.list');
      for (var i = 0; i < jsonPrefs.length; i++)
      {
        var prefText = gamefox_lib.getString(jsonPrefs[i]);
        if (gamefox_lib.isSafeJSON(prefText))
          continue; // already JSON

        var prefObj = gamefox_lib.safeEval(prefText, true);
        if (prefObj)
        {
          // Back it up
          gamefox_lib.setString(jsonPrefs[i] + '.bak', prefText);
          // Update it
          gamefox_lib.setString(jsonPrefs[i], gamefox_lib.toJSON(prefObj));
        }
      }
    }

    /* 0.7.8 */
    if (comparator.compare('0.7.8', version) > 0)
    {
      // New "include" property for highlighting groups
      var groups = gamefox_highlighting.read();
      for (var i = 0; i < groups.length; i++)
        if (!groups[i].include) groups[i].include = [];
      gamefox_highlighting.write(groups);

      // New stylesheet category
      var css = gamefox_lib.safeEval(gamefox_lib.getString('theme.css.serialized'));
      if (!css.themes)
        css.themes = {};
      gamefox_lib.setString('theme.css.serialized', gamefox_lib.toJSON(css));
    }
  },

  importMsgsPerPage: function()
  {
    var request = new XMLHttpRequest();
    request.open('GET', gamefox_lib.domain + gamefox_lib.path
        + 'settings.php');
    var ds = gamefox_lib.thirdPartyCookieFix(request);
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
  }
};

window.addEventListener('load', gamefox.init, false);
