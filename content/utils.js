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

var GFutils =
{
  importBoardSettings: function(inOptions, button, noisy)
  {
    if (button) button.setAttribute('disabled', true);

    var request = new XMLHttpRequest();
    request.open('GET', 'http://www.gamefaqs.com/boards/settings.php');
    var ds = GFlib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText.indexOf('Board Display Settings') == -1)
        {
          GFlib.log('importBoardSettings: Bad things!');
          if (noisy)
            GFlib.alert('Something went wrong. Are you logged in to gamefaqs.com?');
          if (button) button.setAttribute('disabled', false);
          return;
        }

        var topicpage = GFutils.parseHTMLSelect(request.responseText, 'topicpage'),
            topicsort = GFutils.parseHTMLSelect(request.responseText, 'topicsort'),
            messagepage = GFutils.parseHTMLSelect(request.responseText, 'messagepage'),
            messagesort = GFutils.parseHTMLSelect(request.responseText, 'messagesort'),
            timezone = GFutils.parseHTMLSelect(request.responseText, 'timezone'),
            userdisplay = GFutils.parseHTMLSelect(request.responseText, 'userdisplay');
        if (topicpage == null || topicsort == null || messagepage == null
            || messagesort == null || timezone == null || userdisplay == null)
        {
          GFlib.log('importBoardSettings: Unable to retrieve all settings.');
          if (noisy)
            GFlib.alert('Something went wrong. Are you logged in to gamefaqs.com?');
          if (button) button.setAttribute('disabled', false);
          return;
        }

        // TODO: validate settings from GameFAQs
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
          var prefs = Cc['@mozilla.org/preferences-service;1'].getService(
              Ci.nsIPrefService).getBranch('gamefox.');
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

  exportBoardSettings: function(topicpage, topicsort, messagepage, messagesort, timezone, userdisplay, button, noisy)
  {
    if (button) button.setAttribute('disabled', true);
    var request = new XMLHttpRequest();
    request.open('GET', 'http://www.gamefaqs.com/boards/settings.php');
    var ds = GFlib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText.indexOf('Board Display Settings') == -1)
        {
          GFlib.log('exportBoardSettings: Bad things!');
          if (noisy)
            GFlib.alert('Something went wrong. Are you logged in to gamefaqs.com?');
          if (button) button.setAttribute('disabled', false);
          return;
        }

        var action = request.responseText.match(/<form\b[^>]+?\bid="add"[^>]+?\baction="([^"]*)">/);
        if (!action)
        {
          GFlib.log("exportBoardSettings: Couldn't get user id.");
          if (noisy)
            GFlib.alert("Couldn't get your user ID. This shouldn't happen.");
          if (button) button.setAttribute('disabled', false);
          return;
        }
        action = action[1];

        var postRequest = new XMLHttpRequest();
        postRequest.open('POST', 'http://www.gamefaqs.com' + action);
        var ds = GFlib.thirdPartyCookieFix(postRequest);
        postRequest.onreadystatechange = function()
        {
          if (postRequest.readyState == 4)
          {
            if (postRequest.responseText.indexOf('Display settings updated') == -1)
            {
              GFlib.log("exportBoardSettings: Update didn't work!");
              if (noisy)
                GFlib.alert("Didn't receive the expected response from the server. The update probably failed.");
            }
            else
            {
              if (noisy)
                GFlib.alert("Your board display settings have been updated.");
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

  importSignature: function(inOptions, button, noisy)
  {
    if (button) button.setAttribute('disabled', true);

    var request = new XMLHttpRequest();
    request.open('GET', 'http://www.gamefaqs.com/boards/sigquote.php');
    var ds = GFlib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (request.responseText.indexOf('Board Signature and Quote') == -1)
        {
          GFlib.log('importSignature: Bad things!');
          if (noisy)
            GFlib.alert('Something went wrong. Are you logged in to www.gamefaqs.com?');
          if (button) button.setAttribute('disabled', false);
          return;
        }

        var sig = request.responseText.match(/<textarea\b[^>]+?\bname="sig"[^>]*>([^<]*)<\/textarea>/i);
        if (!sig)
        {
          GFlib.log("importSignature: Couldn't get sig");
          if (noisy)
            GFlib.alert("Couldn't get your signature. This shouldn't happen. Maybe you have " +
                "one of those really old signature that displays bold and italics on " +
                "the profile page?");
          if (button) button.setAttribute('disabled', false);
          return;
        }
        sig = GFutils.convertNewlines(GFutils.specialCharsDecode(sig[1]));

        if (inOptions)
        {
          document.getElementById('sig-body').value = sig;

          // oninput isn't called
          GFsig.updatePref(document.getElementById('sig-body'));
        }
        else
        {
          var prefs = Cc['@mozilla.org/preferences-service;1'].getService(
              Ci.nsIPrefService).getBranch('gamefox.');
          var sigs = eval(GFutils.getString('signature.serialized', prefs));
          sigs[0]['body'] = sig;
          GFutils.setString('signature.serialized', sigs.toSource(), prefs);
        }

        if (button) button.setAttribute('disabled', false);
      }
    };

    request.send(null);
  },

  parseHTMLSelect: function(str, name)
  {
    var selectStart = str.search(new RegExp('<select\\b[^>]+?\\bname="' + name + '"[^>]*>'));
    var selectEnd = str.indexOf('</select>', selectStart);
    if (selectStart != -1 && selectEnd != -1)
    {
      var option = str.substring(selectStart, selectEnd)
          .match(/<option\b[^>]+?\bvalue="([^"]*)"[^>]+?\bselected="selected"[^>]*>/);
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

  specialCharsEncode: function(str)
  {
    return str.
      replace(/&/g, '&amp;').
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;').
      replace(/"/g, '&quot;');
  },

  convertNewlines: function(str)
  {
    return str.
      replace(/\r\n/g, '\n').
      replace(/\r/g, '\n');
  },

  getString: function(pref, prefService)
  {
    return (prefService == null ? GameFOX.prefs : prefService).
      getComplexValue(pref, Ci.nsISupportsString).data;
  },

  setString: function(pref, str, prefService)
  {
    prefService = (prefService == null) ? GameFOX.prefs : prefService;
    var ustr = Cc['@mozilla.org/supports-string;1'].
      createInstance(Ci.nsISupportsString);
    ustr.data = str;
    prefService.setComplexValue(pref, Ci.nsISupportsString, ustr);
  },

  formatSig: function(sig, newline, doc)
  {
    if (sig == null) // fetch sig
    {
      if (!doc) return false;
      var boardname = doc.evaluate('//h1', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
        textContent.GFtrim();
      var boardid = doc.location.search.match(/board=([0-9-]+)/)[1];
      var account = doc.evaluate('//div[@class="msg"]', doc, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
          textContent.GFtrim().replace('Welcome, ', '');
      var getSig = GFsig.getSigByCriteria(account, boardname, boardid);
      sig = getSig['body'];
    }
    if (newline == null) // fetch newline
      newline = GameFOX.prefs.getBoolPref('signature.newline');

    if (!sig.length)
      return '';

    // truncate at 2 lines
    sig = sig.split('\n');
    if (sig.length >= 2)
      sig = sig[0] + '\n' + sig[1];
    else
      sig = sig[0];

    // truncate at 160 characters
    sig = GFutils.specialCharsEncode(sig).substr(0, 160);

    // remove truncated entities
    var amp = sig.lastIndexOf('&');
    if (sig.lastIndexOf(';') < amp)
      sig = sig.substr(0, amp);

    sig = GFutils.specialCharsDecode(sig);

    return '\n' + (newline ? '\n' : '') + (sig != '' ? '---\n' + sig : '');
  },

  URLEncode: function(str)
  {
    str = escape(str).
      replace(/\+/g, '%2B').
      replace(/%20/g, '+').
      replace(/\//g, '%2F').
      replace(/@/g, '%40');

    // 4 hex characters to 2 hex characters conversion table for some Unicode
    // chars borrowed from ToadKing's releases and modified. I tried using
    // Mozilla's localization and conversion interfaces to convert from
    // ISO-8859-1 to Unicode, vice versa, Unicode to UTF-8, vice versa, and all
    // other sorts of shit but to no avail. This seems to be the only way to do
    // it, unless GameFAQs changes its character encoding to UTF-8 or Unicode.
    var hex2 = ['80', '82', '83', '84', '85', '86', '87', '88', '89',
                '8A', '8B', '8C', '8E', '91', '92', '93', '94', '95',
                '96', '97', '98', '99', '9A', '9B', '9C', '9E', '9F'];
    ['20AC', '201A', '0192', '201E', '2026', '2020', '2021', '02C6', '2030',
     '0160', '2039', '0152', '017D', '2018', '2019', '201C', '201D', '2022',
     '2013', '2014', '02DC', '2122', '0161', '203A', '0153', '017E', '0178'].
      forEach(
        function(element, index, array)
        {
          str = str.replace(new RegExp('%[Uu]' + element, 'g'), '%' + hex2[index]);
        }
      );

    return str;
  },

  stripQueryString: function(str)
  {
    return str.replace(/&(action|message|search)=[^&]*/g, '');
  },

  getMsgDataDisplay: function(doc)
  {
    var leftMsgData;
    try { leftMsgData = !(doc.getElementsByTagName('tr')[0].
        getElementsByTagName('td').length == 1); }
    catch (e) { leftMsgData = false; }

    return leftMsgData;
  },

  getMsgComponents: function(node, doc)
  {
    var tableNode = node.offsetParent;
    try
    {
      while (tableNode.nodeName.toLowerCase() != 'table'
             || tableNode.className != 'message')
      {
        node = tableNode;
        tableNode = node.offsetParent;
      }
    }
    catch (e)
    {
      return false;
    }

    var leftMsgData = GFutils.getMsgDataDisplay(doc);
    var header, body;
    if ((!leftMsgData && node.parentNode.className != 'even')
        || node.className.indexOf('author') != -1)
    {
      // in header
      header = node;

      if (!leftMsgData)
        body = tableNode.rows[node.parentNode.rowIndex + 1].cells[0];
      else
        body = node.parentNode.cells[1];
    }
    else
    {
      // in body
      body = node;

      if (!leftMsgData)
        header = tableNode.rows[node.parentNode.rowIndex - 1].cells[0];
      else
        header = node.parentNode.cells[0];
    }

    return { header: header, body: body };
  },

  specialRegexpCharsEscape: function(str)
  {
    return str.replace(/([\\\[\](){}^.?*+|$])/g, '\\$1');
  },

  // encode message like GameFAQs does
  encodedMessageLength: function(str)
  {
    var diffs = [
        '&', 4, '<', 3, '>', 3, '"', 5,
        '<b>', -6, '</b>', -6,
        '<i>', -6, '</i>', -6,
        '<strong>', -6, '</strong>', -6,
        '<em>', -6, '</em>', -6,
        '<br>', -6, '</br>', -6, '<br />', -6,
        '<p>', -6, '</p>', -6, '<p />', -6,
        '\n', 4
        ];
    str = str.GFtrim().toLowerCase();
    var len = str.length;
    var pos;
    var count;
    for (var i = 0; i < diffs.length; i += 2)
    {
      pos = -1;
      count = 0;
      while ((pos = str.indexOf(diffs[i], pos + 1)) != -1)
        ++count;
      len += count * diffs[i+1];
    }
    return len;
  },

  // encode topic title like GameFAQs does
  encodedTitleLength: function(str)
  {
    return str.GFtrim().
      replace(/&/g, '&amp;').
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;').length;
  },

  getLastPost: function(msgs, tc)
  {
    var lastPage = Math.floor((msgs - 1) / GameFOX.prefs.getIntPref('msgsPerPage'));
    var pageStr = lastPage ? '&page=' + lastPage + this.tcParam(tc) : '';

    var lastPostNum = '000'.substr(msgs.toString().length) + msgs;

    return [pageStr, lastPostNum];
  },

  mergeArray: function()
  {
    var arr = new Array();
    for (var i = 0; i < arguments.length; i++)
    {
      for (var j = 0; j < arguments[i].length; j++)
      {
        arr.push(arguments[i][j]);
      }
    }
    return arr;
  },

  tcParam: function(tc)
  {
    return tc && GameFOX.prefs.getBoolPref('elements.marktc') ?
        '&tc=' + tc.replace(/ /g, '+') : '';
  },

  parseQueryString: function(str)
  {
    if (str.charAt(0) == '?')
      str = str.substr(1);

    var query = str.split('&');
    var obj = {};
    var arg;
    for (var i = 0; i < query.length; i++)
    {
      arg = query[i].split('=');
      obj[arg[0]] = arg[1];
    }

    return obj;
  },

  getTopOffset: function(node)
  {
    var top = 0;

    while (node)
    {
      top += node.offsetTop;
      node = node.offsetParent;
    }

    return top;
  },

  getAccesskeyPrefix: function()
  {
    var prefix = '';
    var rootPrefs = Cc['@mozilla.org/preferences-service;1']
      .getService(Ci.nsIPrefBranch);
    if (rootPrefs.getPrefType('ui.key.generalAccessKey') == rootPrefs.PREF_INT)
    {
      var generalAccess = rootPrefs.getIntPref('ui.key.generalAccessKey');
      var generalAccessKeys = { 16: 'shift', 17: 'ctrl', 18: 'alt', 224: 'meta' };
      if (generalAccess == -1)
      {
        if (rootPrefs.getPrefType('ui.key.contentAccess') == rootPrefs.PREF_INT)
        {
          var contentAccess = rootPrefs.getIntPref('ui.key.contentAccess');
          var contentAccessKeys = { 1: 'shift', 2: 'ctrl', 4: 'alt', 8: 'meta' };
          for (var i in contentAccessKeys)
          {
            if (contentAccess & i)
              prefix += contentAccessKeys[i] + '-';
          }
        }
      }
      else if (generalAccess in generalAccessKeys)
      {
        prefix = generalAccessKeys[generalAccess] + '-';
      }
    }
    return prefix;
  }
};

String.prototype.GFtrim = function()
{
  var str = this.replace(/^\s\s*/, ''),
      ws = /\s/,
      i = str.length;
  while (ws.test(str.charAt(--i)));
  return str.slice(0, i + 1);
}
