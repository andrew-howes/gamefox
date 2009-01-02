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
  grabFromRSS: function()
  {
    var urlRequest = new XMLHttpRequest();
    urlRequest.open('GET', 'http://www.gamefaqs.com/boards/tracked.php');
    urlRequest.onreadystatechange = function()
    {
      if (urlRequest.readyState == 4)
      {
        var url = urlRequest.responseText.
          match(/<link rel="alternate"[^>]*href="([^"]+)" \/>/)[1];

        var rssRequest = new XMLHttpRequest();
        rssRequest.open('GET', url);
        rssRequest.onreadystatechange = function()
        {
          if (rssRequest.readyState == 4)
          {
            var xmlobject = (new DOMParser()).parseFromString(rssRequest.
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
        rssRequest.send(null);
      }
    }
    urlRequest.send(null);
  },

  populate: function()
  {
    var item, topic;
    var trackedMenu = document.getElementById('gamefox-tracked-menu');

    while (trackedMenu.hasChildNodes())
      trackedMenu.removeChild(trackedMenu.firstChild);

    item = document.createElement('menuitem');
    item.setAttribute('label', 'Update');
    item.setAttribute('oncommand', 'GFtracked.grabFromRSS()');
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
  }
};
