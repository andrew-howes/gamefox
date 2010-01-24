/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009 Brian Marshall, Michael Ryan, Andrianto Effendy
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

var gamefox_utils =
{
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
    var tdNode, tableNode;
    try
    {
      while (!tdNode || !tableNode)
      {
        if (node.nodeName.toLowerCase() == 'td')
          tdNode = node;
        else if (node.nodeName.toLowerCase() == 'table'
                 && node.className == 'board message')
          tableNode = node;
        node = node.parentNode;
      }
    }
    catch (e)
    {
      return false;
    }

    var leftMsgData = gamefox_utils.getMsgDataDisplay(doc);
    var header, body;
    if ((!leftMsgData && tdNode.parentNode.className != 'even')
        || tdNode.className.indexOf('author') != -1)
    {
      // in header
      header = tdNode;

      if (!leftMsgData)
        body = tableNode.rows[tdNode.parentNode.rowIndex + 1].cells[0];
      else
        body = tdNode.parentNode.cells[1];
    }
    else
    {
      // in body
      body = tdNode;

      if (!leftMsgData)
        header = tableNode.rows[tdNode.parentNode.rowIndex - 1].cells[0];
      else
        header = tdNode.parentNode.cells[0];
    }

    return { header: header, body: body, original: tdNode };
  },

  getAccountName: function(doc)
  {
    var div = doc.getElementById('loginbox');
    if (div)
    {
      var node = doc.evaluate('div[@class="msg"]', div, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (node && node.firstChild)
        return node.firstChild.textContent.replace('Welcome,', '').gamefox_trim();
    }
    return '';
  },

  getBoardName: function(doc)
  {
    // this may not return the real board name for split game boards
    var div = doc.getElementById('content');
    if (div)
    {
      var node = doc.evaluate('div[@class="head"]/h1', div, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        || doc.evaluate('div[@class="content_nav"]/h1', div, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (node)
        return node.textContent.gamefox_trim();
    }
    return '';
  },

  getBoardWrapHeader: function(doc)
  {
    var div = doc.getElementById('board_wrap');
    if (div)
    {
      var node = doc.evaluate('div[@class="head"]/h2', div, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (node)
        return node.textContent.gamefox_trim();
    }
    return '';
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
    str = str.gamefox_trim().toLowerCase();
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
    return str.gamefox_trim().
      replace(/&/g, '&amp;').
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;').length;
  },

  getLastPost: function(msgs, tc)
  {
    if (msgs == 1)
      return ['', ''];
    var lastPage = Math.floor((msgs - 1) / gamefox_lib.prefs.getIntPref('msgsPerPage'));
    var pageStr = lastPage ? '&page=' + lastPage + this.tcParam(tc) : '';
    var lastPostNum = '000'.substr(msgs.toString().length) + msgs;
    return [pageStr, '#p' + lastPostNum];
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
    return tc && (gamefox_lib.prefs.getBoolPref('elements.marktc')
        || gamefox_highlighting.checkUsername('(tc)')) ?
        '&tc=' + tc.replace(/ /g, '+') : '';
  },

  parseQueryString: function(str)
  {
    if (str.indexOf('?') != -1)
      str = str.substr(str.indexOf('?') + 1);

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
  },

  // Break tags for posting
  breakTags: function(str)
  {
    return str.
      replace(/&lt;(\/?)(b|i|em|strong|br|p)&gt;/gi, '&lt;$1$2<b></b>&gt;').
      replace(/&lt;(br|p) \/&gt;/gi, '&lt;$1 /<b></b>&gt;');
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
  },

  cloneObj: function(obj)
  {
    var newObj = (obj instanceof Array) ? [] : {};

    for (var i in obj)
    {
      if (obj[i] && typeof obj[i] == 'object')
        newObj[i] = gamefox_utils.cloneObj(obj[i]);
      else
        newObj[i] = obj[i];
    }

    return newObj;
  },

  extractNumber: function(value)
  {
    var n = parseInt(value);

    return n == null || isNaN(n) ? 0 : n;
  },

  linkToTopic: function(board, topic, page, tc, post)
  {
    return gamefox_lib.domain + gamefox_lib.path + 'genmessage.php?board='
      + board + '&topic=' + topic
      + (page ? '&page=' + page : '')
      + (tc ? (page != 0 ? '&tc=' + tc : '') : '')
      + (post ? '#p' + post : '');
  }
};

String.prototype.gamefox_trim = function()
{
  var str = this.replace(/^\s\s*/, ''),
      ws = /\s/,
      i = str.length;
  while (ws.test(str.charAt(--i)));
  return str.slice(0, i + 1);
}
