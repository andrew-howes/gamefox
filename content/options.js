/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Brian Marshall, Michael Ryan, Andrianto Effendy
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

var GFoptions =
{
  importBoardSettings: function()
  {
    GFutils.importBoardSettings(true, document.getElementById('gamefox-css-grab-bs'), true);
  },

  exportBoardSettings: function()
  {
    GFutils.exportBoardSettings(
        document.getElementById('topicpage').value,
        document.getElementById('topicsort').value,
        document.getElementById('messagepage').value,
        document.getElementById('messagesort').value,
        document.getElementById('timezone').value,
        document.getElementById('userdisplay').value,
        document.getElementById('gamefox-css-apply-bs'),
        true
        );
  },

  importSignature: function()
  {
    GFutils.importSignature(true, document.getElementById('gamefox-css-grab-sig'), true);
  },

  openCSSDirectory: function()
  {
    var directoryService = Cc['@mozilla.org/file/directory_service;1'].
      getService(Ci.nsIProperties);

    var directory = directoryService.get('ProfD', Ci.nsILocalFile);
    directory.append('gamefox');
    directory.append('css');

    try
    {
      directory.reveal();
    }
    catch (e)
    {
      GFlib.alert("That isn't supported here. You're probably using Firefox 2 and not using Windows.");
    }
  },

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

  restoreLastPane: function()
  {
    if (navigator.platform.indexOf('Mac') == 0)
    {
      document.getElementById('gamefox-prefwindow').showPane(
          document.getElementById('gamefox-page-pane'));
      return;
    }

    var prefWindow = document.getElementById('gamefox-prefwindow');
    try
    {
      var lastTab = prefWindow.lastSelected;
      prefWindow.showPane(document.getElementById('gamefox-page-pane'));
      prefWindow.showPane(document.getElementById(lastTab));
    }
    catch (e)
    {
      prefWindow.showPane(document.getElementById('gamefox-page-pane'));
    }

    GFoptions.restoreLastTabs();
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

      tabs[i].setAttribute('onselect', 'GFoptions.saveSelectedTab(this)');
    }
  },

  firstRun: function()
  {
    if (window.arguments && window.arguments[0])
    {
      GFuserlist.add();
      GFuserlist.populateLast();
      GFutils.importBoardSettings(true, document.getElementById('gamefox-css-grab-bs'));
      GFutils.importSignature(true, document.getElementById('gamefox-css-grab-sig'));
    }
  }
};
