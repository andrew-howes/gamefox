/* vim: set et sw=2 sts=2 ts=2: */

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
        true, document.getElementById('gamefox-css-apply-bs')
        )
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
      alert("That isn't supported here. You're probably using Firefox 2 and not using Windows.");
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
  }
};
