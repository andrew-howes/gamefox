/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Brian Marshall, Michael Ryan
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

var GFabout =
{
  process: function()
  {
    var em = Cc['@mozilla.org/extensions/manager;1'].getService(Ci.nsIExtensionManager);

    document.getElementById('version').setAttribute('value',
        document.getElementById('version').getAttribute('value')
        + em.getItemForID('{6dd0bdba-0a02-429e-b595-87a7dfdca7a1}').version);
  }
};

window.addEventListener('load', GFabout.process, false);
