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

var gamefox_favoritesWindow =
{
  _tree   : null,
  _view   : null,
  _boards : null,

  init: function()
  {
    this._tree = document.getElementById('gamefox-favorites-tree');
    this._view = new gamefox_treeview();
    this._boards = {};

    // Tree view
    this._view.getCellText = function(idx, column)
    {
      if (column.index == 0) // board id
        return this.visibleData[idx].id;
      if (column.index == 1) // name
        return this.visibleData[idx].name;
    };
    this._view.isContainer = function(idx) { return false; };
    this._view.isContainerOpen = function(idx) { return false; };

    gamefox_favorites.read();
    var boards = {}
    for (var board in gamefox_favorites.list)
    {
      var boardObject = this.makeBoardObject(board,
          gamefox_favorites.list[board].name);
      this.handleBoardAdded(boardObject);
    }

    this._tree.view = this._view;

    new gamefox_observer('favorites.serialized', this.update);
  },

  makeBoardObject: function(id, name)
  {
    var b = { id   : id,
              name : name };
    return b;
  },

  handleBoardAdded: function(boardObject)
  {
    var oldRowCount = this._view.rowCount;

    this._view.visibleData.push(boardObject);
    this._boards[boardObject.id] = boardObject;

    this._tree.treeBoxObject.rowCountChanged(oldRowCount - 1, 1);
  },

  handleBoardRemoved: function(idx)
  {
    var boardObject = this._view.visibleData[idx];
    delete this._boards[boardObject.id];

    this._view.visibleData.splice(idx, 1);
    this._tree.treeBoxObject.rowCountChanged(idx + 1, -1);
  },

  update: function()
  {
    gamefox_favorites.read();

    // Remove boards
    for (var i = 0; i < gamefox_favoritesWindow._view.visibleData.length; i++)
    {
      var id = gamefox_favoritesWindow._view.visibleData[i].id;

      if (!gamefox_favorites.list[id])
      {
        gamefox_favoritesWindow.handleBoardRemoved(i);
        --i;
      }
    }

    // Add boards
    for (var board in gamefox_favorites.list)
    {
      // board already exists in tree
      if (gamefox_favoritesWindow._boards[board]) continue;

      // lazy: reload window to avoid manual sorting
      document.location.reload();
    }
  },

  addBoard: function(tagid, title, property, lastPost)
  {
    this._view.visibleData.push([[tagid, title, property, lastPost], false, false]);

    var oldRowCount = this._view.rowCount;
    this._tree.treeBoxObject.rowCountChanged(oldRowCount + 1, 1);
  },

  action: function(type, dblclick)
  {
    var tree = document.getElementById('gamefox-favorites-tree');
    var index = tree.view.selection.currentIndex;

    if (index == -1 || (tree.view.isContainer(index) && dblclick))
      return;

    var tagID = tree.view.getCellText(index,
        tree.columns.getNamedColumn('gamefox-favorites-id'));

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
    }
  },
};
