/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Michael Ryan, Brian Marshall
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

var gamefox_favorites =
{
  list: {},

  read: function()
  {
      this.list = gamefox_lib.safeEval(gamefox_lib.getString('favorites.serialized'));

      // this.list will be undefined if the pref value isn't an object
      if (!this.list)
          this.list = {};
  },

  populateFavorites: function(doc, favList)
  {
    var favs, item, i;

    while (favList.hasChildNodes())
      favList.removeChild(favList.firstChild);

    favs = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('favorites.serialized'));

    item = doc.createElement('option');
    item.value = 0;
    item.appendChild(doc.createTextNode('Select board...'));
    favList.appendChild(item);
    for (var i in favs)
    {
      item = doc.createElement('option');
      item.value = i;
      item.appendChild(doc.createTextNode(favs[i].name));
      favList.appendChild(item);
    }
  },

  selectFavorite: function(event)
  {
    var node = event.target;
    if (node.nodeName.toLowerCase() == 'option' && node.value != 0)
      gamefox_lib.open(node.value, event.button == 1 ? 0 : 2);
  }
};
