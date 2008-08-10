/* vim: set et sw=2 sts=2 ts=2: */

var GameFOXTags =
{
  tags: '',

  read: function()
  {
    this.tags = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getCharPref('gamefox.tags');

    if (this.tags.replace(/\s/g, '') == '')
    {
      this.tags = '({})';
    }

    this.tags = eval(this.tags);
  },

  write: function(tags)
  {
    if (typeof(tags) == 'object')
    {
      tags = tags.toSource();
    }

    Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).setCharPref('gamefox.tags', tags);
  },

  populate: function(method)
  {
    var tagList, board, topic, i, item, childItem, children, row, cell1, cell2;

    if (method == 1)
    {
      tagList = document.getElementById('gamefox-tags-menu');
    }
    else
    {
      tagList = document.getElementById('gamefox-tags-rows');
    }

    if (!tagList)
    {
      return;
    }

    while (tagList.hasChildNodes())
    {
      tagList.removeChild(tagList.childNodes[0]);
    }

    this.read();

    if (method == 1)
    {
      // For Active Message List and Tracked Topics link section
      var tagPrefs   = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.context.tag.');
      var tagMyPosts = tagPrefs.getBoolPref('myposts');
      var tagTracked = tagPrefs.getBoolPref('tracked');
      if (tagMyPosts)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', 'Active Message List');
        item.setAttribute('accesskey', 'A');
        item.setAttribute('oncommand', 'GameFOXTags.open("' + 0 + ',' + -1 + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) GameFOXTags.open("' + 0 + ',' + -1 + '", 0)');
        tagList.appendChild(item);
      }
      if (tagTracked)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', 'Tracked Topics');
        item.setAttribute('accesskey', 'T');
        item.setAttribute('oncommand', 'GameFOXTags.open("' + 0 + ',' + -2 + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) GameFOXTags.open("' + 0 + ',' + -2 + '", 0)');
        tagList.appendChild(item);
      }
      var createSep = (tagMyPosts || tagTracked) ? true : false;
      // End section

      for (board in this.tags)
      {
        for (topic in this.tags[board].topics)
        {
          if (createSep)
          {
            tagList.appendChild(document.createElement('menuseparator'));
            createSep = false;
          }
          item = document.createElement('menuitem');
          item.setAttribute('label', this.tags[board].topics[topic]);
          item.setAttribute('oncommand', 'GameFOXTags.open("' + board + ',' + topic + '", 2)');
          item.setAttribute('onclick', 'if (event.button == 1) GameFOXTags.open("' + board + ',' + topic + '", 0)');
          tagList.appendChild(item);
        }
      }
    }
    else
    {
      for (board in this.tags)
      {
        children = document.createElement('treechildren');
        item     = document.createElement('treeitem');
        row      = document.createElement('treerow');
        cell1    = document.createElement('treecell');
        cell2    = document.createElement('treecell');
        item.setAttribute('container', 'true');
        item.setAttribute('open', 'true');
        cell1.setAttribute('label', this.tags[board].title);
        cell2.setAttribute('label', board);
        row.appendChild(cell1);
        row.appendChild(cell2);
        item.appendChild(row);

        for (topic in this.tags[board].topics)
        {
          childItem = document.createElement('treeitem');
          row       = document.createElement('treerow');
          cell1     = document.createElement('treecell');
          cell2     = document.createElement('treecell');
          cell1.setAttribute('label', this.tags[board].topics[topic]);
          cell2.setAttribute('label', board + ',' + topic);
          row.appendChild(cell1);
          row.appendChild(cell2);
          childItem.appendChild(row);
          children.appendChild(childItem);
        }

        item.appendChild(children);
        tagList.appendChild(item);
      }
    }
  },

  doAction: function(actID, dblclick)
  {
    var tree = document.getElementById('gamefox-tags-tree');

    if (tree.view.isContainer(tree.view.selection.currentIndex) && dblclick)
    {
      return;
    }

    var tagID = tree.view.getCellText(tree.view.selection.currentIndex, tree.columns.getNamedColumn('gamefox-tags-tagid'));

    switch (actID)
    {
      case 0:
        this.open(tagID, 0); // open in new tab
        break;
      case 1:
        this.open(tagID, 1); // open in new focused tab
        break;
      case 2:
        this.open(tagID, 2); // open in current tab
        break;
      case 3:
        this.open(tagID, 3); // open in new window
        break;
      case 4:
        this.remove(tagID, tree.view.isContainer(tree.view.selection.currentIndex));
        break;
    }
  },

  open: function(tagID, openType)
  {
    var IDs     = tagID.split(/,/);
    var tagURI  = 'http://www.gamefaqs.com/boards';

    if (IDs[0] == 0 && IDs[1] == -1)
    {
      tagURI += '/myposts.php';
    }
    else if (IDs[0] == 0 && IDs[1] == -2)
    {
      tagURI = 'http://www.gamefaqs.com/boards/tracked.php';
    }
    else
    {
      tagURI += (IDs[1] ? '/genmessage.php' : '/gentopic.php') + '?board=' + IDs[0] + (IDs[1] ? '&topic=' + IDs[1] + (IDs[2] && parseInt(IDs[2]) ? '&page=' + IDs[2]  : '') : '' );
    }

    var winMed  = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');

    switch (openType)
    {
      case 0:
        try
        {
          var browser = winMed.getBrowser();
          browser.addTab(tagURI);
        }
        catch (e)
        {
          winMed.loadURI(tagURI);
        }
        break;
      case 1:
        try
        {
          winMed.delayedOpenTab(tagURI);
        }
        catch (e)
        {
          winMed.loadURI(tagURI);
        }
        break;
      case 2:
        winMed.loadURI(tagURI);
        break;
      case 3:
        winMed.open(tagURI);
        break;
    }
  },

  removeSelected: function()
  {
    var tagIDs     = [];
    var start      = {};
    var end        = {};
    var tree       = document.getElementById('gamefox-tags-tree');
    var rangeCount = tree.view.selection.getRangeCount();

    for (var i = 0; i < rangeCount; i++)
    {
      tree.view.selection.getRangeAt(i, start, end);

      for (var j = start.value; j <= end.value; j++)
      {
        if (!tree.view.isContainer(j))
        {
          tagIDs.push(tree.view.getCellText(j, tree.columns.getNamedColumn('gamefox-tags-tagid')));
        }
      }
    }

    this.remove(tagIDs);
  },

  removeAll: function()
  {
    this.write('');
    this.populate(2);
  },


  removePurged: function()
  {
    this.read();
    const errNumber  = [ -404, -1, 0, 302, 401, 403, 500, 503, 504, 555 ]
    var err          = [    0,  0, 0,   0,   0,   0,   0,   0,   0,   0 ]
    var IDs          = 0;
    var processedIDs = 0;
    var progress     = document.getElementById('gamefox-purge-meter');
    var remove       = [];


  /* removePurged: dispatchRequest */

    function dispatchRequest(board, topic)
    {
      var request   = new XMLHttpRequest();
      var processed = false;
      var checkMessageBody = false;


    /* removePurged: dispatchRequest: processRespond */

      function processRespond(status)
      {
        processed = true;
        processedIDs++;

        switch (status)
        {
          case 200:  // OK
            break;
          case 404:  // Not Found               // GamefAQs - 404 Error: Page Not Found
            remove.push(board + ',' + topic);
            break;
          case -404: // Not Found               // (URL not found)
          case -1:   // Error                   // (disconnected, offline mode, aborted by user)
          case 0:    // Request Timeout         // (blank page)
          case 302:  // Found                   // (no page title, blasphemy!)
          case 401:  // Unauthorized            // GamefAQs - 401 Error: Unauthorized Access
          case 403:  // Forbidden               // GamefAQs - 403 Error: Not Authorized
          case 500:  // Internal Server Error   // GamefAQs Error: Internal Error
          case 503:  // Service Unavailable     // GamefAQs Error: maintenance...
          case 504:  // Service Unavailable +1  // GamefAQs Error: Too many connections
          case 555:  // Unknown Error
            try
            {
              err[errNumber.indexOf(status)] += 1;
            }
            catch(e){;}
            break;
        }

        if (processedIDs == IDs)
        {
          progress.setAttribute('hidden', 'true');
          progress.parentNode.selectedIndex = 0;

          var msg;

          if (remove.length)
          {
            GameFOXTags.remove(remove);
            msg =  'Successfully deleted ' + remove.length + ' purged topics.\n\n';
          }
          else
          {
            msg = 'No purged topics.\n\n';
          }

          if (err[errNumber.indexOf(403)])  msg += err[errNumber.indexOf(403)] + ' topics were skipped because of insufficient user privilege. Higher user level or permit is required.\n';
          if (err[errNumber.indexOf(401)])  msg += err[errNumber.indexOf(401)] + ' topics were skipped because of unauthorized access. You shouldn\'t get this error to begin with.\n';
          if (err[errNumber.indexOf(503)])  msg += err[errNumber.indexOf(503)] + ' topics were skipped because the site is temporarily down for maintenance.\n';
          if (err[errNumber.indexOf(504)])  msg += err[errNumber.indexOf(504)] + ' topics were skipped because the site complained getting too many connections.\n';
          if (err[errNumber.indexOf(500)])  msg += err[errNumber.indexOf(500)] + ' topics were skipped because of internal or database error.\n';
          if (err[errNumber.indexOf(555)])  msg += err[errNumber.indexOf(555)] + ' topics were skipped because of unknown or new error. You may safely assume that the problem came from GameFAQs alone.\n';
          if (err[errNumber.indexOf(0)])    msg += err[errNumber.indexOf(0)]   + ' topics were skipped because request timed out.\n';
          if (err[errNumber.indexOf(-1)])   msg += err[errNumber.indexOf(-1)]  + ' topics were skipped because the purge process was aborted or encountered an error.\n';
          if (err[errNumber.indexOf(302)])  msg += err[errNumber.indexOf(302)] + ' topics were skipped because no topic title was found. It\'s blasphemy! Alert the creator.\n';
          if (err[errNumber.indexOf(-404)]) msg += err[errNumber.indexOf(-404)]+ ' topics were skipped because the requested URL was not found. Alert the creator.\n';

          alert(msg);
        }
      }


    /* removePurged: dispatchRequest: open request */

      request.open('GET', 'http://www.gamefaqs.com/boards/genmessage.php?board=' + board + '&topic=' + topic);


    /* removePurged: dispatchRequest: request.onerror */

      request.onerror = function()
      {
        //alert('Whoops! I\'m Error.');
        if (!processed) processRespond(-1);
      };


    /* removePurged: dispatchRequest: request.onreadystatechange */

      request.onreadystatechange = function()
      {
        if (!processed && request.readyState >= 3)
        {
          if (!checkMessageBody && request.responseText.match(/^\s*[^<\s]/))  // Not (X)HTML
          {
            if (request.responseText.match(/maintenance/i))
            {
              processed = true;
              request.abort();
              processRespond(503);
            }
            else if (request.responseText.match(/Internal Error|Database error/i))
            {
              processed = true;
              request.abort();
              processRespond(500);
            }
            else if (request.responseText.match(/Too many connections?/i))
            {
              processed = true;
              request.abort();
              processRespond(504);
            }
          }
          if (!checkMessageBody && request.responseText.match(/<\/title>/i))
          {
            if (request.responseText.match(/<title>404 Not Found<\/title>/i))
            {
              processed = true;
              request.abort();
              processRespond(-404);
            }
            else if (request.responseText.match(/<title\b[^>]*>[^<]*\b(Error\W*404|404\W*Error)\b[^<]*<\/title>/ig))
            {
              processed = true;
              request.abort();
              processRespond(404); //-> this is an old behaviour, now is not like this anymore. Need to be cleaned up?!
            }
            else if (request.responseText.match(/<title\b[^>]*>[^<]*\b(Error\W*403|403\W*Error)\b[^<]*<\/title>/ig))
            {
              processed = true;
              request.abort();
              processRespond(403);
            }
            else if (request.responseText.match(/<title\b[^>]*>[^<]*\b(Error\W*401|401\W*Error)\b[^<]*<\/title>/ig))
            {
              processed = true;
              request.abort();
              processRespond(401);
            }
            else
            {
              checkMessageBody = true;
              //processed = true;
              //request.abort();
              //processRespond(200);
            }
          }
          else if (!checkMessageBody && request.responseText.match(/<\/head>/i))
          {
            processed = true;
            request.abort();
            processRespond(302);
          }
          else if (request.readyState == 4 && !processed)
          {
            if (request.responseText.replace(/^\s+|\s+$/g, '').length == 0)
            {
              processRespond(0);
            }
            else if (checkMessageBody)
            {
              if (request.responseText.match(/<table\b[^>]*\bclass=['"]?messages?['"]?\b[^>]*>/ig))
              {
                // Added: for GameFAQs' new deleted topic handling
                processRespond(200);
              }
              else processRespond(404);
            }
            else processRespond(555);
          }
        }
      };


    /* removePurged: dispatchRequest: send request */

      request.send(null);
    }


  /* removePurged: main */

    var first = true;

    for (var board in this.tags)
    {
      for (var topic in this.tags[board].topics)
      {
        if (first)
        {
          progress.removeAttribute('hidden');
          progress.parentNode.selectedIndex = 1;
          first = false;
        }
        IDs++;
        dispatchRequest(board, topic);
      }
    }
  },

  remove: function(tagIDs, delFolder)
  {
    var IDs;

    if (typeof(tagIDs) == 'string')
    {
      tagIDs = [tagIDs];
    }

    if (tagIDs.length <= 0)
    {
      alert('Nothing to delete.');
      return;
    }

    this.read();

    tagIDs.forEach(function(element, index, array)
    {
      IDs = element.split(/,/);

      if (!IDs[1] && delFolder && typeof(GameFOXTags.tags[IDs[0]].title) == 'string')
      {
        if (confirm('Are you you want to delete this board and its topics?\n\nBoard ID: ' + IDs[0] + '\nBoard Name: ' + GameFOXTags.tags[IDs[0]].title))
        {
          delete GameFOXTags.tags[IDs[0]];
        }
      }
      else if (IDs[1] && typeof(GameFOXTags.tags[IDs[0]].topics[IDs[1]]) == 'string')
      {
        delete GameFOXTags.tags[IDs[0]].topics[IDs[1]];
      }
    });

    this.write(this.tags);
    this.populate(2);
  },

  add: function(event)
  {
    var doc = event.target.ownerDocument;
    var queryStr   = doc.location.search;
    var boardTitle = false;
    var topicTitle = false;

    if (event) // this will always be true, lulz!!?
    {
      if (event.type && event.type == 'dblclick')
      {
        event.preventDefault();
      }

      var onMyPosts   = doc.location.pathname.match(/^\/boards\/myposts\.php$/i);
      var onTopicList;

      if (onMyPosts)
      {
        onTopicList = false;
      }
      else
      {
        onTopicList = !!doc.evaluate('//div[@class="board_nav"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
                    && !!doc.evaluate('//table[@class="topics"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      }

      if (onMyPosts || onTopicList)
      {
        try
        {
          var node = event.target;
          var nodeName = node.nodeName.toLowerCase();

          while (nodeName != 'td')
          {
            node = node.parentNode;
            nodeName = node.nodeName.toLowerCase();
          }

          var topicLink = node.parentNode.cells[1].getElementsByTagName('a')[0];
          queryStr   = topicLink.href;
          topicTitle = topicLink.textContent.replace(/^\s+|\s+$/g, '');

          if (onMyPosts)
          {
            boardTitle = node.parentNode.cells[0].innerHTML.replace(/<(font|div|span)\b[^\0]+$/i, '').replace(/<\/?a\b[^>]*>/ig, '').replace(/^\s+|\s+$/g, '');
          }
        }
        catch(e){return false;}
      }
    }

    var boardID     = queryStr.match(/\bboard=([0-9-]+)/i)[1];
    var topicID     = queryStr.match(/\btopic=([0-9-]+)/i)[1];
    var tagID       = boardID + ',' + topicID;

    var h1s         = doc.getElementsByTagName('h1');
    if (!boardTitle)
    {
      boardTitle  = h1s[0].textContent.replace(/^\s+|\s+$/g, '');
    }
    if (!topicTitle)
    {
      topicTitle  = h1s[1].textContent.replace(/^\s+|\s+$/g, '');
    }

    GameFOXTags.read();

    if (boardID in GameFOXTags.tags && topicID in GameFOXTags.tags[boardID].topics)
    {
      if (confirm("You have already tagged this topic!\nDo you wish to un-tag it?"))
      {
        GameFOXTags.remove(tagID);
        return false;
      }

      return true;
    }

    if (boardID in GameFOXTags.tags)
    {
      GameFOXTags.tags[boardID].topics[topicID] = topicTitle;
    }
    else
    {
      GameFOXTags.tags[boardID] = {title: boardTitle, topics: {}};
      GameFOXTags.tags[boardID].topics[topicID] = topicTitle;
    }

    GameFOXTags.write(GameFOXTags.tags);
    return true;
  },

  tagTopicEvent: function(event)
  {
    event.preventDefault();
    if (GameFOXTags.add(event))
    {
      event.target.removeEventListener('click', GameFOXTags.tagTopicEvent, false);
      event.target.addEventListener('click', GameFOXTags.untagTopicEvent, false);
      event.target.textContent = 'Untag Topic';
    }
  },

  untagTopicEvent: function(event)
  {
    event.preventDefault();
    GameFOXTags.remove(event.target.hash.substring(1));

    event.target.removeEventListener('click', GameFOXTags.untagTopicEvent, false);
    event.target.addEventListener('click', GameFOXTags.tagTopicEvent, false);
    event.target.textContent = 'Tag Topic';
  }
};
