/* vim: set et sw=2 ts=2 sts=2 tw=79: */

// TODO: this thing is huge. try to split it into multiple smaller files, it's
// nearly impossible to follow

function gamefox_log(msg) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage('GameFOX: ' + msg);
}

var GameFOX =
{
  prefs: Components.classes['@mozilla.org/preferences-service;1'].getService(
             Components.interfaces.nsIPrefService).getBranch('gamefox.'),

  processPage: function(event)
  {
    if (!GFlib.onBoards(GFlib.getDocument(event))) return false;
    else var doc = GFlib.getDocument(event);

    // TODO: use nsIContentPolicy to prevent the stylesheet being loaded before
    // it's disabled
    if (GameFOX.prefs.getBoolPref('theme.disablegamefaqscss'))
    {
      var stylesheets = doc.getElementsByTagName('link');
      for (var i = 0; i < stylesheets.length; i++)
      {
        stylesheets[i].disabled = true;
      }
    }

    /* Active Messages (myposts.php) */
    if (GFlib.onPage(doc, 'myposts'))
    {
      doc.evaluate('//div[@class="board"]/table', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
        addEventListener('dblclick', GameFOX.topicDblclick, false);
    }

    /* Posting and Preview (post.php) */
    else if (GFlib.onPage(doc, 'post'))
    {
      // Titles
      if (doc.getElementsByName('topictitle')[0]) // new topic
      {
        GFlib.setTitle(doc,
            doc.evaluate('//h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).
            singleNodeValue.textContent.replace(/^\s+|\s+$/g, ''),
            "Create Topic");
      }
      else // new post
      {
        GFlib.setTitle(doc,
            GameFOXUtils.trim(doc.getElementsByName('message')[0].
            parentNode.parentNode.getElementsByTagName('a')[0].textContent),
            "Post Message");
      }

      // "Post Message" button
      if (GameFOX.prefs.getBoolPref('elements.quickpost.button'))
      {
        var button = doc.createElement('input');
            button.setAttribute('id', 'gamefox-quickpost-btn');
            button.setAttribute('type', 'button');
            button.setAttribute('value', 'Post Message');
            button.addEventListener('click', GFQuickPost.post, false);

        var refChild = doc.getElementsByName('post');
            refChild = (refChild[0].getAttribute('value').match(/post/i) ?
                refChild[1] : refChild[0]);
            refChild.parentNode.insertBefore(button, refChild);
            refChild.parentNode.insertBefore(doc.createTextNode(' '), refChild);
      }

      // Signature
      if (GameFOX.prefs.getBoolPref('signature.applyeverywhere')
          && !doc.documentElement.innerHTML.match(/\b(Error|Preview)\s*<\/h1>\s*<\/div>/ig))
      {
        doc.getElementsByName('message')[0].value =
          GameFOXUtils.formatSig(
              GameFOXUtils.getString('signature.body'),
              GameFOXUtils.getString('signature.presig'),
              GameFOX.prefs.getBoolPref('signature.newline')
              );
      }
    }

    /* User Information (user.php) */
    else if (GFlib.onPage(doc, 'user'))
    {
      GFlib.setTitle(doc, GameFOXUtils.trim(doc.getElementsByTagName('td')[1].textContent), "User");
    }


    var userNav = doc.evaluate('//div[@class="board_nav"]//div[@class="user"]',
        doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    GFHL.loadGroups();

    /* Topic Lists (gentopic.php and tracked.php) */
    if (GFlib.onPage(doc, 'gentopic') || GFlib.onPage(doc, 'tracked'))
    {
      GFlib.setTitle(doc, GameFOXUtils.trim(doc.evaluate('//h1', doc,
              null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
          textContent));

      // Topic "QuickPost" link
      if (GameFOX.prefs.getBoolPref('elements.quickpost.link')
          && doc.evaluate('.//a[contains(@href, "post.php")]', userNav,
            null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
      {
        var anchor = doc.createElement('a');
            anchor.setAttribute('id', 'gamefox-quickpost-link');
            anchor.setAttribute('href', '#');
            anchor.appendChild(doc.createTextNode(GameFOX.prefs.
                  getCharPref('elements.quickpost.link.title')));
            anchor.addEventListener('click', GFQuickPost.toggleVisibility, false);

        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(anchor);
      }

      // Double click action
      doc.evaluate('//table[@class="topics"]', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.addEventListener(
            'dblclick', GameFOX.topicDblclick, false);

      // Topic row loop
      if (GameFOX.prefs.getBoolPref('paging.auto'))
      {
        var rows = doc.getElementsByTagName('table');
            rows = (rows[2] ? rows[2] : rows[0]).getElementsByTagName('tr');

        for (var i = 1; i < rows.length; i++)
        {
          // Pagination
          var pageHTML = GameFOXUtils.formatPagination(
              doc,
              rows[i].cells[1].getElementsByTagName('a')[0].getAttribute('href'),
              Math.ceil(rows[i].cells[3].textContent));

          if (pageHTML) // this topic has multiple pages
          {
            if (GameFOX.prefs.getIntPref('paging.location') == 0)
            {
              var pageTR = doc.createElement('tr');
                  pageTR.setAttribute('class', 'gamefox-pagelist');
                  pageTR.style.display = 'table-row';

              var pageTD = doc.createElement('td');
                  pageTD.setAttribute('colspan', '5');
            }
            else
            {
              var pageTR = rows[i].cells[1];

              var pageTD = doc.createElement('span');
                  pageTD.setAttribute('class', 'gamefox-pagelist');
                  pageTD.setAttribute('tag', GameFOX.prefs.getIntPref('paging.location'));
            }

            pageTD.innerHTML = pageHTML.innerHTML;
            pageTR.appendChild(pageTD);

            if (GameFOX.prefs.getIntPref('paging.location') == 0)
            {
              rows[i].parentNode.insertBefore(pageTR, rows[i].nextSibling);
              i++;
            }
          }

          // Board linkification (tracked.php)
          if (GameFOX.prefs.getBoolPref('elements.tracked.boardlink') && GFlib.onPage(doc, 'tracked'))
          {
            rows[i].cells[2].innerHTML = '<a href="' + rows[i].cells[1].
              getElementsByTagName('a')[0].getAttribute('href').replace(
                  /message(?=\.)/, 'topic').replace(/(&topic=[0-9-]+|\btopic=[0-9-]+&)/, '') + '">' +
              GameFOXUtils.trim(rows[i].cells[2].textContent) + '</a>';
          }

          // User highlighting (only on gentopic.php, tracked.php has no topic
          // creator names)
          if (GFlib.onPage(doc, 'gentopic') && GameFOX.prefs.getBoolPref('highlight.topics'))
          {
            var username = GameFOXUtils.trim(rows[i].getElementsByTagName('td')[2].textContent);
            var hlinfo = false;

            if ((hlinfo = GFHL.getGroupData(username)) != false)
            {
              rows[i].setAttribute('class', rows[i].getAttribute('class') +
                  ' gamefox-highlight-' + hlinfo[0]);
              rows[i].style.setProperty('background-color', hlinfo[1], 'important');

              for (var j = 0; j < rows[i].cells.length; j++)
                rows[i].cells[j].style.setProperty('background-color', hlinfo[1], 'important');
            }
          }
        }
      }
    }

    /* Message Lists (genmessage.php) */
    else if (GFlib.onPage(doc, 'genmessage'))
    {
      var pagenum = doc.location.search.match(/\bpage=([0-9]+)/);
          pagenum = pagenum ? parseInt(pagenum[1]) : 0;
      var leftMsgData = GameFOXUtils.getMsgDataDisplay(doc);

      // Title
      GFlib.setTitle(doc,
          GameFOXUtils.trim(doc.evaluate(
              '//h1/following::h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE,
              null).singleNodeValue.textContent),
                pagenum + 1);

      // "Tag Topic" link
      if (GameFOX.prefs.getBoolPref('elements.tag.link'))
      {
        // TODO: move some of this to tag.js?
        GameFOXTags.read();
        var queryStr = doc.location.search;
        var boardID = queryStr.match(/\bboard=([0-9-]+)/)[1];
        var topicID = queryStr.match(/\btopic=([0-9-]+)/)[1];
        var tagID = boardID + ',' + topicID;

        var a = doc.createElement('a');
            a.setAttribute('id', 'gamefox-tag-link');
            a.setAttribute('href', '#' + tagID);

        if (boardID in GameFOXTags.tags && topicID in GameFOXTags.tags[boardID].topics)
        {
          a.textContent = 'Untag Topic';
          a.addEventListener('click', GameFOXTags.untagTopicEvent, false);
        }
        else
        {
          a.textContent = 'Tag Topic';
          a.addEventListener('click', GameFOXTags.tagTopicEvent, false);
        }

        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(a);
      }

      // Double click
      doc.evaluate('//table[@class="message"]', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
        addEventListener('dblclick', GameFOX.msglistDblclick, false);

      // Message numbering and highlighting
      var td = doc.getElementsByTagName('td');
      var msgnum = pagenum * GameFOX.prefs.getIntPref('msgsPerPage');
      var msgHeader = false;
      for (var j = 0; j < td.length; j++)
      {
        // Message numbering
        //
        // Make sure we're working on a message header. Works for both message
        // data display formats
        if (leftMsgData && td[j].className != 'author')
          continue;
        else if (!leftMsgData)
        {
          try { msgHeader = td[j].offsetParent.rows[td[j].parentNode.rowIndex + 1].className == 'even'; }
          catch (e) { msgHeader = false; }

          if (!msgHeader) continue;
        }

        ++msgnum;

        var msgnumString = '000'.substr(0, 3 - msgnum.toString().length) + msgnum;
        td[j].id = 'p' + msgnumString;

        if (GameFOX.prefs.getBoolPref('elements.msgnum'))
        {
          switch (GameFOX.prefs.getIntPref('elements.msgnum.style'))
          {
            case 1: // Reversed: #001 | message detail
              td[j].insertBefore(doc.createTextNode('#' + msgnumString),
                  td[j].getElementsByTagName('a')[1]);

              if (leftMsgData)
                td[j].insertBefore(doc.createElement('br'), td[j].
                    getElementsByTagName('a')[1])
              else
                td[j].insertBefore(doc.createTextNode(' | '), td[j].
                    getElementsByTagName('a')[1]);

              break;

            case 2: // Number only: #001
              td[j].getElementsByTagName('a')[1].innerHTML = '#' + msgnumString;
              break;

            case 3: // Mixed: message #001
              td[j].getElementsByTagName('a')[1].innerHTML = 'message #' + msgnumString;
              break;

            default:
            case 0: // Original: message detail | #001
              if (leftMsgData)
              {
                td[j].appendChild(doc.createElement('br'));
                td[j].appendChild(doc.createTextNode('#' + msgnumString));
              }
              else
                td[j].appendChild(doc.createTextNode(' | #' + msgnumString));

              break;
          }
        }

        // Message highlighting
        var username = td[j].getElementsByTagName('a')[0].textContent;
        var hlinfo = false;

        if ((hlinfo = GFHL.getGroupData(username)) != false)
        {
          if (GameFOX.prefs.getBoolPref('highlight.msgs'))
          {
            td[j].setAttribute('class', td[j].getAttribute('class') +
                ' gamefox-highlight-' + hlinfo[0]);
            td[j].style.setProperty('background-color', hlinfo[1], 'important');
          }

          if (hlinfo[2]) // Hide post
          {
            td[j].style.setProperty('font-size', '0pt', 'important');
            td[j + 1].style.setProperty('font-size', '0pt', 'important');

            var a = doc.createElement('a');
                a.setAttribute('href', '#');
                a.style.setProperty('font-size', '10px', 'important');
                a.appendChild(doc.createTextNode('[Show]'));
                a.addEventListener('click', GameFOX.showPost, false);

            td[j].appendChild(doc.createElement('br'));
            td[j].appendChild(a);
          }
        }
      }

      // QuickPost
      if (GameFOX.prefs.getBoolPref('elements.quickpost.form')
          && doc.evaluate('.//a[contains(@href, "post.php")]', userNav, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
      {
        var qpdiv = doc.createElement('div');
            qpdiv.id = 'gamefox-quickpost-normal';

        var footer = doc.evaluate('//div[@id="footer"]', doc,
            null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        footer.parentNode.insertBefore(qpdiv, footer);

        GFQuickPost.appendForm(doc, doc.getElementById('gamefox-quickpost-normal'), false);
      }
    }

    /* Message Detail (detail.php) */
    else if (GFlib.onPage(doc, 'detail'))
    {
      GFlib.setTitle(doc,
          GameFOXUtils.trim(doc.evaluate('//h1/following::h1', doc,
              null, XPathResult. FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
            textContent),
          "Message Detail");
    }
  },

  msglistDblclick: function(event)
  {
    var prefs        = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var dblclickHead = prefs.getIntPref('message.header.dblclick');
    var dblclickMsg  = prefs.getBoolPref('message.dblclick');

    if (dblclickHead == 0 && !dblclickMsg)
    {
      return;
    }

    var node = event.target;
    var doc = node.ownerDocument;

    // ignore double-click on images
    if (node.nodeName.toLowerCase() == 'img')
    {
      return;
    }

    var nodeName  = node.nodeName.toLowerCase();
    var nodeClass = node.className.toLowerCase();
    try
    {
      var tableNode      = (nodeName == 'div') ? node.parentNode : node.offsetParent;
      var tableNodeName  = tableNode.nodeName.toLowerCase();
      var tableNodeClass = tableNode.className.toLowerCase();

      while (tableNodeName != 'table' || tableNodeClass != 'message')
      {
        node           = tableNode;
        nodeName       = tableNodeName;
        nodeClass      = tableNodeClass;
        tableNode      = (nodeName == 'div') ? node.parentNode : node.offsetParent;
        tableNodeName  = tableNode.nodeName.toLowerCase();
        tableNodeClass = tableNode.className.toLowerCase();
      }
    }
    catch (e)
    {
      return;
    }


    var vertmess = (doc.getElementsByTagName('tr')[0].getElementsByTagName('td').length == 1) ? true : false;

    if (dblclickHead != 0 && ((vertmess && node.parentNode.className != 'even') || nodeClass.match(/author/)))
    {
      switch (dblclickHead)
      {
        case 1:
          GameFOX.quickWhois(event);
          break;
        case 2:
          GFQuote.quote(event);
          break;
      }
      return;
    }

    if (dblclickMsg)
    {
      GFQuote.quote(event);
    }
  },

  topicDblclick: function(event)
  {
    var onMyPosts = event.target.ownerDocument.location.pathname.match(/\bmyposts\./i);
    var switcher  = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getIntPref('gamefox.' + (onMyPosts ? 'myposts' : 'topic') + '.dblclick');
    switch (switcher)
    {
      case 0:
        break;
      case 1:
        GameFOX.showPages(event);
        break;
      case 2:
        GameFOX.gotoLastPage(event);
        break;
      case 3:
        GameFOXTags.add(event);
        break;
    }
  },

  quickWhois: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;
    var nodeName = node.nodeName.toLowerCase();

    try
    {
      while (nodeName != 'td' && node.className != 'whitebox')
      {
        node = node.parentNode;
        nodeName = node.nodeName.toLowerCase();
      }
    }
    catch (e)
    {
      return;
    }

    var div = node.getElementsByTagName('div');

    if (div.length > 0)
    {
      div[0].style.display = div[0].style.display == 'block' ? 'none' : 'block';
      div[0].style.top     = window.content.scrollY + event.clientY + 'px';
      div[0].style.left    = window.content.scrollX + event.clientX + 'px';
      return;
    }

    function GameFOXFindInfo(what, where)
    {
      var pattern = new RegExp('<td\\b[^>]*>(\\s*<a\\b[^>]*>)?\\s*' + what + '(\\s*</a>)?\\s*</td>\\s*<td\\b[^>]*>([^\\0]*?)</td>', 'gi');
      var matches = pattern.exec(where);

      if (matches)
      {
        return matches[3].replace(/^\s+|\s+$/g, '');
      }

      return '';
    }

    div = doc.createElement('div');
    div.setAttribute('class', 'gamefox-quickwhois');
    div.style.display = 'block';
    div.style.setProperty('font-size', '10pt', '');
    div.style.top     = window.content.scrollY + event.clientY + 'px';
    div.style.left    = window.content.scrollX + event.clientX + 'px';
    div.innerHTML     = 'Loading QuickWhois...'
    node.appendChild(div);

    var request = new XMLHttpRequest();
    request.open('GET', node.getElementsByTagName('a')[0].href);
    request.onreadystatechange = function ()
    {
      if (request.readyState == 4)
      {
        var profileFieldsHTML = '';
        var profileFields = new Array(
          'User ID', 'User ID',
          'Board User Level', 'User Level',
          'Account Created', 'Created At',
          'Last Visit', 'Last Visit',
          'E-Mail', 'Email',
          'Website', 'Website',
          'AIM', 'AIM',
          'Yahoo IM', 'Yahoo IM',
          'Windows Live \\(MSN\\)', 'MSN',
          'Google Talk', 'Google Talk',
          'ICQ', 'ICQ',
          'Xbox Live', 'Xbox Live',
          'PlayStation Network', 'PSN',
          'DS Friend Code', 'DS Friend Code',
          'Wii Number', 'Wii Number',
          'Wii Friend Code', 'Wii Friend Code',
          'Skype', 'Skype',
          'Steam', 'Steam',
          'xfire', 'xfire',
          'Quote', 'Quote',
          'Karma', 'Karma'
        );
        for (var i = 0; i < profileFields.length; i += 2) {
          if ((profileField = GameFOXFindInfo(profileFields[i], request.responseText)) != '') {
            if (profileFields[i] == 'Board User Level') {
              profileField = profileField.split(/<br\s*\/?>/gi)[0].replace(/<\/?b>/ig, '');
            }
            profileFieldsHTML += '<b>' + profileFields[i+1] + ':</b> ' + profileField.replace(/<br\s*\/?>/gi, '<br/>') + '<br/>';
          }
        }
        div.innerHTML = profileFieldsHTML.replace(/<br\/>$/, '')
          + GameFOXFindInfo('Contributor Page', request.responseText).replace(/^</, '<br/><')
          + GameFOXFindInfo('My Games', request.responseText).replace(/^</, '<br/><');
      }
    };
    request.send(null);
  },

  gotoLastPage: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;
    var nodeName = node.nodeName.toLowerCase();

    try
    {
      while (nodeName != 'td')
      {
        node = node.parentNode;
        nodeName = node.nodeName.toLowerCase();
      }

      var myposts = doc.location.pathname.match(/\/myposts\./i) ? true : false;
      var msgsCell = myposts ? node.parentNode.cells[2] : node.parentNode.cells[3];
      var pageNum = Math.floor((msgsCell.textContent-1)/Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getIntPref('gamefox.msgsPerPage'));
      doc.location.href = node.parentNode.cells[1].getElementsByTagName('a')[0].href + (pageNum ? '&page=' + pageNum : '');
    }
    catch (e)
    {
      return;
    }
  },

  showPages: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;
    var nodeName = node.nodeName.toLowerCase();
    var topicLink, msgsCell;

    try
    {
      while (nodeName != 'td')
      {
        node = node.parentNode;
        nodeName = node.nodeName.toLowerCase();
      }

      var myposts = doc.location.pathname.match(/\/myposts\./i) ? true : false;

      topicLink = node.parentNode.cells[1].getElementsByTagName('a')[0].getAttribute('href');

      msgsCell = myposts ? node.parentNode.cells[2] : node.parentNode.cells[3];
    }
    catch (e)
    {
      return;
    }

    var boardID   = topicLink.match(/\bboard=([0-9-]+)/i)[1];
    var topicID   = topicLink.match(/\btopic=([0-9-]+)/i)[1];
    var numPages  = Math.ceil(msgsCell.textContent/Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getIntPref('gamefox.msgsPerPage'));
    var pageList  = document.getElementById('gamefox-pages-menu');
    var i, item, link, tr, td;

    if ('type' in event) // triggered from double-click event
    {
      var pgPrefs    = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.paging.');
      var pgLocation = pgPrefs.getIntPref('location');
      node = node.parentNode.cells[1];

      try {
        if (node.parentNode.nextSibling.className == 'gamefox-pagelist')
        {
          node.parentNode.nextSibling.style.display = (!pgLocation && node.parentNode.nextSibling.style.display != 'table-row') ? 'table-row' : 'none';
          if (!pgLocation)
          {
            try {
              node.getElementsByTagName('span')[0].style.display = 'none';
            } catch(e){;}
            return;
          }
        }
      } catch(e){;}

      var notNewElement = (node.getElementsByTagName('span').length > 0);
      if (notNewElement)
      {
        td = node.getElementsByTagName('span')[0];
        try {
          if (parseInt(td.getAttribute('tag')) == pgLocation)
          {
            td.style.display = (td.style.display == 'none') ? '' : 'none';
            if (td.style.display == 'none')
            return;
          }
          else if (!pgLocation)
          {
            td.style.display = 'none';
          }
        } catch(e){;}

        if (pgLocation)
        {
          tr = node;
          td.setAttribute('tag', pgLocation);
          td.style.display = '';
        }
      }
      else if (pgLocation)
      {
        tr = node;
        td = doc.createElement('span');
        td.setAttribute('class', 'gamefox-pagelist');
        td.setAttribute('tag', pgLocation);
      }

      if (!pgLocation)
      {
        tr = doc.createElement('tr');
        tr.setAttribute('class', 'gamefox-pagelist');
        tr.style.display = 'table-row';
        td = doc.createElement('td');
        td.setAttribute('colspan', '5');
      }

      var pgPrefix = pgPrefs.getCharPref('prefix');
      var pgSep    = pgPrefs.getCharPref('separator');
      var pgSuffix = pgPrefs.getCharPref('suffix');

      td.innerHTML = '';
      td.appendChild(doc.createTextNode(pgSuffix));

      var suffixHTML = td.innerHTML.replace(/\s/g, '&nbsp;');

      td.innerHTML = '';
      if (pgLocation == 2)
      {
        td.appendChild(doc.createElement('br'));
      }
      td.appendChild(doc.createTextNode(pgPrefix));
      td.innerHTML = ' ' + td.innerHTML.replace(/\s/g, '&nbsp;');

      for (i = 0; i < numPages; i++)
      {
        link = doc.createElement('a');
        link.setAttribute('href', topicLink + (i ? '&page=' + i : ''));
        link.innerHTML = i+1;

        td.appendChild(link);

        if (i < numPages-1)
        {
          td.appendChild(doc.createTextNode(pgSep));
        }
      }

      td.innerHTML += suffixHTML;

      tr.appendChild(td);
      if (!pgLocation) node.parentNode.parentNode.insertBefore(tr, node.parentNode.nextSibling);
    }
    else // triggered from context menu
    {
      while (pageList.hasChildNodes())
      {
        pageList.removeChild(pageList.childNodes[0]);
      }

      for (i = 0; i < numPages; i++)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', i+1);
        item.setAttribute('oncommand', 'GameFOXTags.open("' + boardID + ',' + topicID + ',' + i + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) GameFOXTags.open("' + boardID + ',' + topicID + ',' + i + '", 0)');
        pageList.appendChild(item);
      }
    }
  },

  toggleSidebar: function()
  {
    toggleSidebar('viewGamefoxSidebar');
  },
};

function GameFOXLoader()
{
  window.removeEventListener('load', GameFOXLoader, false);
  document.getElementById('appcontent').addEventListener(
      'DOMContentLoaded', GameFOX.processPage, false);
  document.getElementById('contentAreaContextMenu').addEventListener(
      'popupshowing', GFContextMenu.displayMenu, false);

  var prefs = Components.classes['@mozilla.org/preferences-service;1'].
    getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');

  try
  {
    var lastversion = prefs.getCharPref('version');
  }
  catch (e if e.name == "NS_ERROR_UNEXPECTED") // the pref isn't set, we can assume this is a first run
  {
    GameFOXCSS.init();
    GameFOXUtils.importBoardSettings();
    GameFOXUtils.importSignature();
    window.openDialog('chrome://gamefox/content/options.xul', 'GameFOX',
        'chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar');
  }

  var version = Components.classes['@mozilla.org/extensions/manager;1'].
    getService(Components.interfaces.nsIExtensionManager).
    getItemForID('{6dd0bdba-0a02-429e-b595-87a7dfdca7a1}').version;
  var compareVersions = Components.classes['@mozilla.org/xpcom/version-comparator;1'].
    getService(Components.interfaces.nsIVersionComparator).compare(lastversion, version);
  if (compareVersions != 0)
    GameFOXCSS.init();

  prefs.setCharPref('version', version);

  GameFOXCSS.reload();
}

window.addEventListener('load', GameFOXLoader, false);
