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

var gamefox =
{
  processPage: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    if (!gamefox_lib.onGF(doc)) return false;

    // Disable style elements
    if (gamefox_lib.prefs.getBoolPref('elements.stopads'))
    {
      var styles = doc.getElementsByTagName('style');
      for (var i = 0; i < styles.length; i++)
        styles[i].disabled = true;
    }

    // Add favorites
    if (gamefox_lib.prefs.getBoolPref('elements.favorites'))
    {
      var searchForm = doc.getElementById('search');
      if (searchForm)
      {
        var favMenu = doc.createElement('select');
        favMenu.id = 'gamefox-favorites-menu';
        favMenu.addEventListener('mousedown', gamefox_favorites.selectFavorite, false);

        gamefox_favorites.populateFavorites(doc, favMenu);

        searchForm.parentNode.insertBefore(favMenu, searchForm.nextSibling);
      }
    }

    // Save logged-in account name
    var loggedIn = gamefox_lib.isLoggedIn();
    var accountName = gamefox_utils.getAccountName(doc);
    if (loggedIn && accountName)
      gamefox_lib.prefs.setCharPref('accounts.current', accountName);
    else if (!loggedIn)
      gamefox_lib.prefs.setCharPref('accounts.current', '');

    if (!gamefox_lib.onBoards(doc)) return false;

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

    /* sigquote.php */
    if (gamefox_lib.onPage(doc, 'sigquote'))
    {
      var button = doc.createElement('input');
      button.type = 'button';
      button.value = 'Update GameFOX Signature';
      button.addEventListener('click', gamefox_sig.updateFromGameFAQs, false);

      var element = doc.getElementById('add').getElementsByTagName('input')[1]
        .parentNode;
      element.appendChild(doc.createTextNode(' '));
      element.appendChild(button);
    }

    /* Index (index.php) */
    else if (gamefox_lib.onPage(doc, 'index'))
    {
      gamefox_lib.setTitle(doc, 'Message Boards');

      // Get favorites
      if (gamefox_lib.prefs.getBoolPref('favorites.enabled') && boardWrap)
      {
        var i, query, favorites = [], favLinks = [];
        var favResult = doc.evaluate('div[@class="board"]/table/tbody/tr/td[1]/a',
            boardWrap, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (i = 0; i < favResult.snapshotLength; i++)
          favLinks[i] = favResult.snapshotItem(i);

        // skip MBA
        for (i = 1; i < favLinks.length; i++)
        {
          query = gamefox_utils.parseQueryString(favLinks[i].search);
          if (query['board'])
            favorites.push({'id':query['board'], 'name':favLinks[i].textContent});
        }

        gamefox_lib.prefs.setCharPref('favorites.serialized', favorites.toSource());
      }
    }

    /* Active Messages (myposts.php) */
    else if (gamefox_lib.onPage(doc, 'myposts'))
    {
      var topicsTable = boardWrap ? doc.evaluate('div[@class="board"]/table',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue : null;
      var rows;

      if (topicsTable)
      {
        // Double click action
        topicsTable.addEventListener('dblclick', gamefox.topicDblclick, false);

        // Topic rows
        rows = topicsTable.getElementsByTagName('tr');

        // Page jumper
        if (gamefox_lib.prefs.getBoolPref('elements.aml.pagejumper'))
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
              var query = gamefox_utils.parseQueryString(doc.location.search);
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
        if (gamefox_lib.prefs.getBoolPref('elements.topics.lastpostlink'))
        {
          var lastPost = gamefox_utils.getLastPost(rows[i].cells[2].textContent);

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
        if (gamefox_lib.prefs.getBoolPref('elements.aml.marknewposts'))
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
        if (gamefox_lib.prefs.getBoolPref('paging.auto'))
        {
          var pageList = gamefox.formatPagination(
              doc,
              rows[i].cells[1].getElementsByTagName('a')[0].href,
              Math.ceil(rows[i].cells[2].textContent), '');

          if (pageList) // multiple pages
          {
            var pageListParent;
            if (gamefox_lib.prefs.getIntPref('paging.location') == 0)
            {
              pageListParent = doc.createElement('tr');
              pageListParent.setAttribute('class', 'gamefox-pagelist');
            }
            else
            {
              pageListParent = rows[i].cells[1];
            }

            pageListParent.appendChild(pageList);

            if (gamefox_lib.prefs.getIntPref('paging.location') == 0)
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
    else if (gamefox_lib.onPage(doc, 'post'))
    {
      var topictitle = doc.getElementsByName('topictitle')[0];
      var message = doc.getElementsByName('message')[0];

      // Titles
      if (topictitle) // new topic
      {
        gamefox_lib.setTitle(doc, gamefox_utils.getBoardName(doc), 'CT');
      }
      else if (message) // new post
      {
        gamefox_lib.setTitle(doc, message.parentNode.getElementsByTagName('a')[0]
            .textContent.gamefox_trim(), 'PM');
      }

      // Signature
      if (gamefox_lib.prefs.getBoolPref('signature.applyeverywhere')
          && !/\b(Error|Preview|Posted)<\/h1><\/div>/.test(doc.documentElement.innerHTML))
      {
        message.value = gamefox_sig.format(null, null, doc);
      }

      message.setSelectionRange(0, 0);

      // HTML buttons
      if (gamefox_quickpost.createHTMLButtonsPref())
      {
        message.parentNode.insertBefore(gamefox_quickpost.createHTMLButtons(doc), message);
        message.parentNode.insertBefore(doc.createElement('br'), message);
      }

      // Character count
      if (gamefox_lib.prefs.getBoolPref('elements.charcounts'))
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

          gamefox_messages.updateTitleCount(doc);

          topictitle.addEventListener('input',
              gamefox_messages.delayedUpdateTitleCount, false);
          topictitle.form.addEventListener('reset',
              function(event) {setTimeout(gamefox_messages.updateTitleCount, 0, event)}, false);
        }

        // message count
        var msgcount = doc.createElement('span');
            msgcount.id = 'gamefox-message-count';
        var resetBtn = doc.getElementsByName('reset')[0];
            resetBtn.parentNode.appendChild(doc.createTextNode(' '));
            resetBtn.parentNode.appendChild(msgcount);

        gamefox_messages.updateMessageCount(doc);

        message.addEventListener('input',
            gamefox_messages.delayedUpdateMessageCount, false);
        message.form.addEventListener('reset',
            function(event) {setTimeout(gamefox_messages.updateMessageCount, 0, event)}, false);
      }

      // "Post Message" button
      if (gamefox_lib.prefs.getBoolPref('elements.quickpost.button'))
      {
        var button = doc.createElement('input');
            button.setAttribute('id', 'gamefox-quickpost-btn');
            button.setAttribute('type', 'button');
            button.setAttribute('value', 'Post Message');
            button.addEventListener('click', gamefox_quickpost.post, false);

        var refChild = doc.getElementsByName('post');
            refChild = (refChild[0].getAttribute('value') == 'Post Message' ?
                refChild[1] : refChild[0]);
            refChild.parentNode.insertBefore(button, refChild);
            refChild.parentNode.insertBefore(doc.createTextNode(' '), refChild);
      }

      // GFCode whitespace control
      message.form.addEventListener('submit',
          gamefox_quickpost.removeGFCodeWhitespaceListener, false);
    }

    /* User Information (user.php) */
    else if (gamefox_lib.onPage(doc, 'user'))
    {
      var username = doc.getElementsByTagName('td')[1];
      if (username)
        gamefox_lib.setTitle(doc, username.textContent.gamefox_trim(), 'U');
    }

    /* Topic Lists */
    else if (gamefox_lib.onPage(doc, 'topics'))
    {
      var userNav = doc.evaluate('div[@class="board_nav"]/div[@class="body"]/div[@class="user"]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      gamefox_highlighting.loadGroups();

      var onTracked = gamefox_lib.onPage(doc, 'tracked');

      // Title
      gamefox_lib.setTitle(doc, gamefox_utils.getBoardName(doc), 'T');

      // Topic "QuickPost" link
      if (gamefox_lib.prefs.getBoolPref('elements.quickpost.link')
          && doc.evaluate('a[contains(@href, "post.php")]', userNav,
            null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
      {
        var anchor = doc.createElement('a');
            anchor.setAttribute('id', 'gamefox-quickpost-link');
            anchor.setAttribute('href', '#');
            anchor.appendChild(doc.createTextNode(gamefox_lib.prefs.
                  getCharPref('elements.quickpost.link.title')));
            anchor.addEventListener('click', gamefox_quickpost.toggleVisibility, false);

        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(anchor);
      }

      var topicsTable = doc.evaluate('div[@class="board"]/table[@class="topics"]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var rows;

      if (topicsTable)
      {
        // Double click action
        topicsTable.addEventListener('dblclick', gamefox.topicDblclick, false);

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
      var statusCond = gamefox_lib.prefs.getBoolPref('elements.statusspans');

      // Topic row loop
      for (var i = 1; i < rows.length; i++)
      {
        // Status spans
        if (statusCond)
        {
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
        }

        // Last post link
        if (gamefox_lib.prefs.getBoolPref('elements.topics.lastpostlink'))
        {
          var lastPost = gamefox_utils.getLastPost(rows[i].cells[3].textContent,
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
        if (gamefox_lib.prefs.getBoolPref('paging.auto'))
        {
          var pageList = gamefox.formatPagination(
              doc,
              rows[i].cells[1].getElementsByTagName('a')[0].href,
              Math.ceil(rows[i].cells[3].textContent),
              onTracked ? '' : rows[i].cells[2].textContent);

          if (pageList) // multiple pages
          {
            var pageListParent;
            if (gamefox_lib.prefs.getIntPref('paging.location') == 0)
            {
              pageListParent = doc.createElement('tr');
              pageListParent.setAttribute('class', 'gamefox-pagelist');
            }
            else
            {
              pageListParent = rows[i].cells[1];
            }

            pageListParent.appendChild(pageList);

            if (gamefox_lib.prefs.getIntPref('paging.location') == 0)
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
          if (gamefox_lib.prefs.getBoolPref('elements.tracked.boardlink'))
          {
            rows[i].cells[2].innerHTML = '<a href="' + rows[i].cells[1].
              getElementsByTagName('a')[0].getAttribute('href').replace(
                  /message(?=\.)/, 'topic').replace(/(&topic=[0-9]+|\btopic=[0-9]+&)/, '') + '">' +
              rows[i].cells[2].textContent.gamefox_trim() + '</a>';
          }
        }

        // gentopic.php
        else
        {
          // Highlighting
          var username = rows[i].getElementsByTagName('td')[2].textContent.gamefox_trim();
          var title = rows[i].getElementsByTagName('td')[1].textContent.gamefox_trim();
          var hlinfo;

          if ((hlinfo = gamefox_highlighting.searchTopic(username, title)) != false)
          {
            // list of groups
            if (gamefox_lib.prefs.getBoolPref('userlist.topics.showgroupnames') &&
                hlinfo[0].length)
            {
              var groupname = doc.createElement('span');
              groupname.className = gamefox_highlighting.groupClassName;
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
              rows[i].className += ' ' + gamefox_highlighting.highlightClassName;
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
    else if (gamefox_lib.onPage(doc, 'messages'))
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
      gamefox_highlighting.loadGroups();

      var pagenum = doc.location.search.match(/\bpage=([0-9]+)/);
          pagenum = pagenum ? parseInt(pagenum[1]) : 0;
      var leftMsgData = gamefox_utils.getMsgDataDisplay(doc);
      var onArchive = gamefox_lib.onPage(doc, 'archive');
      var onDetail = gamefox_lib.onPage(doc, 'detail');

      // Title
      gamefox_lib.setTitle(doc, gamefox_utils.getBoardWrapHeader(doc),
          'M' + (onDetail ? 'D' : ''),
          (pagenum ? (pagenum + 1) : null));

      // "Tag Topic" link
      if (gamefox_lib.prefs.getBoolPref('elements.tag.link'))
      {
        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(gamefox_tags.tagTopicLink(doc));
      }

      // Tracking
      if (gamefox_lib.prefs.getBoolPref('tracked.enabled'))
      {
        var trackLink = doc.evaluate('a[contains(@href, "track")]', userNav,
            null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (trackLink)
          trackLink.addEventListener('click', gamefox_tracked.linkListener, false);
      }

      // Double click
      var messageTable = doc.evaluate('div[@class="board"]/table[@class="message"]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      messageTable.addEventListener('dblclick', gamefox.msglistDblclick, false);

      // Message numbering and highlighting
      var tdResult = doc.evaluate('tbody/tr/td', messageTable, null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var td = [];
      for (var i = 0; i < tdResult.snapshotLength; i++)
        td[i] = tdResult.snapshotItem(i);

      var alternateColor = false;
      var msgnum = pagenum * gamefox_lib.prefs.getIntPref('msgsPerPage');
      var msgnumCond = !onDetail && gamefox_lib.prefs.getBoolPref('elements.msgnum');
      var msgnumStyle = gamefox_lib.prefs.getIntPref('elements.msgnum.style');

      var tcMarkerCond = !onDetail && gamefox_lib.prefs.getBoolPref('elements.marktc');
      var tcMarker = '\xA0' + gamefox_utils.getString('elements.marktc.marker');
      var tc = doc.location.search.match(/\btc=([^&<>"]+)/);
      if (tc)
        tc = tc[1].replace(/\+/g, ' ');

      var deletelinkCond = gamefox_lib.prefs.getBoolPref('elements.deletelink');
      var loggedInUser = userNav.getElementsByTagName('a')[0].textContent;
      loggedInUser = loggedInUser.substr(0, loggedInUser.indexOf('(') - 1);
      var topicOpen = !!doc.evaluate('a[contains(@href, "post.php")]', userNav,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var firstPostNum = gamefox_lib.prefs.getIntPref('msgSortOrder') == 2 ?
          (doc.gamefox.pages - 1) * gamefox_lib.prefs.getIntPref('msgsPerPage') + td.length / 2 : 1;
      var filterCond = gamefox_lib.prefs.getBoolPref('elements.filterlink') && !onDetail;
      var quotelinkCond = gamefox_lib.prefs.getBoolPref('elements.quotelink') &&
        topicOpen && gamefox_lib.prefs.getBoolPref('elements.quickpost.form');
      var sigCond = gamefox_lib.prefs.getBoolPref('elements.sigspans');

      for (var i = 0; i < td.length; i += 2)
      {
        ++msgnum;
        var msgnumString = '000'.substring(msgnum.toString().length) + msgnum;
        td[i].id = 'p' + msgnumString;

        var detailLink = td[i].getElementsByTagName('a')[1];
        var username = td[i].getElementsByTagName(onArchive ? 'b' : 'a')[0].textContent;
        var postBody = td[i + 1].textContent;

        // Topic creator
        // TODO: Fix for newest first ordering
        if (msgnum == 1 && gamefox_lib.prefs.getIntPref('msgSortOrder') == 1)
          tc = username;

        // Element for sigs
        if (sigCond)
        {
          var msgNode = td[i + 1], dividerIndex = -1, brCount = 0;
          for (var j = msgNode.childNodes.length - 1; j >= 0; j--)
          {
            var childNode = msgNode.childNodes[j];
            if (childNode.nodeName == '#text')
            {
              if (childNode.data.gamefox_trim() == '---')
                dividerIndex = j;
            }
            else if (childNode.nodeName == 'BR')
            {
              ++brCount;
            }
            else if (childNode.nodeType == Node.ELEMENT_NODE)
            {
              brCount += childNode.getElementsByTagName('br').length;
            }
            if (brCount > 2)
              break;
          }
          if (dividerIndex != -1)
          {
            var span = doc.createElement('span');
            span.className = 'gamefox-signature';
            while (dividerIndex < msgNode.childNodes.length)
              span.appendChild(msgNode.childNodes[dividerIndex]);
            msgNode.appendChild(span);
          }
        }

        // Title for detail link (useful with message-link-icons.css)
        if (detailLink)
          detailLink.title = 'Detail';

        // Element for GameFOX links
        var msgLinks = doc.createElement('span');
        msgLinks.className = 'gamefox-message-links';

        // Message highlighting
        var hlinfo, groupname;
        if ((hlinfo = gamefox_highlighting.searchPost(username, postBody,
                tc == username && !onDetail)) != false)
        {
          // add group names after username
          if (gamefox_lib.prefs.getBoolPref('userlist.messages.showgroupnames') &&
              hlinfo[0].length)
          {
            groupname = doc.createElement('span');
            groupname.className = gamefox_highlighting.groupClassName;
            groupname.appendChild(doc.createTextNode(hlinfo[0]));

            td[i].insertBefore(groupname,
                td[i].getElementsByTagName(onArchive ? 'b' : 'a')[0].nextSibling);

            if (leftMsgData)
              td[i].insertBefore(doc.createElement('br'), groupname);
            else
              td[i].insertBefore(doc.createTextNode(' | '), groupname);
          }

          if (hlinfo[2] == 'highlight')
          {
            td[i].className += ' ' + gamefox_highlighting.highlightClassName;
            td[i].style.setProperty('background-color', hlinfo[1], 'important');
          }
          else if (hlinfo[2] == 'collapse') // Collapse post
          {
            td[i + 1].style.setProperty('font-size', '0pt', 'important');
            td[i + 1].style.setProperty('display', 'none', 'important');

            var a = doc.createElement('a');
            a.appendChild(doc.createTextNode('show'));
            a.className = 'gamefox-show-post-link';
            a.href = '#';
            a.addEventListener('click', gamefox_highlighting.showPost, false);

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
        if (tcMarkerCond && tc == username)
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
            td[i + 1].textContent.gamefox_trim() != '[This message was deleted at ' +
            'the request of the original poster]' &&
            td[i + 1].textContent.gamefox_trim() != '[This message was deleted at ' +
            'the request of a moderator or administrator]')
        {
          var a = deletelinkCond ? doc.createElement('a') : null;
          if (msgnum == firstPostNum && (td.length > 2 || pagenum > 0))
          {
            td[i].setAttribute('gfdeletetype', 'close');

            if (deletelinkCond)
            {
              a.appendChild(doc.createTextNode('close'));
              a.title = 'Close';
            }
          }
          else
          {
            if (msgnum == firstPostNum)
              td[i].setAttribute('gfdeletetype', 'deletetopic');
            else
              td[i].setAttribute('gfdeletetype', 'deletepost');

            if (deletelinkCond)
            {
              a.appendChild(doc.createTextNode('delete'));
              a.title = 'Delete';
            }
          }

          if (deletelinkCond)
          {
            a.className = 'gamefox-delete-link';
            a.href = detailLink.href;
            a.addEventListener('click', gamefox_messages.deletePost, false);

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
          a.title = 'Filter';
          a.className = 'gamefox-filter-link';
          a.href = '#';
          a.addEventListener('click', gamefox.toggleFilter, false);

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
          a.title = 'Quote';
          a.className = 'gamefox-quote-link';
          a.href = '#';
          a.addEventListener('click', function(event){
              gamefox_quote.quote(event, true); event.preventDefault();}, false);

          msgLinks.appendChild((leftMsgData && !msgLinks.hasChildNodes()) ?
              doc.createElement('br') : doc.createTextNode(' | '));
          msgLinks.appendChild(a);
        }

        // Append msgLinks
        if (detailLink)
          td[i].insertBefore(msgLinks, detailLink.nextSibling);
        else
          td[i].appendChild(msgLinks);

        // Message numbering
        if (msgnumCond)
        {
          switch (msgnumStyle)
          {
            case 1: // #001 | [message detail]
              var element = onArchive ? msgLinks : detailLink;

              td[i].insertBefore(doc.createTextNode('#' + msgnumString),
                  element);

              if (leftMsgData)
                td[i].insertBefore(doc.createElement('br'), element)
              else if (!onArchive || msgLinks.hasChildNodes())
                td[i].insertBefore(doc.createTextNode(' | '), element);

              break;

            case 2: // [#001]
              if (onArchive)
              {
                var numElement = doc.createElement(leftMsgData ? 'span' : 'b');
                numElement.appendChild(doc.createTextNode('#' + msgnumString));

                td[i].insertBefore(numElement, msgLinks);
                if (msgLinks.hasChildNodes())
                  td[i].insertBefore(leftMsgData ? doc.createElement('br') :
                      doc.createTextNode(' | '), msgLinks);
              }
              else
              {
                detailLink.className = 'gamefox-message-detail-number';
                detailLink.innerHTML = '#' + msgnumString;
              }
              break;

            case 3: // [message #001]
              if (onArchive)
              {
                var numElement = doc.createElement(leftMsgData ? 'span' : 'b');
                numElement.appendChild(doc.createTextNode('message #' + msgnumString));

                td[i].insertBefore(numElement, msgLinks);
                if (msgLinks.hasChildNodes())
                  td[i].insertBefore(leftMsgData ? doc.createElement('br') :
                      doc.createTextNode(' | '), msgLinks);
              }
              else
              {
                detailLink.className = 'gamefox-message-detail-number';
                detailLink.innerHTML = 'message #' + msgnumString;
              }
              break;

            default:
            case 0: // [message detail] | #001
              if (leftMsgData)
              {
                if (!onArchive || msgLinks.hasChildNodes())
                  td[i].appendChild(doc.createElement('br'));
                td[i].appendChild(doc.createTextNode('#' + msgnumString));
              }
              else if (onArchive && !msgLinks.hasChildNodes())
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
      if (pageJumper)
      {
        var tcParam = gamefox_utils.tcParam(tc);
        if (tcParam)
        {
          var pageJumperTop = doc.evaluate('div[@class="pages"]', userNav.parentNode,
              null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          var links = gamefox_utils.mergeArray(
              pageJumperTop ? pageJumperTop.getElementsByTagName('a') : [],
              pageJumper.getElementsByTagName('a'));
          for (var i = 0; i < links.length; i++)
          {
            if (links[i].search.indexOf('page') != -1)
              links[i].search += tcParam;
          }
        }
      }

      // Board nav at the bottom of the page
      if (gamefox_lib.prefs.getBoolPref('elements.boardnav') && !onDetail)
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
      if (gamefox_lib.prefs.getBoolPref('elements.quickpost.form') && topicOpen)
      {
        var qpDiv = doc.createElement('div');
            qpDiv.id = 'gamefox-quickpost-normal';

        boardWrap.appendChild(qpDiv);
        gamefox_quickpost.appendForm(doc, qpDiv, false);
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
    var dblclickHead = gamefox_lib.prefs.getIntPref('message.header.dblclick');
    var dblclickMsg = gamefox_lib.prefs.getBoolPref('message.dblclick');

    if (dblclickHead == 0 && !dblclickMsg)
      return;

    var node = event.target;
    var doc = node.ownerDocument;

    // ignore double-click on images
    if (node.nodeName.toLowerCase() == 'img')
      return;

    var msgComponents = gamefox_utils.getMsgComponents(node, doc);
    if (!msgComponents)
      return;

    if (msgComponents.header == msgComponents.original)
    {
      switch (dblclickHead)
      {
        case 1:
          if (!gamefox_lib.onPage(doc, 'archive'))
            gamefox_quickwhois.quickWhois(event);
          break;
        case 2:
          gamefox_quote.quote(event);
          break;
        case 3:
          gamefox.toggleFilter(event);
          break;
      }
    }
    else if (dblclickMsg)
    {
      gamefox_quote.quote(event);
    }
  },

  topicDblclick: function(event)
  {
    var switcher = gamefox_lib.prefs.getIntPref((gamefox_lib.onPage(event.target.ownerDocument,
            'myposts') ? 'myposts' : 'topic') + '.dblclick');
    switch (switcher)
    {
      case 1:
        gamefox.showPages(event);
        break;
      case 2:
        gamefox.gotoLastPage(event, true); // last post
        break;
      case 3:
        gamefox_tags.add(event);
        break;
      case 4:
        gamefox.gotoLastPage(event);
        break;
      case 5:
        gamefox_tracked.addFromContextMenu(event);
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

      var cell = node.cells[gamefox_lib.onPage(doc, 'myposts') ? 2 : 3];

      var lastPost = gamefox_utils.getLastPost(cell.textContent,
          (gamefox_lib.onPage(doc, 'tracked') || gamefox_lib.onPage(doc, 'myposts')) ? ''
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
      posts = node.cells[gamefox_lib.onPage(doc, 'myposts') ? 2 : 3].textContent;
      tc = gamefox_lib.onPage(doc, 'tracked') || gamefox_lib.onPage(doc, 'myposts') ? '' :
          node.cells[2].firstChild.textContent.gamefox_trim();
    }
    catch (e)
    {
      return;
    }

    if ('type' in event) // triggered from double-click event
    {
      var loc = gamefox_lib.prefs.getIntPref('paging.location');
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
        pageList.style.display = pageList.style.display == 'none' ? '' : 'none';
      }
      else
      {
        pageList = gamefox.formatPagination(doc, topiclink, posts, tc);

        if (pageList) // multiple pages
        {
          var pageListParent;
          if (loc == 0)
          {
            pageListParent = doc.createElement('tr');
            pageListParent.setAttribute('class', 'gamefox-pagelist');
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
      var pages = Math.ceil(posts / gamefox_lib.prefs.getIntPref('msgsPerPage'));
      var tcParam = gamefox_utils.tcParam(tc);
      var item;
      for (var i = 0; i < pages; i++)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', i+1);
        item.setAttribute('oncommand', 'gamefox_lib.open("' + boardID + ',' + topicID + ',' + i + ',' + tcParam + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) gamefox_lib.open("' + boardID + ',' + topicID + ',' + i + ',' + tcParam + '", 0)');
        pageList.appendChild(item);
      }
    }
  },

  formatPagination: function(doc, topiclink, posts, tc)
  {
    var pages = Math.ceil(posts / gamefox_lib.prefs.getIntPref('msgsPerPage'));
    if (pages == 1)
      return false;

    var loc = gamefox_lib.prefs.getIntPref('paging.location');
    var prefix = gamefox_utils.getString('paging.prefix');
    var sep = gamefox_utils.getString('paging.separator');
    var suffix = gamefox_utils.getString('paging.suffix');

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

    var tcParam = gamefox_utils.tcParam(tc);
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

    var doc = gamefox_lib.getDocument(event);
    var boardWrap = doc.getElementById('board_wrap');
    var tdResult = doc.evaluate('div[@class="board"]/table[@class="message"]/tbody/tr/td',
        boardWrap, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var td = [];
    for (var i = 0; i < tdResult.snapshotLength; i++)
      td[i] = tdResult.snapshotItem(i);
    var leftMsgData = gamefox_utils.getMsgDataDisplay(doc);
    var userTagName = gamefox_lib.onPage(doc, 'archive') ? 'b' : 'a';
    var newText;
    var newTitle;
    var newFocus;

    var msgComponents = gamefox_utils.getMsgComponents(event.target, doc);
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
      newTitle = 'Unfilter';
      doc.gamefox.filtered = true;
    }
    else
    {
      for (var i = 0; i < td.length; i += 2)
      {
        if (!/\bgamefox-removed\b/.test(td[i].parentNode.className))
        {
          td[i].parentNode.style.display = '';
          if (!leftMsgData)
            td[i + 1].parentNode.style.display = '';
        }
      }

      newText = 'filter';
      newTitle = 'Filter';
      doc.gamefox.filtered = false;
    }

    var filterResult = doc.evaluate('.//a[@class="gamefox-filter-link"]',
        boardWrap, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < filterResult.snapshotLength; i++)
    {
      filterResult.snapshotItem(i).textContent = newText;
      filterResult.snapshotItem(i).title = newTitle;
    }

    doc.defaultView.scrollTo(0, gamefox_utils.getTopOffset(newFocus || msgComponents.header));
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
      gamefox_lib.alert('This command does not work on your platform. If you are '
          + 'using SeaMonkey, try installing the xSidebar extension.');
    }
  }
};

function gamefox_loader()
{
  window.removeEventListener('load', gamefox_loader, false);
  document.getElementById('appcontent').addEventListener(
      'DOMContentLoaded', gamefox.processPage, false);
  document.getElementById('contentAreaContextMenu').addEventListener(
      'popupshowing', gamefox_context.displayMenu, false);

  var lastversion = gamefox_lib.prefs.getCharPref('version');
  var version = gamefox_lib.version;
  var versionComparator = Cc['@mozilla.org/xpcom/version-comparator;1'].
    getService(Ci.nsIVersionComparator);

  // upgrade, downgrade, first run, or dev version
  if (versionComparator.compare(version, lastversion) != 0 ||
      (version.indexOf('pre') != -1 && version.indexOf('pre') == version.length - 3))
  {
    gamefox_css.init();

    /* compatibility crap
     * TODO: remove these after a while */

    if (versionComparator.compare('0.6.6', lastversion) > 0)
    {
      if (gamefox_lib.prefs.getCharPref('quote.style') == 'gfcode_body')
        gamefox_lib.prefs.setCharPref('quote.style', 'gfcode');
    }

    if (versionComparator.compare('0.6.7', lastversion) > 0)
    {
      if (gamefox_lib.prefs.getCharPref('quote.style') == 'custom')
        gamefox_lib.prefs.setCharPref('quote.style', 'gfcode');
    }

    if (versionComparator.compare('0.6.8', lastversion) > 0)
    {
      var sigs = gamefox_lib.safeEval(gamefox_utils.getString('signature.serialized'));
      // delimiter changed from ; to ,
      for (var i = 1; i < sigs.length; i++)
      {
        sigs[i]['accounts'] = sigs[i]['accounts'].replace(/;/g, ',');
        sigs[i]['boards'] = sigs[i]['boards']
          .replace(/(^|;)\s*life, the universe, and everything\s*($|;)/gi, '$1402$2')
          .replace(/;/g, ',');
      }
      gamefox_utils.setString('signature.serialized', sigs.toSource());
    }

    if (versionComparator.compare('0.6.10', lastversion) > 0)
    {
      // first signature (1) -> sequential (2)
      // random {no | highest} specificity (2 | 3) -> random (1)
      gamefox_lib.prefs.setIntPref('signature.selection', 1);

      // new option for highlighting
      var userlist = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('userlist.serialized'));
      for (var i = 0; i < userlist.length; i++)
        if (!userlist[i].type)
          userlist[i].type = 'users';
      gamefox_lib.prefs.setCharPref('userlist.serialized', userlist.toSource());
    }

    if (lastversion == '')
    {
      // first run
      window.setTimeout(gamefox_lib.openOptionsDialog, 10, true);
    }

    if (version.indexOf('pre') != -1 && lastversion.indexOf('pre') == -1)
    {
      // new nightly install
      window.setTimeout(gamefox_lib.newTab, 10,
          'chrome://gamefox/content/nightly.html', 0);
    }
    else if (version.indexOf('pre') != -1
        && version.indexOf('pre') != version.length - 3
        && gamefox_lib.prefs.getBoolPref('nightlyChangeLog'))
    {
      // updated nightly install
      window.setTimeout(gamefox_lib.newTab, 10,
          'http://beyondboredom.net/projects/gamefox/nightlychanges.php', 0);
    }
    else if (version.indexOf('pre') == -1 && lastversion != '')
    {
      // release notes for new stable release
      window.setTimeout(gamefox_lib.newTab, 10,
          'http://beyondboredom.net/projects/gamefox/releasenotes/' + version +
              '.html', 0);
    }

    gamefox_lib.prefs.setCharPref('version', version);
  }

  gamefox_css.reload();
  if (!gamefox_lib.prefs.getBoolPref('tracked.enabled'))
  {
    gamefox_lib.prefs.clearUserPref('tracked.list');
    gamefox_lib.prefs.clearUserPref('tracked.rssUrl');
    gamefox_lib.prefs.clearUserPref('tracked.lastAccount');
  }
  else
  {
    if (gamefox_lib.isLoggedIn())
      gamefox_tracked.updateList();
  }
  if (!gamefox_lib.prefs.getBoolPref('favorites.enabled'))
  {
    gamefox_lib.prefs.clearUserPref('favorites.serialized');
  }
}

window.addEventListener('load', gamefox_loader, false);
