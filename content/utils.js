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
    request.open('GET', 'http://www.gamefaqs.com/boards/settings.php');
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (!request.responseText.match(/Board Display Settings/))
        {
          GameFOXUtils.log('importBoardSettings: Bad things!');
          if (noisy)
            alert('Something went wrong. Are you logged in to www.gamefaqs.com?');
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
            alert('Something went wrong. Are you logged in to www.gamefaqs.com?');
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
    request.open('GET', 'http://www.gamefaqs.com/boards/settings.php', true);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (!request.responseText.match(/Board Display Settings/))
        {
          GameFOXUtils.log('exportBoardSettings: Bad things!');
          if (noisy)
            alert('Something went wrong. Are you logged in to www.gamefaqs.com?');
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
        postRequest.open('POST', 'http://www.gamefaqs.com' + action);
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
    request.open('GET', 'http://www.gamefaqs.com/boards/sigquote.php');
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (!request.responseText.match(/Board Signature and Quote/))
        {
          GameFOXUtils.log('importSignature: Bad things!');
          if (noisy)
            alert('Something went wrong. Are you logged in to www.gamefaqs.com?');
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
          document.getElementById('sig-body').value = GameFOXUtils.convertNewlines(GameFOXUtils.specialCharsDecode(sig[1]));
        else
        {
          var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(
              Components.interfaces.nsIPrefService).getBranch('gamefox.');
          var str = Components.classes['@mozilla.org/supports-string;1'].createInstance(
              Components.interfaces.nsISupportsString);
          str.data = GameFOXUtils.convertNewlines(GameFOXUtils.specialCharsDecode(sig[1]));
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
  },

  convertNewlines: function(str)
  {
    return str.
      replace(/\r\n/g, '\n').
      replace(/\r/g, '\n');
  },

  getString: function(pref)
  {
    return GameFOX.prefs.getComplexValue(pref, Components.interfaces.nsISupportsString).data;
  },

  trim: function(str)
  {
    return str.replace(/^\s+|\s+$/g, '');
  },

  formatPagination: function(topiclink, posts)
  {
    // Prefix and suffix stuff, looks a little messy
    var loc = GameFOX.prefs.getIntPref('paging.location');
    var prefix = GameFOX.prefs.getCharPref('paging.prefix');
    var sep = GameFOX.prefs.getCharPref('paging.separator');
    var suffix = GameFOX.prefs.getCharPref('paging.suffix');

    var prefixHTML = GameFOX.doc.createElement('span');
    prefixHTML.innerHTML = '';
    if (loc == 2)
      prefixHTML.appendChild(GameFOX.doc.createElement('br'));
    prefixHTML.appendChild(GameFOX.doc.createTextNode(prefix));
    prefixHTML = ' ' + prefixHTML.innerHTML.replace(/\s/g, '&nbsp;');

    var suffixHTML = GameFOX.doc.createElement('span');
    suffixHTML.innerHTML = '';
    suffixHTML.appendChild(GameFOX.doc.createTextNode(suffix));
    suffixHTML = suffixHTML.innerHTML.replace(/\s/g, '&nbsp;');
    //

    var pages = Math.ceil(posts / GameFOX.prefs.getIntPref('msgsPerPage'));
    if (pages == 1)
      return false;

    var pageHTML = GameFOX.doc.createElement('span');
    pageHTML.innerHTML = "" + prefixHTML;

    for (var i = 0; i < pages; i++)
    {
      var a = GameFOX.doc.createElement('a');
          a.setAttribute('href', topiclink + (i ? '&page=' + i : ''));
          a.innerHTML = i + 1;

      pageHTML.appendChild(a);

      if (i < pages - 1)
        pageHTML.appendChild(GameFOX.doc.createTextNode(sep));
    }

    pageHTML.innerHTML += suffixHTML;

    return pageHTML;
  },

  formatSig: function(sig, presig, newline)
  {
    if (!sig.length && !presig.length)
      return "";

    // Restrict signature to 2 lines, presignature to 1
    sig = sig.split("\n");
    if (sig.length >= 2)
      sig = sig[0] + "\n" + sig[1];
    else
      sig = sig[0];

    presig = presig.split("\n");
    presig = presig[0];

    var str = (newline ? "\n" : "") +
      (presig != "" ? presig + (sig != "" ? "\n" : "") : "") +
      (sig != "" ? "---\n" + sig : "");
    return "\n" + str;
  },

  URLEncode: function(str)
  {
    str = escape(str).replace(/\+/g, '%2B').replace(/%20/g, '+').replace(/\//g, '%2F').replace(/@/g, '%40');

    // 4 hex characters to 2 hex characters conversion table for some Unicode
    // chars borrowed from ToadKing's releases and modified. I tried using
    // Mozilla's localization and conversion interfaces to convert from
    // ISO-8859-1 to Unicode, vice versa, Unicode to UTF-8, vice versa, and all
    // other sorts of shit but to no avail. This seems to be the only way to do
    // it, unless CJayC changes GameFAQ's character encoding to UTF-8 or Unicode
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
  },

  stripQueryString: function(str)
  {
    return str.replace(/&(action|message|search)=[^&]*(?=&|$)|\b(action|message|search)=[^&]*&/, '');
  }
};
