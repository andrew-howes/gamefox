/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2009, 2010 Brian Marshall
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
    
    var types = ['topic', 'message', 'clock'];
    var type, formatMenu, formats, formatPreset, item, customTextbox;

    for (var i = 0; i < types.length; i++)
    {
      type = types[i];
      customTextbox = document.getElementById(type + 'FormatCustom');
      formatMenu = document.getElementById(type + 'FormatMenu');
      formats = gamefox_date.listFormats(type);
      formatPreset = document.getElementById('date.' + type + 'Preset').value;
      for (var j = 0; j < formats.length; j++)
      {
        item = formatMenu.insertItemAt(j,
            gamefox_date.parseFormat(null, formats[j]), j);

        // For some reason, the preference attribute of the menulist won't select
        // an item initially. Probably because they're being added with
        // JavaScript?
        if (j == formatPreset)
          formatMenu.selectedItem = item;
      }

      // Activate custom format textbox
      if (formatPreset == '-1')
        customTextbox.disabled = false;

      // Preview custom formats
      this.previewCustom(customTextbox);
    }
  },

  change: function(menu)
  {
    var type = this.idToType(menu.id);

    if (menu.value == -1) // enable custom textbox
      document.getElementById(type + 'FormatCustom').disabled = false;
    else
      document.getElementById(type + 'FormatCustom').disabled = true;
  },

  previewCustom: function(textbox)
  {
    var type = this.idToType(textbox.id);
    var menu = document.getElementById(type + 'FormatMenu');
    var item = menu.getItemAtIndex(menu.itemCount - 1);

    // TODO l10n
    if (!textbox.value.length)
      item.label = 'Custom';
    else
      item.label = 'Custom - '
        + gamefox_date.parseFormat(null, textbox.value);
  },

  idToType: function(menuId)
  {
    return menuId.substr(0, menuId.indexOf('F'));
  },

  help: function()
  {
    gamefox_lib.openPage('chrome://gamefox/content/strftime.html', 1);
  }
};
