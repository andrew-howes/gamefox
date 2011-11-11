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
  toggle: function(event, hover, dblClick)
  {
    var doc = gamefox_lib.getDocument(event);
    var node = gamefox_utils.findParent('td', event.target);
    var name = node.querySelector('a.name');
    var qw = doc.evaluate('div[contains(@class, "gamefox-quickwhois")]', node,
        null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
      .singleNodeValue;

    var className = 'gamefox-quickwhois';
    var pos;
    if (hover)
    {
      pos = gamefox_utils.getPos(name);
      pos[0] -= 3;
      pos[1] -= 3;
      className += ' gamefox-quickwhois-hover';
    }
    else
      pos = gamefox_quickwhois.getPos(event);

    if (qw)
    {
      var qwHover = qw.classList.contains('gamefox-quickwhois-hover');

      if (qw.style.opacity == '0')
      {
        // Only show QuickWhois when hovering over .name
        if (hover && event.target.className != 'name')
          return;

        qw.className = className;
        qw.style.display = 'block';
        qw.style.left = pos[0] + 'px';
        qw.style.top = pos[1] + 'px';
        window.setTimeout(function() { qw.style.opacity = '1'; }, 20);
      }
      // Don't allow double clicking to close a hover-activated QuickWhois,
      // and vice versa
      else if ((qwHover && hover) || (!qwHover && dblClick))
      {
        qw.style.opacity = '0';
        if (qw.style.MozTransition === undefined) // no CSS3 transition support
          qw.style.display = 'none';
      }

      return;
    }

    qw = doc.createElement('div');
    qw.className = className;
    qw.style.left = pos[0] + 'px';
    qw.style.top = pos[1] + 'px';

    var a = doc.createElement('a');
    a.className = 'name';
    a.href = name.href;
    a.textContent = name.textContent;
    qw.appendChild(a);

    qw.appendChild(doc.createTextNode(' (Loading profile...)'));

    qw.addEventListener('transitionend', function() {
      if (qw.style.opacity == '0') qw.style.display = 'none'; }, false);

    qw.addEventListener('mouseout', function(event) {
      if (event.relatedTarget.className != qw.className &&
        gamefox_utils.findParent('div', event.relatedTarget).className !=
        qw.className)
        gamefox_quickwhois.toggle(event, true);
    }, false);

    node.appendChild(qw);
    window.setTimeout(function() { qw.style.opacity = '1'; }, 20);

    var request = new XMLHttpRequest();
    request.open('GET', name.href);
    var ds = gamefox_lib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState != 4) return;

      qw.removeChild(qw.childNodes[1]);

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
      var table = doc.createElement('table');

      // Work around themes that style tr:first-child
      tr = doc.createElement('tr');
      tr.style.setProperty('display', 'none', 'important');
      table.appendChild(tr);

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
            gamefox_quickwhois.linkifyField(td, field, 'mailto:');
          else if (fields[i] == 'Web Site')
            gamefox_quickwhois.linkifyField(td, field);
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
      window.content.scrollX + event.clientX + doc.body.parentNode.offsetLeft,
      window.content.scrollY + event.clientY + doc.body.parentNode.offsetTop
    ];
  },

  linkifyField: function(node, field, prefix)
  {
    var doc = gamefox_lib.getDocument(node);
    var a;
    var lines = field.split('<br />');
    for (var i = 0; i < lines.length; i++)
    {
      a = doc.createElement('a');
      a.href = (prefix ? prefix : '') + lines[i];
      a.textContent = lines[i];
      node.appendChild(a);
      node.appendChild(doc.createElement('br'));
    }
  }
};
