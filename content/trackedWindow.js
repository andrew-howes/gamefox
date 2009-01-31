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
  _tree : null,
  _view : null,

  init: function()
  {
    this._tree = document.getElementById('gamefox-tracked-tree');

    this._view = new GFtreeview();

    this._view.getRowProperties = function(index, properties)
    {
      // hold or deleted property to add the icon with CSS
      var property = this.visibleData[index][0][2];
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
        var property = '';
        if (GFtracked.list[board].topics[topic].deleted)
          property = 'deleted';
        else if (GFtracked.list[board].topics[topic].hold)
          property = 'hold';

        this._view.visibleData.push([[
            board + ',' + topic, // tagid
            GFtracked.list[board].topics[topic].title,
            property,
            GFtracked.list[board].topics[topic].lastPost
            ], false, false]);
      }
    }

    this._tree.view = this._view;

    this.sort('lastPost', false);

    new GFobserver('tracked', this.update);
  },

  update: function()
  {
    var oldList = GFutils.cloneObj(GFtracked.list);
    GFtracked.read();

    // Remove topics and change properties
    for (var i = 0; i < gTrackedWindow._view.visibleData.length; i++)
    {
      var tagid = gTrackedWindow._view.visibleData[i][0][0].split(/,/);
          tagid[0] = parseInt(tagid[0]);
          tagid[1] = parseInt(tagid[1]);

      if (!GFtracked.list[tagid[0]] 
          || !GFtracked.list[tagid[0]].topics[tagid[1]])
      {
        gTrackedWindow._view.visibleData.splice(i, 1);
        gTrackedWindow._tree.treeBoxObject.rowCountChanged(i + 1, -1);
      }
      else
      {
        var property = '';
        if (GFtracked.list[tagid[0]].topics[tagid[1]].deleted)
          property = 'deleted';
        else if (GFtracked.list[tagid[0]].topics[tagid[1]].hold)
          property = 'hold';

        if (property != gTrackedWindow._view.visibleData[i][0][2])
        {
          gTrackedWindow._view.visibleData[i][0][2] = property;
          gTrackedWindow._tree.treeBoxObject.invalidateRow(i);
        }
      }
    };

    // Add topics
    for (var i in GFtracked.list)
    {
      for (var j in GFtracked.list[i].topics)
      {
        // topic already exists in tree
        if (oldList[i] && oldList[i].topics[j]) continue;

        var topic = GFtracked.list[i].topics[j];
        gTrackedWindow.addTopic(i + ',' + j, topic.title, '', topic.lastPost);
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
        return a[0][1].toLowerCase().localeCompare(b[0][1].toLowerCase());
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
        var d1 = GFutils.strtotime(a[0][3]);
        var d2 = GFutils.strtotime(b[0][3]);

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
