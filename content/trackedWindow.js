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

var gTrackedWindow =
{
  _tree   : null,
  _view   : null,
  _topics : null,

  init: function()
  {
    this._tree = document.getElementById('gamefox-tracked-tree');
    this._view = new GFtreeview();
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
      if (this.visibleData[idx].deleted)
        property = 'deleted';
      else if (this.visibleData[idx].hold)
        property = 'hold';

      var atomService = Cc['@mozilla.org/atom-service;1']
        .getService(Ci.nsIAtomService);
      var atom = atomService.getAtom(property);
      properties.AppendElement(atom);
    };

    GFtracked.read();
    var topics = {}
    for (var board in GFtracked.list)
    {
      for (var topic in GFtracked.list[board].topics)
      {
        var topicObject = this.makeTopicObject(board, topic,
            GFtracked.list[board].topics[topic]);
        this.handleTopicAdded(topicObject);
      }
    }

    this._tree.view = this._view;

    this.sort('lastPost', false);

    new GFobserver('tracked.list', this.update);
  },

  makeTopicObject: function(bid, tid, topic)
  {
    var t = { id        : tid,
              boardId   : bid,
              boardName : topic.board,
              name      : topic.title,
              age       : topic.age,
              hold      : topic.hold,
              deleted   : topic.deleted,
              lastPost  : topic.lastPost,
              msgs      : topic.msgs };
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
    GFtracked.read();

    // Remove and update topics
    for (var i = 0; i < gTrackedWindow._view.visibleData.length; i++)
    {
      var boardId = gTrackedWindow._view.visibleData[i].boardId;
      var topicId = gTrackedWindow._view.visibleData[i].id;

      if (!GFtracked.list[boardId]
          || !GFtracked.list[boardId].topics[topicId])
      {
        gTrackedWindow.handleTopicRemoved(i);
        --i;
      }
      else // update
      {
        var topicObject = gTrackedWindow.makeTopicObject(boardId, topicId,
            GFtracked.list[boardId].topics[topicId]);

        gTrackedWindow._view.visibleData[i] = topicObject;
        gTrackedWindow._tree.treeBoxObject.invalidateRow(i);

        gTrackedWindow._topics[topicId] = topicObject;
      }
    }

    // Add topics
    for (var i in GFtracked.list)
    {
      for (var j in GFtracked.list[i].topics)
      {
        // topic already exists in tree
        if (gTrackedWindow._topics[j]) continue;

        var topicObject = gTrackedWindow
          .makeTopicObject(i, j, GFtracked.list[i].topics[j]);
        gTrackedWindow.handleTopicAdded(topicObject);
      }
    }

    gTrackedWindow.sort('lastPost', false);
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
      // We have to convert the last post timestamp provided by GameFAQs to
      // something useful
      var year = new Date().getFullYear();
      function sortByLastPost(a, b)
      {
        var d1 = GFutils.strtotime(a.lastPost);
        var d2 = GFutils.strtotime(b.lastPost);

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

  displayMenu: function()
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
  }
};
