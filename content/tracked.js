/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2009 Brian Marshall
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
  updateList: function()
  {
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
        for (var i = 0; i < items.length; i++)
        {
          var ids = GFutils.parseQueryString(items[i].
              getElementsByTagName('link')[0].textContent);
          var title = items[i].getElementsByTagName('title')[0].textContent;

          var topic = {
            id: ids['topic'],
            title: title.substr(0, title.lastIndexOf('-') - 2),
            age: title.substr(title.lastIndexOf('-') + 2)
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
            list[ids['board']] = {name: topic['board'], topics: []};
          list[ids['board']]['topics'].push(topic);
        }

        GFlib.prefs.setCharPref('tracked.list', list.toSource());
      }
    }
    request.send(null);
  },

  populateMenu: function()
  {
    var item, topic;
    var trackedMenu = document.getElementById('gamefox-tracked-menu');

    while (trackedMenu.hasChildNodes())
      trackedMenu.removeChild(trackedMenu.firstChild);

    item = document.createElement('menuitem');
    item.setAttribute('label', 'Update');
    item.setAttribute('oncommand', 'GFtracked.updateList()');
    trackedMenu.appendChild(item);

    var firstTopic = true;
    var list = eval(GFlib.prefs.getCharPref('tracked.list'));
    for (var i in list)
    {
      for (var j = 0; j < list[i]['topics'].length; j++)
      {
        if (firstTopic)
        {
          trackedMenu.appendChild(document.createElement('menuseparator'));
          firstTopic = false;
        }

        topic = list[i]['topics'][j];

        item = document.createElement('menuitem');
        item.setAttribute('label', topic['title']);
        item.setAttribute('oncommand',
            'GFlib.open("' + i + ',' + topic['id'] + '", 2)');
        trackedMenu.appendChild(item);
      }
    }
  },

  populateTree: function()
  {
    var tree = document.getElementById('gamefox-tracked-rows');
    var list = eval(GFlib.prefs.getCharPref('tracked.list'));

    if (!tree)
      return;

    while (tree.hasChildNodes())
      tree.removeChild(tree.firstChild);

    for (board in list)
    {
      var children = document.createElement('treechildren');
      var item = document.createElement('treeitem');
      var row = document.createElement('treerow');
      var cell1 = document.createElement('treecell');
      var cell2 = document.createElement('treecell');

      item.setAttribute('container', 'true');
      item.setAttribute('open', 'true');

      cell1.setAttribute('label', list[board].name);
      cell2.setAttribute('label', board);

      row.appendChild(cell1);
      row.appendChild(cell2);
      item.appendChild(row);

      for (var i = 0; i < list[board].topics.length; i++)
      {
        var childItem = document.createElement('treeitem');
        var row = document.createElement('treerow');
        var cell1 = document.createElement('treecell');
        var cell2 = document.createElement('treecell');

        cell1.setAttribute('label', list[board].topics[i].title);
        cell2.setAttribute('label', board + ',' + list[board].topics[i].id);

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
        if (request.responseText.indexOf('now tracking') != -1)
          var result = 'start';
        else if (request.responseText.indexOf('no longer tracking') != -1)
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
  }
};
