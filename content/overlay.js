/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GameFOX =
{
  prefs: Components.classes['@mozilla.org/preferences-service;1'].getService(
             Components.interfaces.nsIPrefService).getBranch('gamefox.'),

  processPage: function(event)
  {
    var doc = GFlib.getDocument(event);
    if (!GFlib.onGF(doc)) return false;

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

    if (!GFlib.onBoards(doc)) return false;

    /* Index (index.php) */
    if (GFlib.onPage(doc, 'index'))
    {
      GFlib.setTitle(doc, 'Message Boards');
    }

    /* Active Messages (myposts.php) */
    else if (GFlib.onPage(doc, 'myposts'))
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
            'CT');
      }
      else if (doc.getElementsByName('message')[0]) // new post
      {
        GFlib.setTitle(doc,
            GameFOXUtils.trim(doc.getElementsByName('message')[0].
            parentNode.parentNode.getElementsByTagName('a')[0].textContent),
            'PM');
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
            refChild = (refChild[0].getAttribute('value') == 'Post Message' ?
                refChild[1] : refChild[0]);
            refChild.parentNode.insertBefore(button, refChild);
            refChild.parentNode.insertBefore(doc.createTextNode(' '), refChild);
      }

      // Signature
      if (GameFOX.prefs.getBoolPref('signature.applyeverywhere')
          && !/\b(Error|Preview|Posted)<\/h1><\/div>/.test(doc.documentElement.innerHTML))
      {
        doc.getElementsByName('message')[0].value =
          GameFOXUtils.formatSig(null, null,
              GameFOX.prefs.getBoolPref('signature.newline'), doc);
      }
    }

    /* User Information (user.php) */
    else if (GFlib.onPage(doc, 'user'))
    {
      GFlib.setTitle(doc, GameFOXUtils.trim(doc.getElementsByTagName('td')[1].
            textContent), 'U');
    }


    var userNav = doc.evaluate('//div[@class="board_nav"]//div[@class="user"]',
        doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    GFHL.loadGroups();

    /* Topic Lists */
    if (GFlib.onPage(doc, 'topics'))
    {
      GFlib.setTitle(doc, GameFOXUtils.trim(doc.evaluate('//h1', doc,
              null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
          textContent), 'T');

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
      var rows = doc.getElementsByTagName('table');
      rows = (rows[2] ? rows[2] : rows[0]).getElementsByTagName('tr');

      for (var i = 1; i < rows.length; i++)
      {
        if (GameFOX.prefs.getBoolPref('paging.auto'))
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
        if (!GFlib.onPage(doc, 'tracked') && GameFOX.prefs.getBoolPref('highlight.topics'))
        {
          var username = GameFOXUtils.trim(rows[i].getElementsByTagName('td')[2].textContent);
          var hlinfo;

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

    /* Message Lists */
    else if (GFlib.onPage(doc, 'messages'))
    {
      var pagenum = doc.location.search.match(/\bpage=([0-9]+)/);
          pagenum = pagenum ? parseInt(pagenum[1]) : 0;
      var leftMsgData = GameFOXUtils.getMsgDataDisplay(doc);

      // Title
      GFlib.setTitle(doc,
          GameFOXUtils.trim(doc.evaluate(
              '//h1/following::h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE,
              null).singleNodeValue.textContent),
                'M' + (GFlib.onPage(doc, 'detail') ? 'D' : ''),
                (pagenum ? (pagenum + 1) : null));

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
          try
          {
            msgHeader = td[j].offsetParent.rows[td[j].parentNode.rowIndex + 1].className == 'even';
          }
          catch (e)
          {
            msgHeader = false;
          }

          if (!msgHeader) continue;
        }

        ++msgnum;

        var msgnumString = '000'.substr(0, 3 - msgnum.toString().length) + msgnum;
        td[j].id = 'p' + msgnumString;

        // don't try to number the message detail page
        if (!GFlib.onPage(doc, 'detail') && GameFOX.prefs.getBoolPref('elements.msgnum'))
        {
          switch (GameFOX.prefs.getIntPref('elements.msgnum.style'))
          {
            case 1: // Reversed: #001 | message detail
              td[j].insertBefore(doc.createTextNode('#' + msgnumString),
                  td[j].getElementsByTagName('a')[1]);

              if (leftMsgData)
                td[j].insertBefore(doc.createElement('br'), td[j].
                    getElementsByTagName('a')[1])
              else if (!GFlib.onPage(doc, 'archive'))
                td[j].insertBefore(doc.createTextNode(' | '), td[j].
                    getElementsByTagName('a')[1]);

              break;

            case 2: // Number only: #001
              if (GFlib.onPage(doc, 'archive'))
                td[j].innerHTML += '<b>#' + msgnumString + '</b>';
              else
                td[j].getElementsByTagName('a')[1].innerHTML = '#' + msgnumString;
              break;

            case 3: // Mixed: message #001
              if (GFlib.onPage(doc, 'archive'))
                td[j].innerHTML += '<b>message #' + msgnumString + '</b>';
              else
                td[j].getElementsByTagName('a')[1].innerHTML = 'message #' + msgnumString;
              break;

            default:
            case 0: // Original: message detail | #001
              if (leftMsgData)
              {
                if (!GFlib.onPage(doc, 'archive'))
                  td[j].appendChild(doc.createElement('br'));
                td[j].appendChild(doc.createTextNode('#' + msgnumString));
              }
              else
                if (GFlib.onPage(doc, 'archive'))
                  td[j].appendChild(doc.createTextNode('#' + msgnumString));
                else
                  td[j].appendChild(doc.createTextNode(' | #' + msgnumString));

              break;
          }
        }

        // Message highlighting
        if (GFlib.onPage(doc, 'archive')) // archived topics have no message links
          var username = td[j].getElementsByTagName('b')[0].textContent;
        else
          var username = td[j].getElementsByTagName('a')[0].textContent;
        var hlinfo;

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
            td[j + 1].style.setProperty('font-size', '0pt', 'important');
            td[j + 1].style.setProperty('display', 'none', 'important');

            var a = doc.createElement('a');
                a.setAttribute('href', '#');
                a.appendChild(doc.createTextNode('[Show]'));
                a.addEventListener('click', GFHL.showPost, false);

            if (leftMsgData)
              td[j].appendChild(doc.createElement('br'));
            else
              td[j].appendChild(doc.createTextNode(' | '));
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


    var vertmess = doc.getElementsByTagName('tr')[0].getElementsByTagName('td').length == 1;

    if (dblclickHead != 0 && ((vertmess && node.parentNode.className != 'even') || nodeClass.indexOf('author') != -1))
    {
      switch (dblclickHead)
      {
        case 1:
          GFQuickWhois.quickWhois(event);
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
    var myposts = GFlib.onPage(event.target.ownerDocument, 'myposts');
    var switcher  = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getIntPref('gamefox.' + (myposts ? 'myposts' : 'topic') + '.dblclick');
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

      var myposts = GFlib.onPage(doc, 'myposts');
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

      var myposts = GFlib.onPage(doc, 'myposts');

      topicLink = node.parentNode.cells[1].getElementsByTagName('a')[0].getAttribute('href');

      msgsCell = myposts ? node.parentNode.cells[2] : node.parentNode.cells[3];
    }
    catch (e)
    {
      return;
    }

    var boardID   = topicLink.match(/\bboard=([0-9-]+)/)[1];
    var topicID   = topicLink.match(/\btopic=([0-9-]+)/)[1];
    var numPages  = Math.ceil(msgsCell.textContent/Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getIntPref('gamefox.msgsPerPage'));
    var pageList  = document.getElementById('gamefox-pages-menu');
    var i, item, link, tr, td;

    if ('type' in event) // triggered from double-click event
    {
      var pgPrefs    = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.paging.');
      var pgLocation = pgPrefs.getIntPref('location');
      node = node.parentNode.cells[1];

      try
      {
        if (node.parentNode.nextSibling.className == 'gamefox-pagelist')
        {
          node.parentNode.nextSibling.style.display = (!pgLocation && node.parentNode.nextSibling.style.display != 'table-row') ? 'table-row' : 'none';
          if (!pgLocation)
          {
            try
            {
              node.getElementsByTagName('span')[0].style.display = 'none';
            }
            catch (e) {}
            return;
          }
        }
      }
      catch (e) {}

      var notNewElement = (node.getElementsByTagName('span').length > 0);
      if (notNewElement)
      {
        td = node.getElementsByTagName('span')[0];
        try
        {
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
        }
        catch (e) {}

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
  }
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
  catch (e if e.name == 'NS_ERROR_UNEXPECTED') // the pref isn't set, we can assume this is a first run
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
  var versionComparator =
    Components.classes['@mozilla.org/xpcom/version-comparator;1'].getService(
        Components.interfaces.nsIVersionComparator);

  var compareVersions = versionComparator.compare(lastversion, version);
  if (compareVersions != 0) // upgrade or downgrade
  {
    GameFOXCSS.init();

    // convert old signature prefs to serialized pref
    // TODO: remove this after a while, it's not necessary when the majority
    // of people have already updated with previous versions
    if (versionComparator.compare('0.6.2', version) == -1)
    {
      var oldPresig, oldSig;
      try
      {
        oldPresig = GameFOXUtils.getString('signature.presig', prefs);
      }
      catch (e) {}
      try
      {
        oldSig = GameFOXUtils.getString('signature.body', prefs);
      }
      catch (e) {}

      var sigs = eval(GameFOXUtils.getString('signature.serialized', prefs));
      if (oldPresig) sigs[0]['presig'] = oldPresig;
      if (oldSig) sigs[0]['body'] = oldSig;
      GameFOXUtils.setString('signature.serialized', sigs.toSource(), prefs);
    }
  }

  prefs.setCharPref('version', version);

  GameFOXCSS.reload();
}

window.addEventListener('load', GameFOXLoader, false);
