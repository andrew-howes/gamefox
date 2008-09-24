/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GameFOX =
{
  prefs: Cc['@mozilla.org/preferences-service;1'].
           getService(Ci.nsIPrefService).getBranch('gamefox.'),

  processPage: function(event)
  {
    var doc = GFlib.getDocument(event);
    if (!GFlib.onBoards(doc)) return false;

    /* Index (index.php) */
    if (GFlib.onPage(doc, 'index'))
    {
      GFlib.setTitle(doc, 'Message Boards');
    }

    /* Active Messages (myposts.php) */
    else if (GFlib.onPage(doc, 'myposts'))
    {
      var topicsTable = doc.evaluate('//div[@class="board"]/table', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var rows;

      if (topicsTable != null)
      {
        // Double click action
        topicsTable.addEventListener('dblclick', GameFOX.topicDblclick, false);

        // Topic rows
        rows = topicsTable.getElementsByTagName('tr');
      }
      else
      {
        // No topics
        rows = [];
      }

      // Topic row loop
      for (var i = 1; i < rows.length; i++)
      {
        // Last post link
        if (GameFOX.prefs.getBoolPref('elements.topics.lastpostlink')) // pref
        {
          var lastPost = GFutils.getLastPost(rows[i].cells[2].textContent);

          var text = rows[i].cells[3].textContent;
          rows[i].cells[3].textContent = '';

          var a = doc.createElement('a');
              a.href = rows[i].cells[1].getElementsByTagName('a')[0].href +
                lastPost[0] + '#p' + lastPost[1];
              a.textContent = text;
              a.className = 'gamefox-last-post-link';
          rows[i].cells[3].appendChild(a);
        }
      }
    }

    /* Posting and Preview (post.php) */
    else if (GFlib.onPage(doc, 'post'))
    {
      // Titles
      if (doc.getElementsByName('topictitle')[0]) // new topic
      {
        GFlib.setTitle(doc, GFutils.trim(
            doc.evaluate('//h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).
            singleNodeValue.textContent),
            'CT');
      }
      else if (doc.getElementsByName('message')[0]) // new post
      {
        GFlib.setTitle(doc,
            GFutils.trim(doc.getElementsByName('message')[0].
            parentNode.parentNode.getElementsByTagName('a')[0].textContent),
            'PM');
      }

      // Character count
      if (GameFOX.prefs.getBoolPref('elements.charcounts'))
      {
        // title count
        if (doc.getElementsByName('topictitle')[0])
        {
          var titlecount = doc.createElement('span');
              titlecount.id = 'gamefox-title-count';
          var titleInput = doc.getElementsByName('topictitle')[0];
              titleInput.parentNode.insertBefore(titlecount,
                  titleInput.nextSibling);
              titleInput.parentNode.insertBefore(doc.createTextNode(' '),
                  titleInput.nextSibling);

          GFmessages.updateTitleCount(doc);

          doc.getElementsByName('topictitle')[0].addEventListener('input',
              GFmessages.delayedUpdateTitleCount, false);
          doc.getElementsByName('topictitle')[0].form.addEventListener('reset',
              function(event) {setTimeout(GFmessages.updateTitleCount, 0, event)}, false);
        }

        // message count
        var msgcount = doc.createElement('span');
            msgcount.id = 'gamefox-message-count';
        var resetBtn = doc.getElementsByName('reset')[0];
            resetBtn.parentNode.appendChild(doc.createTextNode(' '));
            resetBtn.parentNode.appendChild(msgcount);

        GFmessages.updateMessageCount(doc);

        doc.getElementsByName('message')[0].addEventListener('input',
            GFmessages.delayedUpdateMessageCount, false);
        doc.getElementsByName('message')[0].form.addEventListener('reset',
            function(event) {setTimeout(GFmessages.updateMessageCount, 0, event)}, false);
      }

      // "Post Message" button
      if (GameFOX.prefs.getBoolPref('elements.quickpost.button'))
      {
        var button = doc.createElement('input');
            button.setAttribute('id', 'gamefox-quickpost-btn');
            button.setAttribute('type', 'button');
            button.setAttribute('value', 'Post Message');
            button.addEventListener('click', GFquickpost.post, false);

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
          GFutils.formatSig(null,
              GameFOX.prefs.getBoolPref('signature.newline'), doc);
      }
    }

    /* User Information (user.php) */
    else if (GFlib.onPage(doc, 'user'))
    {
      GFlib.setTitle(doc, GFutils.trim(doc.getElementsByTagName('td')[1].
            textContent), 'U');
    }

    /* Topic Lists */
    else if (GFlib.onPage(doc, 'topics'))
    {
      var userNav = doc.evaluate('//div[@class="board_nav"]//div[@class="user"]',
          doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      GFuserlist.loadGroups();

      // Title
      GFlib.setTitle(doc, GFutils.trim(doc.evaluate('//h1', doc,
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
            anchor.addEventListener('click', GFquickpost.toggleVisibility, false);

        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(anchor);
      }

      var topicsTable = doc.evaluate('//table[@class="topics"]', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var rows;

      if (topicsTable != null)
      {
        // Double click action
        topicsTable.addEventListener('dblclick', GameFOX.topicDblclick, false);

        // Topic rows
        rows = topicsTable.getElementsByTagName('tr');
      }
      else
      {
        // No topics
        rows = [];
      }

      var skipNext = false;
      var alternateColor = false;

      // Topic row loop
      for (var i = 1; i < rows.length; i++)
      {
        // Last post link
        if (GameFOX.prefs.getBoolPref('elements.topics.lastpostlink')) // pref
        {
          var lastPost = GFutils.getLastPost(rows[i].cells[3].textContent);

          var text = rows[i].cells[4].textContent;
          rows[i].cells[4].textContent = '';

          var a = doc.createElement('a');
              a.href = rows[i].cells[1].getElementsByTagName('a')[0].href +
                lastPost[0] + '#p' + lastPost[1];
              a.textContent = text;
              a.className = 'gamefox-last-post-link';
          rows[i].cells[4].appendChild(a);
        }

        // Pagination
        if (GameFOX.prefs.getBoolPref('paging.auto'))
        {
          var pageHTML = GFutils.formatPagination(
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
              skipNext = true;
            }
          }
        }

        // tracked.php
        if (GFlib.onPage(doc, 'tracked'))
        {
          // Board linkification
          if (GameFOX.prefs.getBoolPref('elements.tracked.boardlink'))
          {
            rows[i].cells[2].innerHTML = '<a href="' + rows[i].cells[1].
              getElementsByTagName('a')[0].getAttribute('href').replace(
                  /message(?=\.)/, 'topic').replace(/(&topic=[0-9]+|\btopic=[0-9]+&)/, '') + '">' +
              GFutils.trim(rows[i].cells[2].textContent) + '</a>';
          }
        }

        // gentopic.php
        else
        {
          // User highlighting
          var username = GFutils.trim(rows[i].getElementsByTagName('td')[2].textContent);
          var hlinfo;

          if ((hlinfo = GFuserlist.searchUsername(username)) != false)
          {
            // list of groups
            if (GameFOX.prefs.getBoolPref('userlist.topics.showgroupnames') &&
                hlinfo[0].length)
            {
              var groupname = doc.createElement('span');
              groupname.className = GFuserlist.groupClassName;
              groupname.style.setProperty('font-style', 'italic', '');
              groupname.appendChild(doc.createTextNode(' (' + hlinfo[0] + ')'));
              rows[i].cells[2].appendChild(groupname);
            }

            if (hlinfo[3] == 'remove') // remove topic
            {
              rows[i].style.setProperty('display', 'none', null);
              alternateColor = !alternateColor;
            }
            else if (hlinfo[3] == 'highlight') // highlight topic
            {
              rows[i].className += ' ' + GFuserlist.highlightClassName;
              rows[i].style.setProperty('background-color', hlinfo[1], 'important');

              for (var j = 0; j < rows[i].cells.length; j++)
                rows[i].cells[j].style.setProperty('background-color', hlinfo[1], 'important');
            }
          }

          // for removed topics
          if (alternateColor)
          {
            if (/\beven\b/.test(rows[i].className))
              rows[i].className = rows[i].className.replace(/\beven\b/, '');
            else
              rows[i].className += ' even';
          }
        }

        // for added page rows
        if (skipNext)
        {
          ++i;
          skipNext = false;
        }
      }
    }

    /* Message Lists */
    else if (GFlib.onPage(doc, 'messages'))
    {
      var userNav = doc.evaluate('//div[@class="board_nav"]//div[@class="user"]',
          doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      GFuserlist.loadGroups();

      var pagenum = doc.location.search.match(/\bpage=([0-9]+)/);
          pagenum = pagenum ? parseInt(pagenum[1]) : 0;
      var leftMsgData = GFutils.getMsgDataDisplay(doc);
      var onArchive = GFlib.onPage(doc, 'archive');

      // Title
      GFlib.setTitle(doc,
          GFutils.trim(doc.evaluate(
              '//h1/following::h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE,
              null).singleNodeValue.textContent),
                'M' + (GFlib.onPage(doc, 'detail') ? 'D' : ''),
                (pagenum ? (pagenum + 1) : null));

      // "Tag Topic" link
      if (GameFOX.prefs.getBoolPref('elements.tag.link'))
      {
        // TODO: move some of this to tag.js?
        GFtags.read();
        var queryStr = doc.location.search;
        var boardID = queryStr.match(/\bboard=([0-9-]+)/)[1];
        var topicID = queryStr.match(/\btopic=([0-9]+)/)[1];
        var tagID = boardID + ',' + topicID;

        var a = doc.createElement('a');
            a.setAttribute('id', 'gamefox-tag-link');
            a.setAttribute('href', '#' + tagID);

        if (boardID in GFtags.tags && topicID in GFtags.tags[boardID].topics)
        {
          a.textContent = 'Untag Topic';
          a.addEventListener('click', GFtags.untagTopicEvent, false);
        }
        else
        {
          a.textContent = 'Tag Topic';
          a.addEventListener('click', GFtags.tagTopicEvent, false);
        }

        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(a);
      }

      // Double click
      doc.evaluate('//table[@class="message"]', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
        addEventListener('dblclick', GameFOX.msglistDblclick, false);

      // Message numbering and highlighting
      var tdResult = doc.evaluate('//table[@class="message"]/tbody/tr/td', doc, null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var td = [];
      for (var j = 0; j < tdResult.snapshotLength; j++)
        td[j] = tdResult.snapshotItem(j);

      var alternateColor = false;
      var msgnum = pagenum * GameFOX.prefs.getIntPref('msgsPerPage');
      var msgnumCond = !GFlib.onPage(doc, 'detail') && GameFOX.prefs.getBoolPref('elements.msgnum');
      var msgnumStyle = GameFOX.prefs.getIntPref('elements.msgnum.style');
      var tcMarker = ' ✪'; // have a pref for this?
      for (var j = 0; j < td.length; j += 2)
      {
        // Message numbering
        ++msgnum;

        var msgnumString = '000'.substring(msgnum.toString().length) + msgnum;
        td[j].id = 'p' + msgnumString;

        if (msgnumCond)
        {
          switch (msgnumStyle)
          {
            case 1: // Reversed: #001 | message detail
              td[j].insertBefore(doc.createTextNode('#' + msgnumString),
                  td[j].getElementsByTagName('a')[1]);

              if (leftMsgData)
                td[j].insertBefore(doc.createElement('br'), td[j].
                    getElementsByTagName('a')[1])
              else if (!onArchive)
                td[j].insertBefore(doc.createTextNode(' | '), td[j].
                    getElementsByTagName('a')[1]);

              break;

            case 2: // Number only: #001
              if (onArchive)
                td[j].innerHTML += '<b>#' + msgnumString + '</b>';
              else
                td[j].getElementsByTagName('a')[1].innerHTML = '#' + msgnumString;
              break;

            case 3: // Mixed: message #001
              if (onArchive)
                td[j].innerHTML += '<b>message #' + msgnumString + '</b>';
              else
                td[j].getElementsByTagName('a')[1].innerHTML = 'message #' + msgnumString;
              break;

            default:
            case 0: // Original: message detail | #001
              if (leftMsgData)
              {
                if (!onArchive)
                  td[j].appendChild(doc.createElement('br'));
                td[j].appendChild(doc.createTextNode('#' + msgnumString));
              }
              else
                if (onArchive)
                  td[j].appendChild(doc.createTextNode('#' + msgnumString));
                else
                  td[j].appendChild(doc.createTextNode(' | #' + msgnumString));

              break;
          }
        }

        // Message highlighting
        var username = td[j].getElementsByTagName(onArchive ? 'b' : 'a')[0].textContent;

        var hlinfo, groupname;
        if ((hlinfo = GFuserlist.searchUsername(username)) != false)
        {
          // add group names after username
          if (GameFOX.prefs.getBoolPref('userlist.messages.showgroupnames') &&
              hlinfo[0].length)
          {
            groupname = doc.createElement('span');
            groupname.className = GFuserlist.groupClassName;
            groupname.appendChild(doc.createTextNode(' ' + hlinfo[0]));

            if (onArchive)
              td[j].insertBefore(groupname,
                  td[j].getElementsByTagName('b')[0].nextSibling);
            else
              td[j].insertBefore(groupname,
                  td[j].getElementsByTagName('a')[0].nextSibling);

            td[j].insertBefore(doc.createTextNode('\n'), groupname);
            if (leftMsgData)
              td[j].insertBefore(doc.createElement('br'), groupname);
            else
              td[j].insertBefore(doc.createTextNode(' |'), groupname);
          }

          if (hlinfo[2] == 'highlight')
          {
            td[j].className += ' ' + GFuserlist.highlightClassName;
            td[j].style.setProperty('background-color', hlinfo[1], 'important');
          }
          else if (hlinfo[2] == 'collapse') // Collapse post
          {
            td[j + 1].style.setProperty('font-size', '0pt', 'important');
            td[j + 1].style.setProperty('display', 'none', 'important');

            var a = doc.createElement('a');
                a.setAttribute('href', '#');
                a.appendChild(doc.createTextNode('[Show]'));
                a.addEventListener('click', GFuserlist.showPost, false);

            if (leftMsgData)
              td[j].appendChild(doc.createElement('br'));
            else
              td[j].appendChild(doc.createTextNode(' | '));
            td[j].appendChild(a);
          }
          else if (hlinfo[2] == 'remove') // remove post
          {
            td[j].style.setProperty('display', 'none', 'important');
            td[j + 1].style.setProperty('display', 'none', 'important');
            if (leftMsgData)
              alternateColor = !alternateColor;
          }
        }

        // for removed posts
        if (alternateColor)
        {
          var tr = td[j].parentNode;
          if (/\beven\b/.test(tr.className))
            tr.className = tr.className.replace(/\beven\b/, '');
          else
            tr.className += ' even';
        }

        // Distinguish posts from the topic creator
        // TODO: save the username in the URI for multiple pages
        // e.g. board=1&topic=1&hl=username
        if (1) // preference
        {
          if (msgnum == 1)
            var tc = username;

          if (tc == username)
          {
            if (onArchive)
              td[j].insertBefore(doc.createTextNode(tcMarker),
                  td[j].getElementsByTagName('b')[0].nextSibling);
            else
              td[j].insertBefore(doc.createTextNode(tcMarker),
                  td[j].getElementsByTagName('a')[0].nextSibling);
          }
        }
      }

      // QuickPost
      if (GameFOX.prefs.getBoolPref('elements.quickpost.form')
          && doc.evaluate('.//a[contains(@href, "post.php")]', userNav, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
      {
        var qpDiv = doc.createElement('div');
            qpDiv.id = 'gamefox-quickpost-normal';

        doc.getElementById('board_wrap').appendChild(qpDiv);
        GFquickpost.appendForm(doc, qpDiv, false);
      }

      // post ids are generated after the page is loaded
      // this is at the bottom because firefox 2 doesn't re-center the page after
      // QuickPost is added
      if (doc.location.hash.length) doc.location.hash = doc.location.hash;
    }
  },

  msglistDblclick: function(event)
  {
    var prefs        = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('gamefox.');
    var dblclickHead = prefs.getIntPref('message.header.dblclick');
    var dblclickMsg  = prefs.getBoolPref('message.dblclick');

    if (dblclickHead == 0 && !dblclickMsg)
    {
      return;
    }

    var node = event.target;
    var doc = node.ownerDocument;
    var nodeName = node.nodeName.toLowerCase();

    // ignore double-click on images
    if (nodeName == 'img')
    {
      return;
    }

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

    var leftMsgData = GFutils.getMsgDataDisplay(doc);

    if (dblclickHead != 0 && ((!leftMsgData && node.parentNode.className != 'even') || nodeClass.indexOf('author') != -1))
    {
      switch (dblclickHead)
      {
        case 1:
          if (!GFlib.onPage(doc, 'archive'))
            GFquickwhois.quickWhois(event);
          break;
        case 2:
          GFquote.quote(event);
          break;
      }
    }

    else if (dblclickMsg)
    {
      GFquote.quote(event);
    }
  },

  topicDblclick: function(event)
  {
    var myposts = GFlib.onPage(event.target.ownerDocument, 'myposts');
    var switcher = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch).getIntPref('gamefox.' + (myposts ? 'myposts' : 'topic') + '.dblclick');
    switch (switcher)
    {
      case 0:
        break;
      case 1:
        GameFOX.showPages(event);
        break;
      case 2:
        GameFOX.gotoLastPage(event, true); // last post
        break;
      case 3:
        GFtags.add(event);
        break;
      case 4:
        GameFOX.gotoLastPage(event);
        break;
    }
  },

  gotoLastPage: function(event, gotoLastPost)
  {
    var node = event.target;
    var doc = node.ownerDocument;

    try
    {
      while (node.nodeName.toLowerCase() != 'td')
      {
        node = node.parentNode;
      }

      if (GFlib.onPage(doc, 'myposts'))
        var cell = node.parentNode.cells[2];
      else
        var cell = node.parentNode.cells[3];

      var lastPost = GFutils.getLastPost(cell.textContent);

      var uri = node.parentNode.cells[1].getElementsByTagName('a')[0].href
        + lastPost[0] + (gotoLastPost ? '#p' + lastPost[1] : '');
      doc.location.href = uri;
    }
    catch (e) {}
  },

  showPages: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;
    var topicLink, msgsCell;

    try
    {
      while (node.nodeName.toLowerCase() != 'td')
      {
        node = node.parentNode;
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
    var topicID   = topicLink.match(/\btopic=([0-9]+)/)[1];
    var numPages  = Math.ceil(msgsCell.textContent/Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch).getIntPref('gamefox.msgsPerPage'));
    var pageList  = document.getElementById('gamefox-pages-menu');
    var i, item, link, tr, td;

    if ('type' in event) // triggered from double-click event
    {
      var pgPrefs    = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('gamefox.paging.');
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
        item.setAttribute('oncommand', 'GFtags.open("' + boardID + ',' + topicID + ',' + i + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) GFtags.open("' + boardID + ',' + topicID + ',' + i + '", 0)');
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
      'popupshowing', GFcontext.displayMenu, false);

  var prefs = Cc['@mozilla.org/preferences-service;1'].
    getService(Ci.nsIPrefService).getBranch('gamefox.');

  try
  {
    var lastversion = prefs.getCharPref('version');
  }
  catch (e if e.name == 'NS_ERROR_UNEXPECTED') // pref isn't set, assume this is a first run
  {
    var lastversion = '';
  }

  var version = Cc['@mozilla.org/extensions/manager;1'].
    getService(Ci.nsIExtensionManager).
    getItemForID('{6dd0bdba-0a02-429e-b595-87a7dfdca7a1}').version;
  var versionComparator = Cc['@mozilla.org/xpcom/version-comparator;1'].
    getService(Ci.nsIVersionComparator);

  if (versionComparator.compare(version, lastversion) != 0) // upgrade, downgrade, or first run
  {
    GFcss.init();

    /* compatibilty crap
     * TODO: remove these after a while */

    // old signature prefs
    if (versionComparator.compare('0.6.2', lastversion) > 0)
    {
      try { var oldSig = GFutils.getString('signature.body', prefs); }
      catch (e) { var oldSig = false; }

      if (oldSig)
      {
        var sigs = eval(GFutils.getString('signature.serialized', prefs));
        sigs[0]['body'] = oldSig;
        GFutils.setString('signature.serialized', sigs.toSource(), prefs);
      }
    }

    // user highlighting groups
    if (versionComparator.compare('0.6.5', lastversion) > 0)
    {
      var groupAdded = false;

      try
      { var messages = prefs.getBoolPref('highlight.msgs') ? 'highlight' : 'nothing'; }
      catch (e) { var messages = null; }
      try
      { var topics = prefs.getBoolPref('highlight.topics') ? 'highlight' : 'nothing'; }
      catch (e) { var topics = null; }

      try
      { var groups1 = prefs.getCharPref('highlight.groups.1'); }
      catch (e) { var groups1 = null; }
      try
      { var groups2 = prefs.getCharPref('highlight.groups.2'); }
      catch (e) { var groups2 = null; }

      if (groups1)
      {
        try
        { var colors1 = prefs.getCharPref('highlight.colors.1'); }
        catch (e) { var colors1 = '#CCFFFF'; }

        GFuserlist.add('', colors1, groups1, messages, topics);
        groupAdded = true;
      }

      if (groups2)
      {
        try
        { var colors2 = prefs.getCharPref('highlight.colors.2'); }
        catch (e) { var colors2 = '#99CC66'; }

        try
        { var ignore = prefs.getBoolPref('highlight.ignore'); }
        catch (e) { var ignore = false; }

        if (ignore)
          GFuserlist.add('', colors2, groups2, 'remove', 'remove');
        else
          GFuserlist.add('', colors2, groups2, messages, topics);
        groupAdded = true;
      }

      if (!groupAdded)
        GFuserlist.add(); // TODO: move this into first run after above code is removed
    }

    if (versionComparator.compare('0.6.6', lastversion) > 0)
    {
      if (prefs.getCharPref('quote.style') == 'gfcode_body')
        prefs.setCharPref('quote.style', 'gfcode');
    }

    if (lastversion == '') // first run
    {
      GFutils.importBoardSettings();
      GFutils.importSignature();
      window.openDialog('chrome://gamefox/content/options.xul', 'GameFOX',
        'chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar');
    }

    prefs.setCharPref('version', version);
  }

  GFcss.reload();
}

window.addEventListener('load', GameFOXLoader, false);
