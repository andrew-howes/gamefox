/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011 Brian Marshall, Michael Ryan
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

var gamefox_about =
{
  process: function()
  {
    var strbundle = document.getElementById('strings');

    document.getElementById('version').value =
        strbundle.getString('version') + ' ' + gamefox_lib.version;

    var sections = {
      currentDevelopers:  ['currentDeveloperBox',
                          [
                          	['Andrew Howes', 'NewerShadow']
                            
                          ]],
      previousDevelopers: ['previousDeveloperBox',
                          [
                            ['Abdullah A', 'ultimategamer00'],
                            ['Toad King', 'Calvinjpwalker'],
                            ['Andrianto Effendy', 'ZeroAnt'],
                            ['Michael Ryan', 'RockMFR 5'],
                            ['Brian Marshall', 'Karamthulhu']
                          ]],
      contributors:       ['contributorBox',
                          [
                            ['Ant P.', 'GFCode'],
                            ['Poo Poo Butter', 'CSS'],
                            ['Swordless Link', 'CSS'],
                            ['TakatoMatsuki', 'CSS'],
                            ['Ricapar', 'CSS'],
                            ['selmiak', 'CSS'],
                            ['spynae', 'CSS'],
                            ['Tango Desktop Project', 'icons'],
                            ['http://www.pinvoke.com/', 'icons']
                          ]]
    };

    for (var i in sections)
    {
      var node = document.getElementById(sections[i][0]);
      for (var j = 0; j < sections[i][1].length; j++)
      {
        var label = document.createElement('label');
        label.setAttribute('value', sections[i][1][j][0] +
            ' (' + sections[i][1][j][1] + ')');
        node.appendChild(label);
      }
    }
  }
};

window.addEventListener('load', gamefox_about.process, false);
