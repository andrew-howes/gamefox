/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GameFOX =
{
  prefs: Cc['@mozilla.org/preferences-service;1'].
           getService(Ci.nsIPrefService).getBranch('gamefox.'),

  processPage: function(event)
  {
    var doc = GFlib.getDocument(event);
    if (!GFlib.onBoards(doc)) return false;

    doc.gamefox = {};

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

        // Page jumper
        if (GameFOX.prefs.getBoolPref('elements.aml.pagejumper'))
        {
          var pageJumperTop = doc.evaluate('//div[@class="pages"]', doc, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (pageJumperTop != null)
          {
            var pageMatches = pageJumperTop.textContent.match(/Page ([0-9]+) of ([0-9]+)/);
            if (pageMatches)
            {
              var currentPage = pageMatches[1] - 1;
              var lastPage = pageMatches[2] - 1;
              var query = GFutils.parseQueryString(doc.location.search);
              query = '/boards/myposts.php?' +
                 (query['board'] ? 'board=' + query['board'] + '&' : '') +
                 (query['topic'] ? 'topic=' + query['topic'] + '&' : '') +
                 (query['user'] ? 'user=' + query['user'] + '&' : '');

              var pageJumper = doc.createElement('div');
              pageJumper.className = 'pagejumper';

              var pageUL = doc.createElement('ul');
              var pageLI, pageA;
              for (var i = 0; i <= lastPage; i++)
              {
                pageLI = doc.createElement('li');
                if (i == 0)
                {
                  pageLI.className = 'first';
                  pageLI.appendChild(doc.createTextNode('Jump to Page: '));
                }
                if (i == currentPage)
                {
                  pageLI.appendChild(doc.createTextNode(i + 1));
                }
                else
                {
                  pageA = doc.createElement('a');
                  pageA.href = query + 'page=' + i;
                  pageA.appendChild(doc.createTextNode(i + 1));
                  pageLI.appendChild(pageA);
                }
                pageUL.appendChild(pageLI);
              }

              pageJumper.appendChild(pageUL);
              topicsTable.parentNode.parentNode.appendChild(pageJumper);
            }
          }
        }
      }
      else
      {
        // No topics
        rows = [];
      }

      var skipNext = false;

      // Topic row loop
      for (var i = 1; i < rows.length; i++)
      {
        // Last post link
        if (GameFOX.prefs.getBoolPref('elements.topics.lastpostlink'))
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

        // Label topics with messages after your last post
        if (GameFOX.prefs.getBoolPref('elements.aml.marknewposts'))
        {
          if (rows[i].cells[3].textContent != rows[i].cells[4].textContent)
          { // "last post" and "your last post" differ
            var span = doc.createElement('span');
                span.className = 'gamefox-new-posts';
                span.style.setProperty('font-weight', 'bold', null);
                span.appendChild(doc.createTextNode('(new)'));

            rows[i].cells[4].appendChild(doc.createTextNode(' '));
            rows[i].cells[4].appendChild(span);
          }
        }

        // Pagination
        if (GameFOX.prefs.getBoolPref('paging.auto'))
        {
          var pageHTML = GFutils.formatPagination(
              doc,
              rows[i].cells[1].getElementsByTagName('a')[0].href,
              Math.ceil(rows[i].cells[2].textContent), '');

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

        // for added page rows
        if (skipNext)
        {
          ++i;
          skipNext = false;
        }
      }
    }

    /* Posting and Preview (post.php) */
    else if (GFlib.onPage(doc, 'post'))
    {
      // Titles
      if (doc.getElementsByName('topictitle')[0]) // new topic
      {
        GFlib.setTitle(doc,
            doc.evaluate('//h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).
            singleNodeValue.textContent.trim(),
            'CT');
      }
      else if (doc.getElementsByName('message')[0]) // new post
      {
        GFlib.setTitle(doc,
            doc.getElementsByName('message')[0].
            parentNode.parentNode.getElementsByTagName('a')[0].textContent.trim(),
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
          GFutils.formatSig(null, null, doc);
      }
    }

    /* User Information (user.php) */
    else if (GFlib.onPage(doc, 'user'))
    {
      GFlib.setTitle(doc, doc.getElementsByTagName('td')[1].
            textContent.trim(), 'U');
    }

    /* Topic Lists */
    else if (GFlib.onPage(doc, 'topics'))
    {
      var userNav = doc.evaluate('//div[@class="board_nav"]//div[@class="user"]',
          doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      GFuserlist.loadGroups();

      var onTracked = GFlib.onPage(doc, 'tracked');

      // Title
      GFlib.setTitle(doc, doc.evaluate('//h1', doc, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
          textContent.trim(), 'T');

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

        // No status column
        var statusPref = GameFOX.prefs.getBoolPref('elements.nostatuscolumn');
        if (statusPref)
        {
          var col = topicsTable.getElementsByTagName('col')[0];
          col.parentNode.removeChild(col);
          rows[0].cells[0].style.display = 'none';
        }
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
        // No status column
        if (statusPref)
        {
          rows[i].cells[0].style.display = 'none';
          var statusType = rows[i].cells[0].getElementsByTagName('img')[0].src
              .match(/\/images\/default\/([^\.]+)\.gif/)[1];
          if (statusType != 'topic')
          {
            var statusSpan = doc.createElement('span');
            statusSpan.className = statusType + '-end';
            statusSpan.style.verticalAlign = 'middle';
            statusSpan.style.display = '-moz-inline-box';
            rows[i].cells[1].insertBefore(statusSpan, rows[i].cells[1].firstChild.nextSibling);
            statusSpan = doc.createElement('span');
            statusSpan.className = statusType + '-start';
            statusSpan.style.verticalAlign = 'middle';
            statusSpan.style.display = '-moz-inline-box';
            rows[i].cells[1].insertBefore(statusSpan, rows[i].cells[1].firstChild);
          }
        }

        // Last post link
        if (GameFOX.prefs.getBoolPref('elements.topics.lastpostlink'))
        {
          var lastPost = GFutils.getLastPost(rows[i].cells[3].textContent,
              onTracked ? '' : rows[i].cells[2].textContent);

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
              rows[i].cells[1].getElementsByTagName('a')[0].href,
              Math.ceil(rows[i].cells[3].textContent),
              onTracked ? '' : rows[i].cells[2].textContent);

          if (pageHTML) // this topic has multiple pages
          {
            if (GameFOX.prefs.getIntPref('paging.location') == 0)
            {
              var pageTR = doc.createElement('tr');
              pageTR.setAttribute('class', 'gamefox-pagelist');
              pageTR.style.display = 'table-row';

              var pageTD = doc.createElement('td');
              pageTD.setAttribute('colspan', statusPref ? '4' : '5');
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
        if (onTracked)
        {
          // Board linkification
          if (GameFOX.prefs.getBoolPref('elements.tracked.boardlink'))
          {
            rows[i].cells[2].innerHTML = '<a href="' + rows[i].cells[1].
              getElementsByTagName('a')[0].getAttribute('href').replace(
                  /message(?=\.)/, 'topic').replace(/(&topic=[0-9]+|\btopic=[0-9]+&)/, '') + '">' +
              rows[i].cells[2].textContent.trim() + '</a>';
          }
        }

        // gentopic.php
        else
        {
          // User highlighting
          var username = rows[i].getElementsByTagName('td')[2].textContent.trim();
          var hlinfo;

          if ((hlinfo = GFuserlist.searchUsername(username)) != false)
          {
            // list of groups
            if (GameFOX.prefs.getBoolPref('userlist.topics.showgroupnames') &&
                hlinfo[0].length)
            {
              var groupname = doc.createElement('span');
              groupname.className = GFuserlist.groupClassName;
              groupname.appendChild(doc.createTextNode('(' + hlinfo[0] + ')'));
              rows[i].cells[2].appendChild(doc.createTextNode(' '));
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
      var pageJumper = doc.evaluate('//div[@class="pagejumper"]', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      GFuserlist.loadGroups();

      var pagenum = doc.location.search.match(/\bpage=([0-9]+)/);
          pagenum = pagenum ? parseInt(pagenum[1]) : 0;
      var leftMsgData = GFutils.getMsgDataDisplay(doc);
      var onArchive = GFlib.onPage(doc, 'archive');
      var onDetail = GFlib.onPage(doc, 'detail');

      // Title
      GFlib.setTitle(doc,
          doc.evaluate(
              '//h1/following::h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE,
              null).singleNodeValue.textContent.trim(),
                'M' + (onDetail ? 'D' : ''),
                (pagenum ? (pagenum + 1) : null));

      // "Tag Topic" link
      if (GameFOX.prefs.getBoolPref('elements.tag.link'))
      {
        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(GFtags.tagTopicLink(doc));
      }

      // Double click
      doc.evaluate('//table[@class="message"]', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
        addEventListener('dblclick', GameFOX.msglistDblclick, false);

      // Message numbering and highlighting
      var tdResult = doc.evaluate('//table[@class="message"]/tbody/tr/td', doc, null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var td = [];
      for (var i = 0; i < tdResult.snapshotLength; i++)
        td[i] = tdResult.snapshotItem(i);

      var alternateColor = false;
      var msgnum = pagenum * GameFOX.prefs.getIntPref('msgsPerPage');
      var msgnumCond = !onDetail && GameFOX.prefs.getBoolPref('elements.msgnum');
      var msgnumStyle = GameFOX.prefs.getIntPref('elements.msgnum.style');

      var tcCond = !onDetail && GameFOX.prefs.getBoolPref('elements.marktc');
      var tcMarker = '\xA0' + GFutils.getString('elements.marktc.marker');
      var tc = tcCond ? doc.location.search.match(/\btc=([^&<>"]+)/) : null;
      if (tc)
        tc = tc[1].replace(/\+/g, ' ');

      var deletelinkCond = GameFOX.prefs.getBoolPref('elements.deletelink') && !onArchive;
      var loggedInUser = userNav.getElementsByTagName('a')[0].textContent;
      loggedInUser = loggedInUser.substr(0, loggedInUser.indexOf('(') - 1);

      for (var i = 0; i < td.length; i += 2)
      {
        // Message numbering
        ++msgnum;

        var msgnumString = '000'.substring(msgnum.toString().length) + msgnum;
        td[i].id = 'p' + msgnumString;

        if (msgnumCond)
        {
          switch (msgnumStyle)
          {
            case 1: // Reversed: #001 | message detail
              td[i].insertBefore(doc.createTextNode('#' + msgnumString),
                  td[i].getElementsByTagName('a')[1]);

              if (leftMsgData)
                td[i].insertBefore(doc.createElement('br'), td[i].
                    getElementsByTagName('a')[1])
              else if (!onArchive)
                td[i].insertBefore(doc.createTextNode(' | '), td[i].
                    getElementsByTagName('a')[1]);

              break;

            case 2: // Number only: #001
              if (onArchive)
                td[i].innerHTML += '<b>#' + msgnumString + '</b>';
              else
                td[i].getElementsByTagName('a')[1].innerHTML = '#' + msgnumString;
              break;

            case 3: // Mixed: message #001
              if (onArchive)
                td[i].innerHTML += '<b>message #' + msgnumString + '</b>';
              else
                td[i].getElementsByTagName('a')[1].innerHTML = 'message #' + msgnumString;
              break;

            default:
            case 0: // Original: message detail | #001
              if (leftMsgData)
              {
                if (!onArchive)
                  td[i].appendChild(doc.createElement('br'));
                td[i].appendChild(doc.createTextNode('#' + msgnumString));
              }
              else
                if (onArchive)
                  td[i].appendChild(doc.createTextNode('#' + msgnumString));
                else
                  td[i].appendChild(doc.createTextNode(' | #' + msgnumString));

              break;
          }
        }

        // Message highlighting
        var username = td[i].getElementsByTagName(onArchive ? 'b' : 'a')[0].textContent;

        var hlinfo, groupname;
        if ((hlinfo = GFuserlist.searchUsername(username)) != false)
        {
          // add group names after username
          if (GameFOX.prefs.getBoolPref('userlist.messages.showgroupnames') &&
              hlinfo[0].length)
          {
            groupname = doc.createElement('span');
            groupname.className = GFuserlist.groupClassName;
            groupname.appendChild(doc.createTextNode(hlinfo[0]));

            td[i].insertBefore(groupname,
                td[i].getElementsByTagName(onArchive ? 'b' : 'a')[0].nextSibling);

            td[i].insertBefore(doc.createTextNode('\n'), groupname);
            if (leftMsgData)
              td[i].insertBefore(doc.createElement('br'), groupname);
            else
              td[i].insertBefore(doc.createTextNode(' | '), groupname);
          }

          if (hlinfo[2] == 'highlight')
          {
            td[i].className += ' ' + GFuserlist.highlightClassName;
            td[i].style.setProperty('background-color', hlinfo[1], 'important');
          }
          else if (hlinfo[2] == 'collapse') // Collapse post
          {
            td[i + 1].style.setProperty('font-size', '0pt', 'important');
            td[i + 1].style.setProperty('display', 'none', 'important');

            var a = doc.createElement('a');
                a.setAttribute('href', '#');
                a.appendChild(doc.createTextNode('[Show]'));
                a.addEventListener('click', GFuserlist.showPost, false);

            if (leftMsgData)
              td[i].appendChild(doc.createElement('br'));
            else
              td[i].appendChild(doc.createTextNode(' | '));
            td[i].appendChild(a);
          }
          else if (hlinfo[2] == 'remove') // remove post
          {
            td[i].style.setProperty('display', 'none', 'important');
            td[i + 1].style.setProperty('display', 'none', 'important');
            if (leftMsgData)
              alternateColor = !alternateColor;
          }
        }

        // for removed posts
        if (alternateColor)
        {
          var tr = td[i].parentNode;
          if (/\beven\b/.test(tr.className))
            tr.className = tr.className.replace(/\beven\b/, '');
          else
            tr.className += ' even';
        }

        // Distinguish posts from the topic creator
        if (tcCond)
        {
          // TODO: Fix for newest first ordering
          if (msgnum == 1)
            tc = username;

          if (tc == username)
          {
            var span = doc.createElement('span');
                span.className = 'gamefox-tc-label';
                span.appendChild(doc.createTextNode(tcMarker));

            td[i].insertBefore(span,
                td[i].getElementsByTagName(onArchive ? 'b' : 'a')[0].nextSibling);
          }
        }

        // Add "delete" link
        if (deletelinkCond && msgnum != 1 && loggedInUser == username &&
            td[i + 1].textContent.trim() != '[This message was deleted at ' +
            'the request of the original poster]' &&
            td[i + 1].textContent.trim() != '[This message was deleted at ' +
            'the request of a moderator or administrator]')
        {
          var msgDetailLink = td[i].getElementsByTagName('a')[1];

          var a = doc.createElement('a');
          a.appendChild(doc.createTextNode('delete'));
          a.className = 'gamefox-delete-link';
          a.href = msgDetailLink.href;
          a.addEventListener('click', GFmessages.deletePost, false);

          td[i].insertBefore(a, msgDetailLink.nextSibling);
          var separator = leftMsgData ? doc.createElement('br') : doc.createTextNode(' | ');
          td[i].insertBefore(separator, msgDetailLink.nextSibling);
        }
      }

      doc.gamefox.tc = tc;
      doc.gamefox.msgnum = msgnum;
      if (pageJumper)
        doc.gamefox.pages = pageJumper.getElementsByTagName('li').length;
      else
        doc.gamefox.pages = 1;

      // Add TC to page links
      if (tc && pageJumper)
      {
        var tcParam = GFutils.tcParam(tc);
        var pageJumperTop = doc.evaluate('//div[@class="pages"]', userNav.parentNode,
            null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        var links = GFutils.mergeArray(pageJumperTop.getElementsByTagName('a'),
            pageJumper.getElementsByTagName('a'));
        for (var i = 0; i < links.length; i++)
        {
          if (links[i].search.indexOf('page') != -1)
            links[i].search += tcParam;
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
      if (doc.location.hash.length)
      {
        if (doc.location.hash == '#last-post')
          doc.location.hash = '#p' + msgnumString;
        else
          doc.location.hash = doc.location.hash;
      }
    }
  },

  msglistDblclick: function(event)
  {
    var dblclickHead = GameFOX.prefs.getIntPref('message.header.dblclick');
    var dblclickMsg  = GameFOX.prefs.getBoolPref('message.dblclick');

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

    if (dblclickHead != 0 && ((!leftMsgData && node.parentNode.className != 'even')
            || nodeClass.indexOf('author') != -1))
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
    var switcher = GameFOX.prefs.getIntPref((GFlib.onPage(event.target.ownerDocument, 'myposts') ?
        'myposts' : 'topic') + '.dblclick');
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
      node = node.parentNode; // topic row

      var cell = node.cells[GFlib.onPage(doc, 'myposts') ? 2 : 3];

      var lastPost = GFutils.getLastPost(cell.textContent,
          GFlib.onPage(doc, 'tracked') ? '' : node.cells[2].textContent);

      var uri = node.cells[1].getElementsByTagName('a')[0].href + lastPost[0] +
          (gotoLastPost ? '#p' + lastPost[1] : '');
      doc.location.href = uri;
    }
    catch (e) {}
  },

  showPages: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;
    var topicLink, msgsCell, tc;

    try
    {
      while (node.nodeName.toLowerCase() != 'td')
      {
        node = node.parentNode;
      }

      topicLink = node.parentNode.cells[1].getElementsByTagName('a')[0].getAttribute('href');

      msgsCell = node.parentNode.cells[GFlib.onPage(doc, 'myposts') ? 2 : 3];

      tc = GFlib.onPage(doc, 'tracked') || GFlib.onPage(doc, 'myposts') ? '' :
          GFutils.tcParam(node.parentNode.cells[2].firstChild.textContent.trim());
    }
    catch (e)
    {
      return;
    }

    var boardID  = topicLink.match(/\bboard=([0-9-]+)/)[1];
    var topicID  = topicLink.match(/\btopic=([0-9]+)/)[1];
    var numPages = Math.ceil(msgsCell.textContent/GameFOX.prefs.getIntPref('msgsPerPage'));
    var pageList = document.getElementById('gamefox-pages-menu');
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
        link.setAttribute('href', topicLink + (i ? '&page=' + i + tc : ''));
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
        pageList.removeChild(pageList.firstChild);

      for (i = 0; i < numPages; i++)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', i+1);
        item.setAttribute('oncommand', 'GFtags.open("' + boardID + ',' + topicID + ',' + i + ',' + tc + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) GFtags.open("' + boardID + ',' + topicID + ',' + i + ',' + tc + '", 0)');
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

  try
  {
    var lastversion = GameFOX.prefs.getCharPref('version');
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
      try { var oldSig = GFutils.getString('signature.body'); }
      catch (e) { var oldSig = false; }

      if (oldSig)
      {
        var sigs = eval(GFutils.getString('signature.serialized'));
        sigs[0]['body'] = oldSig;
        GFutils.setString('signature.serialized', sigs.toSource());
      }
    }

    // user highlighting groups
    if (versionComparator.compare('0.6.5', lastversion) > 0)
    {
      var groupAdded = false;

      try
      { var messages = GameFOX.prefs.getBoolPref('highlight.msgs') ? 'highlight' : 'nothing'; }
      catch (e) { var messages = null; }
      try
      { var topics = GameFOX.prefs.getBoolPref('highlight.topics') ? 'highlight' : 'nothing'; }
      catch (e) { var topics = null; }

      try
      { var groups1 = GameFOX.prefs.getCharPref('highlight.groups.1'); }
      catch (e) { var groups1 = null; }
      try
      { var groups2 = GameFOX.prefs.getCharPref('highlight.groups.2'); }
      catch (e) { var groups2 = null; }

      if (groups1)
      {
        try
        { var colors1 = GameFOX.prefs.getCharPref('highlight.colors.1'); }
        catch (e) { var colors1 = '#CCFFFF'; }

        GFuserlist.add('', colors1, groups1, messages, topics);
        groupAdded = true;
      }

      if (groups2)
      {
        try
        { var colors2 = GameFOX.prefs.getCharPref('highlight.colors.2'); }
        catch (e) { var colors2 = '#99CC66'; }

        try
        { var ignore = GameFOX.prefs.getBoolPref('highlight.ignore'); }
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
      if (GameFOX.prefs.getCharPref('quote.style') == 'gfcode_body')
        GameFOX.prefs.setCharPref('quote.style', 'gfcode');
    }

    if (lastversion == '') // first run
    {
      window.openDialog('chrome://gamefox/content/options.xul', 'GameFOX',
        'chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar', true);
    }

    if (version.indexOf('pre') != -1 && lastversion.indexOf('pre') == -1)
    {
      // new nightly install
      GFlib.newTab('chrome://gamefox/content/nightly.html', 0);
    }

    GameFOX.prefs.setCharPref('version', version);
  }

  GFcss.reload();
}

window.addEventListener('load', GameFOXLoader, false);
