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

var gamefox_options_dateFormat =
{
  init: function()
  {
    // Populate menus with formats
    var topicFormatMenu = document.getElementById('topicFormatMenu');
    var topicFormats = gamefox_date.listFormats('topic');
    var topicFormatPreset = document.getElementById('date.topicPreset').value;
    for (var i = 0; i < topicFormats.length; i++)
    {
      var item = topicFormatMenu.insertItemAt(i,
          gamefox_date.parseFormat(null, topicFormats[i]), i);

      // For some reason, the preference attribute of the menulist won't select
      // an item initially. Probably because they're being added with
      // JavaScript?
      if (i == topicFormatPreset)
        topicFormatMenu.selectedItem = item;
    }
  }
};
