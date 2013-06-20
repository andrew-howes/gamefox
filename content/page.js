/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012
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

var gamefox_page =
{
  onload: function(event)
  {
    try
    {
      gamefox_page.process(event);
    }
    catch(e)
    {
      // Don't show an error notification if the user has ignored errors for
      // this version. Using the version number for this may cause some errors
      // to never be seen, but it's a simpler system than keeping track of each
      // individual error in the prefs.
      if (gamefox_lib.prefs.getCharPref('ignoreErrorsVersion') == gamefox_lib
            .version)
        throw e;

      // Show an error notification
      var strbundle = document.getElementById('gamefox-overlay-strings');
      var notifyBox = gBrowser.getNotificationBox();
      var shortFileName = e.fileName.split('/').slice(4).join('/');
      var buttons = [
        { label: strbundle.getString('ignore'),
          accessKey: strbundle.getString('ignoreAK'),
          callback: function() {
            gamefox_lib.prefs.setCharPref('ignoreErrorsVersion', gamefox_lib
                .version);
          }
        }
      ];

      notifyBox.appendNotification(strbundle.getString('notifyError') + ' ' +
            e.name + ': ' + e.message + ' (' + shortFileName + ', ' +
            strbundle.getString('line') + ' ' + e.lineNumber + ')',
          'gamefox-error', null, notifyBox.PRIORITY_WARNING_HIGH, buttons);

      // For logging purposes, this exception should still bubble up to the
      // Error Console.
      throw e;
    }
  },

  process: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    if (!doc.body || !gamefox_lib.onGF(doc)) return false;

    // Disable ads
    if (gamefox_lib.prefs.getBoolPref('elements.stopads'))
    {
      // Style elements
      var styles = doc.body.getElementsByTagName('style');
      for (var i = 0; i < styles.length; i++)
        styles[i].disabled = true;

      // Skinned home page
      doc.body.className = '';

      // Poll of the Day
      var poll = doc.evaluate('//div[@class="body poll"]', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (poll)
      {
        if (poll.style.background.indexOf('promo') != -1)
        {
          poll.style.background = '';
          poll.removeChild(poll.firstChild);
        }

        if (poll.parentNode.getElementsByTagName('h2').length == 0)
        {
          var pollHead = doc.createElement('div');
          pollHead.className = 'head';

          var pollTitle = doc.createElement('h2');
          pollTitle.className = 'title';
          pollTitle.appendChild(doc.createTextNode('Poll of the Day'));
          pollHead.appendChild(pollTitle);

          poll.parentNode.insertBefore(pollHead, poll);
        }
      }
    }

    // Add favorites
    if (gamefox_lib.prefs.getBoolPref('elements.favorites'))
    {
      let div = doc.getElementById('mast_jump') || doc.getElementById('sys');
      if (div)                     /* V12 */                          /* V11 */
      {
        div.style.width = 'auto';

        let favMenu = doc.createElement('select');
        favMenu.id = 'gamefox-favorites-menu';
        favMenu.style.width = div.getElementsByTagName('select')[0]
          .offsetWidth + 'px';
        favMenu.addEventListener('mousedown', gamefox_favorites.selectFavorite,
            false);
        gamefox_favorites.populateFavorites(doc, favMenu);

        div.insertBefore(favMenu, div.firstChild);
      }
    }
	
    // Save logged-in account name /* fixed for V13 */
    var loggedIn = gamefox_lib.isLoggedIn();
    var accountName = gamefox_utils.getAccountName(doc);
    if (loggedIn && accountName)
      gamefox_lib.prefs.setCharPref('accounts.current', accountName);
    else if (!loggedIn)
      gamefox_lib.prefs.setCharPref('accounts.current', '');
	
    // Allow CSS to highlight the "New Messages" link /* fixed for V13 (and v12, etc) */
    var pmLink = doc.querySelector('.masthead_user a[href="/pm/"], ' + '#mast_user .nav a[href="/pm/"], ' +
        '#loginbox .nav a[href="/pm/"]'); // V12, V11
    if (pmLink && pmLink.textContent[5] != undefined)
      pmLink.id = 'gamefox-new-pm';
	
    // Private Messages /* fixed for V13 */
    if (gamefox_lib.inDir(doc, 'pm'))
      gamefox_page_pm.process(doc);

    if (!gamefox_lib.onBoards(doc)) return false;

    doc.gamefox = {
      _lastFocusedPostForm: null,

      get lastFocusedPostForm() {
        return this._lastFocusedPostForm;
      },

      set lastFocusedPostForm(val) {
        if (this._lastFocusedPostForm != val)
        {
          gamefox_quickpost.toggleAccessKeys(val.getElementsByTagName(
                'input'));

          if (this._lastFocusedPostForm)
            gamefox_quickpost.toggleAccessKeys(this._lastFocusedPostForm
                .getElementsByTagName('input'));

          this._lastFocusedPostForm = val;
        }
      }
    };

    gamefox_lib.useBeta = gamefox_lib.onBeta(doc);

    // Update last visit time
    gamefox_lib.prefs.setIntPref('lastVisit', Math.floor(Date.now() / 1000));

    // boardWrap has been moved, so some elements are no longer contained in it
    var contentDiv = doc.getElementById('content');

    if (!contentDiv) // This isn't a normal page
      return false;

    // TODO: myposts and some other pages are now missing this
    //   Admin says board_wrap is "depreciated", so we should use something else
    var boardWrap = contentDiv.getElementsByClassName('board_wrap')[0];

    // Apply classes to existing elements
    if (boardWrap)
    {
      var element = doc.evaluate('p/a[contains(@href, "usernote.php")]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element)
        element.parentNode.className += ' gamefox-usernote';

      element = doc.evaluate('div[@class="body"]/p/a[contains(@href, "ignorelist")]',
          boardWrap, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (element)
        element.parentNode.className += ' gamefox-ignorelist';
    }

    /* Index (index.php) and board lists (boardlist.php) */
    if (gamefox_lib.onPage(doc, 'index'))
    {
      gamefox_lib.setTitle(doc, 'Message Boards');

      // Get favorites
      if (!gamefox_lib.onPage(doc, 'boardlist') &&
          !doc.getElementsByClassName('crumbs').length && // no split lists
          gamefox_lib.prefs.getBoolPref('favorites.enabled') && boardWrap)
      {
        var i, boardId, favorites = {}, favLinks = [];
        var favResult = doc.evaluate('table[1]/tbody/tr/td[1]/a', boardWrap,
            null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (i = 0; i < favResult.snapshotLength; i++)
          favLinks[i] = favResult.snapshotItem(i);

        // skip MBA
        for (i = 1; i < favLinks.length; i++)
        {
          boardId = gamefox_utils.getBoardId(favLinks[i].pathname);
          if (boardId != 0)
            favorites[boardId] = {name:favLinks[i].textContent};
        }

        gamefox_lib.setString('favorites.serialized', JSON.stringify(favorites)
            );
      }

      // Date format board loop
      // TODO: merge this with favorites loop
      if (gamefox_date.enabled)
      {
        var rows = doc.getElementsByTagName('tr');

        for (var i = 1; i < rows.length; i++)
        {
          if (rows[i].cells[3])
          {
            var format = gamefox_date.getFormat('topic');
            rows[i].cells[3].textContent = gamefox_date.parseFormat(
                rows[i].cells[3].textContent, format);
          }
        }
      }
    }

    /* Board Manager (bman.php) */
    else if (gamefox_lib.onPage(doc, 'bman'))
    {
      var rows = doc.getElementsByTagName('tr');

      for (var i = 1; i < rows.length; i++)
      {
        if (rows[i].cells[3])
        {
          var format = gamefox_date.getFormat('topic');
          rows[i].cells[3].textContent = gamefox_date.parseFormat(
              rows[i].cells[3].textContent, format);
        }
      }
    }

    /* Active Messages (myposts.php) */ /* mostly fixed for v13. Don't have multi-page AMP to check that much yet */
    else if (gamefox_lib.onPage(doc, 'myposts'))
    {
      var topicsTable = doc.evaluate(
          './/div[@class="body"]/table[@class="board topics tlist"]', contentDiv,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue || doc.evaluate(
          './/div[@class="body"]/table[@class="board topics"]', contentDiv,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var rows;

      if (topicsTable)
      {
        // Double click action
        topicsTable.addEventListener('dblclick', gamefox_page.topicDblclick,
            false);

        // Topic rows
        rows = topicsTable.getElementsByTagName('tr');

        // Page jumper
        if (gamefox_lib.prefs.getBoolPref('elements.aml.pagejumper'))
        {
          var pageJumperTop = doc.evaluate(
              './/div[@class="board_nav"]/div[@class="body"]' +
              '/div[@class="pages"]', contentDiv, null,
              XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
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
              pageJumper.className = 'pod pagejumper';

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
      var IOService = Cc['@mozilla.org/network/io-service;1']
        .getService(Ci.nsIIOService);
      //var globalHistory = Cc['@mozilla.org/browser/global-history;2']
      //  .getService(Ci.nsIGlobalHistory2);

      // Topic row loop
      for (var i = 1; i < rows.length; i++)
      {
        // Date format
        if (gamefox_date.enabled)
        {
          var format = gamefox_date.getFormat('topic');
          var date1 = rows[i].cells[3].children[1] || rows[i].cells[3].firstChild;
          var date2 = rows[i].cells[4].children[1] || rows[i].cells[4].firstChild;
          date1.textContent = gamefox_date.parseFormat(date1.textContent,
              format);
          date2.textContent = gamefox_date.parseFormat(date2.textContent,
              format);
        }

        // Label topics with messages after your last post
        /*
        if (gamefox_lib.prefs.getBoolPref('elements.aml.marknewposts'))
        {
          // don't mark row as new if the last post link is visited
          var link = rows[i].cells[3].getElementsByTagName('a')[0];
          var visited = link ? globalHistory.isVisited(IOService.newURI(
              link.href, null, null)) : false;
          var lastPost = gamefox_date.strtotime(rows[i].cells[3].textContent);
          var yourLastPost = gamefox_date.strtotime(rows[i].cells[4]
              .textContent);

          if (!visited && lastPost.getTime() > yourLastPost.getTime())
          {
            var span = doc.createElement('span');
                span.className = 'gamefox-new-posts';
                span.style.setProperty('font-weight', 'bold', null);
                span.title = 'New posts in this topic';
                span.appendChild(doc.createTextNode('(N)'));

            rows[i].cells[4].appendChild(doc.createTextNode(' '));
            rows[i].cells[4].appendChild(span);
          }
        }*/

        // Pagination
        if (gamefox_lib.prefs.getBoolPref('paging.auto'))
        {
          var numPosts = (rows[i].cells[2].textContent.length > 4) ?
           			rows[i].cells[2].textContent.split(" ")[0] :
           			rows[i].cells[2].textContent;
          var pageList = gamefox_page.formatPagination(
              doc,
              rows[i].cells[1].getElementsByTagName('a')[0].href,
              Math.ceil(numPosts), '');

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

    /* Posting and Preview (post.php) */ /* should be updated for V13 */
    else if (gamefox_lib.onPage(doc, 'post'))
    {
      var message = doc.getElementsByName('messagetext')[0];
      if (!message)
        return; // "Message Posted" page
      var form = message.form;
      var topictitle = form.elements.namedItem('topictitle');
      var detailsDiv = message.parentNode.parentNode;
      var postBtns = form.querySelectorAll('[name="post"]');
      var previewBtn = postBtns[0];
      var queryArgs = gamefox_utils.parseQueryString(doc.location.search);

      // Titles
      if (topictitle) // new topic
      {
        gamefox_lib.setTitle(doc, gamefox_utils.getBoardName(doc), 'CT');
      }
      else // new post
      {
        gamefox_lib.setTitle(doc, detailsDiv.getElementsByTagName('a')[0]
            .textContent.trim(), 'PM');
      }

      // Signature
      var sigField = gamefox_quickpost.createSigField(gamefox_sigs.select(doc),
          doc);

      if (sigField.type != 'hidden' &&
          !/\b(Posted)<\/h2>/.test(doc.body.innerHTML) &&
          !queryArgs['message'])
      {
        detailsDiv.removeChild(form.elements.namedItem('custom_sig'));

        // Do this twice to remove the signature info text and the <br>
        message.parentNode.parentNode.removeChild(message.parentNode
            .nextSibling);
        message.parentNode.parentNode.removeChild(message.parentNode
            .nextSibling);

        previewBtn.parentNode.insertBefore(sigField, previewBtn);
      }

      // HTML buttons
      if (gamefox_quickpost.htmlButtonsEnabled)
      {
      	
        detailsDiv.insertBefore(gamefox_quickpost.createHTMLButtons(doc),
            message.parentNode);
        detailsDiv.insertBefore(doc.createElement('br'), message.parentNode);
        
        
        //if we're using GameFox buttons, remove the gamefaqs html buttons.
        var tagBtnsDiv = form.querySelector('.tagbuttons');
        tagBtnsDiv.parentNode.removeChild(tagBtnsDiv);
      }
	  
	  	
      // Remove post buttons and add our own
      let i = postBtns.length;
      while (i--)
        postBtns[i].parentNode.removeChild(postBtns[i]);
      let resetBtn = form.elements.namedItem('reset');
      resetBtn.parentNode.removeChild(resetBtn);

      detailsDiv.appendChild(gamefox_quickpost.createPostButtons(doc,
            [!queryArgs['poll'] ? 'Post Message' : '', 'Preview Message',
             'Preview and Spellcheck Message', 'Reset']));

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
          form.addEventListener('reset',
              function(event) { setTimeout(function() {
                gamefox_messages.updateTitleCount(event);
              }, 0); }, false);
        }

        // message count
        var msgcount = doc.createElement('span');
        msgcount.className = 'gamefox-message-count';
        detailsDiv.appendChild(doc.createTextNode(' '));
        detailsDiv.appendChild(msgcount);

        gamefox_messages.updateMessageCount(detailsDiv);
        
        //remove gamefaqs count, since it doesn't take into account custom signatures.
        var gfaqsMsgCount = doc.querySelector('#cc').parentNode;
        gfaqsMsgCount.parentNode.removeChild(gfaqsMsgCount);
        //remove gamefaqs listeners from message area (for tag buttons)
        message.onkeydown = null;
        message.onblur = null;
        message.onkeyup = null;
		
        message.addEventListener('input',
            gamefox_messages.delayedUpdateMessageCount, false);
        form.elements.namedItem('custom_sig').addEventListener('input',
            gamefox_messages.delayedUpdateMessageCount, false);
        form.addEventListener('reset',
            function(event) { setTimeout(function() {
              gamefox_messages.updateMessageCount(event);
            }, 0); }, false);
      }

      // Clock
      if (gamefox_lib.prefs.getBoolPref('elements.clock'))
      {
        var clockNode = doc.createElement('span');
        clockNode.className = 'gamefox-clock';
        clockNode.appendChild(doc.createTextNode(''));
        detailsDiv.appendChild(clockNode);

        gamefox_page.updateClock(clockNode.firstChild);
      }

      // Other form stuff
      doc.gamefox.lastFocusedPostForm = form;
      if (topictitle) topictitle.tabIndex = 1;
      message.tabIndex = 2;
    }

    /* User Information (user.php) */ /* this doesn't really exist with new profiles, left as-is */
    else if (gamefox_lib.onPage(doc, 'user'))
    {
      var username = doc.getElementsByTagName('td')[0];
      if (username)
        gamefox_lib.setTitle(doc, username.textContent.trim(), 'U');
    }

    /* Topic Lists */
    else if (gamefox_lib.onPage(doc, 'topics'))
    {
      var v13 = doc.evaluate('.//ul[@class="paginate user"]', contentDiv, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue != null;
      var userPanel = doc.evaluate('//div[@class="user_panel"]', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; //not sure this exists in v13
      var userNav;
      if(v13)
      {
      	userNav = doc.evaluate('.//ul[@class="paginate user"]', contentDiv, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      }else
      {
      	userNav = doc.evaluate('.//div[@class="board_nav"]' +
          '/div[@class="body"]/div[@class="user"]', contentDiv, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      }
      
      var userlist = gamefox_highlighting.loadGroups();

      var onTracked = gamefox_lib.onPage(doc, 'tracked');

      // Title
      gamefox_lib.setTitle(doc, gamefox_utils.getBoardName(doc), 'T');

      // Topic "QuickPost" link
      var newTopicLink;
      if (!onTracked
          && gamefox_lib.prefs.getBoolPref('elements.quickpost.link')
          && (newTopicLink = doc.evaluate('.//a[contains(@href, "post.php")]',
              userNav || userPanel, null,
              XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue))
      {
        var anchor = doc.createElement('a');
            anchor.className = 'gamefox-quickpost-link';
            anchor.href = '#';
            anchor.appendChild(doc.createTextNode(gamefox_lib.prefs.
                  getCharPref('elements.quickpost.link.title')));
            anchor.addEventListener('click', gamefox_quickpost.toggleVisibility, false);
				if(v13)
				{
          	var listItem = doc.createElement('li');
          	listItem.appendChild(anchor);
          	anchor = listItem;
        }
				
        if (userPanel)
        {
          newTopicLink.parentNode.appendChild(doc.createTextNode(' ('));
          newTopicLink.parentNode.appendChild(anchor);
          newTopicLink.parentNode.appendChild(doc.createTextNode(')'));
        }
        else
        {
          if(v13)
          {
          	//only putting the quickpost link on the top, for simplicity's sake
          		// really I couldn't get it to work, probably because of invalid HTML with 
          		// duplicate IDs. 
          		userNav.insertBefore(anchor, newTopicLink.nextSibling);
          }
          else{
						userNav.insertBefore(anchor, newTopicLink.nextSibling);
						userNav.insertBefore(doc.createTextNode(' | '), newTopicLink
							.nextSibling);
    	  	}
        }
      }

      var topicsTable = boardWrap ? (doc
        .evaluate('div[@class="body"]/table[@class="board topics"]', boardWrap,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue ||
          doc
        .evaluate('div[@class="body"]/table[@class="board topics tlist"]', boardWrap,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
        : null;
      var rows;

      if (topicsTable)
      {
        // Double click action
        topicsTable.addEventListener('dblclick', gamefox_page.topicDblclick,
            false);

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
        // XXX Lots of references to rows[i].cells[n], including repeated calls
        // to getElementsByTagName('a'). Would be nice to abstract the cell
        // numbers to their purpose (like cells.username or cells.lastPost or
        // something). (bm 2010-08)

        if (rows[i].cells.length == 1)
        {
          // this is an ad row
          if (gamefox_lib.prefs.getBoolPref('elements.stopads'))
          {
            rows[i].parentNode.removeChild(rows[i]);
            i--;
          }
          continue;
        }

						//so gamefaqs uses icons for these now. Going to leave this alone at the moment.
        // Status spans
        if (statusCond && !v13)
        {
          // TODO: add a class to some element on message lists so they can be
          //   identified properly
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

        // Date format
        if (gamefox_date.enabled)
        {
          var format = gamefox_date.getFormat('topic');
          var date = rows[i].cells[4].children[1] || rows[i].cells[4].firstChild;
          date.textContent = gamefox_date.parseFormat(date.textContent, format
              );
        }

        // Pagination
        if (gamefox_lib.prefs.getBoolPref('paging.auto'))
        {
          var pageList = gamefox_page.formatPagination(
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
            var topicLink = rows[i].cells[1].getElementsByTagName('a')[0]
              .getAttribute('href');
            var topicParams = gamefox_utils.parseBoardLink(topicLink);

            rows[i].cells[2].innerHTML = '<a href="' + gamefox_utils
              .newURI(topicParams['board'], null, null, null, topicLink) + '">'
              + rows[i].cells[2].textContent.trim() + '</a>';
          }
        }

        // gentopic.php /* v11 or v10? Not sure if this is broken */
        else
        {
          // Highlighting
          var username = gamefox_utils
            .cleanUsername(rows[i].cells[2].textContent.trim());
          var userStatus = gamefox_utils.readStatus(rows[i].cells[2]
              .textContent);
          var title = rows[i].cells[1].textContent.trim();
          var topicId = gamefox_utils.getTopicId(rows[i].cells[1]
              .getElementsByTagName('a')[0].href);
          var hlinfo;

          if ((hlinfo = gamefox_highlighting.searchTopic(username, topicId,
                  title, userStatus, userlist)) != false)
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
              if(!v13)
          		{
              	alternateColor = !alternateColor;
              }else{
              	var dummyRowParent;
								dummyRowParent = doc.createElement('tr');
								dummyRowParent.style.setProperty('display', 'none', null);
								rows[i].parentNode.insertBefore(dummyRowParent, rows[i].nextSibling);
								skipNext = true;
              }
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
    	var v13 = doc.evaluate('.//ul[@class="paginate user"]', contentDiv, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue != null;
      var userPanel = doc.evaluate('//div[@class="user_panel"]', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var userNav = doc.evaluate('.//ul[@class="paginate user"]', contentDiv, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
          || doc.evaluate('.//div[@class="board_nav"]'
          + '/div[@class="body"]/div[@class="user"]', contentDiv, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var pageJumper = doc.evaluate('.//div[@class="pod pagejumper"]',
          contentDiv, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
        .singleNodeValue;
      
      if (pageJumper)
      {
        var pageJumperItems = pageJumper.getElementsByTagName('li');
        doc.gamefox.pages = parseInt(pageJumperItems[pageJumperItems.length - 1].textContent);
      }
      else
      {
        doc.gamefox.pages = 1;
      }
      
      var userlist = gamefox_highlighting.loadGroups();

      var boardId = gamefox_utils.getBoardId(doc.location.pathname);
      var topicId = gamefox_utils.getTopicId(doc.location.pathname);
      var topicParams = gamefox_utils.parseQueryString(doc.location.search);
      var pagenum = Math.max(parseInt(topicParams.page), 0) || 0;
      var leftMsgData = gamefox_utils.getMsgDataDisplay(doc);
      var onArchive = gamefox_lib.onPage(doc, 'archive');
      var onDetail = gamefox_lib.onPage(doc, 'detail');
			
      doc.gamefox.thisPage = pagenum;

      // Title
      gamefox_lib.setTitle(doc, gamefox_utils.getPageHeader(doc),
          'M' + (onDetail ? 'D' : ''),
          (pagenum ? (pagenum + 1) : null));

      // "Tag Topic" link
      if (gamefox_lib.prefs.getBoolPref('elements.tag.link'))
      {
        if (userPanel)
        {
          var li = doc.createElement('li');
          li.appendChild(gamefox_tags.tagTopicLink(doc));
          userPanel.getElementsByTagName('ul')[0].appendChild(li);
        }
        else
        {
        	if(v13)
        	{
        		var li = doc.createElement('li');
          	li.appendChild(gamefox_tags.tagTopicLink(doc));
          	userNav.appendChild(li);
        	}else{
						userNav.appendChild(doc.createTextNode(' | '));
						userNav.appendChild(gamefox_tags.tagTopicLink(doc));
					}
        }
      }

      // Double click
      var messageTable = doc.evaluate('.//div[@class="body"]/' +
            'table[@class="board message msg"]', contentDiv, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
            || doc.evaluate(
          './/div[@class="body"]/table[@class="board message"]', contentDiv,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          
      messageTable.addEventListener('dblclick', gamefox_page.msglistDblclick,
          false);

      // Message numbering and highlighting
      var tdResult = doc.evaluate('tbody/tr/td', messageTable, null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var td = [];
      for (var i = 0; i < tdResult.snapshotLength; i++)
        td[i] = tdResult.snapshotItem(i);

      if (boardWrap)
        var ignoreMsg = doc.evaluate('div[@class="body"]/p', boardWrap, null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var ignoreCount = 0;
      if (ignoreMsg)
      {
        var ignoreMatch = ignoreMsg.textContent.match(/([0-9]+) message/);
        if (ignoreMatch)
          ignoreCount = parseInt(ignoreMatch[1]);
      }

      // Quick post key
      var postKey = doc.getElementsByName('key')[0];
      if (postKey)
        gamefox_quickpost.setPostKey(postKey.value);

      var alternateColor = false;
      var msgnum, msgnumString;
      var msgnumCond = !onDetail && gamefox_lib.prefs.getBoolPref('elements.msgnum');
      var msgnumStyle = gamefox_lib.prefs.getIntPref('elements.msgnum.style');

      var tcMarkerCond = !onDetail && gamefox_lib.prefs.getBoolPref('elements.marktc');
      var tcMarker = gamefox_lib.getString('elements.marktc.marker');
      var tc;

      var deletelinkCond = gamefox_lib.prefs.getBoolPref('elements.deletelink');
      var editlinkCond = gamefox_lib.prefs.getBoolPref('elements.editlink');
      var loggedInAs = (userNav || userPanel).getElementsByTagName('a')[0]
        .textContent;
      var loggedInUser = loggedInAs.substr(0, loggedInAs.indexOf('(') - 1);
      var loggedInLevel = loggedInAs.substr(loggedInAs.indexOf(')') - 2, 2);
      var topicOpen = !!doc.evaluate('.//a[contains(@href, "post.php")]',
          userNav || userPanel, null, XPathResult.FIRST_ORDERED_NODE_TYPE,
          null).singleNodeValue;
      var canQuickPost = (topicOpen || loggedInLevel >= 50) && !onDetail
        && !onArchive
        && gamefox_lib.prefs.getBoolPref('elements.quickpost.form');
      var filterCond = gamefox_lib.prefs.getBoolPref('elements.filterlink') && !onDetail;
			
      for (var i = 0; i < td.length; i += 2)
      {
        if (/\bad\b/.test(td[i].firstChild.className))
        {
          // this is an ad row
          if (gamefox_lib.prefs.getBoolPref('elements.stopads'))
            td[i].parentNode.parentNode.removeChild(td[i].parentNode);
          i--;
          continue;
        }
				
        msgnum = parseInt((td[i].querySelector('a[name]') || {}).name);
        msgnumString = '000'.substring(msgnum.toString().length) + msgnum;

        if (onArchive)
          var profileLink = td[i].getElementsByTagName('b')[0];
        else
          var profileLink = td[i].querySelector('a.name');
        var username = (v13) ? profileLink.firstChild.textContent : profileLink.textContent;
        var msgStats = (v13) ? profileLink.parentNode.parentNode : profileLink.parentNode;
        var detailLink = msgStats.getElementsByTagName('a')[2];
        var postBody = td[i + 1].textContent;

        // Remove GameFAQs post numbering
        if (gamefox_lib.prefs.getBoolPref('elements.msgnum'))
        {
          if (leftMsgData && msgStats.childNodes[1].textContent.charAt(0) ==
              '#')
          {
            // Do this twice to remove the <br>
            msgStats.removeChild(msgStats.childNodes[1]);
            msgStats.removeChild(msgStats.childNodes[1]);
          }
          else if (msgStats.childNodes[0].textContent.charAt(0) == '#')
            msgStats.removeChild(msgStats.childNodes[0]);
        }
				
				/* no QuickWhois for v13 at the moment */
        // Add profile link mouseover event listener for QuickWhois
        if (!v13 && !onArchive && gamefox_lib.prefs
            .getBoolPref('mouse.quickwhoisHover'))
        {
          profileLink.addEventListener('mouseover', function(event) {
            event.target.gamefox_QWTimerId = window.setTimeout(function() {
              event.target.gamefox_QWTimerId = null;
              gamefox_quickwhois.toggle(event, true); }, gamefox_lib.prefs
                .getIntPref('mouse.quickwhoisHover.delay'));
          }, false);

          profileLink.addEventListener('mouseout', function(event) {
            if (typeof event.target.gamefox_QWTimerId == 'number')
            {
              clearTimeout(event.target.gamefox_QWTimerId);
              event.target.gamefox_QWTimerId = null;
            }
          }, false);
        }

        var isEdited = false;
        var editTextNode = null;
        for (var j = 0; j < msgStats.childNodes.length; j++)
        {
          // check if this is the post date node
          if (msgStats.childNodes[j].textContent.indexOf('Posted') != -1
              && /Posted:? [0-9\/\: ]+\s(A|P)M/.test(msgStats.childNodes[j]
                .textContent))
            var postDateNode = msgStats.childNodes[j];

          // check for "(edited)" node
          if (msgStats.childNodes[j].textContent.indexOf('(edited)') != -1)
          {
            isEdited = true;
            if (!onArchive)
              editTextNode = msgStats.childNodes[j];
          }
        }

        // Add edit viewer dropdown menu
        if (gamefox_lib.prefs.getBoolPref('elements.editHistory') &&
            editTextNode)
        {
          editTextNode.textContent = leftMsgData ? '' : ' | ';

          var editListSpan = doc.createElement('span');
          editListSpan.className = 'gamefox-edit-list';

          var editList = doc.createElement('select');
          editList.addEventListener('click', gamefox_messages.fetchEdits,
              false);

          // For the custom drop-down menu arrow: Windows has unremovable
          // padding on the <select>, but Linux does not, so we need to do an
          // OS check here
          if (Cc['@mozilla.org/xre/app-info;1'].getService(Ci.nsIXULRuntime).OS
              != 'WINNT')
            editList.style.paddingRight = '17px';

          var editListText = doc.createElement('option');
          editListText.textContent = '(edited)';
          editList.appendChild(editListText);

          editListSpan.appendChild(editList);
          msgStats.insertBefore(editListSpan, editTextNode.nextSibling);
        }

        var postDate = postDateNode.textContent.replace(/(Posted:? )?/g, '')
          .replace('(edited)', '').replace(' |', '');
        msgStats.setUserData('gamefox_date', postDate, null); // for quoting

        // Create post date element
        var postDateElement = doc.createElement('span');
        postDateElement.className = 'gamefox-post-date';
        // XXX: message detail uses "Posted:" instead of "Posted", but we
        // replace that
        if (leftMsgData)
          postDateElement.appendChild(doc.createTextNode('Posted ' +
                postDate));
        else
          postDateElement.appendChild(doc.createTextNode('Posted ' +
                postDate + (onArchive ? '' : ' | ')));
        msgStats.replaceChild(postDateElement, postDateNode);

        if (onArchive && isEdited)
        {
          if (leftMsgData) // work around GameFAQs bug: <br><br>(edited)
          {
            msgStats.removeChild(postDateElement.nextSibling);
            msgStats.appendChild(doc.createElement('br'));
          }
          else
            msgStats.insertBefore(doc.createTextNode(' | (edited)'),
                postDateNode.nextSibling);
        }

        // Replace nbsp with normal space so date parsing works
        postDate = postDate.replace('\u00a0', ' ');

        // User status
        var userStatusNode = (v13) ? profileLink.parentNode.nextSibling : profileLink.nextSibling;
        var userStatus = (v13) ? gamefox_utils.readStatus(userStatusNode.textContent) : gamefox_utils.readStatus(gamefox_utils
            .getTextBetweenNodes(profileLink, postDateElement));

        if (msgnum == 1 && !onDetail)
        	//if(v13)
        	//	profileLink.appendChild(doc.createTextNode('(tc)');
        	//else
          	userStatus.push('tc'); // GFAQs doesn't add TC status to first post
        if (/*(v13 && profileLink.childNodes[1]) || */ userStatus.indexOf('tc') != -1)
          tc = username;

        // Remove "(Topic Creator)" since we add this in our own way
        if (msgnum != 1 && (userStatus.indexOf('tc') != -1 || userStatusNode.textContent.indexOf('Topic') != -1))
        {
        	if(v13)
        	{
        		userStatusNode.parentNode.removeChild(userStatusNode);
        	}
        	else{
						if (leftMsgData)
						{
							userStatusNode.parentNode.removeChild(userStatusNode.nextSibling);
							userStatusNode.parentNode.removeChild(userStatusNode);
						}
						else
							userStatusNode.textContent = ' ' + gamefox_utils.showStatus(
									userStatus) + ' | ';
					}
        }

        // Date format
        if (gamefox_date.enabled)
        {
          var format = gamefox_date.getFormat('message');

          postDateElement.textContent = 'Posted ' + gamefox_date.parseFormat(
              postDate, format) + (leftMsgData || onArchive ? '' : ' | ');
        }

        // Element for sigs
        gamefox_page_msgs.wrapSigs(td[i + 1]);

        // Title for detail link (useful with message-link-icons.css)
        if (detailLink)
          detailLink.title = 'Detail';

        // Element for GameFOX links
        var msgLinks = doc.createElement('span');
        msgLinks.className = 'gamefox-message-links';

        // Message highlighting
        var hlinfo, groupname;
        if ((hlinfo = gamefox_highlighting.searchPost(username, postBody,
                userStatus, userlist)) != false)
        {
          // add group names before post date
          if (gamefox_lib.prefs.getBoolPref('userlist.messages.showgroupnames') &&
              hlinfo[0].length)
          {
            groupname = doc.createElement('span');
            groupname.className = gamefox_highlighting.groupClassName;
            groupname.appendChild(doc.createTextNode(((v13) ? " " : "") + hlinfo[0]));
            groupname.style.setProperty('display', 'block');

            msgStats.insertBefore(groupname, postDateElement);
            	
            if (leftMsgData){
              if (!v13) 
              	msgStats.insertBefore(doc.createElement('br'), postDateElement);
            }
            else
              msgStats.insertBefore(doc.createTextNode(' | '), groupname
                  .nextSibling);
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
            a.title = 'Show';
            a.className = 'gamefox-show-post-link';
            a.href = '#';
            a.addEventListener('click', gamefox_highlighting.showPost, false);

            if (!leftMsgData)
              msgLinks.appendChild(doc.createTextNode(' | '));
            else if (!onArchive)
              msgLinks.appendChild(doc.createElement('br'));
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
          if(v13)
          {
          	profileLink.parentNode.appendChild(doc.createTextNode(' '));
          	profileLink.parentNode.appendChild(span);
					}else{
	          msgStats.insertBefore(span, profileLink.nextSibling);
          	msgStats.insertBefore(doc.createTextNode(' '), span);
					}
        }

        // Add delete and edit links
        if (loggedInUser == username && !onArchive && !onDetail &&
            postBody.trim() != '[This message was deleted at ' +
            'the request of the original poster]' &&
            postBody.trim() != '[This message was deleted at ' +
            'the request of a moderator or administrator]')
        {
          // Edit
          if (topicOpen && loggedInLevel >= 30
              && gamefox_date.strtotime(postDate).getTime() > Date.now()
                 - 3600000) // 3600000 ms = 3600 s = 1 h
          {
            var editURI = gamefox_lib.domain + gamefox_lib.path
              + 'post.php?board=' + boardId + '&topic=' + topicId
              + '&message=' + gamefox_utils.parseBoardLink(detailLink
                  .href)['message'];
            msgStats.setUserData('gamefox_editURI', editURI, null);

            if (editlinkCond)
            {
              var a = doc.createElement('a');
              a.appendChild(doc.createTextNode('edit'));
              a.title = 'Edit';
              a.className = 'gamefox-edit-link';
              a.href = '#';
              a.addEventListener('click', gamefox_messages.edit, false);

              msgLinks.appendChild((leftMsgData && !msgLinks.hasChildNodes()) ?
                  doc.createElement('br') : doc.createTextNode(' | '));
              msgLinks.appendChild(a);
            }
          }

          // Delete/close
          var deleteType = [];

          if (msgnum == 1 && td.length >= 4 && topicOpen)
            deleteType = ['close', 'close'];
          else if (msgnum == 1 && td.length < 4)
            deleteType = ['deletetopic', 'delete'];
          else if (msgnum != 1)
            deleteType = ['deletepost', 'delete'];

          if (deleteType.length)
          {
            msgStats.setUserData('gamefox_deleteType', deleteType[0], null);

            if (deletelinkCond)
            {
              var link = doc.createElement('a');
              link.className = 'gamefox-delete-link';
              link.href = '#';
              link.appendChild(doc.createTextNode(deleteType[1]));
              link.title = deleteType[1].charAt(0).toUpperCase()
                + deleteType[1].slice(1);
              link.addEventListener('click', gamefox_messages.deletePost,
                  false);

              msgLinks.appendChild((leftMsgData && !msgLinks.hasChildNodes()) ?
                  doc.createElement('br') : doc.createTextNode(' | '));
              msgLinks.appendChild(link);
            }
          }
        }

        // Filtering
        if (filterCond)
        {
          var a = doc.createElement('a');
          a.appendChild(doc.createTextNode('filter'));
          a.title = 'Filter';
          a.className = 'gamefox-filter-link';
          a.href = '#';
          a.addEventListener('click', gamefox_page.toggleFilter, false);

          if (!leftMsgData || msgLinks.hasChildNodes())
            msgLinks.appendChild(doc.createTextNode(' | '));
          else if (!onArchive)
            msgLinks.appendChild(doc.createElement('br'));
          msgLinks.appendChild(a);
        }

        // Quoting
        var a;
        if(v13)
        {
        	a = msgStats.querySelectorAll('a[href]')[2].parentNode;
				}else{
					a = doc.evaluate('//a[contains(@href, "quote=")]', msgStats, null,
            							XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue ||
            							doc.evaluate('//a[contains(@href, "qp")]', msgStats, null,
            							XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
				}
        var quoteURI;
        if (a)
        {
          quoteURI = a.href;

          // Remove GameFAQs' quote link and extra | or <br>
          if (v13)
          	a.parentNode.removeChild(a);
          else{
						a.parentNode.removeChild(a.previousSibling);
						a.parentNode.removeChild(a);
          }
        }

        if ((canQuickPost || quoteURI) &&
            gamefox_lib.prefs.getBoolPref('elements.quotelink'))
        {
          // Create our own
          a = doc.createElement('a');
          a.className = 'gamefox-quote-link';
          a.textContent = 'quote';
          a.title = 'Quote';

          if (canQuickPost)
          {
            a.href = '#';
            a.addEventListener('click', function(event) {
              gamefox_quote.quote(event, true); event.preventDefault();
            }, false);
          }
          else
            a.href = quoteURI;

          if (!leftMsgData || msgLinks.hasChildNodes())
            msgLinks.appendChild(doc.createTextNode(' | '));
          else if (!onArchive && !v13)
            msgLinks.appendChild(doc.createElement('br'));
          msgLinks.appendChild(a);
        }

        // Append msgLinks
        if (detailLink)
          msgStats.insertBefore(msgLinks, detailLink.nextSibling);
        else
          msgStats.appendChild(msgLinks);

        // Message numbering
        if (msgnumCond)
        {
          switch (msgnumStyle)
          {
            case 1: // #001 | [message detail]
              var element = onArchive ? msgLinks : detailLink;
              msgStats.insertBefore(doc.createTextNode((!leftMsgData &&
                  onArchive ? ' | ' : '') + '#' + msgnumString + (!leftMsgData
                  && !onArchive ? ' | ' : '')), element);
              if (leftMsgData && msgLinks.hasChildNodes())
                msgStats.insertBefore(doc.createElement('br'), element);
              break;

            case 2: // [#001]
              if (onArchive)
              {
                if (!leftMsgData)
                  msgStats.insertBefore(doc.createTextNode(' | '), msgLinks);
                var numElement = leftMsgData ?
                  doc.createElement('span') : doc.createElement('b');
                numElement.appendChild(doc.createTextNode('#' + msgnumString));
                msgStats.insertBefore(numElement, msgLinks);
                if (leftMsgData && msgLinks.hasChildNodes())
                  msgStats.insertBefore(doc.createElement('br'), msgLinks);
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
                if (!leftMsgData)
                  msgStats.insertBefore(doc.createTextNode(' | '), msgLinks);
                var numElement = leftMsgData ?
                  doc.createElement('span') : doc.createElement('b');
                numElement.appendChild(doc.createTextNode('message #' + msgnumString));
                msgStats.insertBefore(numElement, msgLinks);
                if (leftMsgData && msgLinks.hasChildNodes())
                  msgStats.insertBefore(doc.createElement('br'), msgLinks);
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
                  msgStats.appendChild(doc.createElement('br'));

                msgStats.appendChild(doc.createTextNode('#' + msgnumString));
              }
              else
                msgStats.appendChild(doc.createTextNode(' | #' + msgnumString)
                    );
              break;
          }
        }
      }

      doc.gamefox.msgnum = msgnum;

      // Board nav at the bottom of the page
      if (gamefox_lib.prefs.getBoolPref('elements.boardnav') && !onDetail)
      {
        var miniBoardNav = doc.createElement('div');
        miniBoardNav.id = 'gamefox-board-nav';

        var boardNavLinks = (userNav || userPanel).getElementsByTagName('a');
        for (var i = 0; i < boardNavLinks.length; i++)
        {
          if (!/([0-9]{1,2}\)|Topic List|Board List)/.test(boardNavLinks[i]
                .textContent))
            continue;

          miniBoardNav.appendChild(boardNavLinks[i].cloneNode(true));
          miniBoardNav.appendChild(doc.createTextNode(' | '));
        }
        miniBoardNav.removeChild(miniBoardNav.lastChild);

        if (pageJumper && contentDiv.firstChild.id == 'top_col_wrap')
        {
          // Insert above ad to align with the page jumper (if ad blocking is
          // disabled)
          let side_col = pageJumper.parentNode.nextSibling;
          side_col.insertBefore(miniBoardNav, side_col.firstChild);
        }
        else
          boardWrap.appendChild(miniBoardNav);
      }

      // Link post nums in quotes
      // Based on barbarianbob's initial code.
      // http://www.gamefaqs.com/boards/565885-blood-money/52347416
      if (gamefox_lib.prefs.getBoolPref('elements.postidQuoteLinks'))
      {
        var quotes = doc.querySelectorAll(
            '.message i > p > strong:first-child, .message cite');
        for (var i = 0; i < quotes.length; ++i)
        {
          var quote = quotes[i];
          quote.innerHTML = quote.innerHTML.replace(/#([0-9]+)/,
            function(_, num) {
              return '<a href="' + gamefox_utils.newURI(boardId, topicId,
                  Math.floor((num - 1) / gamefox_lib.prefs.getIntPref(
                    'msgsPerPage')), num, doc.location.pathname) + '">#' +
                  num + '</a>';
            });
        }
      }

      // QuickPost
      if (canQuickPost)
      {
        var qpDiv = doc.createElement('div');
            qpDiv.id = 'gamefox-quickpost-normal';
            qpDiv.className = 'col_layout'; // for padding

        // Remove GameFAQs' quick post form
        var postForm = doc.querySelector('#content form[action^="/boards/post'
            + '.php"]');
        if (postForm)
          postForm.parentNode.removeChild(postForm);

        contentDiv.appendChild(qpDiv);
        gamefox_quickpost.appendForm(doc, qpDiv, false);
      }

      // Change #last to a post number
      if (doc.location.hash == '#last')
        doc.location.replace(doc.location.toString().split('#')[0] + '#' +
            msgnum);
      // Force scroll to the post (needed since Firefox preserves scroll
      // position when reloading page even if there's a hash)
      else if (doc.location.hash.length)
        doc.location.hash = doc.location.hash;
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

    if (msgComponents.header.parentNode == msgComponents.original)
    {
      switch (dblclickHead)
      {
        case 1:
          if (!gamefox_lib.onPage(doc, 'archive'))
            gamefox_quickwhois.toggle(event, null, true);
          break;
        case 2:
          gamefox_quote.quote(event);
          break;
        case 3:
          gamefox_page.toggleFilter(event);
          break;
      }
    }
    else if (dblclickMsg &&
        !msgComponents.body.getUserData('gamefox_editing'))
      gamefox_quote.quote(event);
  },

  topicDblclick: function(event)
  {
    var switcher = gamefox_lib.prefs.getIntPref((gamefox_lib.onPage(event.target.ownerDocument,
            'myposts') ? 'myposts' : 'topic') + '.dblclick');
    switch (switcher)
    {
      case 1:
        gamefox_page.showPages(event);
        break;
      case 2:
        gamefox_page.gotoLastPage(event, true); // last post
        break;
      case 3:
        gamefox_tags.add(event);
        break;
      case 4:
        gamefox_page.gotoLastPage(event);
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
      var lastPost = gamefox_utils.getLastPost(cell.textContent);
      var uri = node.cells[1].getElementsByTagName('a')[0].href + lastPost[0] +
          (gotoLastPost ? lastPost[1] : '');
      doc.location.href = uri;
    }
    catch (e) {}
  },

  showPages: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;
    var topiclink, posts, pageList;

    try
    {
      while (node.nodeName.toLowerCase() != 'td')
        node = node.parentNode;
      node = node.parentNode; // topic row

      topiclink = node.cells[1].getElementsByTagName('a')[0].href;
      posts = node.cells[gamefox_lib.onPage(doc, 'myposts') ? 2 : 3].textContent;
      tc = gamefox_lib.onPage(doc, 'tracked') || gamefox_lib.onPage(doc, 'myposts')
          ? '' : node.cells[2].firstChild.textContent.trim();
    }
    catch (e)
    {
      return;
    }

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
      pageList = gamefox_page.formatPagination(doc, topiclink, posts, tc);

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
  },

  formatPagination: function(doc, topiclink, posts, tc)
  {
    var pages = Math.ceil(posts / gamefox_lib.prefs.getIntPref('msgsPerPage'));
    if (pages == 1)
      return false;

    var loc = gamefox_lib.prefs.getIntPref('paging.location');
    var prefix = gamefox_lib.getString('paging.prefix');
    var sep = gamefox_lib.getString('paging.separator');
    var suffix = gamefox_lib.getString('paging.suffix');

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

    var a;
    for (var i = 0; i < pages; i++)
    {
      a = doc.createElement('a');
      a.href = topiclink + (i ? '?page=' + i : '');
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
    var boardWrap = doc.getElementsByClassName('board_wrap')[0];
    var tdResult = doc.evaluate('.//div[@class="body"]/'
        + 'table[@class="board message"]/tbody/tr/td', boardWrap, null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var td = [];
    for (var i = 0; i < tdResult.snapshotLength; i++)
      td[i] = tdResult.snapshotItem(i);
    var leftMsgData = gamefox_utils.getMsgDataDisplay(doc);
    var userSelector = gamefox_lib.onPage(doc, 'archive') ? 'b' : 'a.name';
    var newText, newTitle, newFocus;

    var msgComponents = gamefox_utils.getMsgComponents(event.target, doc);
    if (!msgComponents)
      return;

    if (!doc.gamefox.filtered)
    {
      var username = msgComponents.header.querySelector(userSelector)
        .textContent;

      for (var i = 0; i < td.length; i += 2)
      {
        if (td[i].querySelector(userSelector).textContent == username)
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

  updateClock: function(dateNode)
  {
    var ms = Date.now() + gamefox_lib.prefs.getIntPref('dateOffset');
    dateNode.nodeValue = ' | ' + gamefox_date.parseFormat(ms,
        gamefox_date.getFormat('clock'));
    // 1025 so we don't get "misses" so often
    dateNode.ownerDocument.defaultView.setTimeout(gamefox_page.updateClock,
        1025 - ms % 1000, dateNode);
  }
};
