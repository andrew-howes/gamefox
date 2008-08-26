/* vim: set et sw=2 ts=2 sts=2 tw=79: */

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
      div[0].style.top = window.content.scrollY + event.clientY + 'px';
      div[0].style.left = window.content.scrollX + event.clientX + 'px';
      return;
    }

    div = doc.createElement('div');
    div.setAttribute('class', 'gamefox-quickwhois');
    div.style.display = 'block';
    div.style.setProperty('font-size', '10pt', '');
    div.style.top = window.content.scrollY + event.clientY + 'px';
    div.style.left = window.content.scrollX + event.clientX + 'px';
    div.innerHTML = 'Loading QuickWhois...';
    node.appendChild(div);

    var request = new XMLHttpRequest();
    request.open('GET', node.getElementsByTagName('a')[0].href);
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
            'AIM', 'AIM',
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
      return GFutils.trim(matches[3]);
    
    return '';
  }
};
