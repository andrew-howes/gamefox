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
    GameFOXUtils.importSignature(true, document.getElementById('gamefox-css-grab-bs'), true);
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

function gamefoxURLEncode(str)
{
  str = escape(str).replace(/\+/g, '%2B').replace(/%20/g, '+').replace(/\//g, '%2F').replace(/@/g, '%40');

  var hex2  = ['80', '82', '83', '84', '85', '86', '87', '88', '89', '8A', '8B', '8C', '8E', '91',
               '92', '93', '94', '95', '96', '97', '98', '99', '9A', '9B', '9C', '9E', '9F'];
  ['20AC', '201A', '0192', '201E', '2026', '2020', '2021', '02C6', '2030', '0160', '2039', '0152', '017D', '2018',
   '2019', '201C', '201D', '2022', '2013', '2014', '02DC', '2122', '0161', '203A', '0153', '017E', '0178'].forEach
  (
    function(element, index, array)
    {
      str = str.replace(new RegExp('%[Uu]' + element, 'g'), '%' + hex2[index]);
    }
  );

  return str;
}
