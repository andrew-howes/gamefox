/* vim: set et sw=2 sts=2 ts=2: */

var GameFOXOptions =
{
  importBoardSettings: function()
  {
    GameFOXUtils.importBoardSettings(true, document.getElementById('gamefox-css-grab-bs'), true);
  },

  exportBoardSettings: function()
  {
    GameFOXUtils.exportBoardSettings(
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
    GameFOXUtils.importSignature(true, document.getElementById('gamefox-css-grab-sig'), true);
  },

  openCSSDirectory: function()
  {
    var directoryService = Components.classes['@mozilla.org/file/directory_service;1'].
      getService(Components.interfaces.nsIProperties);

    var directory = directoryService.get('ProfD', Components.interfaces.nsILocalFile);
    directory.append("gamefox");
    directory.append("css");

    try
    {
      directory.reveal();
    }
    catch (e)
    {
      alert("That isn't supported here. You're probably using Firefox 2 and not using Windows.");
    }
  }
};

function gamefoxSelectedPrefTabFix()
{
  if (navigator.platform.match(/^Mac/i))
  {
    document.getElementById('gamefox-prefwindow').showPane(document.getElementById('gamefox-page-pane'));
  }
  else
  {
    var prefWindow = document.getElementById('gamefox-prefwindow');
    try
    {
      var lastTab    = prefWindow.lastSelected;
      prefWindow.showPane(document.getElementById('gamefox-page-pane'));
      prefWindow.showPane(document.getElementById(lastTab));
    }
    catch (e)
    {
      prefWindow.showPane(document.getElementById('gamefox-page-pane'));
    }
  }

  // Restore selected tab position for every tab panel out there, well... there's currently only one
  gamefoxRestoreSelectedTabs();
}

function gamefoxSaveSelectedTab(which)
{
  var optPrefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.options.');

  try
  {
    optPrefs.setIntPref(which.getAttribute('tabGroup') + '.selectedtab', which.selectedIndex);
  }
  catch (e)
  {
    optPrefs.setIntPref(which.getAttribute('tabGroup') + '.selectedtab', 0);
  }
}

function gamefoxRestoreSelectedTabs()
{
  var optPrefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.options.');
  var tabs     = document.getElementsByTagName('tabs');
  var tabGroup;

  for (var i = 0; i < tabs.length; i++)
  {
    tabGroup = tabs[i].getAttribute('tabGroup');
    if (!tabGroup)
    {
      tabs[i].setAttribute('tabGroup', 'tabGroup' + i);
      tabGroup = tabs[i].getAttribute('tabGroup');
    }

    try
    {
      tabs[i].selectedIndex = optPrefs.getIntPref(tabGroup + '.selectedtab');
    }
    catch (e)
    {
      try
      {
        tabs[i].selectedIndex = 0;
      }
      catch(e){;}
    }

    tabs[i].setAttribute('onselect', 'gamefoxSaveSelectedTab(this)');
  }
}
