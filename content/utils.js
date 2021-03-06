/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011, 2012
 * Brian Marshall, Michael Ryan, Andrianto Effendy
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

/**
 * Common DOM convenience and other utility functions
 * @namespace
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

  getBoardId: function(str)
  {
    var params = gamefox_utils.parseBoardLink(str);
    return params ? params['board'] : null;
  },

  getTopicId: function(str)
  {
    var params = gamefox_utils.parseBoardLink(str);
    return params ? params['topic'] : null;
  },

  /**
   * Determines the display setting of message data on the message list
   *
   * @param {HTMLDocument} doc
   * @return {Boolean} true if left of message, false if above message
   */
  getMsgDataDisplay: function(doc)
  {
    return doc.getElementById('content').getElementsByClassName('top').length < 1;
  },
/////////
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
                 && (node.className == 'board message msg' 
                 || node.className == 'board message'))
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
    if ((!leftMsgData && !tdNode.parentNode.classList.contains('topmsg'))
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

    // Get post id
    var postId = (header.querySelector('div[class^="msg_stats"] > a[name]') ||
        {name: 0}).name;

    // Only select the first child if there's a container div - message detail
    // is lacking these
    if (header.firstChild.tagName == 'DIV')
    {
      header = header.firstChild;
      body = body.firstChild;
    }

    return { 'id': postId, 'header': header, 'body': body, 'original': tdNode,
      'leftMsgData': leftMsgData };
  },

  /**
   * Gets the logged in universal account name
   *
   * @param {HTMLDocument} doc
   * @return {String} Account name or empty string on failure
   */
  getAccountName: function(doc)
  {
    var div = doc.getElementsByClassName('masthead_user')[0] || doc.getElementById('mast_user') || doc.getElementById('loginbox'
        );         		   /*V13*/					                  /* V12 */                          /* V11 */
    if (div)
    {
      var username = div.firstElementChild.textContent.replace('Welcome,', '');

      // Cut out the clock (delimited by "|")
      if (username.indexOf('|') != -1)
        username = username.substr(0, username.indexOf('|'));

      return username.trim();
    }

    return '';
  },

	/* fixed for V13 */
  getBoardName: function(doc)
  {
    // this may not return the real board name for split game boards
    var div = doc.getElementById('content');
    if (div)
    {
      var node = doc.evaluate('.//header[@class="page-header"]/h1', div, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue //v13
        || doc.evaluate('.//div[@class="head"]/h1', div, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        || doc.evaluate('.//div[@class="content_nav"]/h1', div, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (node)
        return node.textContent.trim();
    }
    return '';
  },

  getPageHeader: function(doc)
  {
    var contentDiv = doc.getElementById('content');
    if (contentDiv)
    {
      var header = doc.evaluate('.//div[@class="head"]/h2', contentDiv, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (header)
        return header.textContent.trim();
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
    str = str.trim().toLowerCase();
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
    return str.trim().
      replace(/&/g, '&amp;').
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;').length;
  },

  getLastPost: function(msgs)
  {
    if (msgs == 1)
      return ['', ''];
    var lastPage = Math.floor((msgs - 1) / gamefox_lib.prefs.getIntPref('msgsPerPage'));
    var pageStr = lastPage ? '?page=' + lastPage : '';
    return [pageStr, '#' + msgs];
  },

  /**
   * Merge two or more arrays
   *
   * @param {Array} array...
   *        Each array to merge
   * @return {Array} Merged array
   */
  mergeArrays: function()
  {
    var arr = [];
    for (var i = 0; i < arguments.length; i++)
      for (var j = 0; j < arguments[i].length; j++)
        arr.push(arguments[i][j]);

    return arr;
  },

  /**
   * Merge, sort and remove duplicates of one or more number arrays
   *
   * @param {Number[]} array...
   *        Each array to merge
   * @return {Number[]} Merged array
   */
  mergeSortArrays: function()
  {
    var arr = [];

    for (var i = 0; i < arguments.length; i++)
      arr = arr.concat(arguments[i]);

    arr.sort(function(a, b) { return a - b; });

    return arr.filter(function(element, index, array) {
      return !index || element != array[index - 1];
    });
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

  /**
   * Break (escape) tags for posting raw HTML
   *
   * @param {String} str
   * @return {String} Text with HTML tags escaped
   */
  breakTags: function(str)
  {
    return str.replace(
        /&lt;(\/?)(b|i|em|strong|quote|cite|spoiler|code)&gt;/gi,
        '&lt;$1$2<b></b>&gt;');
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

  newURI: function(board, topic, page, post, link)
  {
    if (link)
    {
      var params = gamefox_utils.parseBoardLink(link);
      if (params['board'] == board) // we know the board name from the provided URL
        var name = params['name'];
    }

    // parseInt to make sure the post num is not zero-padded (since input can
    // vary)
    if (post)
      post = '#' + parseInt(post, 10);

    return gamefox_lib.domain + gamefox_lib.path
      + board + '-' + (name ? name : '')
      + (topic ? ('/' + topic) : '')
      + (page ? '?page=' + page : '')
      + (post ? post : '');
  },

  parseBoardLink: function(link)
  {
    var params = link.match(/boards\/(-?\d+)([^\/]+)?(\/\d+)?(\/\d+)?/);

    if (!params) // regex didn't match
      return false;
    return { 'board': params[1], 'name': params[2].substr(1),
      'topic': (params[3] ? params[3].substr(1) : null),
      'message': (params[4] ? params[4].substr(1) : null) };
  },

  // Strips admin/mod/vip tags from usernames on the topic list
  cleanUsername: function(username)
  {
    return username.replace(/ \((A|M|V)\)/, '');
  },

  parseFormInput: function(name, str)
  {
    return (str.match(new RegExp(
          '<input\\b[^>]+?\\bname="' + name + '"[^>]+?\\bvalue="([^"]+)"')) ||
        [])[1];
  },

  /**
   * Search up the DOM tree for a tag name, including the starting node itself
   *
   * @param {Object} node
   *        Node to start the search from
   * @param {String} [tagName]
   *        Element tag name to search for (case insensitive). If not supplied,
   *        testFunc will be used instead.
   * @param {Function} [testFunc]
   *        Function to test each node against to see if it's the correct one.
   *        Will be passed the node as its only argument, and should return
   *        true or false.
   * @return {Object} An HTML element
   */
  findClosest: function(node, tagName, testFunc)
  {
    if (tagName)
      while (node.tagName != tagName.toUpperCase() && node.parentNode)
        node = node.parentNode;
    else if (typeof testFunc == 'function')
      while (!testFunc(node) && node.parentNode)
        node = node.parentNode;

    return node;
  },

  getPos: function(element)
  {
    var doc = gamefox_lib.getDocument(element);
    var rect = element.getBoundingClientRect();

    var x = Math.round(rect.left + doc.defaultView.scrollX);
    var y = Math.round(rect.top + doc.defaultView.scrollY);

    return [x, y];
  },

  fade: {
    add: function(element)
    {
      element.style.opacity = '0';

      element.addEventListener('transitionend', function() {
        if (element.style.opacity == '0')
          element.style.display = 'none';
      }, false);
    },

    in: function(element)
    {
      element.style.display = '';

      window.setTimeout(function() {
        element.style.opacity = '';
      }, 20);
    },

    out: function(element)
    {
      element.style.opacity = '0';

      // If there's no transition support, our transitionend listener will
      // never get called
      if (element.style.MozTransition === undefined)
        element.style.display = 'none';
    }
  },

  /**
   * Finds the post header node reliably
   *
   * @param {Object} element
   *        Any child element of the header
   * @return {Object} |td| element that contains the post header
   */
  findHeader: function(element)
  {
    return gamefox_utils.findClosest(element, '', function(node) {
      return node.firstChild && node.firstChild.className &&
        node.firstChild.className.indexOf('msg_stats') === 0;
    });
  },

  /**
   * Substitute variables in a string with values.
   *
   * Variables are in the form of {0}, {1}, etc.
   *
   * @param {String} str
   * @param {String} var...
   *        Each variable is a separate argument
   * @return {String} Formatted string
   */
  format: function(str)
  {
    var args = arguments;
    return str.replace(/{(\d+)}/g, function(match, number) {
      number = parseInt(number)+1;
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  },

  /**
   * Get all text between two sibling nodes.
   *
   * The range is exclusive - text inside the start/end nodes themselves is not
   * included.
   *
   * @param {HTMLElement} start
   *        Node to start reading text from
   * @param {HTMLElement} end
   *        Node to end at
   * @return {String} Compilation of all text between the nodes
   */
  getTextBetweenNodes: function(start, end)
  {
    var par = start.parentNode;
    var node = start.nextSibling;
    var text = '';

    while (node && node != end)
    {
      text += node.textContent;
      node = node.nextSibling;
    }

    return text;
  },

  /**
   * Convert the statuses of a user into an array
   *
   * @param {String} stat
   *        User status from GameFAQs, e.g. "(Admin)" or "(Topic Creator)"
   * @return {Array} List of statuses
   */
  readStatus: function(stat)
  {
    statList = [];

    [['Admin', 'admins'],
     ['Moderator', 'mods'],
     ['VIP', 'vips'],
     ['Topic Creator', 'tc']].forEach(function(item) {
      // Check both full and abbreviated forms, e.g. "(Admin)" and "(A)"
      if (stat.indexOf('(' + item[0] + ')') != -1
          || stat.indexOf('(' + item[0][0] + ')') != -1)
       statList.push(item[1]);
    });

    return statList;
  },

  /**
   * Convert an array of statuses into a string
   *
   * Note: topic creator status is not included because it's displayed
   * separately
   *
   * @param {Array} statList
   *        List of statuses (e.g., from readStatus())
   * @return {String} User statuses displayed in parentheses, like GameFAQs
   */
  showStatus: function(statList)
  {
    var stat = '';

    // TC status is added separately
    [['admins', 'Admin'],
     ['mods', 'Moderator'],
     ['vips', 'VIP']].forEach(function(item) {
      if (statList.indexOf(item[0]) != -1)
       stat += '(' + item[1] + ') ';
     });

    return stat.trim();
  }
};
