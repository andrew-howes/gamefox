/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2011 Brian Marshall, Michael Ryan
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

var gamefox_quickwhois =
{
  quickWhois: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    var pos = gamefox_quickwhois.getPos(event);
    var row = gamefox_utils.findParent('td', event.target);
    var qw = doc.evaluate('div[@class="gamefox-quickwhois"]', row, null,
        XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (qw)
    {
      if (qw.style.display == 'none')
      {
        qw.style.display = 'block';
        qw.style.top = pos[0] + 'px';
        qw.style.left = pos[1] + 'px';
        window.setTimeout(function() { qw.style.opacity = '1'; }, 10);
      }
      else
        qw.style.opacity = '0';

      return;
    }

    qw = doc.createElement('div');
    qw.className = 'gamefox-quickwhois';
    qw.style.top = pos[0] + 'px';
    qw.style.left = pos[1] + 'px';
    qw.textContent = 'Loading QuickWhois...';
    qw.addEventListener('transitionend', function() {
      if (qw.style.opacity == '0') qw.style.display = 'none'; }, false);
    row.appendChild(qw);
    window.setTimeout(function() { qw.style.opacity = '1'; }, 10);

    var request = new XMLHttpRequest();
    request.open('GET', row.querySelector('a.name').href);
    var ds = gamefox_lib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState != 4) return;

      qw.textContent = '';
      var table = doc.createElement('table');

      var text = request.responseText;
      var profileFieldsHTML = '';
      var fields = [
        'User ID',
        'Board User Level',
        'Account Created',
        'Last Visit',
        'E-Mail',
        'Web Site',
        'AIM (Username)',
        'AIM (E-Mail)',
        'Yahoo IM',
        'Windows Live (MSN)',
        'Google Talk',
        'ICQ',
        'Xbox Live',
        'PlayStation Network',
        'DS Friend Code',
        'Wii Number',
        'Wii Friend Code',
        'Skype',
        'Steam',
        'xfire',
        'Twitter',
        'Signature',
        'Quote',
        'Karma',
        'Contributor Page',
        'My Games Page'
      ];
      var field, tr, td;

      for (var i = 0; i < fields.length; i++)
      {
        if (field = gamefox_quickwhois.findInfo(fields[i], text))
        {
          tr = doc.createElement('tr');

          td = doc.createElement('td');
          td.textContent = fields[i];
          tr.appendChild(td);

          td = doc.createElement('td');
          if (fields[i] == 'E-Mail')
            td.innerHTML = '<a href="mailto:' + gamefox_utils.URLEncode(field)
              + '">' + field + '</a>';
          else if (fields[i] == 'Web Site')
            td.innerHTML = '<a href="' + gamefox_utils
              .specialCharsEncode(field) + '">' + field + '</a>';
          else
            td.innerHTML = field;
          tr.appendChild(td);

          table.appendChild(tr);
        }
      }

      qw.appendChild(table);
    };
    request.send(null);
  },

  findInfo: function(what, where)
  {
    return (new RegExp('<th\\b[^>]*>(?:\\s*<a\\b[^>]*>)?\\s*' +
          gamefox_utils.specialRegexpCharsEscape(what) +
          '(?:\\s*</a>)?\\s*</th><td>([^\\0]*?)</td>', 'gi').exec(where) ||
        [, ''])[1].trim();
  },

  getPos: function(event)
  {
    var doc = gamefox_lib.getDocument(event);

    // offsets are for stylesheets that put a border on <html>
    return [
      window.content.scrollY + event.clientY + doc.body.parentNode.offsetTop,
      window.content.scrollX + event.clientX + doc.body.parentNode.offsetLeft
    ];
  }
};
