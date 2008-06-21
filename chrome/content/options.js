/* vim : set et sw=2 : */

function gamefoxOpenCSS()
{
  // Borrowed from MR Tech Local Install
  var directoryService=Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
  var extDir = directoryService.get('ProfD', Components.interfaces.nsILocalFile);

  extDir.append("gamefox");
  extDir.append("css");

  if(extDir.exists()) {
    try {
      extDir.reveal();
    } catch(ex) {
      alert("Error!\n" + ex + "\nYou are probably getting this because you are not running on a Windows operating system. Sorry, but that's  the only way this works right now. :(");
    }
  }
}

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

function gamefoxSavePreferences()
{
  var prefWindow = document.getElementById('gamefox-prefwindow');
  var panes      = prefWindow.preferencePanes;

  for (var i = 0; i < panes.length; i++)
  {
    panes[i].writePreferences();
  }
}

function gamefoxChangeBoardSettings()
{
  document.getElementById('gamefox-css-apply-bs').setAttribute('disabled', 'true');

  var request = new XMLHttpRequest();
  request.open('GET', 'http://boards.gamefaqs.com/gfaqs/settings.php');
  request.onreadystatechange = function()
  {
    if (request.readyState == 4)
    {
      if (!request.responseText.match(/Board Display Settings/))
      {
        alert('Something broke. Are you logged in to boards.gamefaqs.com?');
        document.getElementById('gamefox-css-apply-bs').removeAttribute('disabled');
      }

      var action = request.responseText.match(/<form\b[^>]+?\bid="add"[^>]+?\baction="([^"]*)">/);
      action = action[1];

      var request2 = new XMLHttpRequest();
      request2.open('POST', 'http://boards.gamefaqs.com' + action);
      request2.onreadystatechange = function()
      {
        if (request2.readyState == 4)
        {
          if (!request2.responseText.match(/Display settings updated/))
          {
            alert("The settings update was unsuccessful. This shouldn't happen.");
          }
          else
          {
            alert("Your board display settings have been updated.");
          }

          document.getElementById('gamefox-css-apply-bs').removeAttribute('disabled');
        }
      }
      var key = request.responseText.match(/<input\b[^>]+?\bname="key"[^>]+?\bvalue="([^"]*)"[^>]*>/i);
      key = key[1];
      
      request2.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      request2.send(
                      'topicpage=' + document.getElementById('topicpage').value + '&' +
                      'topicsort=' + document.getElementById('topicsort').value + '&' +
                      'messagepage=' + document.getElementById('messagepage').value + '&' +
                      'messagesort=' + document.getElementById('messagesort').value + '&' +
                      'timezone=' + document.getElementById('timezone').value + '&' +
                      'userdisplay=' + document.getElementById('userdisplay').value + '&' +
                      'key=' + key + '&' +
                      'submit=Change+Settings'
                   );
    }
  };

  request.send(null);
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

function gamefoxSpecialCharsDecode(str)
{
  return str.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}
