/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2005, 2006, 2007, 2008, 2009
 * Abdullah A, Toad King, Andrianto Effendy, Brian Marshall, Michael Ryan
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

var GameFOX =
{
  processPage: function(event)
  {
    var doc = GFlib.getDocument(event);
    if (!GFlib.onGF(doc)) return false;

    // Disable style elements
    if (GFlib.prefs.getBoolPref('elements.stopads'))
    {
      var styles = doc.getElementsByTagName('style');
      for (var i = 0; i < styles.length; i++)
        styles[i].disabled = true;
    }

    // Add favorites
    if (GFlib.prefs.getBoolPref('elements.favorites'))
    {
      var searchForm = doc.getElementById('search');
      if (searchForm)
      {
        var favMenu = doc.createElement('select');
        favMenu.id = 'gamefox-favorites-menu';
        favMenu.addEventListener('mousedown', GFfavorites.selectFavorite, false);

        GFfavorites.populateFavorites(doc, favMenu);

        searchForm.parentNode.insertBefore(favMenu, searchForm.nextSibling);
      }
    }

    // Save logged-in account name
    GFlib.prefs.setCharPref('accounts.current', GFutils.getAccountName(doc));

    if (!GFlib.onBoards(doc)) return false;

    doc.gamefox = {};

    var boardWrap = doc.getElementById('board_wrap');

    // Apply classes to existing elements
    if (boardWrap)
    {
      var element = doc.evaluate('p/a[contains(@href, "usernote.php")]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element)
        element.parentNode.className += ' gamefox-usernote';

      element = doc.evaluate('div[@class="board"]/p/a[contains(@href, "ignorelist")]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element)
        element.parentNode.className += ' gamefox-ignorelist';
    }

    /* Index (index.php) */
    if (GFlib.onPage(doc, 'index'))
    {
      GFlib.setTitle(doc, 'Message Boards');

      // Get favorites
      if (boardWrap)
      {
        var i, query, favorites = [], favLinks = [];
        var favResult = doc.evaluate('div[@class="board"]/table/tbody/tr/td[1]/a',
            boardWrap, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (i = 0; i < favResult.snapshotLength; i++)
          favLinks[i] = favResult.snapshotItem(i);

        // skip MBA
        for (i = 1; i < favLinks.length; i++)
        {
          query = GFutils.parseQueryString(favLinks[i].search);
          if (query['board'])
            favorites.push({'id':query['board'], 'name':favLinks[i].textContent});
        }

        GFlib.prefs.setCharPref('favorites.serialized', favorites.toSource());
      }
    }

    /* Active Messages (myposts.php) */
    else if (GFlib.onPage(doc, 'myposts'))
    {
      var topicsTable = boardWrap ? doc.evaluate('div[@class="board"]/table',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue : null;
      var rows;

      if (topicsTable)
      {
        // Double click action
        topicsTable.addEventListener('dblclick', GameFOX.topicDblclick, false);

        // Topic rows
        rows = topicsTable.getElementsByTagName('tr');

        // Page jumper
        if (GFlib.prefs.getBoolPref('elements.aml.pagejumper'))
        {
          var pageJumperTop = doc.evaluate('div[@class="board_nav"]/div[@class="body"]/div[@class="pages"]',
              boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (pageJumperTop)
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
        if (GFlib.prefs.getBoolPref('elements.topics.lastpostlink'))
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
        if (GFlib.prefs.getBoolPref('elements.aml.marknewposts'))
        {
          // don't mark row as new if the last post link is visited
          var visited = false;
          var link = rows[i].cells[3].getElementsByTagName('a')[0];
          if (link)
          {
            var newLink = doc.createElement('a');
            // make sure our test link gets the same CSS applied to it
            newLink.href = 'about:blank'; // for :link rules
            rows[i].cells[3].appendChild(newLink);
            var newLinkStyle = doc.defaultView.getComputedStyle(newLink, null);

            var linkStyle = doc.defaultView.getComputedStyle(link, null);

            if (linkStyle.color != newLinkStyle.color)
              visited = true;
          }

          if (rows[i].cells[3].textContent != rows[i].cells[4].textContent
              && !visited)
          { // "last post" and "your last post" differ
            var span = doc.createElement('span');
                span.className = 'gamefox-new-posts';
                span.style.setProperty('font-weight', 'bold', null);
                span.title = 'New posts in this topic';
                span.appendChild(doc.createTextNode('(N)'));

            rows[i].cells[4].appendChild(doc.createTextNode(' '));
            rows[i].cells[4].appendChild(span);
          }
        }

        // Pagination
        if (GFlib.prefs.getBoolPref('paging.auto'))
        {
          var pageList = GameFOX.formatPagination(
              doc,
              rows[i].cells[1].getElementsByTagName('a')[0].href,
              Math.ceil(rows[i].cells[2].textContent), '');

          if (pageList) // multiple pages
          {
            var pageListParent;
            if (GFlib.prefs.getIntPref('paging.location') == 0)
            {
              pageListParent = doc.createElement('tr');
              pageListParent.setAttribute('class', 'gamefox-pagelist');
              pageListParent.style.display = 'table-row';
            }
            else
            {
              pageListParent = rows[i].cells[1];
            }

            pageListParent.appendChild(pageList);

            if (GFlib.prefs.getIntPref('paging.location') == 0)
            {
              rows[i].parentNode.insertBefore(pageListParent, rows[i].nextSibling);
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
      var topictitle = doc.getElementsByName('topictitle')[0];
      var message = doc.getElementsByName('message')[0];

      // Titles
      if (topictitle) // new topic
      {
        GFlib.setTitle(doc, GFutils.getBoardName(doc), 'CT');
      }
      else if (message) // new post
      {
        GFlib.setTitle(doc, message.parentNode.getElementsByTagName('a')[0]
            .textContent.GFtrim(), 'PM');
      }

      // Signature
      if (GFlib.prefs.getBoolPref('signature.applyeverywhere')
          && !/\b(Error|Preview|Posted)<\/h1><\/div>/.test(doc.documentElement.innerHTML))
      {
        message.value = GFsig.format(null, null, doc);
      }

      // HTML buttons
      if (GFquickpost.createHTMLButtonsPref())
      {
        message.setSelectionRange(0, 0);

        message.parentNode.insertBefore(GFquickpost.createHTMLButtons(doc), message);
        message.parentNode.insertBefore(doc.createElement('br'), message);
      }

      // Character count
      if (GFlib.prefs.getBoolPref('elements.charcounts'))
      {
        // title count
        if (topictitle)
        {
          var titlecount = doc.createElement('span');
              titlecount.id = 'gamefox-title-count';
          topictitle.parentNode.insertBefore(titlecount,
              topictitle.nextSibling);
          topictitle.parentNode.insertBefore(doc.createTextNode(' '),
              topictitle.nextSibling);

          GFmessages.updateTitleCount(doc);

          topictitle.addEventListener('input',
              GFmessages.delayedUpdateTitleCount, false);
          topictitle.form.addEventListener('reset',
              function(event) {setTimeout(GFmessages.updateTitleCount, 0, event)}, false);
        }

        // message count
        var msgcount = doc.createElement('span');
            msgcount.id = 'gamefox-message-count';
        var resetBtn = doc.getElementsByName('reset')[0];
            resetBtn.parentNode.appendChild(doc.createTextNode(' '));
            resetBtn.parentNode.appendChild(msgcount);

        GFmessages.updateMessageCount(doc);

        message.addEventListener('input',
            GFmessages.delayedUpdateMessageCount, false);
        message.form.addEventListener('reset',
            function(event) {setTimeout(GFmessages.updateMessageCount, 0, event)}, false);
      }

      // "Post Message" button
      if (GFlib.prefs.getBoolPref('elements.quickpost.button'))
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

      // GFCode whitespace control
      message.form.addEventListener('submit',
          GFquickpost.removeGFCodeWhitespaceListener, false);
    }

    /* User Information (user.php) */
    else if (GFlib.onPage(doc, 'user'))
    {
      var username = doc.getElementsByTagName('td')[1];
      if (username)
        GFlib.setTitle(doc, username.textContent.GFtrim(), 'U');
    }

    /* Topic Lists */
    else if (GFlib.onPage(doc, 'topics'))
    {
      var userNav = doc.evaluate('div[@class="board_nav"]/div[@class="body"]/div[@class="user"]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      GFuserlist.loadGroups();

      var onTracked = GFlib.onPage(doc, 'tracked');

      // Title
      GFlib.setTitle(doc, GFutils.getBoardName(doc), 'T');

      // Topic "QuickPost" link
      if (GFlib.prefs.getBoolPref('elements.quickpost.link')
          && doc.evaluate('a[contains(@href, "post.php")]', userNav,
            null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
      {
        var anchor = doc.createElement('a');
            anchor.setAttribute('id', 'gamefox-quickpost-link');
            anchor.setAttribute('href', '#');
            anchor.appendChild(doc.createTextNode(GFlib.prefs.
                  getCharPref('elements.quickpost.link.title')));
            anchor.addEventListener('click', GFquickpost.toggleVisibility, false);

        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(anchor);
      }

      var topicsTable = doc.evaluate('div[@class="board"]/table[@class="topics"]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var rows;

      if (topicsTable)
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
        // Status spans
        // TODO: maybe have pref for users who notice lag?
        var statusType = rows[i].cells[0].getElementsByTagName('img')[0].src
            .match(/\/images\/default\/([^\.]+)\.gif/)[1];
        if (statusType != 'topic')
        {
          var statusSpan = doc.createElement('span');
          statusSpan.className = statusType + '-end gamefox-status';
          rows[i].cells[1].insertBefore(statusSpan, rows[i].cells[1].firstChild.nextSibling);
          statusSpan = doc.createElement('span');
          statusSpan.className = statusType + '-start gamefox-status';
          rows[i].cells[1].insertBefore(statusSpan, rows[i].cells[1].firstChild);
        }

        // Last post link
        if (GFlib.prefs.getBoolPref('elements.topics.lastpostlink'))
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
        if (GFlib.prefs.getBoolPref('paging.auto'))
        {
          var pageList = GameFOX.formatPagination(
              doc,
              rows[i].cells[1].getElementsByTagName('a')[0].href,
              Math.ceil(rows[i].cells[3].textContent),
              onTracked ? '' : rows[i].cells[2].textContent);

          if (pageList) // multiple pages
          {
            var pageListParent;
            if (GFlib.prefs.getIntPref('paging.location') == 0)
            {
              pageListParent = doc.createElement('tr');
              pageListParent.setAttribute('class', 'gamefox-pagelist');
              pageListParent.style.display = 'table-row';
            }
            else
            {
              pageListParent = rows[i].cells[1];
            }

            pageListParent.appendChild(pageList);

            if (GFlib.prefs.getIntPref('paging.location') == 0)
            {
              rows[i].parentNode.insertBefore(pageListParent, rows[i].nextSibling);
              skipNext = true;
            }
          }
        }

        // tracked.php
        if (onTracked)
        {
          // Board linkification
          if (GFlib.prefs.getBoolPref('elements.tracked.boardlink'))
          {
            rows[i].cells[2].innerHTML = '<a href="' + rows[i].cells[1].
              getElementsByTagName('a')[0].getAttribute('href').replace(
                  /message(?=\.)/, 'topic').replace(/(&topic=[0-9]+|\btopic=[0-9]+&)/, '') + '">' +
              rows[i].cells[2].textContent.GFtrim() + '</a>';
          }
        }

        // gentopic.php
        else
        {
          // User highlighting
          var username = rows[i].getElementsByTagName('td')[2].textContent.GFtrim();
          var hlinfo;

          if ((hlinfo = GFuserlist.searchUsername(username)) != false)
          {
            // list of groups
            if (GFlib.prefs.getBoolPref('userlist.topics.showgroupnames') &&
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
      var userNav = doc.evaluate('div[@class="board_nav"]/div[@class="body"]/div[@class="user"]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var pageJumper = doc.evaluate('div[@class="pagejumper"]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (pageJumper)
      {
        var pageJumperItems = pageJumper.getElementsByTagName('li');
        doc.gamefox.pages = parseInt(pageJumperItems[pageJumperItems.length - 1].textContent);
      }
      else
      {
        doc.gamefox.pages = 1;
      }
      GFuserlist.loadGroups();

      var pagenum = doc.location.search.match(/\bpage=([0-9]+)/);
          pagenum = pagenum ? parseInt(pagenum[1]) : 0;
      var leftMsgData = GFutils.getMsgDataDisplay(doc);
      var onArchive = GFlib.onPage(doc, 'archive');
      var onDetail = GFlib.onPage(doc, 'detail');

      // Title
      GFlib.setTitle(doc, GFutils.getBoardWrapHeader(doc),
          'M' + (onDetail ? 'D' : ''),
          (pagenum ? (pagenum + 1) : null));

      // "Tag Topic" link
      if (GFlib.prefs.getBoolPref('elements.tag.link'))
      {
        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(GFtags.tagTopicLink(doc));
      }

      // Tracking
      var trackLink = doc.evaluate('a[contains(@href, "track")]', userNav,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (trackLink)
        trackLink.addEventListener('click', GFtracked.linkListener, false);

      // Double click
      var messageTable = doc.evaluate('div[@class="board"]/table[@class="message"]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      messageTable.addEventListener('dblclick', GameFOX.msglistDblclick, false);

      // Message numbering and highlighting
      var tdResult = doc.evaluate('tbody/tr/td', messageTable, null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var td = [];
      for (var i = 0; i < tdResult.snapshotLength; i++)
        td[i] = tdResult.snapshotItem(i);

      var alternateColor = false;
      var msgnum = pagenum * GFlib.prefs.getIntPref('msgsPerPage');
      var msgnumCond = !onDetail && GFlib.prefs.getBoolPref('elements.msgnum');
      var msgnumStyle = GFlib.prefs.getIntPref('elements.msgnum.style');

      var tcCond = !onDetail && GFlib.prefs.getBoolPref('elements.marktc');
      var tcMarker = '\xA0' + GFutils.getString('elements.marktc.marker');
      var tc = tcCond ? doc.location.search.match(/\btc=([^&<>"]+)/) : null;
      if (tc)
        tc = tc[1].replace(/\+/g, ' ');

      var deletelinkCond = GFlib.prefs.getBoolPref('elements.deletelink');
      var loggedInUser = userNav.getElementsByTagName('a')[0].textContent;
      loggedInUser = loggedInUser.substr(0, loggedInUser.indexOf('(') - 1);
      var topicOpen = !!doc.evaluate('a[contains(@href, "post.php")]', userNav,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var firstPostNum = GFlib.prefs.getIntPref('msgSortOrder') == 2 ?
          (doc.gamefox.pages - 1) * GFlib.prefs.getIntPref('msgsPerPage') + td.length / 2 : 1;
      var filterCond = GFlib.prefs.getBoolPref('elements.filterlink') && !onDetail;
      var quotelinkCond = GFlib.prefs.getBoolPref('elements.quotelink') &&
        topicOpen && GFlib.prefs.getBoolPref('elements.quickpost.form');

      for (var i = 0; i < td.length; i += 2)
      {
        ++msgnum;
        var msgnumString = '000'.substring(msgnum.toString().length) + msgnum;
        td[i].id = 'p' + msgnumString;

        var username = td[i].getElementsByTagName(onArchive ? 'b' : 'a')[0].textContent;

        // Topic creator
        // TODO: Fix for newest first ordering
        if (msgnum == 1 && GFlib.prefs.getIntPref('msgSortOrder') == 1)
          tc = username;

        // Element for GameFOX links
        var msgLinks = doc.createElement('span');
        msgLinks.className = 'gamefox-message-links';

        // Message highlighting
        var hlinfo, groupname;
        if ((hlinfo = GFuserlist.searchUsername(username, tc == username && !onDetail)) != false)
        {
          // add group names after username
          if (GFlib.prefs.getBoolPref('userlist.messages.showgroupnames') &&
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
                a.appendChild(doc.createTextNode('show'));
                a.addEventListener('click', GFuserlist.showPost, false);

            if (!onArchive || msgLinks.hasChildNodes())
              msgLinks.appendChild((leftMsgData && !msgLinks.hasChildNodes()) ?
                  doc.createElement('br') : doc.createTextNode(' | '));
            msgLinks.appendChild(a);
          }
          else if (hlinfo[2] == 'remove') // remove post
          {
            td[i].parentNode.className += ' gamefox-removed';
            td[i].parentNode.style.setProperty('display', 'none', null);
            if (leftMsgData)
              alternateColor = !alternateColor;
            else
              td[i + 1].parentNode.style.setProperty('display', 'none', null);
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
        if (tcCond && tc == username)
        {
          var span = doc.createElement('span');
          span.className = 'gamefox-tc-label';
          span.appendChild(doc.createTextNode(tcMarker));

          td[i].insertBefore(span,
              td[i].getElementsByTagName(onArchive ? 'b' : 'a')[0].nextSibling);
        }

        // Add "delete" link
        if (loggedInUser == username && !onArchive &&
            ((msgnum == firstPostNum && topicOpen) || msgnum != firstPostNum) &&
            td[i + 1].textContent.GFtrim() != '[This message was deleted at ' +
            'the request of the original poster]' &&
            td[i + 1].textContent.GFtrim() != '[This message was deleted at ' +
            'the request of a moderator or administrator]')
        {
          var a = deletelinkCond ? doc.createElement('a') : null;
          if (msgnum == firstPostNum && (td.length > 2 || pagenum > 0))
          {
            td[i].setAttribute('gfdeletetype', 'close');
            deletelinkCond && a.appendChild(doc.createTextNode('close'));
          }
          else
          {
            if (msgnum == firstPostNum)
              td[i].setAttribute('gfdeletetype', 'deletetopic');
            else
              td[i].setAttribute('gfdeletetype', 'deletepost');
            deletelinkCond && a.appendChild(doc.createTextNode('delete'));
          }

          if (deletelinkCond)
          {
            a.className = 'gamefox-delete-link';
            a.href = td[i].getElementsByTagName('a')[1].href;
            a.addEventListener('click', GFmessages.deletePost, false);

            msgLinks.appendChild((leftMsgData && !msgLinks.hasChildNodes()) ?
                doc.createElement('br') : doc.createTextNode(' | '));
            msgLinks.appendChild(a);
          }
        }
        else
          td[i].setAttribute('gfdeletetype', 'none');

        // Filtering
        if (filterCond)
        {
          var a = doc.createElement('a');
          a.appendChild(doc.createTextNode('filter'));
          a.className = 'gamefox-filter-link';
          a.href = '#';
          a.addEventListener('click', GameFOX.toggleFilter, false);

          if (!onArchive || msgLinks.hasChildNodes())
            msgLinks.appendChild((leftMsgData && !msgLinks.hasChildNodes()) ?
                doc.createElement('br') : doc.createTextNode(' | '));
          msgLinks.appendChild(a);
        }

        // Quoting
        if (quotelinkCond)
        {
          var a = doc.createElement('a');
          a.appendChild(doc.createTextNode('quote'));
          a.className = 'gamefox-quote-link';
          a.href = '#';
          a.addEventListener('click', function(event){
              GFquote.quote(event, true); event.preventDefault();}, false);

          msgLinks.appendChild((leftMsgData && !msgLinks.hasChildNodes()) ?
              doc.createElement('br') : doc.createTextNode(' | '));
          msgLinks.appendChild(a);
        }

        // Append msgLinks
        td[i].appendChild(msgLinks);

        // Message numbering
        if (msgnumCond)
        {
          switch (msgnumStyle)
          {
            case 1: // Reversed: #001 | message detail
              if (onArchive)
                var element = msgLinks;
              else
                var element = td[i].getElementsByTagName('a')[1];

              td[i].insertBefore(doc.createTextNode('#' + msgnumString),
                  element);

              if (leftMsgData)
                td[i].insertBefore(doc.createElement('br'), element)
              else if (!onArchive || msgLinks.hasChildNodes())
                td[i].insertBefore(doc.createTextNode(' | '), element);

              break;

            case 2: // Number only: #001
              if (onArchive)
              {
                var numElement = doc.createElement(leftMsgData ? 'span' : 'b');
                numElement.appendChild(doc.createTextNode('#' + msgnumString));

                if (!msgLinks.hasChildNodes())
                  td[i].appendChild(numElement);
                else
                {
                  td[i].appendChild(leftMsgData ? doc.createElement('br') :
                      doc.createTextNode(' | '));
                  td[i].appendChild(numElement);
                }
              }
              else
                td[i].getElementsByTagName('a')[1].innerHTML = '#' + msgnumString;
              break;

            case 3: // Mixed: message #001
              if (onArchive)
              {
                var numElement = doc.createElement(leftMsgData ? 'span' : 'b');
                numElement.appendChild(doc.createTextNode('message #' + msgnumString));

                if (!msgLinks.hasChildNodes())
                  td[i].appendChild(numElement);
                else
                {
                  td[i].appendChild(leftMsgData ? doc.createElement('br') :
                      doc.createTextNode(' | '));
                  td[i].appendChild(numElement);
                }
              }
              else
                td[i].getElementsByTagName('a')[1].innerHTML = 'message #' + msgnumString;
              break;

            default:
            case 0: // Original: message detail | #001
              if (leftMsgData)
              {
                if (!onArchive || msgLinks.hasChildNodes())
                  td[i].appendChild(doc.createElement('br'));
                td[i].appendChild(doc.createTextNode('#' + msgnumString));
              }
              else
                if (onArchive && !msgLinks.hasChildNodes())
                  td[i].appendChild(doc.createTextNode('#' + msgnumString));
                else
                  td[i].appendChild(doc.createTextNode(' | #' + msgnumString));

              break;
          }
        }
      }

      doc.gamefox.tc = tc;
      doc.gamefox.msgnum = msgnum;

      // Add TC to page links
      if (tc && pageJumper)
      {
        var tcParam = GFutils.tcParam(tc);
        var pageJumperTop = doc.evaluate('div[@class="pages"]', userNav.parentNode,
            null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        var links = GFutils.mergeArray(pageJumperTop.getElementsByTagName('a'),
            pageJumper.getElementsByTagName('a'));
        for (var i = 0; i < links.length; i++)
        {
          if (links[i].search.indexOf('page') != -1)
            links[i].search += tcParam;
        }
      }

      // Board nav at the bottom of the page
      if (GFlib.prefs.getBoolPref('elements.boardnav') && !onDetail)
      {
        var miniBoardNav = doc.createElement('div');
        miniBoardNav.id = 'gamefox-board-nav';

        for (var i = 0; i <= 2; i++)
        {
          miniBoardNav.appendChild(userNav.getElementsByTagName('a')[i]
              .cloneNode(true));
          if (i < 2)
            miniBoardNav.appendChild(doc.createTextNode(' | '));
        }

        boardWrap.insertBefore(miniBoardNav, pageJumper);
      }

      // QuickPost
      if (GFlib.prefs.getBoolPref('elements.quickpost.form') && topicOpen)
      {
        var qpDiv = doc.createElement('div');
            qpDiv.id = 'gamefox-quickpost-normal';

        boardWrap.appendChild(qpDiv);
        GFquickpost.appendForm(doc, qpDiv, false);
      }

      // post ids are generated after the page is loaded
      // this is at the bottom because firefox 2 doesn't re-center the page after
      // QuickPost is added
      if (doc.location.hash.length)
      {
        if (doc.location.hash == '#last-post'
            || (doc.location.hash.substr(2) > msgnumString
              && /#p[0-9]{3}/.test(doc.location.hash)))
          doc.location.hash = '#p' + msgnumString;
        else
          doc.location.hash = doc.location.hash;
      }
    }
  },

  msglistDblclick: function(event)
  {
    var dblclickHead = GFlib.prefs.getIntPref('message.header.dblclick');
    var dblclickMsg = GFlib.prefs.getBoolPref('message.dblclick');

    if (dblclickHead == 0 && !dblclickMsg)
      return;

    var node = event.target;
    var doc = node.ownerDocument;

    // ignore double-click on images
    if (node.nodeName.toLowerCase() == 'img')
      return;

    var msgComponents = GFutils.getMsgComponents(node, doc);
    if (!msgComponents)
      return;

    if (msgComponents.header == msgComponents.original)
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
    var switcher = GFlib.prefs.getIntPref((GFlib.onPage(event.target.ownerDocument,
            'myposts') ? 'myposts' : 'topic') + '.dblclick');
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
        node = node.parentNode;
      node = node.parentNode; // topic row

      var cell = node.cells[GFlib.onPage(doc, 'myposts') ? 2 : 3];

      var lastPost = GFutils.getLastPost(cell.textContent,
          (GFlib.onPage(doc, 'tracked') || GFlib.onPage(doc, 'myposts')) ? ''
            : node.cells[2].firstChild.textContent);

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
    var topiclink, posts, tc, pageList;

    try
    {
      while (node.nodeName.toLowerCase() != 'td')
        node = node.parentNode;
      node = node.parentNode; // topic row

      topiclink = node.cells[1].getElementsByTagName('a')[0].href;
      posts = node.cells[GFlib.onPage(doc, 'myposts') ? 2 : 3].textContent;
      tc = GFlib.onPage(doc, 'tracked') || GFlib.onPage(doc, 'myposts') ? '' :
          node.cells[2].firstChild.textContent.GFtrim();
    }
    catch (e)
    {
      return;
    }

    if ('type' in event) // triggered from double-click event
    {
      var loc = GFlib.prefs.getIntPref('paging.location');
      node = node.cells[1];

      if (loc == 0)
      {
        if (node.parentNode.nextSibling
            && node.parentNode.nextSibling.className == 'gamefox-pagelist')
          pageList = node.parentNode.nextSibling;
      }
      else
      {
        pageList = doc.evaluate('span[@class="gamefox-pagelist"]',
            node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      }

      if (pageList)
      {
        pageList.style.display = pageList.style.display == 'none' ?
            (pageList.tagName.toLowerCase() == 'tr' ? 'table-row' : '') : 'none';
      }
      else
      {
        pageList = GameFOX.formatPagination(doc, topiclink, posts, tc);

        if (pageList) // multiple pages
        {
          var pageListParent;
          if (loc == 0)
          {
            pageListParent = doc.createElement('tr');
            pageListParent.setAttribute('class', 'gamefox-pagelist');
            pageListParent.style.display = 'table-row';
          }
          else
          {
            pageListParent = node;
          }

          pageListParent.appendChild(pageList);

          if (loc == 0)
            node.parentNode.parentNode.insertBefore(pageListParent, node.parentNode.nextSibling);
        }
      }
    }
    else // triggered from context menu
    {
      pageList = document.getElementById('gamefox-pages-menu');
      while (pageList.hasChildNodes())
        pageList.removeChild(pageList.firstChild);

      var boardID = topiclink.match(/\bboard=([0-9-]+)/)[1];
      var topicID = topiclink.match(/\btopic=([0-9]+)/)[1];
      var pages = Math.ceil(posts / GFlib.prefs.getIntPref('msgsPerPage'));
      var tcParam = GFutils.tcParam(tc);
      var item;
      for (var i = 0; i < pages; i++)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', i+1);
        item.setAttribute('oncommand', 'GFlib.open("' + boardID + ',' + topicID + ',' + i + ',' + tcParam + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) GFlib.open("' + boardID + ',' + topicID + ',' + i + ',' + tcParam + '", 0)');
        pageList.appendChild(item);
      }
    }
  },

  formatPagination: function(doc, topiclink, posts, tc)
  {
    var pages = Math.ceil(posts / GFlib.prefs.getIntPref('msgsPerPage'));
    if (pages == 1)
      return false;

    var loc = GFlib.prefs.getIntPref('paging.location');
    var prefix = GFutils.getString('paging.prefix');
    var sep = GFutils.getString('paging.separator');
    var suffix = GFutils.getString('paging.suffix');

    var prefixHTML = doc.createElement('span');
    if (loc == 2)
      prefixHTML.appendChild(doc.createElement('br'));
    prefixHTML.appendChild(doc.createTextNode(' ' + prefix.replace(/\s/g, '\xA0')));

    var suffixHTML = doc.createElement('span');
    suffixHTML.appendChild(doc.createTextNode(suffix.replace(/\s/g, '\xA0')));

    var pageHTML;
    if (loc == 0)
    {
      pageHTML = doc.createElement('td');
      pageHTML.setAttribute('colspan', '0');
    }
    else
    {
      pageHTML = doc.createElement('span');
      pageHTML.setAttribute('class', 'gamefox-pagelist');
    }

    pageHTML.appendChild(prefixHTML);

    var tcParam = GFutils.tcParam(tc);
    var a;
    for (var i = 0; i < pages; i++)
    {
      a = doc.createElement('a');
      a.href = topiclink + (i ? '&page=' + i + tcParam : '');
      a.appendChild(doc.createTextNode(i + 1));

      pageHTML.appendChild(a);

      if (i < pages - 1)
        pageHTML.appendChild(doc.createTextNode(sep));
    }

    pageHTML.appendChild(suffixHTML);

    return pageHTML;
  },

  toggleFilter: function(event, context)
  {
    context || event.preventDefault();

    var doc = GFlib.getDocument(event);
    var boardWrap = doc.getElementById('board_wrap');
    var tdResult = doc.evaluate('div[@class="board"]/table[@class="message"]/tbody/tr/td',
        boardWrap, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var td = [];
    for (var i = 0; i < tdResult.snapshotLength; i++)
      td[i] = tdResult.snapshotItem(i);
    var leftMsgData = GFutils.getMsgDataDisplay(doc);
    var userTagName = GFlib.onPage(doc, 'archive') ? 'b' : 'a';
    var newText;
    var newFocus;

    var msgComponents = GFutils.getMsgComponents(event.target, doc);
    if (!msgComponents)
      return;

    if (!doc.gamefox.filtered)
    {
      var username = msgComponents.header.
        getElementsByTagName(userTagName)[0].textContent;

      for (var i = 0; i < td.length; i += 2)
      {
        if (td[i].getElementsByTagName(userTagName)[0].textContent == username)
        {
          if (!newFocus)
            newFocus = td[i];
        }
        else
        {
          td[i].parentNode.style.display = 'none';
          if (!leftMsgData)
            td[i + 1].parentNode.style.display = 'none';
        }
      }

      newText = 'unfilter';
      doc.gamefox.filtered = true;
    }
    else
    {
      for (var i = 0; i < td.length; i += 2)
      {
        if (!/\bgamefox-removed\b/.test(td[i].parentNode.className))
        {
          td[i].parentNode.style.display = 'table-row';
          if (!leftMsgData)
            td[i + 1].parentNode.style.display = 'table-row';
        }
      }

      newText = 'filter';
      doc.gamefox.filtered = false;
    }

    var filterResult = doc.evaluate('.//a[@class="gamefox-filter-link"]',
        boardWrap, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < filterResult.snapshotLength; i++)
      filterResult.snapshotItem(i).textContent = newText;

    doc.defaultView.scrollTo(0, GFutils.getTopOffset(newFocus || msgComponents.header));
  },

  toggleSidebar: function()
  {
    if (typeof toggleSidebar == 'function')
    {
      toggleSidebar('viewGamefoxSidebar');
    }
    else
    {
      document.getElementById('gamefox-toggle-sidebar').removeAttribute('checked');
      GFlib.alert('This command does not work on your platform. If you are '
          + 'using SeaMonkey, try installing the xSidebar extension.');
    }
  },

  showFavs: function()
  {
    var favList, favs, item, i;

    favList = document.getElementById('gamefox-favorites-menu');
    if (!favList)
      return;

    while (favList.hasChildNodes())
      favList.removeChild(favList.firstChild);

    favs = eval(GFlib.prefs.getCharPref('favorites.serialized'));

    for (i = 0; i < favs.length; i++)
    {
      item = document.createElement('menuitem');
      item.setAttribute('label', favs[i].name);
      item.setAttribute('oncommand', 'GFlib.open("' + favs[i].id + '", 2)');
      item.setAttribute('onclick', 'if (event.button == 1) GFlib.open("' + favs[i].id + '", 0)');
      favList.appendChild(item);
    }
  }
};

function GameFOXLoader()
{
  window.removeEventListener('load', GameFOXLoader, false);
  document.getElementById('appcontent').addEventListener(
      'DOMContentLoaded', GameFOX.processPage, false);
  document.getElementById('contentAreaContextMenu').addEventListener(
      'popupshowing', GFcontext.displayMenu, false);

  var lastversion = GFlib.prefs.getCharPref('version');
  var version = GFlib.version;
  var versionComparator = Cc['@mozilla.org/xpcom/version-comparator;1'].
    getService(Ci.nsIVersionComparator);

  // upgrade, downgrade, first run, or dev version
  if (versionComparator.compare(version, lastversion) != 0 ||
      (version.indexOf('pre') != -1 && version.indexOf('pre') == version.length - 3))
  {
    GFcss.init();

    /* compatibility crap
     * TODO: remove these after a while */

    if (versionComparator.compare('0.6.6', lastversion) > 0)
    {
      if (GFlib.prefs.getCharPref('quote.style') == 'gfcode_body')
        GFlib.prefs.setCharPref('quote.style', 'gfcode');
    }

    if (versionComparator.compare('0.6.7', lastversion) > 0)
    {
      if (GFlib.prefs.getCharPref('quote.style') == 'custom')
        GFlib.prefs.setCharPref('quote.style', 'gfcode');
    }

    if (versionComparator.compare('0.6.8', lastversion) > 0)
    {
      var sigs = eval(GFutils.getString('signature.serialized'));
      // delimiter changed from ; to ,
      for (var i = 1; i < sigs.length; i++)
      {
        sigs[i]['accounts'] = sigs[i]['accounts'].replace(/;/g, ',');
        sigs[i]['boards'] = sigs[i]['boards']
          .replace(/(^|;)\s*life, the universe, and everything\s*($|;)/gi, '$1402$2')
          .replace(/;/g, ',');
      }
      GFutils.setString('signature.serialized', sigs.toSource());
    }

    if (versionComparator.compare('0.6.10', lastversion) > 0)
    {
      // first signature (1) -> sequential (2)
      // random {no | highest} specificity (2 | 3) -> random (1)
      GFlib.prefs.setIntPref('signature.selection', 1);
    }

    if (lastversion == '')
    {
      // first run
      window.setTimeout(GFlib.openOptionsDialog, 10, true);
    }

    if (version.indexOf('pre') != -1 && lastversion.indexOf('pre') == -1)
    {
      // new nightly install
      window.setTimeout(GFlib.newTab, 10,
          'chrome://gamefox/content/nightly.html', 0);
    }
    else if (version.indexOf('pre') != -1
        && version.indexOf('pre') != version.length - 3
        && GFlib.prefs.getBoolPref('nightlyChangeLog'))
    {
      // updated nightly install
      window.setTimeout(GFlib.newTab, 10,
          'http://beyondboredom.net/projects/gamefox/nightlychanges.php', 0);
    }
    else if (version.indexOf('pre') == -1 && lastversion != '')
    {
      // release notes for new stable release
      window.setTimeout(GFlib.newTab, 10,
          'http://beyondboredom.net/projects/gamefox/releasenotes/' + version +
              '.html', 0);
    }

    GFlib.prefs.setCharPref('version', version);
  }

  GFcss.reload();
  if (GFlib.isLoggedIn())
  {
    GFtracked.updateList();
  }
}

window.addEventListener('load', GameFOXLoader, false);
