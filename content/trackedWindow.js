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

var gamefox_trackedWindow =
{
  _tree   : null,
  _view   : null,
  _topics : null,

  init: function()
  {
    this._tree = document.getElementById('gamefox-tracked-tree');
    this._view = new gamefox_treeview();
    this._topics = {};

    // Tree view
    this._view.getCellText = function(idx, column)
    {
      if (column.index == 0) // tagid
        return this.visibleData[idx].boardId + ',' + this.visibleData[idx].id;
      if (column.index == 1) // name
        return this.visibleData[idx].name;
    };
    this._view.isContainer = function(idx) { return false; };
    this._view.isContainerOpen = function(idx) { return false; };
    this._view.getRowProperties = function(idx, properties)
    {
      // hold or deleted property to add the icon with CSS
      var property = '';
      if (this.visibleData[idx].newPosts)
        property = 'new';
      else if (this.visibleData[idx].deleted)
        property = 'deleted';
      else if (this.visibleData[idx].hold)
        property = 'hold';

      var atomService = Cc['@mozilla.org/atom-service;1']
        .getService(Ci.nsIAtomService);
      var atom = atomService.getAtom(property);
      properties.AppendElement(atom);
    };

    gamefox_tracked.read();
    var topics = {}
    for (var board in gamefox_tracked.list)
    {
      for (var topic in gamefox_tracked.list[board].topics)
      {
        var topicObject = this.makeTopicObject(board, topic,
            gamefox_tracked.list[board].topics[topic]);
        this.handleTopicAdded(topicObject);
      }
    }

    this._tree.view = this._view;

    this.sort('lastPost', false);

    new gamefox_observer('tracked.list', this.update);
  },

  makeTopicObject: function(bid, tid, topic)
  {
    var t = { id           : tid,
              boardId      : bid,
              boardName    : topic.board,
              name         : topic.title,
              age          : topic.age,
              hold         : topic.hold,
              deleted      : topic.deleted,
              newPosts     : topic.newPosts,
              lastPost     : topic.lastPost,
              lastPostYear : topic.lastPostYear,
              msgs         : topic.msgs };
    return t;
  },

  handleTopicAdded: function(topicObject)
  {
    var oldRowCount = this._view.rowCount;

    this._view.visibleData.push(topicObject);
    this._topics[topicObject.id] = topicObject;

    this._tree.treeBoxObject.rowCountChanged(oldRowCount - 1, 1);
  },

  handleTopicRemoved: function(idx)
  {
    var topicObject = this._view.visibleData[idx];
    delete this._topics[topicObject.id];

    this._view.visibleData.splice(idx, 1);
    this._tree.treeBoxObject.rowCountChanged(idx + 1, -1);
  },

  update: function()
  {
    gamefox_tracked.read();

    // Remove and update topics
    for (var i = 0; i < gamefox_trackedWindow._view.visibleData.length; i++)
    {
      var boardId = gamefox_trackedWindow._view.visibleData[i].boardId;
      var topicId = gamefox_trackedWindow._view.visibleData[i].id;

      if (!gamefox_tracked.list[boardId]
          || !gamefox_tracked.list[boardId].topics[topicId])
      {
        gamefox_trackedWindow.handleTopicRemoved(i);
        --i;
      }
      else // update
      {
        var topicObject = gamefox_trackedWindow.makeTopicObject(boardId, topicId,
            gamefox_tracked.list[boardId].topics[topicId]);

        gamefox_trackedWindow._view.visibleData[i] = topicObject;
        gamefox_trackedWindow._tree.treeBoxObject.invalidateRow(i);

        gamefox_trackedWindow._topics[topicId] = topicObject;
      }
    }

    // Add topics
    for (var i in gamefox_tracked.list)
    {
      for (var j in gamefox_tracked.list[i].topics)
      {
        // topic already exists in tree
        if (gamefox_trackedWindow._topics[j]) continue;

        var topicObject = gamefox_trackedWindow
          .makeTopicObject(i, j, gamefox_tracked.list[i].topics[j]);
        gamefox_trackedWindow.handleTopicAdded(topicObject);
      }
    }

    gamefox_trackedWindow.sort('lastPost', false);
  },

  sort: function(property, ascending)
  {
    if (property == 'name')
    {
      function sortByName(a, b)
      {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      this._view.visibleData.sort(sortByName);
    }
    else if (property == 'lastPost')
    {
      function sortByLastPost(a, b)
      {
        // We have to convert the last post timestamp provided by GameFAQs to
        // something useful
        var d1 = gamefox_utils.strtotime(a.lastPost, a.lastPostYear);
        var d2 = gamefox_utils.strtotime(b.lastPost, b.lastPostYear);

        if (d1.getTime() < d2.getTime())
          return -1;
        if (d1.getTime() > d2.getTime())
          return 1;
        return 0;
      }
      this._view.visibleData.sort(sortByLastPost);
    }

    if (!ascending)
      this._view.visibleData.reverse();

    this._view.selection.clearSelection();
    this._tree.treeBoxObject.invalidate();
  },

  addTopic: function(tagid, title, property, lastPost)
  {
    this._view.visibleData.push([[tagid, title, property, lastPost], false, false]);

    var oldRowCount = this._view.rowCount;
    this._tree.treeBoxObject.rowCountChanged(oldRowCount + 1, 1);
  },

  action: function(type, dblclick)
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
        gamefox_tracked.holdTopic(topic[0], topic[1]);
        break;
      case 5:
        gamefox_tracked.deleteTopic(topic[0], topic[1]);
        break;
    }
  },

  displayMenu: function()
  {
    var tree = document.getElementById('gamefox-tracked-tree');
    var index = tree.view.selection.currentIndex;

    if (index == -1)
      return;

    gamefox_tracked.read();

    var tagID = tree.view.getCellText(index,
        tree.columns.getNamedColumn('gamefox-tracked-tagid')).split(',');
    var topic = gamefox_tracked.list[tagID[0]].topics[tagID[1]];

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
  }
};
