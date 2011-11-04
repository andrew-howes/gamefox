/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011
 * Brian Marshall, Michael Ryan, Andrianto Effendy
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

var gamefox_quickpost =
{
  drag: { startX: 0, startY: 0, offsetX: 0, offsetY: 0, dragging: false },

  appendForm: function(doc, div, newTopic)
  {
    var charCounts = gamefox_lib.prefs.getBoolPref('elements.charcounts');
    var clock = gamefox_lib.prefs.getBoolPref('elements.clock');
    var accesskeyPrefix = gamefox_utils.getAccesskeyPrefix();

    var form = doc.createElement('form');
    form.id = 'gamefox-quickpost-form';
    var boardId = gamefox_utils.getBoardId(doc.location.pathname);
    var topicId = gamefox_utils.getTopicId(doc.location.pathname);
    // TODO: preview button for new topics broken if user just deleted a topic
    form.action = '/boards/post.php?board=' + boardId
        + (topicId != 0 ? '&topic=' + topicId : '');
    form.method = 'post';
    form.addEventListener('submit', gamefox_quickpost.removeGFCodeWhitespaceListener,
        false);
    form.addEventListener('submit', gamefox_quickpost.cleanSig, false);
    div.appendChild(form);

    if (newTopic)
    {
      var topictitle = doc.createElement('input');
      topictitle.id = 'gamefox-topic';
      topictitle.type = 'text';
      topictitle.name = 'topictitle';
      topictitle.size = 60;
      topictitle.maxlength = 80;
      topictitle.tabIndex = 1;
      form.appendChild(topictitle);
      topictitle.focus();

      if (charCounts)
      {
        var titlecount = doc.createElement('span');
        titlecount.id = 'gamefox-title-count';
        topictitle.addEventListener('input', gamefox_messages.delayedUpdateTitleCount,
            false);
        form.appendChild(titlecount);
        gamefox_messages.updateTitleCount(doc);
      }

      form.appendChild(doc.createElement('br'));
    }

    // HTML buttons
    if (gamefox_quickpost.createHTMLButtonsPref())
    {
      form.appendChild(gamefox_quickpost.createHTMLButtons(doc));
      form.appendChild(doc.createElement('br'));
    }

    // Post key
    var key = doc.createElement('input');
    key.type = 'hidden';
    key.name = 'key';
    key.value = gamefox_quickpost.readPostKey().key;
    form.appendChild(key);

    // Message
    var message = doc.createElement('textarea');
    message.id = 'gamefox-message';
    message.name = 'messagetext';
    message.wrap = 'virtual';
    message.rows = 16;
    message.cols = 60;
    message.tabIndex = 2;
    form.appendChild(message);

    form.appendChild(doc.createElement('br'));

    // Signature
    doc.gamefox.sig = gamefox_sig.format(null, null, doc);

    form.appendChild(gamefox_quickpost.createSigField(doc));

    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.button'))
    {
      var postbutton = doc.createElement('input');
      postbutton.id = 'gamefox-quickpost-btn';
      postbutton.type = 'button';
      postbutton.name = 'quickpost';
      postbutton.value = 'Post Message';
      postbutton.title = 'Post Message [' + accesskeyPrefix + 'z]';
      postbutton.accessKey = 'z';
      postbutton.tabIndex = 3;
      postbutton.addEventListener('click', gamefox_quickpost.post, false);
      form.appendChild(postbutton);
    }

    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.otherbuttons'))
    {
      var previewbutton = doc.createElement('input');
      previewbutton.type = 'submit';
      previewbutton.name = 'post';
      previewbutton.value = 'Preview Message';
      previewbutton.title = 'Preview Message [' + accesskeyPrefix + 'x]';
      previewbutton.accessKey = 'x';
      previewbutton.tabIndex = 3;
      form.appendChild(doc.createTextNode(' '));
      form.appendChild(previewbutton);

      var spellchkbutton = doc.createElement('input');
      spellchkbutton.type = 'submit';
      spellchkbutton.name = 'post';
      spellchkbutton.value = 'Preview and Spellcheck Message';
      spellchkbutton.title = 'Preview and Spellcheck Message [' + accesskeyPrefix + 'c]';
      spellchkbutton.accessKey = 'c';
      spellchkbutton.tabIndex = 3;
      form.appendChild(doc.createTextNode(' '));
      form.appendChild(spellchkbutton);

      var resetbutton = doc.createElement('input');
      resetbutton.type = 'reset';
      resetbutton.value = 'Reset';
      resetbutton.title = 'Reset [' + accesskeyPrefix + 'v]';
      resetbutton.accessKey = 'v';
      resetbutton.addEventListener('click', gamefox_quickpost.resetPost, false);
      resetbutton.tabIndex = 3;
      form.appendChild(doc.createTextNode(' '));
      form.appendChild(resetbutton);
    }

    if (newTopic)
    {
      var hidebutton = doc.createElement('input');
      hidebutton.id = 'gamefox-quickpost-hide';
      hidebutton.type = 'button';
      hidebutton.value = 'Hide';
      hidebutton.tabIndex = 3;
      hidebutton.addEventListener('click', gamefox_quickpost.toggleVisibility, false);
      form.appendChild(doc.createTextNode(' '));
      form.appendChild(hidebutton);
    }

    if (charCounts)
    {
      var messagecount = doc.createElement('span');
      messagecount.id = 'gamefox-message-count';
      message.addEventListener('input', gamefox_messages.delayedUpdateMessageCount,
          false);
      form.appendChild(messagecount);
      gamefox_messages.updateMessageCount(doc);
    }

    if (clock)
    {
      var dateNode = doc.createElement('span');
      dateNode.className = 'gamefox-clock';
      dateNode.appendChild(doc.createTextNode(''));
      form.appendChild(dateNode);
      gamefox_page.updateClock(dateNode.childNodes[0]);
    }

    if (gamefox_lib.isNightly())
    {
      var nightlyMsg = doc.createElement('span');
      nightlyMsg.id = 'gamefox-nightly-msg';
      
      var gamefoxLink = doc.createElement('a');
      gamefoxLink.textContent = 'GameFOX';
      gamefoxLink.href = 'http://beyondboredom.net/gamefox/';
      nightlyMsg.appendChild(gamefoxLink);

      nightlyMsg.appendChild(doc.createTextNode(' development release'
            + ' - ' + gamefox_lib.getNightlyFormattedDate()));

      form.appendChild(doc.createElement('br'));
      form.appendChild(nightlyMsg);
    }

    // Dragging for floating QuickPost
    if (newTopic)
    {
      // Set these manually here instead of in CSS for the drag script
      div.style.left = (doc.defaultView.innerWidth - div.clientWidth) / 2
        + 'px';
      div.style.top = doc.defaultView.innerHeight / 1.7 - div.clientHeight / 2
        + 'px';

      // Make the box draggable
      doc.addEventListener('mousedown', gamefox_quickpost.onMouseDown, false);
      doc.addEventListener('mouseup', gamefox_quickpost.onMouseUp, false);
    }
  },

  onMouseDown: function(event)
  {
    if (!event.target)
      return false;

    var node = event.target;

    if (node.nodeName == 'INPUT'
        || node.nodeName == 'TEXTAREA' // allow text selection in inputs
        || node.nodeName == 'A'
        || node.nodeName == 'TD'
        || node.id && node.id == 'gamefox-character-map')
      return false;

    // get the right element
    while (node.id != 'gamefox-quickpost-afloat')
    {
      node = node.parentNode;
      if (!node)
        return false;
    }

    var doc = gamefox_lib.getDocument(event);
    var drag = gamefox_quickpost.drag;
    if (event.button == 0 // left click
        && node.id == 'gamefox-quickpost-afloat')
    {
      // grab the mouse position
      drag.startX = event.clientX;
      drag.startY = event.clientY;

      // grab the clicked element's position
      drag.offsetX = parseInt(node.style.left);
      drag.offsetY = parseInt(node.style.top);

      drag.dragging = true;

      // prevent selection
      doc.body.style.MozUserSelect = '-moz-none'; 
      node.style.MozUserSelect = '-moz-none';

      doc.body.focus();

      // start moving
      doc.addEventListener('mousemove', gamefox_quickpost.onMouseMove, false);

      // this is also supposed to prevent selection but it doesn't work for me
      return false;
    }
  },

  onMouseMove: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    var element = doc.getElementById('gamefox-quickpost-afloat');
    var drag = gamefox_quickpost.drag;

    element.style.left = (drag.offsetX + event.clientX - drag.startX) + 'px';
    element.style.top = (drag.offsetY + event.clientY - drag.startY) + 'px';
  },

  onMouseUp: function(event)
  {
    // stop dragging
    var doc = gamefox_lib.getDocument(event);
    var drag = gamefox_quickpost.drag;
    var element = doc.getElementById('gamefox-quickpost-afloat');
    if (drag.dragging)
    {
      // Clean up
      doc.removeEventListener('mousemove', gamefox_quickpost.onMouseMove, false);
      doc.body.style.MozUserSelect = 'text';
      element.style.MozUserSelect = 'text';
      drag.dragging = false;

      // Restore position if it's outside the window
      var left = parseInt(element.style.left);
      if (left + element.offsetWidth < 50)
        element.style.left = (50 - element.offsetWidth) + 'px';
      else if (left > doc.defaultView.innerWidth - 50)
        element.style.left = (doc.defaultView.innerWidth - 50) + 'px';

      var top = parseInt(element.style.top);
      if (top + element.offsetHeight < 50)
        element.style.top = (50 - element.offsetHeight) + 'px';
      else if (top > doc.defaultView.innerHeight - 50)
        element.style.top = (doc.defaultView.innerHeight - 50) + 'px';
    }
  },

  appendSig: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    if (!doc.gamefox.sigAdded)
    {
      doc.getElementById('gamefox-message').value += doc.gamefox.sig;
      doc.gamefox.sigAdded = true;
    }
  },

  toggleVisibility: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    event.preventDefault();

    var qpDiv = doc.getElementById('gamefox-quickpost-afloat');
    if (qpDiv)
    {
      qpDiv.style.display = qpDiv.style.display == 'none' ? '' : 'none';
      return;
    }

    qpDiv = doc.createElement('div');
    qpDiv.id = 'gamefox-quickpost-afloat';

    doc.getElementsByClassName('board_wrap')[0].appendChild(qpDiv);
    gamefox_quickpost.appendForm(doc, qpDiv, true);
  },

  post: function(event)
  {
    event.target.disabled = true;
    event.target.blur();

    var doc = gamefox_lib.getDocument(event);

    var topicTitle = (doc.getElementsByName('topictitle')[0] || {}).value;
    var key = doc.getElementsByName('key')[0].value;
    var message = gamefox_quickpost.removeGFCodeWhitespace(
        doc.getElementsByName('messagetext')[0].value);
    var sig = gamefox_sig.format(doc.getElementsByName('custom_sig')[0]
        .value);
    var params = gamefox_utils.parseBoardLink(doc.location.pathname) ||
      gamefox_utils.parseQueryString(doc.location.search); // post.php

    gamefox_messages.post(topicTitle, message, sig, key, params,
        function(result, msg, data) {
          if (result == 'SUCCESS')
          {
            event.target.removeAttribute('disabled');

            // Redirect after posting
            if (topicTitle) // new topic
            {
              var topicLink = data;

              switch (gamefox_lib.prefs
                .getIntPref('elements.quickpost.aftertopic'))
              {
                case 0: // go to topic
                  doc.location = gamefox_utils.newURI(params['board'],
                    topicLink[1], null, null, null, topicLink[0]);
                  break;

                case 1: // go to board
                  doc.location = gamefox_utils.newURI(params['board'], null,
                    null, null, null, topicLink[0]);
                  break;
              }
            }
            else // new post
            {
              switch (gamefox_lib.prefs
                  .getIntPref('elements.quickpost.aftermessage'))
              {
                case 0: // go to last page/post
                  var msgsPerPage = gamefox_lib.prefs
                    .getIntPref('msgsPerPage');
                  var pages = doc.gamefox.pages;
                  var msgs = doc.gamefox.msgnum;

                  if (pages * msgsPerPage > msgs &&
                      (pages - 1) * msgsPerPage < msgs)
                  { // We're on the last page and staying on it
                    doc.location.hash = doc.gamefox.msgnum + 1;
                    doc.location.reload();
                  }
                  else if (pages * msgsPerPage == msgs)
                  { // This post is creating a new page (last page is full)
                    doc.location = gamefox_utils.newURI(params['board'],
                        params['topic'], pages, doc.gamefox.tc, msgs + 1,
                        doc.location.pathname);
                  }
                  else
                  { // Load last page
                    if (gamefox_lib.onPage(doc, 'post'))
                    {
                      var topicLink = doc.evaluate('//div[@class="details"]' +
                          '//b/following-sibling::a', doc, null,
                          XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                        .singleNodeValue;

                      doc.location = gamefox_utils.newURI(params['board'],
                          params['topic'], 0, '', '', topicLink.href);
                    }
                    else
                      doc.location = gamefox_utils.newURI(params['board'],
                          params['topic'], pages - 1, doc.gamefox.tc, 'last',
                          doc.location.pathname);
                  }

                  break;

                case 1: // go back to same page
                  doc.location = gamefox_utils.newURI(params['board'],
                      params['topic'], gamefox_utils
                        .parseQueryString(doc.location.search)['page'],
                      doc.gamefox.tc, null, doc.location.pathname);
                  break;

                case 2: // go to first page
                  doc.location = gamefox_utils.newURI(params['board'],
                      params['topic'], null, null, null,
                      doc.location.pathname);
                  break;

                case 3: // go to board
                  doc.location = gamefox_utils.newURI(params['board'], null,
                      null, null, null, doc.location.pathname);
                  break;
              }
            }
          }
          else
          {
            if (msg) gamefox_lib.alert(msg);
            event.target.removeAttribute('disabled');
          }
        });
  },

  resetPost: function(event)
  {
    event.preventDefault();

    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.resetconfirm') &&
        !gamefox_lib.confirm('Are you sure? This will clear your entire post so far.'))
      return;

    var doc = gamefox_lib.getDocument(event);
    var charCounts = gamefox_lib.prefs.getBoolPref('elements.charcounts');

    doc.getElementById('gamefox-message').value = '';

    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.resetnewsig'))
    {
      doc.gamefox.sig = gamefox_sig.format(null, null, doc);
      doc.getElementsByName('custom_sig')[0].value = doc.gamefox.sig;
    } 

    if (charCounts)
      gamefox_messages.updateMessageCount(doc);
    if (doc.getElementById('gamefox-topic'))
    {
      doc.getElementById('gamefox-topic').value = '';
      if (charCounts)
        gamefox_messages.updateTitleCount(doc);
    }
  },

  formatTag: function(tag, end)
  {
    tag = tag.split(',');
    var str = '';

    if (!end)
    {
      for (var i = 0; i < tag.length; i++)
      {
        if (tag[i] == 'br')
          str += '<br />';
        else
          str += '<' + tag[i] + '>';
      }
    }
    else
    {
      for (var i = (tag.length - 1); i >= 0; i--)
        str += '</' + tag[i] + '>';
    }

    return str;
  },

  insertTag: function(event)
  {
    event.preventDefault();
    var doc = gamefox_lib.getDocument(event);

    var quickpost = doc.getElementsByName('messagetext')[0];
    var scrollTop = quickpost.scrollTop;
    var tagStrStart = gamefox_quickpost.formatTag(this.name, false);
    var tagStrEnd = gamefox_quickpost.formatTag(this.name, true);

    if (quickpost.selectionStart == quickpost.selectionEnd)
    {
      var endPosition = quickpost.selectionEnd + tagStrStart.length;

      quickpost.value = quickpost.value.substr(0, quickpost.selectionStart)
        + tagStrStart + (this.name != 'br' ? tagStrEnd : '')
        + quickpost.value.substr(quickpost.selectionEnd);
    }
    else if (this.name != 'br')
    {
      // encapsulate selected text
      var endPosition = quickpost.selectionEnd + tagStrStart.length +
        tagStrEnd.length;

      quickpost.value = quickpost.value.substr(0, quickpost.selectionStart)
        + tagStrStart + quickpost.value.substring(quickpost.selectionStart,
            quickpost.selectionEnd) + tagStrEnd +
        quickpost.value.substr(quickpost.selectionEnd);
    }

    quickpost.setSelectionRange(endPosition, endPosition);
    quickpost.focus();
    quickpost.scrollTop = scrollTop;

    if (gamefox_lib.prefs.getBoolPref('elements.charcounts'))
      gamefox_messages.updateMessageCount(doc);
  },

  createHTMLButtons: function(doc)
  {
    var span = doc.createElement('span');
    span.id = 'gamefox-html-buttons';

    var tags = [];
    // Standard
    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons'))
      tags.push(
          'b', 'Bold', 'b',
          'i', 'Italics', 'i');
    // Extended
    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons.extended'))
      tags.push(
          'em', 'Emphasis', 'e',
          'strong', 'Strong Emphasis', 's',
          'p', 'Paragraph', 'g',
          'br', 'Break', 'n');
    // GFCode
    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons.gfcode'))
      tags.push(
          'i,p', 'Quote', 'q',
          'em,p', 'Code', 'd');

    var accesskeyPrefix = gamefox_utils.getAccesskeyPrefix();
    var button;

    for (var i = 0; i < tags.length; i += 3)
    {
      if (i != 0)
        span.appendChild(doc.createTextNode(' '));

      button = doc.createElement('input');
      button.type = 'submit';
      button.value = tags[i + 1];
      button.name = tags[i];
      button.title = '<' + tags[i].replace(/,/g, '><') +
        (tags[i] == 'br' ? ' /' : '') + '> [' + accesskeyPrefix + tags[i + 2] + ']';
      button.accessKey = tags[i + 2];
      button.tabIndex = 5;
      button.addEventListener('click', gamefox_quickpost.insertTag, false);

      span.appendChild(button);
    }

    // Break tags
    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons.breaktags'))
    {
      if (span.hasChildNodes())
        span.appendChild(doc.createTextNode(' | '));

      button = doc.createElement('input');
      button.type = 'submit';
      button.value = 'Break HTML';
      button.title = 'Break HTML tags in selection [' + accesskeyPrefix + 'r]';
      button.accessKey = 'r';
      button.tabIndex = 5;
      button.addEventListener('click', gamefox_quickpost.breakTagsFromButton, false);

      span.appendChild(button);
    }

    // Character map
    if (gamefox_lib.prefs.getBoolPref('elements.charmap'))
    {
      if (span.hasChildNodes())
        span.appendChild(doc.createTextNode(' | '));

      button = doc.createElement('input');
      button.type = 'submit';
      button.value = 'Character Map';
      button.tabIndex = 5;
      button.addEventListener('click', gamefox_quickpost.toggleCharacterMap, false);

      span.appendChild(button);
    }

    return span;
  },

  removeGFCodeWhitespace: function(str)
  {
    return gamefox_lib.prefs.getBoolPref('quote.controlwhitespace') ?
      str.replace(/<\/p>\s*<\/(i|em)>\n{2}(?!\n)/g, '</p></$1>\n') : str;
  },

  removeGFCodeWhitespaceListener: function(event)
  {
    var message = event.target.elements.namedItem('messagetext');
    message.value = gamefox_quickpost.removeGFCodeWhitespace(message.value);
  },

  breakTags: function(msg)
  {
    var brokenStr = gamefox_utils.specialCharsDecode(gamefox_utils.breakTags(
          gamefox_utils.specialCharsEncode(msg.value.substring(msg.selectionStart,
              msg.selectionEnd))));

    var endPosition = msg.selectionStart + brokenStr.length;
    msg.value = msg.value.substr(0, msg.selectionStart)
      + brokenStr
      + msg.value.substr(msg.selectionEnd);

    msg.setSelectionRange(endPosition, endPosition);
  },

  breakTagsFromButton: function(event)
  {
    event.preventDefault();
    var doc = gamefox_lib.getDocument(event);

    var msg = doc.getElementsByName('messagetext')[0];
    if (msg.selectionStart == msg.selectionEnd)
    {
      gamefox_lib.alert('You need to select some text containing HTML first.');
      return;
    }

    gamefox_quickpost.breakTags(msg);
    msg.focus();

    if (gamefox_lib.prefs.getBoolPref('elements.charcounts'))
      gamefox_messages.updateMessageCount(doc);
  },

  breakTagsFromContext: function(event)
  {
    gamefox_quickpost.breakTags(event.target);

    if (gamefox_lib.prefs.getBoolPref('elements.charcounts'))
      gamefox_messages.updateMessageCount(gamefox_lib.getDocument(event));
  },

  createHTMLButtonsPref: function()
  {
    return gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons')
      || gamefox_lib.prefs.getBoolPref('elements.charmap')
      || gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons.extended')
      || gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons.gfcode')
      || gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons.breaktags');
  },

  toggleCharacterMap: function(event)
  {
    event.preventDefault();
    var doc = gamefox_lib.getDocument(event);

    var map = doc.getElementById('gamefox-character-map');
    if (map)
    {
      map.style.display = map.style.display == 'none' ? '' : 'none';
      map.style.top = event.target.offsetTop
        + doc.body.parentNode.offsetTop - map.offsetHeight + 'px';
      map.style.left = event.target.offsetLeft + event.target.clientWidth
        + doc.body.parentNode.offsetLeft + 'px';
    }
    else
    {
      map = doc.createElement('div');
      map.id = 'gamefox-character-map';
      map.style.top = event.target.offsetTop
        + doc.body.parentNode.offsetTop - 200 + 'px';
      map.style.left = event.target.offsetLeft + event.target.clientWidth
        + doc.body.parentNode.offsetLeft + 'px';
      var table = doc.createElement('table');
      map.appendChild(table);
      var tbody = doc.createElement('tbody');
      table.appendChild(tbody);

      var characters = [
        ' !"#$%&\'()*+,-./',
        '0123456789:;<=>?',
        '@ABCDEFGHIJKLMNO',
        'PQRSTUVWXYZ[\\]^_',
        '`abcdefghijklmno',
        'pqrstuvwxyz{|}~ ',
        '\u20AC \u201A\u0192\u201E\u2026\u2020\u2021'
          + '\u02C6\u2030\u0160\u2039\u0152 \u017D ',
        ' \u2018\u2019\u201C\u201D\u2022\u2013\u2014'
          + '\u02DC\u2122\u0161\u203A\u0153 \u017E\u0178',
        ' \xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC \xAE\xAF',
        '\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF',
        '\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF',
        '\xD0\xD1\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xDB\xDC\xDD\xDE\xDF',
        '\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF',
        '\xF0\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\xFD\xFE\xFF'
      ];

      for (var i = 0; i < characters.length; i++)
      {
        var tr = doc.createElement('tr');
        for (var j = 0; j < characters[i].length; j++)
        {
          var td = doc.createElement('td');
          var character = characters[i].charAt(j);
          if (character != ' ')
          {
            var a = doc.createElement('a');
            a.appendChild(doc.createTextNode(character));
            a.href = '#';
            a.addEventListener('click', gamefox_quickpost.addCharacter, false);
            td.appendChild(a);
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }

      var button = event.target;
      button.parentNode.parentNode.insertBefore(map,
          button.parentNode.nextSibling.nextSibling);
    }
  },

  addCharacter: function(event)
  {
    event.preventDefault();
    var doc = gamefox_lib.getDocument(event);

    var character = event.target.textContent;

    var msg = doc.getElementsByName('messagetext')[0];
    var endPosition = msg.selectionEnd + character.length;
    msg.value = msg.value.substr(0, msg.selectionEnd)
      + character
      + msg.value.substr(msg.selectionEnd);
    msg.setSelectionRange(endPosition, endPosition);
    msg.focus();

    if (gamefox_lib.prefs.getBoolPref('elements.charcounts'))
      gamefox_messages.updateMessageCount(doc);
  },

  createSigField: function(doc, postPage)
  {
    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.sig'))
    {
      var sigField = doc.createElement('span');
      sigField.id = postPage ? 'gamefox-post-signature' :
        'gamefox-quickpost-signature';

      var span = doc.createElement('span');
      span.textContent = 'Signature:';
      sigField.appendChild(span);

      sigField.appendChild(doc.createElement('br'));

      var sigText = doc.createElement('textarea');
      sigText.name = 'custom_sig';
      sigText.rows = 2;
      sigText.cols = 100;
      sigText.tabIndex = 4;

      sigText.value = doc.gamefox.sig;

      sigField.appendChild(sigText);
      sigField.appendChild(doc.createElement('br'));
    }
    else
    {
      var sigField = doc.createElement('input');
      sigField.name = 'custom_sig';
      sigField.type = 'hidden';
      sigField.value = doc.gamefox.sig;
    }

    return sigField;
  },

  cleanSig: function(event)
  {
    var sig = event.target.elements.namedItem('custom_sig');
    sig.value = gamefox_sig.format(sig.value);
  },

  readPostKey: function()
  {
    var blank = {key: '', ctk: ''};

    var account = gamefox_lib.prefs.getCharPref('accounts.current');
    if (!account)
      return blank;

    var keys = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('keys'));
    if (!keys[account])
      return blank;

    return keys[account];
  },

  setPostKey: function(key)
  {
    var ctk = gamefox_lib.getCookie('ctk');
    var account = gamefox_lib.prefs.getCharPref('accounts.current');
    if (!ctk || !account || !key)
      return false;

    var keys = gamefox_lib.safeEval(gamefox_lib.prefs.getCharPref('keys'));
    keys[account] = { key: key, ctk: ctk };
    gamefox_lib.prefs.setCharPref('keys', gamefox_lib.toJSON(keys));

    return true;
  },

  updatePostKey: function()
  {
    var ctk = gamefox_lib.getCookie('ctk');
    var account = gamefox_lib.prefs.getCharPref('accounts.current');

    if (gamefox_quickpost.readPostKey().ctk == ctk || !account
        || !gamefox_lib.isLoggedIn())
    {
      gamefox_lib.log('Not updating post key: already up to date or not logged'
          + ' in', 2);
      return;
    }

    var now = Math.floor(Date.now() / 1000);
    var disabledUntil = gamefox_lib.prefs
      .getIntPref('keys.throttle.disabledUntil');
    if (disabledUntil > now)
    {
      gamefox_lib.log('Not updating post key: throttled until ' + new
          Date(disabledUntil * 1000));
      return;
    }

    var uri = gamefox_lib.domain + gamefox_lib.path + 'post.php?board=2';
    var keyRequest = new XMLHttpRequest();
    keyRequest.open('GET', uri);
    var ds = gamefox_lib.thirdPartyCookieFix(keyRequest);
    keyRequest.onreadystatechange = function()
    {
      if (keyRequest.readyState == 4)
      {
        var key = keyRequest.responseText
          .match(/<input\b[^>]+?\bname="key"[^>]+?\bvalue="([^"]+)"/);

        if (key)
        {
          var keys = gamefox_lib.safeEval(gamefox_lib.prefs
              .getCharPref('keys'));
          keys[account] = { key: key[1], ctk: ctk };
          gamefox_lib.prefs.setCharPref('keys', gamefox_lib.toJSON(keys));
        }
        else
        { // Throttle unsuccessful attempts to prevent spamming GameFAQs with
          // HTTP requests
          var throttleCount = gamefox_lib.prefs
            .getIntPref('keys.throttle.count');
          var throttleStart = gamefox_lib.prefs
            .getIntPref('keys.throttle.start');

          if (throttleStart < now - 3600) // reset after an hour
            throttleStart = 0;
          else if (throttleCount >= 10) // more than 10 failed requests/hr
          {
            gamefox_lib.prefs.setIntPref('keys.throttle.disabledUntil',
                now + 36000); // disable for 10 hours
          }

          if (!throttleCount || !throttleStart)
          {
            throttleCount = 0;
            throttleStart = now;
          }

          ++throttleCount;

          gamefox_lib.prefs.setIntPref('keys.throttle.count', throttleCount);
          gamefox_lib.prefs.setIntPref('keys.throttle.start', throttleStart);

          gamefox_lib.log('Failed to update post key');
          gamefox_lib.log('Post key response text:\n\n' + keyRequest
              .responseText, 3);
        }
      }
    }

    keyRequest.send();
  },

  keyObserver: function(subject, topic)
  {
    if (!gamefox_lib.isTopBrowserWindow())
      return;

    if (topic) // pref change
    {
      gamefox_quickpost.updatePostKey();
      return;
    }

    let cookie = subject.QueryInterface(Ci.nsICookie);
    if (cookie.host == gamefox_lib.cookieHost && cookie.name == 'ctk')
    {
      if (gamefox_lib.getCookie('ctk'))
        gamefox_quickpost.updatePostKey();
    }
  }
};
