/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2010 Brian Marshall
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

var gamefox_options_main =
{
  init: function()
  {
    this.titleChangeToggled();
  },

  titleChangeToggled: function()
  {
    var titleChangePref = document.getElementById('elements.titlechange');
    document.getElementById('elements.titleprefix-checkbox').disabled =
      !titleChangePref.value;
  }
};
