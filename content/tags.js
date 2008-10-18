/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2005, 2006, 2007, 2008
 * Abdullah A, Andrianto Effendy, Brian Marshall, Michael Ryan
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

var GFtags =
{
  tags: '',

  read: function()
  {
    this.tags = Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefBranch)
        .getCharPref('gamefox.tags');

    if (!/\S/.test(this.tags))
      this.tags = '({})';

    this.tags = eval(this.tags);
  },

  write: function(tags)
  {
    if (typeof(tags) == 'object')
      tags = tags.toSource();

    Cc['@mozilla.org/preferences-service;1']
        .getService(Ci.nsIPrefBranch)
        .setCharPref('gamefox.tags', tags);
  },

  populate: function(method)
  {
    // context menu: method == 1
    // tag tree: method == 2
    var tagList, board, topic, item, childItem, children, row, cell1, cell2;

    if (method == 1)
      tagList = document.getElementById('gamefox-tags-menu');
    else
      tagList = document.getElementById('gamefox-tags-rows');

    if (!tagList)
      return;

    while (tagList.hasChildNodes())
      tagList.removeChild(tagList.firstChild);

    this.read();

    if (method == 1)
    {
      // Active Message List and Tracked Topics links
      var tagPrefs = Cc['@mozilla.org/preferences-service;1']
          .getService(Ci.nsIPrefService)
          .getBranch('gamefox.context.tag.');
      var tagMyPosts = tagPrefs.getBoolPref('myposts');
      var tagTracked = tagPrefs.getBoolPref('tracked');
      if (tagMyPosts)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', 'Active Message List');
        item.setAttribute('accesskey', 'A');
        item.setAttribute('oncommand', 'GFtags.open("' + 0 + ',' + -1 + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) GFtags.open("' + 0 + ',' + -1 + '", 0)');
        tagList.appendChild(item);
      }
      if (tagTracked)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', 'Tracked Topics');
        item.setAttribute('accesskey', 'T');
        item.setAttribute('oncommand', 'GFtags.open("' + 0 + ',' + -2 + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) GFtags.open("' + 0 + ',' + -2 + '", 0)');
        tagList.appendChild(item);
      }
      var createSep = tagMyPosts || tagTracked;

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
          item.setAttribute('oncommand', 'GFtags.open("' + board + ',' + topic + '", 2)');
          item.setAttribute('onclick', 'if (event.button == 1) GFtags.open("' + board + ',' + topic + '", 0)');
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
    var index = tree.view.selection.currentIndex;

    if (index == -1 || (tree.view.isContainer(index) && dblclick))
      return;

    var tagID = tree.view.getCellText(index, tree.columns.getNamedColumn('gamefox-tags-tagid'));

    switch (actID)
    {
      case 0:
        this.open(tagID, 0); // new tab
        break;
      case 1:
        this.open(tagID, 1); // new focused tab
        break;
      case 2:
        this.open(tagID, 2); // focused tab
        break;
      case 3:
        this.open(tagID, 3); // new window
        break;
      case 4:
        this.remove(tagID, tree.view.isContainer(index));
        break;
    }
  },

  open: function(tagID, openType)
  {
    var IDs = tagID.split(',');
    var tagURI = GFlib.domain + GFlib.path;

    if (IDs[1] == -1)
    {
      tagURI += 'myposts.php';
    }
    else if (IDs[1] == -2)
    {
      tagURI += 'tracked.php';
    }
    else
    {
      tagURI += (IDs[1] ? 'genmessage.php' : 'gentopic.php')
                + '?board=' + IDs[0] + (IDs[1] ? '&topic=' + IDs[1]
                + (IDs[2] && parseInt(IDs[2]) ? '&page=' + IDs[2]
                + (IDs[3] ? IDs[3] : '') : '') : '');
    }

    var win = Cc['@mozilla.org/appshell/window-mediator;1']
        .getService(Ci.nsIWindowMediator)
        .getMostRecentWindow('navigator:browser');

    switch (openType)
    {
      case 0: // new tab
        try
        {
          win.getBrowser().addTab(tagURI);
        }
        catch (e)
        {
          win.loadURI(tagURI);
        }
        break;
      case 1: // new focused tab
        try
        {
          win.delayedOpenTab(tagURI);
        }
        catch (e)
        {
          win.loadURI(tagURI);
        }
        break;
      case 2: // focused tab
        win.loadURI(tagURI);
        break;
      case 3: // new window
        win.open(tagURI);
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
    if (GFlib.confirm('Are you sure you want to delete all your tags?'))
    {
      this.write('');
      this.populate(2);
    }
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
            catch (e) {}
            break;
        }

        if (processedIDs == IDs)
        {
          progress.setAttribute('hidden', 'true');
          progress.parentNode.selectedIndex = 0;

          var msg;

          if (remove.length)
          {
            GFtags.remove(remove);
            msg = 'Successfully deleted ' + remove.length + ' purged topics.\n\n';
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

          GFlib.alert(msg);
        }
      }


    /* removePurged: dispatchRequest: open request */

      request.open('GET', GFlib.domain + GFlib.path + 'genmessage.php?board=' + board + '&topic=' + topic);


    /* removePurged: dispatchRequest: request.onerror */

      request.onerror = function()
      {
        //GFlib.alert('Whoops! I\'m Error.');
        if (!processed) processRespond(-1);
      };


    /* removePurged: dispatchRequest: request.onreadystatechange */

      request.onreadystatechange = function()
      {
        if (!processed && request.readyState >= 3)
        {
          if (!checkMessageBody && /^\s*[^<\s]/.test(request.responseText)) // Not (X)HTML
          {
            if (/maintenance/i.test(request.responseText))
            {
              processed = true;
              request.abort();
              processRespond(503);
            }
            else if (/Internal Error|Database error/i.test(request.responseText))
            {
              processed = true;
              request.abort();
              processRespond(500);
            }
            else if (/Too many connections?/i.test(request.responseText))
            {
              processed = true;
              request.abort();
              processRespond(504);
            }
          }
          if (!checkMessageBody && /<\/title>/i.test(request.responseText))
          {
            if (/<title>404 Not Found<\/title>/i.test(request.responseText))
            {
              processed = true;
              request.abort();
              processRespond(-404);
            }
            else if (/<title\b[^>]*>[^<]*\b(Error\W*404|404\W*Error)\b[^<]*<\/title>/i.test(request.responseText))
            {
              processed = true;
              request.abort();
              processRespond(404); //-> this is an old behaviour, now is not like this anymore. Need to be cleaned up?!
            }
            else if (/<title\b[^>]*>[^<]*\b(Error\W*403|403\W*Error)\b[^<]*<\/title>/i.test(request.responseText))
            {
              processed = true;
              request.abort();
              processRespond(403);
            }
            else if (/<title\b[^>]*>[^<]*\b(Error\W*401|401\W*Error)\b[^<]*<\/title>/i.test(request.responseText))
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
          else if (!checkMessageBody && /<\/head>/i.test(request.responseText))
          {
            processed = true;
            request.abort();
            processRespond(302);
          }
          else if (request.readyState == 4 && !processed)
          {
            if (!/\S/.test(request.responseText))
            {
              processRespond(0);
            }
            else if (checkMessageBody)
            {
              if (/<table\b[^>]*\bclass=['"]?messages?['"]?\b[^>]*>/i.test(request.responseText))
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
      GFlib.alert('Nothing to delete.');
      return;
    }

    this.read();

    tagIDs.forEach(function(element, index, array)
    {
      IDs = element.split(',');

      if (!IDs[1] && delFolder && typeof(GFtags.tags[IDs[0]].title) == 'string')
      {
        if (GFlib.confirm('Are you sure you want to delete this board and its topics?\n\nBoard ID: ' + IDs[0] + '\nBoard Name: ' + GFtags.tags[IDs[0]].title))
        {
          delete GFtags.tags[IDs[0]];
        }
      }
      else if (IDs[1] && typeof(GFtags.tags[IDs[0]].topics[IDs[1]]) == 'string')
      {
        delete GFtags.tags[IDs[0]].topics[IDs[1]];
      }
    });

    this.write(this.tags);
    this.populate(2);
  },

  add: function(event)
  {
    var doc = event.target.ownerDocument;
    var queryStr = doc.location.search;
    var boardTitle = false;
    var topicTitle = false;

    if (event.type == 'dblclick')
      event.preventDefault();

    var onMyPosts = GFlib.onPage(doc, 'myposts');
    var onTracked = GFlib.onPage(doc, 'tracked');
    var onTopicList = !onMyPosts
        && doc.evaluate('//div[@class="board_nav"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue != null
        && doc.evaluate('//table[@class="topics"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue != null;

    if (onTopicList || onMyPosts)
    {
      try
      {
        var node = event.target;

        while (node.nodeName.toLowerCase() != 'td')
        {
          node = node.parentNode;
        }

        var topicLink = node.parentNode.cells[1].getElementsByTagName('a')[0];
        queryStr = topicLink.href;
        topicTitle = topicLink.textContent.trim();

        if (onMyPosts)
        {
          boardTitle = node.parentNode.cells[0].innerHTML.
            replace(/<\/?a\b[^>]*>/ig, '').trim();
        }
        else if (onTracked)
        {
          boardTitle = node.parentNode.cells[2].innerHTML.
            replace(/<\/?a\b[^>]*>/ig, '').trim();
        }
      }
      catch (e) { return false; }
    }

    var boardID     = queryStr.match(/\bboard=([0-9-]+)/)[1];
    var topicID     = queryStr.match(/\btopic=([0-9]+)/)[1];
    var tagID       = boardID + ',' + topicID;

    var h1s         = doc.getElementsByTagName('h1');
    if (!boardTitle)
    {
      boardTitle = h1s[0].textContent.trim();
    }
    if (!topicTitle)
    {
      topicTitle = h1s[1].textContent.trim();
    }

    GFtags.read();

    if (boardID in GFtags.tags && topicID in GFtags.tags[boardID].topics)
    {
      if (GFlib.confirm('You have already tagged this topic!\nDo you wish to un-tag it?'))
      {
        GFtags.remove(tagID);
        return false;
      }

      return true;
    }

    if (boardID in GFtags.tags)
    {
      if (!onTracked)
      { // overwrite if not on tracked topics - fixes abbreviated board titles
        //   from tracked topics and changed board titles, if that happens
        GFtags.tags[boardID].title = boardTitle;
      }
    }
    else
    {
      GFtags.tags[boardID] = {title: boardTitle, topics: {}};
    }
    GFtags.tags[boardID].topics[topicID] = topicTitle;

    GFtags.write(GFtags.tags);
    return true;
  },

  tagTopicLink: function(doc)
  {
    this.read();
    var queryStr = doc.location.search;
    var boardID = queryStr.match(/\bboard=([0-9-]+)/)[1];
    var topicID = queryStr.match(/\btopic=([0-9]+)/)[1];
    var tagID = boardID + ',' + topicID;

    var a = doc.createElement('a');
        a.setAttribute('id', 'gamefox-tag-link');
        a.setAttribute('href', '#' + tagID);

    if (boardID in this.tags && topicID in this.tags[boardID].topics)
    {
      a.textContent = 'Untag Topic';
      a.addEventListener('click', this.untagTopicEvent, false);
    }
    else
    {
      a.textContent = 'Tag Topic';
      a.addEventListener('click', this.tagTopicEvent, false);
    }

    return a;
  },

  tagTopicEvent: function(event)
  {
    event.preventDefault();
    if (GFtags.add(event))
    {
      event.target.removeEventListener('click', GFtags.tagTopicEvent, false);
      event.target.addEventListener('click', GFtags.untagTopicEvent, false);
      event.target.textContent = 'Untag Topic';
    }
  },

  untagTopicEvent: function(event)
  {
    event.preventDefault();
    GFtags.remove(event.target.hash.substr(1));

    event.target.removeEventListener('click', GFtags.untagTopicEvent, false);
    event.target.addEventListener('click', GFtags.tagTopicEvent, false);
    event.target.textContent = 'Tag Topic';
  }
};
