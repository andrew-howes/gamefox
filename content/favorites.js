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

var GFfavorites =
{
  populateFavorites: function(doc, favList)
  {
    var favs, item, i;

    while (favList.hasChildNodes())
      favList.removeChild(favList.firstChild);

    favs = eval(GFlib.getCharPref('favorites.serialized'));

    item = doc.createElement('option');
    item.value = 0;
    item.appendChild(doc.createTextNode('Select board...'));
    favList.appendChild(item);
    for (i = 0; i < favs.length; i++)
    {
      item = doc.createElement('option');
      item.value = favs[i].id;
      item.appendChild(doc.createTextNode(favs[i].name));
      favList.appendChild(item);
    }
  },

  selectFavorite: function(event)
  {
    var node = event.target;
    if (node.nodeName.toLowerCase() == 'option' && node.value != 0)
      GFlib.open(node.value, event.button == 1 ? 0 : 2);
  }
};
