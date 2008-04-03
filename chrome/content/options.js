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
  request.open('GET', 'http://www.gamefaqs.com/user/boards.html');
  request.onreadystatechange = function()
  {
    if (request.readyState == 4)
    {
      if (!request.responseText.match(/Warning: The below information will be displayed publicly\./))
      {
        alert('Error changing your board settings. The problem might be that you are not logged in to GameFAQs.');
        document.getElementById('gamefox-css-apply-bs').removeAttribute('disabled');
      }
      var request2 = new XMLHttpRequest();
      request2.open('POST', 'http://www.gamefaqs.com/user/boards.html');
      request2.onreadystatechange = function()
      {
        if (request2.readyState == 4)
        {
          if (!request2.responseText.match(/Your boards profile has been updated/))
          {
            alert('Error changing your board settings');
          }
          else
          {
            alert('Your board settings has been updated');
          }

          document.getElementById('gamefox-css-apply-bs').removeAttribute('disabled');
        }
      }
      var sig = request.responseText.match(/<textarea\b[^>]+?\bname="sig"[^>]*>([^<]*)<\/textarea>/i);
      sig = gamefoxSpecialCharsDecode(sig[1]);
      var quote = request.responseText.match(/<textarea\b[^>]+?\bname="quote"[^>]*>([^<]*)<\/textarea>/i);
      quote = gamefoxSpecialCharsDecode(quote[1]);
      var publicEmail = request.responseText.match(/<input\b[^>]+?\bname="publicemail"[^>]+?\bvalue="([^"]*)"[^>]*>/i);
      if (!publicEmail)
      {
        publicEmail = '';
      } else {
        publicEmail = publicEmail[1];
      }
      var imClient = request.responseText.match(/<option\b[^>]+?\bvalue="([^"]*)"[^>]+?\bselected\b[^>]*>/i);
      if (!imClient)
      {
        imClient = 'None';
      } else {
        imClient = imClient[1];
      }
      var imName = request.responseText.match(/<input\b[^>]+?\bname="imname"[^>]+?\bvalue="([^"]*)"[^>]*>/i);
      if (!imName)
      {
        imName = '';
      } else {
        imName = imName[1];
      }
      var rid = request.responseText.match(/<input\b[^>]+?\bname="rid"[^>]+?\bvalue="([^"]*)"[^>]*>/i);
      rid = rid[1];
      request2.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      request2.send('topicpage=' + document.getElementById('topicpage').value + '&topicsort=' + document.getElementById('topicsort').value + '&messagepage=' + document.getElementById('messagepage').value + '&messagesort=' + document.getElementById('messagesort').value + '&securitylevel=' + document.getElementById('securitylevel').value + '&timezone=' + document.getElementById('timezone').value + '&sig=' + gamefoxURLEncode(sig) + '&quote=' + gamefoxURLEncode(quote) + '&publicemail=' + gamefoxURLEncode(publicEmail) + '&imcli=' + imClient + '&imname=' + gamefoxURLEncode(imName) + '&rid=' + rid);
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
