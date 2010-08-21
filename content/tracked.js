/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2009, 2010 Brian Marshall, Michael Ryan
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

var gamefox_tracked =
{
  list: {},

  read: function()
  {
    this.list = gamefox_lib.safeEval(gamefox_lib.getString('tracked.list'));

    // this.list will be undefined if the pref value isn't an object
    if (!this.list)
      this.list = {};
  },

  save: function()
  {
    gamefox_lib.setString('tracked.list', gamefox_lib.toJSON(this.list));
  },

  accountChanged: function()
  {
    var lastAccount = gamefox_lib.prefs.getCharPref('tracked.lastAccount');
    var currentAccount = gamefox_lib.prefs.getCharPref('accounts.current');

    return !currentAccount.length || lastAccount != currentAccount;
  },

  updateList: function()
  {
    if (!gamefox_lib.isLoggedIn())
    {
      gamefox_lib.alert('Could not update your tracked topics because you aren\'t logged in.');
      return;
    }

    var currentAccount = gamefox_lib.prefs.getCharPref('accounts.current');

    // Because of how the RSS feed works without cookies, we could have an
    // option to always update from a certain account. This won't work well for
    // removing or adding tracked topics though.
    if (gamefox_tracked.accountChanged())
    { // cached url is out of date
      if (!gamefox_lib.thirdPartyCookiePreCheck())
        return;
      var request = new XMLHttpRequest();
      request.open('GET', gamefox_lib.domain + gamefox_lib.path + 'tracked.php');
      var ds = gamefox_lib.thirdPartyCookieFix(request);
      request.onreadystatechange = function()
      {
        if (request.readyState == 4)
        {
          // TODO: don't hardcode - escape gamefox_lib.domain/path
          var url = /<link rel="alternate"[^>]*href="(http:\/\/www\.gamefaqs\.com\/boards\/tracked\.xml\?user=\d+&key=[^"]+)" \/>/
            .exec(request.responseText);
          if (url)
          {
            url = url[1];

            // cache it
            if (currentAccount.length)
            {
              gamefox_lib.prefs.setCharPref('tracked.rssUrl', url);
              gamefox_lib.prefs.setCharPref('tracked.lastAccount', currentAccount);
            }

            gamefox_tracked.grabFromRSS(url);
          }
        }
      }
      request.send(null);
    }
    else
    {
      // use cached url
      gamefox_tracked.grabFromRSS(gamefox_lib.prefs.getCharPref('tracked.rssUrl'));
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
        var year = new Date().getFullYear();
        var prevLastPost = 0;

        var xmlobject = (new DOMParser()).parseFromString(request.
            responseText, 'text/xml');
        var items = xmlobject.getElementsByTagName('item');
        var list = {};
        gamefox_tracked.read();
        for (var i = 0; i < items.length; i++)
        {
          var title = items[i].getElementsByTagName('title')[0].textContent;
          var link = items[i].getElementsByTagName('link')[0].textContent;
          var ids = gamefox_utils.parseBoardLink(link);

          // keep hold status
          if (gamefox_tracked.list[ids['topic']] &&
              gamefox_tracked.list[ids['topic']].hold)
            var hold = true;
          else
            var hold = false;

          var topic = {
            title: title.substr(0, title.lastIndexOf('-') - 2),
            boardId: ids.board,
            link: link,
            age: title.substr(title.lastIndexOf('-') + 2),
            hold: hold,
            deleted: false,
            newPosts: false
          };
          var data = new Array(
              'Last Post', 'lastPost',
              'Messages', 'msgs',
              'Board', 'boardName'
              );
          var desc = items[i].getElementsByTagName('description')[0].
            textContent;
          for (var j = 0; j < data.length; j += 2)
          {
            topic[data[j + 1]] =
                (new RegExp(data[j] + ': ([^\\0]*?)\n')).
                exec(desc)[1].replace(/<br \/>/g, '').trim();
          }

          // check for year change
          if (prevLastPost != 0 &&
              prevLastPost < gamefox_date.strtotime(topic.lastPost).getTime())
          {
            // this entry is more recent than the last entry, which should
            // only happen when the year is different
            --year;
          }
          prevLastPost = gamefox_date.strtotime(topic.lastPost).getTime();
          topic.lastPostYear = year;

          // check for new posts and preserve previous newPosts status
          if (gamefox_tracked.list[ids['topic']]
              && (topic.msgs != gamefox_tracked.list[ids['topic']].msgs
                  || gamefox_tracked.list[ids['topic']].newPosts))
            topic.newPosts = true;

          list[ids['topic']] = topic;
        }

        // check deleted topics
        for (var i in gamefox_tracked.list)
        {
          var topic = gamefox_tracked.list[i];

          if (topic) continue; // topic still exists
          if (!topic.hold) continue; // topic isn't held

          topic.deleted = true;
          list[i] = topic;
        }

        gamefox_tracked.list = list;
        gamefox_tracked.save();
        gamefox_lib.prefs.setIntPref('tracked.lastUpdate',
            Math.floor(Date.now() / 1000));
      }
    }
    request.send(null);
  },

  linkListener: function(event)
  {
    // Prevent the link from loading, make our own XMLHttpRequest to stop/start
    // tracking and update the cached tracked list
    event.preventDefault();

    var request = new XMLHttpRequest();
    request.open('GET', this.href);
    var ds = gamefox_lib.thirdPartyCookieFix(request);
    var link = this;
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        var result = gamefox_tracked.trackResponse(request.responseText);

        if (result[0])
        {
          if (result[1] == 'tracktopic')
          {
            link.textContent = 'Stop Tracking';
            link.href = link.href.replace(/tracktopic/, 'stoptrack');
          }
          else
          {
            link.textContent = 'Track Topic';
            link.href = link.href.replace(/stoptrack/, 'tracktopic');
          }
          gamefox_tracked.updateList();
        }
        else
          gamefox_lib.alert('An error occurred while tracking or untracking this '
              + 'topic.\n\n' + result[1]);
      }
    }
    request.send(null);
  },

  isTracked: function(topicId)
  {
    this.read();

    return !!(topicId in this.list);
  },

  addFromContextMenu: function(event)
  {
    var doc = gamefox_lib.getDocument(event);

    if (gamefox_lib.onPage(doc, 'topics') || gamefox_lib.onPage(doc, 'myposts'))
    {
      var node = event.target;
      while (node.nodeName != 'TD')
        node = node.parentNode;

      var ids = gamefox_utils.parseBoardLink(node.parentNode.cells[1].
          getElementsByTagName('a')[0].href);

      var untrack = gamefox_tracked.isTracked(ids['topic']);
    }
    else if (gamefox_lib.onPage(doc, 'messages'))
    {
      var ids = gamefox_utils.parseBoardLink(doc.location.pathname);

      var userNav = doc.evaluate('//div[@class="board_nav"]//div[@class="user"]',
          doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      var trackLink = doc.evaluate('./a[contains(@href, "track")]', userNav,
          null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      var untrack = trackLink.href.indexOf('stoptrack') != -1;
    }

    var request = new XMLHttpRequest();
    request.open('GET', gamefox_utils.newURI(ids['board'], ids['topic'])
        + '?action=' + (untrack ? 'stoptrack' : 'tracktopic'));
    var ds = gamefox_lib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        var result = gamefox_tracked.trackResponse(request.responseText);

        if (result[0])
        {
          gamefox_tracked.updateList();

          if (gamefox_lib.onPage(doc, 'messages'))
          {
            if (result[1] == 'tracktopic')
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
          gamefox_lib.alert('An error occurred while tracking or untracking this '
              + 'topic.\n\n' + result[1]);
      }
    }
    request.send(null);
  },

  holdTopic: function(topicId)
  {
    this.read();

    if (!this.list[topicId])
      return;

    this.list[topicId].hold = !this.list[topicId].hold;

    this.save();
  },

  deleteTopic: function(topicId)
  {
    if (!gamefox_lib.thirdPartyCookiePreCheck())
      return;
    this.read();

    var topic = this.list[topicId];
    if (!topic.deleted)
    {
      var request = new XMLHttpRequest();
      request.open('GET', gamefox_utils.newURI(topic.boardId, topicId)
          + '?action=stoptrack');
      var ds = gamefox_lib.thirdPartyCookieFix(request);
      request.onreadystatechange = function()
      {
        if (request.readyState == 4)
        {
          if (request.responseText.indexOf('no longer tracking') != -1)
            gamefox_tracked.updateList();
          else
            gamefox_lib.alert('An error occurred untracking this topic.');
        }
      }
      request.send(null);
    }
    else
    {
      delete this.list[topicId];
      this.save();
    }
  },

  trackResponse: function(str)
  {
    // archived topic
    if (str.indexOf('Topic List</a>\n\t\t\t\t| Topic Archived') != -1)
      return [false, 'This topic is archived.'];

    // start tracking
    if (str.indexOf('<div id="board_wrap" class="pod"><p>You are now tracking this topic.</p>') != -1)
      return [true, 'tracktopic'];

    // stop tracking
    if (str.indexOf('<div id="board_wrap" class="pod"><p>You are no longer tracking this topic.</p>') != -1)
      return [true, 'stoptrack'];

    // generic error
    return [false, ''];
  },

  openWindow: function()
  {
    window.openDialog('chrome://gamefox/content/tracked.xul', '_blank',
        'dialog=no', null);
  },

  listUpdatedTopics: function()
  {
    this.read();

    var topics = [];
    for (topicId in this.list)
      if (this.list[topicId].newPosts)
        topics.push(topicId);

    return topics;
  },

  markTopicAsRead: function(topicId, msgs)
  {
    this.read();

    if (!this.list[topicId])
      return;

    this.list[topicId].newPosts = false;
    this.list[topicId].msgs = msgs;

    this.save();
  },

  markAllAsRead: function()
  {
    this.read();

    for (var topicId in this.list)
      this.list[topicId].newPosts = false;

    this.save();
  },

  timedUpdate: function()
  {
    if (!gamefox_lib.prefs.getBoolPref('tracked.notify')
        || !gamefox_lib.isLoggedIn())
      return;

    var lastUpdate = gamefox_lib.prefs.getIntPref('tracked.lastUpdate');
    var lastVisit = gamefox_lib.prefs.getIntPref('lastVisit');
    var now = Date.now() / 1000;
    var interval = Math.max(
        gamefox_lib.prefs.getIntPref('tracked.updateInterval'), 300);

    gamefox_tracked.read();

    if ((now - interval >= lastUpdate && now - 1800 < lastVisit
          && gamefox_tracked.list.__count__ != 0)
        || gamefox_tracked.accountChanged())
      gamefox_tracked.updateList();
  }
};
