/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2009 Brian Marshall, Michael Ryan
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

var GFtracked =
{
  list: {},

  read: function()
  {
    this.list = eval(GFlib.prefs.getCharPref('tracked.list'));

    // this.list will be undefined if the pref value isn't an object
    if (!this.list)
      this.list = {};
  },

  save: function()
  {
    GFlib.prefs.setCharPref('tracked.list', this.list.toSource());
  },

  updateList: function()
  {
    if (!GFlib.isLoggedIn())
    {
      GFlib.alert('Could not update your tracked topics because you aren\'t logged in.');
      return;
    }

    // Because of how the RSS feed works without cookies, we could have an
    // option to always update from a certain account. This won't work well for
    // removing or adding tracked topics though.
    if (GFlib.prefs.getCharPref('tracked.lastAccount')
        != GFlib.prefs.getCharPref('accounts.current'))
    { // cached url is out of date
      var request = new XMLHttpRequest();
      request.open('GET', 'http://www.gamefaqs.com/boards/tracked.php');
      var ds = GFlib.thirdPartyCookieFix(request);
      request.onreadystatechange = function()
      {
        if (request.readyState == 4)
        {
          var url = request.responseText.
            match(/<link rel="alternate"[^>]*href="([^"]+)" \/>/)[1];

          // cache it
          GFlib.prefs.setCharPref('tracked.rssUrl', url);
          GFlib.prefs.setCharPref('tracked.lastAccount',
              GFlib.prefs.getCharPref('accounts.current'));

          GFtracked.grabFromRSS(url);
        }
      }
      request.send(null);
    }
    else
    {
      // use cached url
      GFtracked.grabFromRSS(GFlib.prefs.getCharPref('tracked.rssUrl'));
    }
  },

  grabFromRSS: function(url)
  {
    var request = new XMLHttpRequest();
    request.open('GET', url);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        var xmlobject = (new DOMParser()).parseFromString(request.
            responseText, 'text/xml');
        var items = xmlobject.getElementsByTagName('item');
        var list = {};
        GFtracked.read();
        for (var i = 0; i < items.length; i++)
        {
          var ids = GFutils.parseQueryString(items[i].
              getElementsByTagName('link')[0].textContent);
          var title = items[i].getElementsByTagName('title')[0].textContent;

          // keep hold status
          if (GFtracked.list[ids['board']]
              && GFtracked.list[ids['board']].topics[ids['topic']]
              && GFtracked.list[ids['board']].topics[ids['topic']].hold)
            var hold = true;
          else
            var hold = false;

          var topic = {
            title: title.substr(0, title.lastIndexOf('-') - 2),
            age: title.substr(title.lastIndexOf('-') + 2),
            hold: hold,
            deleted: false
          };
          var data = new Array(
              'Last Post', 'lastPost',
              'Messages', 'msgs',
              'Board', 'board'
              );
          var desc = items[i].getElementsByTagName('description')[0].
            textContent;
          for (var j = 0; j < data.length; j += 2)
          {
            topic[data[j + 1]] = (new RegExp(data[j] + ': ([^\\0]*?)\n')).
              exec(desc)[1].replace(/<br \/>/g, '').GFtrim();
          }

          if (!list[ids['board']])
            list[ids['board']] = {name: topic['board'], topics: {}};
          list[ids['board']]['topics'][ids['topic']] = topic;
        }

        // check deleted topics
        for (var i in GFtracked.list)
        {
          for (var j in GFtracked.list[i].topics)
          {
            if (list[i] && list[i].topics[j]) continue; // topic still exists

            var topic = GFtracked.list[i].topics[j];

            if (!topic.hold) continue; // topic isn't held

            if (!list[i])
            {
              // board has been removed from tracked list
              list[i] = {name: GFtracked.list[i].name, topics: {}};
            }

            topic.deleted = true;
            list[i].topics[j] = topic;
          }
        }

        GFtracked.list = list;
        GFtracked.save();
      }
    }
    request.send(null);
  },

  populateMenu: function()
  {
    var item, topic;
    var trackedMenu = document.getElementById('gamefox-tracked-menu');
    var strbundle = document.getElementById('strings');

    while (trackedMenu.hasChildNodes())
      trackedMenu.removeChild(trackedMenu.firstChild);

    item = document.createElement('menuitem');
    item.setAttribute('label', strbundle.getString('updateTracked'));
    item.setAttribute('oncommand', 'GFtracked.updateList()');
    trackedMenu.appendChild(item);

    this.read();
    var firstTopic = true;
    for (var i in this.list)
    {
      for (var j in this.list[i].topics)
      {
        if (firstTopic)
        {
          trackedMenu.appendChild(document.createElement('menuseparator'));
          firstTopic = false;
        }

        topic = this.list[i].topics[j];

        item = document.createElement('menuitem');
        item.setAttribute('label', topic['title']);
        item.setAttribute('oncommand',
            'GFlib.open("' + i + ',' + j + '", 2)');
        trackedMenu.appendChild(item);
      }
    }
  },

  populateTree: function()
  {
    var tree = document.getElementById('gamefox-tracked-rows');

    if (!tree)
      return;

    while (tree.hasChildNodes())
      tree.removeChild(tree.firstChild);

    this.read();
    for (board in this.list)
    {
      var children = document.createElement('treechildren');
      var item = document.createElement('treeitem');
      var row = document.createElement('treerow');
      var cell1 = document.createElement('treecell');
      var cell2 = document.createElement('treecell');

      item.setAttribute('container', 'true');
      item.setAttribute('open', 'true');

      cell1.setAttribute('label', this.list[board].name);
      cell2.setAttribute('label', board);

      row.appendChild(cell1);
      row.appendChild(cell2);
      item.appendChild(row);

      for (var topic in this.list[board].topics)
      {
        var childItem = document.createElement('treeitem');
        var row = document.createElement('treerow');
        var cell1 = document.createElement('treecell');
        var cell2 = document.createElement('treecell');

        if (this.list[board].topics[topic].deleted)
          row.setAttribute('properties', 'deleted');
        else if (this.list[board].topics[topic].hold)
          row.setAttribute('properties', 'hold');

        cell1.setAttribute('label', this.list[board].topics[topic].title);
        cell2.setAttribute('label', board + ',' + topic);

        row.appendChild(cell1);
        row.appendChild(cell2);

        childItem.appendChild(row);
        children.appendChild(childItem);
      }

      item.appendChild(children);
      tree.appendChild(item);
    }
  },

  treeAction: function(type, dblclick)
  {
    var tree = document.getElementById('gamefox-tracked-tree');
    var index = tree.view.selection.currentIndex;

    if (index == -1 || (tree.view.isContainer(index) && dblclick))
      return;

    var tagID = tree.view.getCellText(index,
        tree.columns.getNamedColumn('gamefox-tracked-tagid'));
    var topic = tagID.split(',');

    switch (type)
    {
      case 0:
        GFlib.open(tagID, 0); // new tab
        break;
      case 1:
        GFlib.open(tagID, 1); // new focused tab
        break;
      case 2:
        GFlib.open(tagID, 2); // focused tab
        break;
      case 3:
        GFlib.open(tagID, 3); // new window
        break;
      case 4:
        GFtracked.holdTopic(topic[0], topic[1]);
        break;
      case 5:
        GFtracked.deleteTopic(topic[0], topic[1]);
        break;
    }
  },

  linkListener: function(event)
  {
    // Prevent the link from loading, make our own XMLHttpRequest to stop/start
    // tracking and update the cached tracked list
    event.preventDefault();

    var request = new XMLHttpRequest();
    request.open('GET', this.href);
    var ds = GFlib.thirdPartyCookieFix(request);
    var link = this;
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (GFtracked.trackResponse(request.responseText, 'tracktopic'))
          var result = 'start';
        else if (GFtracked.trackResponse(request.responseText, 'stoptrack'))
          var result = 'stop';
        else
          var result = 'error';

        if (result != 'error')
        {
          if (result == 'start')
          {
            link.textContent = 'Stop Tracking';
            link.href = link.href.replace(/tracktopic/, 'stoptrack');
          }
          else
          {
            link.textContent = 'Track Topic';
            link.href = link.href.replace(/stoptrack/, 'tracktopic');
          }
          GFtracked.updateList();
        }
        else
          GFlib.alert('An error occurred tracking or stopping tracking of this topic.');
      }
    }
    request.send(null);
  },

  isTracked: function(board, topic)
  {
    this.read();

    return !!(this.list[board] && topic in this.list[board].topics);
  },

  addFromContextMenu: function(event)
  {
    var doc = GFlib.getDocument(event);

    if (GFlib.onPage(doc, 'topics') || GFlib.onPage(doc, 'myposts'))
    {
      var node = event.target;
      while (node.nodeName != 'TD')
        node = node.parentNode;

      var topic = GFutils.parseQueryString(node.parentNode.cells[1].
          getElementsByTagName('a')[0].href);

      var untrack = GFtracked.isTracked(topic['board'], topic['topic']);
    }
    else if (GFlib.onPage(doc, 'messages'))
    {
      var topic = GFutils.parseQueryString(doc.location.search);

      var userNav = doc.evaluate('//div[@class="board_nav"]//div[@class="user"]',
          doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var trackLink = doc.evaluate('./a[contains(@href, "track")]', userNav,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      var untrack = trackLink.href.indexOf('stoptrack') != -1;
    }

    var request = new XMLHttpRequest();
    request.open('GET', GFlib.domain + GFlib.path + 'genmessage.php?board='
        + topic['board'] + '&topic=' + topic['topic'] + '&action=' +
        (untrack ? 'stoptrack' : 'tracktopic'));
    var ds = GFlib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        if (GFtracked.trackResponse(request.responseText, 'tracktopic'))
          var result = 'start';
        else if (GFtracked.trackResponse(request.responseText, 'stoptrack'))
          var result = 'stop';
        else
          var result = 'error';

        if (result != 'error')
        {
          GFtracked.updateList();

          if (GFlib.onPage(doc, 'messages'))
          {
            if (result == 'start')
            {
              trackLink.textContent = 'Stop Tracking';
              trackLink.href = trackLink.href.replace(/tracktopic/, 'stoptrack');
            }
            else
            {
              trackLink.textContent = 'Track Topic';
              trackLink.href = trackLink.href.replace(/stoptrack/, 'tracktopic');
            }
          }
        }
        else
          GFlib.alert('An error occurred tracking or stopping tracking of this topic.');
      }
    }
    request.send(null);
  },

  holdTopic: function(board, topic)
  {
    this.read();

    if (!this.list[board].topics[topic])
      return;

    this.list[board].topics[topic].hold = !this.list[board].topics[topic].hold;

    this.save();
  },

  deleteTopic: function(boardId, topicId)
  {
    this.read();

    var topic = this.list[boardId].topics[topicId];
    if (!topic.deleted)
    {
      var request = new XMLHttpRequest();
      request.open('GET', GFlib.domain + GFlib.path + 'genmessage.php?board='
          + boardId + '&topic=' + topicId + '&action=stoptrack');
      var ds = GFlib.thirdPartyCookieFix(request);
      request.onreadystatechange = function()
      {
        if (request.readyState == 4)
        {
          if (request.responseText.indexOf('no longer tracking') != -1)
            GFtracked.updateList();
          else
            GFlib.alert('An error occurred stopping tracking of this topic.');
        }
      }
      request.send(null);
    }
    else
    {
      delete this.list[boardId].topics[topicId];

      if (!this.list[boardId].topics.__count__)
        delete this.list[boardId]; // board is empty

      this.save();
    }
  },

  displayTreeMenu: function()
  {
    var tree = document.getElementById('gamefox-tracked-tree');
    var index = tree.view.selection.currentIndex;

    if (index == -1)
      return;

    GFtracked.read();

    var tagID = tree.view.getCellText(index,
        tree.columns.getNamedColumn('gamefox-tracked-tagid')).split(',');
    var topic = GFtracked.list[tagID[0]].topics[tagID[1]];

    if (!tagID[1]) // board
    {
      document.getElementById('gamefox-tracked-contextmenu-hold')
        .hidden = true;
      document.getElementById('gamefox-tracked-contextmenu-stop')
        .hidden = true;
      return;
    }
    else // topic
    {
      document.getElementById('gamefox-tracked-contextmenu-hold')
        .hidden = false;
      document.getElementById('gamefox-tracked-contextmenu-stop')
        .hidden = false;
    }

    var menuItem = document.getElementById('gamefox-tracked-contextmenu-hold');
    var strbundle = document.getElementById('strings');
    menuItem.accessKey = strbundle.getString('holdAccessKey');
    if (!topic.hold)
      menuItem.label = strbundle.getString('hold');
    else
      menuItem.label = strbundle.getString('unhold');
  },

  trackResponse: function(str, action)
  {
    switch (action)
    {
      case 'tracktopic':
        return str.indexOf('<div id="board_wrap">\n\n\n<p>You are now'
            + ' tracking this topic.</p>') != -1;
      case 'stoptrack':
        return str.indexOf('<div id="board_wrap">\n\n\n<p>You are no'
            + ' longer tracking this topic.</p>') != -1;
    }

    return false;
  }
};
