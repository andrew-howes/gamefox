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

var GFquickwhois =
{
  quickWhois: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;

    try
    {
      while (node.nodeName.toLowerCase() != 'td')
      {
        node = node.parentNode;
      }
    }
    catch (e) { return; }

    var div = node.getElementsByTagName('div');
    if (div.length > 0)
    {
      div[0].style.display = (div[0].style.display == 'block') ?
        'none' : 'block';
      div[0].style.top = window.content.scrollY + event.clientY + doc.body.parentNode.offsetTop + 'px';
      div[0].style.left = window.content.scrollX + event.clientX + doc.body.parentNode.offsetLeft + 'px';
      return;
    }

    div = doc.createElement('div');
    div.setAttribute('class', 'gamefox-quickwhois');
    div.style.display = 'block';
    div.style.setProperty('font-size', '10pt', '');
    div.style.top = window.content.scrollY + event.clientY + doc.body.parentNode.offsetTop + 'px';
    div.style.left = window.content.scrollX + event.clientX + doc.body.parentNode.offsetLeft + 'px';
    div.innerHTML = 'Loading QuickWhois...';
    node.appendChild(div);

    var request = new XMLHttpRequest();
    request.open('GET', node.getElementsByTagName('a')[0].href);
    var ds = GFlib.thirdPartyCookieFix(request);
    request.onreadystatechange = function()
    {
      if (request.readyState == 4)
      {
        var profileFieldsHTML = '';
        var profileFields = new Array(
            'User ID', 'User ID',
            'Board User Level', 'User Level',
            'Account Created', 'Created At',
            'Last Visit', 'Last Visit',
            'E-Mail', 'Email',
            'Web Site', 'Website',
            'AIM \\(Username\\)', 'AIM Username',
            'AIM \\(E-Mail\\)', 'AIM Email',
            'Yahoo IM', 'Yahoo IM',
            'Windows Live \\(MSN\\)', 'MSN',
            'Google Talk', 'Google Talk',
            'ICQ', 'ICQ',
            'Xbox Live', 'Xbox Live',
            'PlayStation Network', 'PlayStation Network',
            'DS Friend Code', 'DS Friend Code',
            'Wii Number', 'Wii Number',
            'Wii Friend Code', 'Wii Friend Code',
            'Skype', 'Skype',
            'Steam', 'Steam',
            'xfire', 'Xfire',
            'Signature', 'Signature',
            'Quote', 'Quote',
            'Karma', 'Karma'
              );
        for (var i = 0; i < profileFields.length; i += 2)
        {
          if ((profileField = GFquickwhois.findInfo(profileFields[i], request.responseText))
              != '')
          {
            if (profileFields[i] == 'Board User Level')
              profileField = profileField.split(/<br\s*\/?>/i)[0].replace(
                  /<\/?b>/gi, '');
            profileFieldsHTML += '<b>' + profileFields[i+1] + ':</b> ' +
              profileField.replace(/<br\s*\/?>/gi, '<br/>') + '<br/>';
          }
        }
        div.innerHTML = profileFieldsHTML.replace(/<br\/>$/, '')
          + GFquickwhois.findInfo('Contributor Page', request.responseText).
          replace(/^</, '<br/><')
          + GFquickwhois.findInfo('My Games', request.responseText).
          replace(/^</, '<br/><');
      }
    };
    request.send(null);
  },

  findInfo: function(what, where)
  {
    var pattern = new RegExp('<td\\b[^>]*>(\\s*<a\\b[^>]*>)?\\s*' + what +
        '(\\s*</a>)?\\s*</td>\\s*<td\\b[^>]*>([^\\0]*?)</td>', 'gi');
    var matches = pattern.exec(where);

    if (matches)
      return matches[3].GFtrim();

    return '';
  }
};
