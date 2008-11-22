/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2005, 2006, 2007, 2008
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
  prefs: Cc['@mozilla.org/preferences-service;1'].
           getService(Ci.nsIPrefService).getBranch('gamefox.'),

  processPage: function(event)
  {
    var doc = GFlib.getDocument(event);
    if (!GFlib.onGF(doc)) return false;

    // Disable style elements
    if (GameFOX.prefs.getBoolPref('elements.stopads'))
    {
      var styles = doc.getElementsByTagName('style');
      for (var i = 0; i < styles.length; i++)
        styles[i].disabled = true;
    }

    // Add favorites
    if (GameFOX.prefs.getBoolPref('elements.favorites'))
    {
      var favorites = doc.createElement('select');
      favorites.id = 'gamefox-favorites-menu';
      favorites.addEventListener('mousedown', GFfavorites.selectFavorite, false);

      GFfavorites.populateFavorites(doc, favorites);

      doc.getElementById('search').parentNode.insertBefore(favorites,
          doc.getElementById('search').nextSibling);
    }

    if (!GFlib.onBoards(doc)) return false;

    doc.gamefox = {};

    // User notification
    var usernote = doc.evaluate('//div[@id="board_wrap"]/p/a[contains(@href, "usernote.php")]',
        doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (usernote)
      usernote.parentNode.className += ' gamefox-usernote';

    /* Index (index.php) */
    if (GFlib.onPage(doc, 'index'))
    {
      GFlib.setTitle(doc, 'Message Boards');

      // Get favorites
      if (1) // pref?
      {
        var i, query;
        var favorites = [];

        var favResult = doc.evaluate('//div[@class="board"]/table/tbody/tr/td[1]/a',
            doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        var favLinks = [];
        for (i = 0; i < favResult.snapshotLength; i++)
          favLinks[i] = favResult.snapshotItem(i);

        for (i = 1; i < favLinks.length; i++)
        {
          query = GFutils.parseQueryString(favLinks[i].search);
          if (query['board'])
          {
            favorites.push({'id':query['board'], 'name':favLinks[i].textContent});
          }
        }

        GameFOX.prefs.setCharPref('favorites.serialized', favorites.toSource());
      }
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
          var pageList = GameFOX.formatPagination(
              doc,
              rows[i].cells[1].getElementsByTagName('a')[0].href,
              Math.ceil(rows[i].cells[2].textContent), '');

          if (pageList) // multiple pages
          {
            var pageListParent;
            if (GameFOX.prefs.getIntPref('paging.location') == 0)
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

            if (GameFOX.prefs.getIntPref('paging.location') == 0)
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
      // Titles
      if (doc.getElementsByName('topictitle')[0]) // new topic
      {
        GFlib.setTitle(doc,
            doc.evaluate('//h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).
            singleNodeValue.textContent.GFtrim(),
            'CT');
      }
      else if (doc.getElementsByName('message')[0]) // new post
      {
        GFlib.setTitle(doc,
            doc.getElementsByName('message')[0].
            parentNode.parentNode.getElementsByTagName('a')[0].textContent.GFtrim(),
            'PM');
      }

      // HTML buttons
      if (GameFOX.prefs.getBoolPref('elements.quickpost.htmlbuttons'))
      {
        var message = doc.getElementsByName('message')[0];
        var buttons = doc.createElement('span');
        GFquickpost.appendHTMLButtons(doc, buttons);
        message.parentNode.insertBefore(buttons, message);
        
        message.setSelectionRange(0, 0);
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
            textContent.GFtrim(), 'U');
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
          textContent.GFtrim(), 'T');

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
          var pageList = GameFOX.formatPagination(
              doc,
              rows[i].cells[1].getElementsByTagName('a')[0].href,
              Math.ceil(rows[i].cells[3].textContent),
              onTracked ? '' : rows[i].cells[2].textContent);

          if (pageList) // multiple pages
          {
            var pageListParent;
            if (GameFOX.prefs.getIntPref('paging.location') == 0)
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

            if (GameFOX.prefs.getIntPref('paging.location') == 0)
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
          if (GameFOX.prefs.getBoolPref('elements.tracked.boardlink'))
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
      GFlib.setTitle(doc,
          doc.evaluate(
              '//h1/following::h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE,
              null).singleNodeValue.textContent.GFtrim(),
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
      var topicOpen = doc.evaluate('.//a[contains(@href, "post.php")]', userNav,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var firstPostNum = GameFOX.prefs.getIntPref('msgSortOrder') == 2 ?
          (doc.gamefox.pages - 1) * GameFOX.prefs.getIntPref('msgsPerPage') + td.length / 2 : 1;
      var filterCond = GameFOX.prefs.getBoolPref('elements.filterlink') && !onDetail;

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
        if (tcCond)
        {
          // TODO: Fix for newest first ordering
          if (msgnum == 1 && GameFOX.prefs.getIntPref('msgSortOrder') == 1)
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
        if (deletelinkCond && loggedInUser == username &&
            ((msgnum == firstPostNum && topicOpen) || msgnum != firstPostNum) &&
            td[i + 1].textContent.GFtrim() != '[This message was deleted at ' +
            'the request of the original poster]' &&
            td[i + 1].textContent.GFtrim() != '[This message was deleted at ' +
            'the request of a moderator or administrator]')
        {
          var msgDetailLink = td[i].getElementsByTagName('a')[1];

          var a = doc.createElement('a');
          if (msgnum == firstPostNum && td.length > 2)
            a.appendChild(doc.createTextNode('close'));
          else
            a.appendChild(doc.createTextNode('delete'));
          a.className = 'gamefox-delete-link';
          a.href = msgDetailLink.href;
          a.addEventListener('click', GFmessages.deletePost, false);

          td[i].insertBefore(a, msgDetailLink.nextSibling);
          td[i].insertBefore(leftMsgData ? doc.createElement('br') : doc.createTextNode(' | '),
              msgDetailLink.nextSibling);
        }

        // Filtering
        if (filterCond)
        {
          var a = doc.createElement('a');
          a.appendChild(doc.createTextNode('filter'));
          a.className = 'gamefox-filter-link';
          a.href = '#';
          a.addEventListener('click', GameFOX.toggleFilter, false);

          td[i].appendChild(leftMsgData ? doc.createElement('br') : doc.createTextNode(' | '));
          td[i].appendChild(a);
        }
      }

      doc.gamefox.tc = tc;
      doc.gamefox.msgnum = msgnum;

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
      if (GameFOX.prefs.getBoolPref('elements.quickpost.form') && topicOpen)
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
        node = node.parentNode;
      node = node.parentNode; // topic row

      var cell = node.cells[GFlib.onPage(doc, 'myposts') ? 2 : 3];

      var lastPost = GFutils.getLastPost(cell.textContent,
          GFlib.onPage(doc, 'tracked') ? '' : node.cells[2].firstChild.textContent);

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
      var loc = GameFOX.prefs.getIntPref('paging.location');
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
      var pages = Math.ceil(posts / GameFOX.prefs.getIntPref('msgsPerPage'));
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
    var pages = Math.ceil(posts / GameFOX.prefs.getIntPref('msgsPerPage'));
    if (pages == 1)
      return false;

    var loc = GameFOX.prefs.getIntPref('paging.location');
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

  toggleFilter: function(event)
  {
    event.preventDefault();

    var doc = GFlib.getDocument(event);
    var button = event.target;
    var tdResult = doc.evaluate('//table[@class="message"]/tbody/tr/td', doc, null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var td = [];
    for (var i = 0; i < tdResult.snapshotLength; i++)
      td[i] = tdResult.snapshotItem(i);
    var leftMsgData = GFutils.getMsgDataDisplay(doc);
    var userTagName = GFlib.onPage(doc, 'archive') ? 'b' : 'a';
    var newText;
    var newFocus;

    if (button.textContent == 'filter')
    {
      var username = button.parentNode.getElementsByTagName(userTagName)[0].textContent;

      for (var i = 0; i < td.length; i += 2)
      {
        if (td[i].getElementsByTagName(userTagName)[0].textContent == username)
        {
          if (!newFocus)
            newFocus = td[i];
          td[i].parentNode.style.removeProperty('display');
          td[i].parentNode.removeAttribute('style');
          if (!leftMsgData)
          {
            td[i + 1].parentNode.style.removeProperty('display');
            td[i + 1].parentNode.removeAttribute('style');
          }
        }
        else
        {
          td[i].parentNode.style.setProperty('display', 'none', null);
          if (!leftMsgData)
            td[i + 1].parentNode.style.setProperty('display', 'none', null);
        }
      }

      newText = 'unfilter';
    }
    else
    {
      for (var i = 0; i < td.length; i += 2)
      {
        if (!/\bgamefox-removed\b/.test(td[i].parentNode.className))
        {
          td[i].parentNode.style.removeProperty('display');
          td[i].parentNode.removeAttribute('style');
          if (!leftMsgData)
            td[i + 1].parentNode.style.removeProperty('display');
            td[i + 1].parentNode.removeAttribute('style');
        }
      }

      newText = 'filter';
    }

    var filterResult = doc.evaluate('//a[@class="gamefox-filter-link"]', doc, null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < filterResult.snapshotLength; i++)
      filterResult.snapshotItem(i).textContent = newText;

    doc.defaultView.scrollTo(0, GFutils.getTopOffset(newFocus ? newFocus : button.parentNode));
  },

  toggleSidebar: function()
  {
    toggleSidebar('viewGamefoxSidebar');
  },

  showFavs: function()
  {
    var favList, favs, item, i;

    favList = document.getElementById('gamefox-favorites-menu');
    if (!favList)
      return;

    while (favList.hasChildNodes())
      favList.removeChild(favList.firstChild);

    favs = eval(GameFOX.prefs.getCharPref('favorites.serialized'));

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

  // upgrade, downgrade, first run, or dev version
  if (versionComparator.compare(version, lastversion) != 0 || version.indexOf('pre') != -1)
  {
    GFcss.init();

    /* compatibility crap
     * TODO: remove these after a while */

    if (versionComparator.compare('0.6.6', lastversion) > 0)
    {
      if (GameFOX.prefs.getCharPref('quote.style') == 'gfcode_body')
        GameFOX.prefs.setCharPref('quote.style', 'gfcode');
    }

    if (versionComparator.compare('0.6.7', lastversion) > 0)
    {
      if (GameFOX.prefs.getCharPref('quote.style') == 'custom')
        GameFOX.prefs.setCharPref('quote.style', 'gfcode');
    }

    if (versionComparator.compare('0.6.8', lastversion) > 0)
    {
      var sigs = eval(GFutils.getString('signature.serialized'));
      // delimiter changed from ; to ,
      for (var i = 1; i < sigs.length; i++)
      {
        sigs[i]['accounts'] = sigs[i]['accounts'].replace(/;/g, ',');
        sigs[i]['boards'] = sigs[i]['boards'].replace(/;/g, ',');
      }
      GFutils.setString('signature.serialized', sigs.toSource());
    }

    if (lastversion == '') // first run
    {
      GFuserlist.add();
      window.openDialog('chrome://gamefox/content/options.xul', 'GameFOX',
        'chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar', true);
    }

    if (version.indexOf('pre') != -1 && lastversion.indexOf('pre') == -1)
    {
      // new nightly install
      window.setTimeout(function(){
          GFlib.newTab('chrome://gamefox/content/nightly.html', 0)}, 10);
    }
    else if (version.indexOf('pre') == -1 && lastversion != '')
    {
      // release notes for new stable release
      window.setTimeout(function(){
          GFlib.newTab('http://beyondboredom.net/projects/gamefox/releasenotes/'
            + version + '.html', 0)}, 10);
    }

    GameFOX.prefs.setCharPref('version', version);
  }

  GFcss.reload();
}

window.addEventListener('load', GameFOXLoader, false);
