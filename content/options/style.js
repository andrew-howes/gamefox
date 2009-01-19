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

var GFstyleOptions =
{
  showDesc: function(event)
  {
    var tree = document.getElementById('css-tree');
    var tbo = tree.treeBoxObject;

    // get the row, col and child element at the point
    var row = {}, col = {}, child = {};
    tbo.getCellAt(event.clientX, event.clientY, row, col, child);

    var cat = tree.view.getCellText(row.value, {index: 5});
    if (tree.view.isContainer(row.value) || col.value.index != 1
        || cat == 'user')
      return;

    var name = tree.view.getCellText(row.value, {index: 0});
    var desc = tree.view.getCellText(row.value, col.value);
    GFlib.alert(name + ':\n' + desc);
  }
};
