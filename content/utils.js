/* vim: set et sw=2 sts=2 ts=2: */

var GameFOXUtils =
{
  log: function(msg)
  {
    var consoleService = Components.classes['@mozilla.org/consoleservice;1'].
      getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage('GameFOX: ' + msg);
  },

  importBoardSettings: function(noisy, button, inOptions)
  {
    if (button) button.setAttribute('disabled', true);

    var request = new XMLHttpRequest();
    request.open('GET', 'http://boards.gamefaqs.com/gfaqs/settings.php');
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (!request.responseText.match(/Board Display Settings/))
        {
          GameFOXUtils.log('importBoardSettings: Bad things!');
          if (noisy)
            alert('Something went wrong. Are you logged in to boards.gamefaqs.com?');
          if (button) button.setAttribute('disabled', false);
          return;
        }

        var topicpage = GameFOXUtils.parseHTMLSelect(request.responseText, 'topicpage'),
            topicsort = GameFOXUtils.parseHTMLSelect(request.responseText, 'topicsort'),
            messagepage = GameFOXUtils.parseHTMLSelect(request.responseText, 'messagepage'),
            messagesort = GameFOXUtils.parseHTMLSelect(request.responseText, 'messagesort'),
            timezone = GameFOXUtils.parseHTMLSelect(request.responseText, 'timezone'),
            userdisplay = GameFOXUtils.parseHTMLSelect(request.responseText, 'userdisplay');
        if (topicpage == null || topicsort == null || messagepage == null
            || messagesort == null || timezone == null || userdisplay == null)
        {
          this.log('importBoardSettings: Unable to retrieve all settings.');
          if (noisy)
            alert('Something went wrong. Are you logged in to boards.gamefaqs.com?');
          if (button) button.setAttribute('disabled', false);
          return;
        }
        // if GameFAQs gives us bad values, bad things happen
        
        if (inOptions)
        {
          document.getElementById('gamefoxTpcsPerPage').value = topicpage;
          document.getElementById('gamefoxTpcSortOrder').value = topicsort;
          document.getElementById('gamefoxMsgsPerPage').value = messagepage;
          document.getElementById('gamefoxMsgSortOrder').value = messagesort;
          document.getElementById('gamefoxTimeZone').value = timezone;
          document.getElementById('gamefoxMsgDisplay').value = userdisplay;
        }
        else
        {
          var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
              Components.interfaces.nsIPrefService).getBranch('gamefox.');
          prefs.setIntPref('tpcsPerPage', topicpage);
          prefs.setIntPref('tpcSortOrder', topicsort);
          prefs.setIntPref('msgsPerPage', messagepage);
          prefs.setIntPref('msgSortOrder', messagesort);
          prefs.setIntPref('timeZone', timezone);
          prefs.setIntPref('msgDisplay', userdisplay);
        }

        if (button) button.setAttribute('disabled', false);
      }
    }

    request.send(null);
  },

  exportBoardSettings: function(topicpage, topicsort, messagepage, messagesort, timezone, userdisplay, noisy, button)
  {
    if (button) button.setAttribute('disabled', true);
    var request = new XMLHttpRequest();
    request.open('GET', 'http://boards.gamefaqs.com/gfaqs/settings.php', true);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (!request.responseText.match(/Board Display Settings/))
        {
          GameFOXUtils.log('exportBoardSettings: Bad things!');
          if (noisy)
            alert('Something went wrong. Are you logged in to boards.gamefaqs.com?');
          if (button) button.setAttribute('disabled', false);
          return;
        }

        var action = request.responseText.match(/<form\b[^>]+?\bid="add"[^>]+?\baction="([^"]*)">/);
        if (!action)
        {
          GameFOXUtils.log("exportBoardSettings: Couldn't get user id.");
          if (noisy)
            alert("Couldn't get your user ID. This shouldn't happen.");
          if (button) button.setAttribute('disabled', false);
          return;
        }
        action = action[1];

        var postRequest = new XMLHttpRequest();
        postRequest.open('POST', 'http://boards.gamefaqs.com' + action);
        postRequest.onreadystatechange = function()
        {
          if (postRequest.readyState == 4)
          {
            if (!postRequest.responseText.match(/Display settings updated/))
            {
              GameFOXUtils.log("exportBoardSettings: Update didn't work!");
              if (noisy)
                alert("Didn't receive the expected response from the server. The update probably failed.");
            }
            else
            {
              if (noisy)
                alert("Your board display settings have been updated.");
            }
            if (button) button.setAttribute('disabled', false);
          }
        }
        var key = request.responseText.match(/<input\b[^>]+?\bname="key"[^>]+?\bvalue="([^"]*)"[^>]*>/i);
        key = key[1];

        postRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        postRequest.send(
            'topicpage=' + topicpage + '&' +
            'topicsort=' + topicsort + '&' +
            'messagepage=' + messagepage + '&' +
            'messagesort=' + messagesort + '&' +
            'timezone=' + timezone + '&' +
            'userdisplay=' + userdisplay + '&' +
            'key=' + key + '&' +
            'submit=1'
            );
      }
    };

    request.send(null);
    return true;
  },

  importSignature: function(noisy, button, inOptions)
  {
    if (button) button.setAttribute('disabled', true);

    var request = new XMLHttpRequest();
    request.open('GET', 'http://boards.gamefaqs.com/gfaqs/sigquote.php');
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (!request.responseText.match(/Board Signature and Quote/))
        {
          GameFOXUtils.log('importSignature: Bad things!');
          if (noisy)
            alert('Something went wrong. Are you logged in to boards.gamefaqs.com?');
          if (button) button.setAttribute('disabled', false);
          return;
        }

        var sig = request.responseText.match(/<textarea\b[^>]+?\bname="sig"[^>]*>([^<]*)<\/textarea>/i);
        if (!sig)
        {
          GameFOXUtils.log("importSignature: Couldn't get sig");
          if (noisy)
            alert("Couldn't get your signature. This shouldn't happen. Maybe you have " +
                "one of those really old signature that displays bold and italics in " +
                "the profile page?");
          if (button) button.setAttribute('disabled', false);
          return;
        }
        if (inOptions)
          document.getElementById('sig-body').value = GameFOXUtils.specialCharsDecode(sig[1]);
        else
        {
          var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
              Components.interfaces.nsIPrefService).getBranch('gamefox.');
          var str = Components.classes['@mozilla.org/supports-string;1'].createInstance(
              Components.interfaces.nsISupportsString);
          str.data = GameFOXUtils.specialCharsDecode(sig[1]);
          prefs.setComplexValue('signature.body', Components.interfaces.nsISupportsString,
            str);
        }
        if (button) button.setAttribute('disabled', false);
      }
    };

    request.send(null);
  },

  parseHTMLSelect: function(str, name)
  {
    var selectStart = str.search(new RegExp('<select\\b[^>]+?\\bname="' + name + '"[^>]*>', 'i'));
    if (selectStart != -1)
    {
      var selectSubstring = str.substring(selectStart+1);
      var selectEnd = selectSubstring.search(/<\/?select\b/i);
      if (selectEnd != -1)
        selectSubstring = selectSubstring.substring(0, selectEnd);
      var option = selectSubstring.match(/<option\b[^>]+?\bvalue="([^"]*)"[^>]+?\bselected="selected"[^>]*>/i);
      if (option)
        return option[1];
    }

    return null;
  },

  specialCharsDecode: function(str)
  {
    return str.
      replace(/&gt;/g, '>').
      replace(/&lt;/g, '<').
      replace(/&quot;/g, '"').
      replace(/&amp;/g, '&');
  }
};
