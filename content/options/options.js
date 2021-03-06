/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011
 * Brian Marshall, Michael Ryan, Andrianto Effendy
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

var gamefox_options =
{
  saveSelectedTab: function(tab)
  {
    var prefs = Cc['@mozilla.org/preferences-service;1'].getService(
        Ci.nsIPrefService).getBranch('gamefox.options.');
    try
    {
      prefs.setIntPref(tab.getAttribute('tabGroup') + '.selectedtab', tab.selectedIndex);
    }
    catch (e)
    {
      prefs.setIntPref(tab.getAttribute('tabGroup') + '.selectedtab', 0);
    }
  },

  loadAllOverlays: function()
  {
    if (!this.overlayIdx)
      this.overlayIdx = 0;

    var prefpane = document.getElementsByTagName('prefpane')[this.overlayIdx];
    if (!prefpane)
    {
      // end of the line
      gamefox_options.init();
      return;
    }

    ++this.overlayIdx;

    if (prefpane.loaded)
    {
      // this prefpane is already loaded, so skip it
      gamefox_options.loadAllOverlays();
      return;
    }

    function OverlayLoadObserver(aPane)
    {
      this._pane = aPane;
    }
    OverlayLoadObserver.prototype = {
      observe: function(aSubject, aTopic, aData)
      {
        this._pane.loaded = true;
        document.getElementById('gamefox-prefwindow')
          ._fireEvent('paneload', this._pane);

        // This recursive call in the observer acts like a queue, since
        // overlays do not like being loaded if any other overlay isn't
        // finished loading.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=330458
        gamefox_options.loadAllOverlays();
      }
    }

    var obs = new OverlayLoadObserver(prefpane);
    document.loadOverlay(prefpane.src, obs);
  },

  restoreLastTabs: function()
  {
    var prefs = Cc['@mozilla.org/preferences-service;1'].getService(
        Ci.nsIPrefService).getBranch('gamefox.options.');
    var tabs = document.getElementsByTagName('tabs');
    var tabGroup;

    for (var i = 0; i < tabs.length; i++)
    {
      tabGroup = tabs[i].getAttribute('tabGroup');
      if (!tabGroup)
      {
        tabs[i].setAttribute('tabGroup', 'tabGroup' + i);
        tabGroup = tabs[i].setAttribute('tabGroup');
      }

      try
      {
        tabs[i].selectedIndex = prefs.getIntPref(tabGroup + '.selectedtab');
      }
      catch (e)
      {
        try
        {
          tabs[i].selectedIndex = 0;
        }
        catch (e) {}
      }

      tabs[i].addEventListener('select', function() {
        gamefox_options.saveSelectedTab(this);
      }, false);
    }
  },

  init: function()
  {
    // Make sure the window is big enough (different fonts and widget sizes can
    // make the min-height style inadequate)
    // This breaks when animateFadeIn is true, so check that first
    if (!Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch)
        .getBoolPref('browser.preferences.animateFadeIn'))
      window.sizeToContent();

    gamefox_options.restoreLastTabs();

    // Set listeners on links
    var links = document.getElementsByTagName('html:a');
    for (var i = 0; i < links.length; i++)
    {
      links[i].addEventListener('click', function(event) {
        gamefox_lib.newTab(this.href, event.button);
        this.blur();
        event.preventDefault();
      }, false);
    }

    if (!window.arguments)
      // opened from Add-ons window
      return;

    var args = window.arguments[0].wrappedJSObject;

    // Placeholder: no longer used, but may be useful in the future
    /* if (args.firstRun) */

    for (var i in args.notifications)
    {
      var notificationbox = document.getElementById(i);
      for (var j = 0; j < args.notifications[i].length; j++)
      {
        gamefox_options.showNotification(notificationbox,
            args.notifications[i][j].label, args.notifications[i][j].type);
      }
    }

    if (args.pane)
    {
      var prefwin = document.getElementById('gamefox-prefwindow');
      prefwin.showPane(document.getElementById(args.pane));
    }
  },

  showNotification: function(msgBox, label, type)
  {
    var oldMessage = msgBox.getNotificationWithValue(label);
    if (oldMessage && oldMessage.parentNode)
      msgBox.removeNotification(oldMessage);

    var priority = msgBox.currentNotification ?
      msgBox.currentNotification.priority + 0.0001 : 1;

    var notification = msgBox.appendNotification(label, label, null, priority);
    notification.type = type;
  }
};
