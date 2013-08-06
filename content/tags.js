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

var gamefox_tags =
{
  tags: '',

  read: function()
  {
    this.tags = gamefox_lib.getString('tags');

    if (!/\S/.test(this.tags))
      this.tags = '{}';

    this.tags = gamefox_lib.parseJSON(this.tags);
  },

  write: function(tags)
  {
    if (typeof(tags) == 'object')
      tags = JSON.stringify(tags);

    gamefox_lib.setString('tags', tags);
  },

  init: function()
  {
    this.populateTree();
    new gamefox_pref_observer('tags', this.populateTree);
  },

  populateTree: function()
  {
    var tagList, board, topic, item, childItem, children, row, cell1, cell2;

    tagList = document.getElementById('gamefox-tags-rows');

    while (tagList.hasChildNodes())
      tagList.removeChild(tagList.firstChild);

    gamefox_tags.read();

    for (board in gamefox_tags.tags)
    {
      children = document.createElement('treechildren');
      item     = document.createElement('treeitem');
      row      = document.createElement('treerow');
      cell1    = document.createElement('treecell');
      cell2    = document.createElement('treecell');
      item.setAttribute('container', 'true');
      item.setAttribute('open', 'true');
      cell1.setAttribute('label', gamefox_tags.tags[board].title);
      cell2.setAttribute('label', board);
      row.appendChild(cell1);
      row.appendChild(cell2);
      item.appendChild(row);

      for (topic in gamefox_tags.tags[board].topics)
      {
        childItem = document.createElement('treeitem');
        row       = document.createElement('treerow');
        cell1     = document.createElement('treecell');
        cell2     = document.createElement('treecell');
        cell1.setAttribute('label', gamefox_tags.tags[board].topics[topic]);
        cell2.setAttribute('label', board + ',' + topic);
        row.appendChild(cell1);
        row.appendChild(cell2);
        childItem.appendChild(row);
        children.appendChild(childItem);
      }

      item.appendChild(children);
      tagList.appendChild(item);
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
        gamefox_lib.open(tagID, 0); // new tab
        break;
      case 1:
        gamefox_lib.open(tagID, 1); // new focused tab
        break;
      case 2:
        gamefox_lib.open(tagID, 2); // focused tab
        break;
      case 3:
        gamefox_lib.open(tagID, 3); // new window
        break;
      case 4:
        this.remove(tagID, tree.view.isContainer(index));
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
    if (gamefox_lib.confirm('Are you sure you want to delete all your tags?'))
      this.write('');
  },

  removePurged: function()
  {
    this.read();
    const errNumber  = [ -404, -1, 0, 302, 401, 403, 500, 503, 504, 555 ];
    var err          = [    0,  0, 0,   0,   0,   0,   0,   0,   0,   0 ];
    const errMsgs = [
      'the requested URL was not found. Alert the creator',
      'the purge process was aborted or encountered an error',
      'the request timed out',
      'no topic title was found. Alert the creator',
      'of unauthorized access. You shouldn\'t get this error to begin with',
      'of insufficient user privilege. Higher user level or permit is required',
      'of internal or database error',
      'the site is temporarily down for maintenance',
      'the site complained getting too many connections',
      'of an unknown or new error. You may safely assume that the problem came from GameFAQs alone'
    ];
    var IDs          = 0;
    var processedIDs = 0;
    var button       = document.getElementById('gamefox-purge');
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
            err[errNumber.indexOf(status)]++;
            break;
        }

        if (processedIDs == IDs)
        {
          button.disabled = false;

          var msg;

          if (remove.length)
          {
            gamefox_tags.remove(remove);
            msg = 'Successfully deleted ' + remove.length + ' purged topics.\n\n';
          }
          else
          {
            msg = 'No purged topics.\n\n';
          }

          for (var i = 0; i < err.length; i++)
          {
            if (err[i])
              msg += err[i] + ' topics were skipped because ' + errMsgs[i] + '.\n';
          }

          gamefox_lib.alert(msg);
        }
      }


    /* removePurged: dispatchRequest: open request */

      //request.open('GET', gamefox_lib.domain + gamefox_lib.path + 'genmessage.php?board=' + board + '&topic=' + topic);
      request.open('GET', gamefox_lib.domain + gamefox_lib.path + board + '-/' + topic);
      gamefox_lib.forceAllowThirdPartyCookie(request);

    /* removePurged: dispatchRequest: request.onerror */

      request.onerror = function()
      {
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
              if (/<table\b[^>]*\bclass="(board )?message( msg)?"[^>]*>/i.test(request.responseText))
              {
                processRespond(200);
              }
              else // not on message list - probably deleted
                processRespond(404);
            }
            else
              processRespond(555);
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
          button.disabled = true;
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
      gamefox_lib.alert('Nothing to delete.');
      return;
    }

    this.read();

    tagIDs.forEach(function(element, index, array)
    {
      IDs = element.split(',');

      if (!IDs[1] && delFolder && typeof(gamefox_tags.tags[IDs[0]].title) == 'string')
      {
        if (gamefox_lib.confirm('Are you sure you want to delete this board and its topics?\n\nBoard ID: ' + IDs[0] + '\nBoard Name: ' + gamefox_tags.tags[IDs[0]].title))
        {
          delete gamefox_tags.tags[IDs[0]];
        }
      }
      else if (IDs[1] && typeof(gamefox_tags.tags[IDs[0]].topics[IDs[1]]) == 'string')
      {
        delete gamefox_tags.tags[IDs[0]].topics[IDs[1]];
      }
    });

    this.write(this.tags);
  },

  add: function(event)
  {
    var doc = event.target.ownerDocument;
    var boardTitle, topicTitle;
    var strbundle = document.getElementById('gamefox-overlay-strings');

    if (event.type == 'dblclick')
      event.preventDefault();

    var onMyPosts = gamefox_lib.onPage(doc, 'myposts');
    var onTracked = gamefox_lib.onPage(doc, 'tracked');

    if (gamefox_lib.onPage(doc, 'topics') || onMyPosts)
    {
      // From context menu
      try
      {
        var node = event.target;

        while (node.nodeName.toLowerCase() != 'td')
          node = node.parentNode;

        var topicLink = node.parentNode.cells[1].getElementsByTagName('a')[0];

        var params = gamefox_utils.parseBoardLink(topicLink.href);
        var boardID = params['board'], topicID = params['topic'];
        var tagID = boardID + ',' + topicID;

        topicTitle = topicLink.textContent.trim();

        if (onMyPosts)
          boardTitle = node.parentNode.cells[0].textContent.trim();
        else if (onTracked)
          boardTitle = node.parentNode.cells[2].textContent.trim();
      }
      catch (e) {
        gamefox_lib.alert(strbundle.getString('tagError'));
        return false;
      }
    }

    if (!tagID)
    {
      if (event.target.hash) // tag topic link
      {
        var tagID = event.target.hash.substr(1);
        var boardID = tagID.split(',')[0], topicID = tagID.split(',')[1];
      }
      else // context menu
      {
        var path = doc.location.pathname;
        var params = gamefox_utils.parseBoardLink(path);
        var boardID = params['board'], topicID = params['topic'];
        var tagID = boardID + ',' + topicID;
      }
    }

    if (!boardTitle)
      boardTitle = gamefox_utils.getBoardName(doc);
    if (!topicTitle)
      topicTitle = gamefox_utils.getPageHeader(doc);

    gamefox_tags.read();

    if (boardID in gamefox_tags.tags && topicID in gamefox_tags.tags[boardID].topics)
    {
      if (gamefox_lib.confirm('You have already tagged this topic!\nDo you wish to un-tag it?'))
      {
        gamefox_tags.remove(tagID);
        return false;
      }

      return true;
    }

    if (boardID in gamefox_tags.tags)
    {
      if (!onTracked)
      { // overwrite if not on tracked topics - fixes abbreviated board titles
        //   from tracked topics and changed board titles, if that happens
        gamefox_tags.tags[boardID].title = boardTitle;
      }
    }
    else
    {
      gamefox_tags.tags[boardID] = {title: boardTitle, topics: {}};
    }
    gamefox_tags.tags[boardID].topics[topicID] = topicTitle;

    gamefox_tags.write(gamefox_tags.tags);
    return true;
  },

  tagTopicLink: function(doc)
  {
    this.read();
    var path = doc.location.pathname;
    var IDs = gamefox_utils.parseBoardLink(path);
    if (IDs)
      var boardID = IDs['board'], topicID = IDs['topic'];
    else
      var boardID = 0, topicID = 0;
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
    var strbundle = document.getElementById('gamefox-overlay-strings');

    event.preventDefault();
    if (gamefox_tags.add(event))
    {
      event.target.removeEventListener('click', gamefox_tags.tagTopicEvent, false);
      event.target.addEventListener('click', gamefox_tags.untagTopicEvent, false);
      event.target.textContent = 'Untag Topic';
    }
    else
      gamefox_lib.alert(strbundle.getString('tagError'));
  },

  untagTopicEvent: function(event)
  {
    event.preventDefault();
    gamefox_tags.remove(event.target.hash.substr(1));

    event.target.removeEventListener('click', gamefox_tags.untagTopicEvent, false);
    event.target.addEventListener('click', gamefox_tags.tagTopicEvent, false);
    event.target.textContent = 'Tag Topic';
  }
};
