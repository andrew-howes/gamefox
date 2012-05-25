/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009, 2010, 2011, 2012
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

/**
 * Quick posting
 * @namespace
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
    form.action = '/boards/post.php?board=' + boardId
        + (topicId ? '&topic=' + topicId : '');
    form.method = 'post';
    form.addEventListener('submit', gamefox_quickpost.cleanSig, false);
    div.appendChild(form);

    if (newTopic)
    {
      var hideLink = doc.createElement('a');
      hideLink.id = 'gamefox-quickpost-hide';
      hideLink.href = '#';
      hideLink.textContent = '×';
      hideLink.title = 'Hide QuickPost';
      hideLink.addEventListener('click', gamefox_quickpost.toggleVisibility,
          false);
      form.appendChild(hideLink);

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
    message.addEventListener('focus', function() {
      doc.gamefox.lastFocusedPostForm = form; }, false);
    form.appendChild(message);

    form.appendChild(doc.createElement('br'));

    // Signature
    form.appendChild(gamefox_quickpost.createSigField(gamefox_sigs.select(doc),
          doc));

    // Post buttons
    form.appendChild(gamefox_quickpost.createPostButtons(doc, ['Post Message',
          'Preview Message', 'Preview and Spellcheck Message', 'Reset']));

    if (charCounts)
    {
      var messagecount = doc.createElement('span');
      messagecount.className = 'gamefox-message-count';
      message.addEventListener('input',
          gamefox_messages.delayedUpdateMessageCount, false);
      form.elements.namedItem('custom_sig').addEventListener('input',
          gamefox_messages.delayedUpdateMessageCount, false);
      form.appendChild(messagecount);
      gamefox_messages.updateMessageCount(form);
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

    doc.gamefox.lastFocusedPostForm = form;
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

  toggleVisibility: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    event.preventDefault();

    var qp = doc.getElementById('gamefox-quickpost-afloat');
    if (qp)
    {
      if (qp.style.opacity == '0')
        gamefox_utils.fade.in(qp);
      else
        gamefox_utils.fade.out(qp);

      return;
    }

    qp = doc.createElement('div');
    qp.id = 'gamefox-quickpost-afloat';
    gamefox_utils.fade.add(qp);

    doc.getElementById('content').appendChild(qp);
    gamefox_quickpost.appendForm(doc, qp, true);
    gamefox_utils.fade.in(qp);
  },

  post: function(event)
  {
    event.target.disabled = true;
    event.target.blur();

    var doc = gamefox_lib.getDocument(event);
    var form = event.target.form;

    var topicTitle = (form.elements.namedItem('topictitle') || {}).value;
    var key = form.elements.namedItem('key').value;
    var message = form.elements.namedItem('messagetext').value;
    var sig = gamefox_sigs.clean(form.elements.namedItem('custom_sig').value);

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
                    topicLink[1], null, null, topicLink[0]);
                  break;

                case 1: // go to board
                  doc.location = gamefox_utils.newURI(params['board'], null,
                    null, null, topicLink[0]);
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
                        params['topic'], pages, msgs + 1, doc.location.pathname
                      );
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
                          params['topic'], 0, '', topicLink.href);
                    }
                    else
                      doc.location = gamefox_utils.newURI(params['board'],
                          params['topic'], pages - 1, 'last', doc.location
                          .pathname);
                  }

                  break;

                case 1: // go back to same page
                  doc.location = gamefox_utils.newURI(params['board'],
                      params['topic'], gamefox_utils
                        .parseQueryString(doc.location.search)['page'], null,
                        doc.location.pathname);
                  break;

                case 2: // go to first page
                  doc.location = gamefox_utils.newURI(params['board'],
                      params['topic'], null, null, doc.location.pathname);
                  break;

                case 3: // go to board
                  doc.location = gamefox_utils.newURI(params['board'], null,
                      null, null, doc.location.pathname);
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
        !gamefox_lib.confirm('Are you sure? This will clear your entire post '
          + 'so far.'))
      return;

    var doc = gamefox_lib.getDocument(event);
    var form = event.target.form;

    form.elements.namedItem('gamefox-message').value = '';

    var custom_sig = form.elements.namedItem('custom_sig');
    if (custom_sig.type != 'hidden' &&
        gamefox_lib.prefs.getBoolPref('elements.quickpost.resetnewsig'))
      custom_sig.value = gamefox_sigs.select(doc);

    gamefox_messages.updateMessageCount(form);

    var topic = doc.getElementById('gamefox-topic');
    if (topic)
    {
      topic.value = '';
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

    var form = event.target.form;
    var quickpost = form.elements.namedItem('messagetext');
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

    gamefox_messages.updateMessageCount(form);
  },

  createHTMLButtons: function(doc)
  {
    var span = doc.createElement('span');
    span.className = 'gamefox-html-buttons';

    var tags = [];
    // Basic
    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons'))
      tags.push(
          'b', 'Bold', 'b',
          'i', 'Italics', 'i'
      );
    // Extra
    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.htmlbuttons.extra'))
      tags.push(
          'quote', 'Quote', 'q',
          'spoiler', 'Spoiler', 's',
          'code', 'Code', 'd'
      );

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
      button.title = '<' + tags[i].replace(/,/g, '><') + (tags[i] == 'br' ?
          ' /' : '') + '>';
      button.tabIndex = 5;
      button.setUserData('accessKey', tags[i + 2], null);
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
      button.title = 'Break HTML tags in selection';
      button.tabIndex = 5;
      button.setUserData('accessKey', 'r', null);
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
      gamefox_messages.updateMessageCount(msg);
  },

  breakTagsFromContext: function(event)
  {
    gamefox_quickpost.breakTags(event.target);
    gamefox_messages.updateMessageCount(event.target);
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
    var form = event.target.form;

    var map = form.getElementsByClassName('gamefox-character-map')[0];
    if (map)
    {
      if (map.style.opacity == '0')
        gamefox_utils.fade.in(map);
      else
        gamefox_utils.fade.out(map);
    }
    else
    {
      map = doc.createElement('div');
      map.className = 'gamefox-character-map';
      map.style.marginLeft = event.target.parentNode.offsetWidth + 'px';
      gamefox_utils.fade.add(map);

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

      event.target.parentNode.parentNode.insertBefore(map,
          event.target.parentNode);
      gamefox_utils.fade.in(map);
    }
  },

  addCharacter: function(event)
  {
    event.preventDefault();

    var form = gamefox_utils.findClosest(event.target, 'form');
    var character = event.target.textContent;
    var msg = form.elements.namedItem('messagetext');
    var endPosition = msg.selectionEnd + character.length;

    msg.value = msg.value.substr(0, msg.selectionEnd)
      + character
      + msg.value.substr(msg.selectionEnd);
    msg.setSelectionRange(endPosition, endPosition);
    msg.focus();

    gamefox_messages.updateMessageCount(form);
  },

  createSigField: function(sig, doc)
  {
    var showSig = gamefox_lib.prefs.getCharPref('signature.show');

    if (showSig == 'always' || (sig && showSig == 'auto'))
    {
      var sigField = doc.createElement('span');
      sigField.id = gamefox_lib.onPage(doc, 'post') ? 'gamefox-post-signature'
        : 'gamefox-quickpost-signature';

      var span = doc.createElement('span');
      span.textContent = 'Signature:';
      sigField.appendChild(span);

      sigField.appendChild(doc.createElement('br'));

      var sigText = doc.createElement('textarea');
      sigText.name = 'custom_sig';
      sigText.rows = 2;
      sigText.cols = 100;
      sigText.tabIndex = 4;
      sigText.value = sig;

      sigField.appendChild(sigText);
      sigField.appendChild(doc.createElement('br'));
    }
    else
    {
      var sigField = doc.createElement('input');
      sigField.name = 'custom_sig';
      sigField.type = 'hidden';
    }

    return sigField;
  },

  cleanSig: function(event)
  {
    var sig = event.target.elements.namedItem('custom_sig');
    sig.value = gamefox_sigs.clean(sig.value);
  },

  readPostKey: function()
  {
    var blank = {key: '', ctk: ''};

    var account = gamefox_lib.prefs.getCharPref('accounts.current');
    if (!account)
      return blank;

    var keys = JSON.parse(gamefox_lib.prefs.getCharPref('keys'));
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

    var keys = JSON.parse(gamefox_lib.prefs.getCharPref('keys'));
    keys[account] = { key: key, ctk: ctk };
    gamefox_lib.prefs.setCharPref('keys', JSON.stringify(keys));

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
          var keys = JSON.parse(gamefox_lib.prefs.getCharPref('keys'));
          keys[account] = { key: key[1], ctk: ctk };
          gamefox_lib.prefs.setCharPref('keys', JSON.stringify(keys));
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
    if (typeof gamefox_lib == 'undefined' || !gamefox_lib.isTopBrowserWindow())
      return;

    if (topic) // pref change
    {
      gamefox_quickpost.updatePostKey();
      return;
    }

    try
    {
      let cookie = subject.QueryInterface(Ci.nsICookie);
      if (cookie.host == gamefox_lib.cookieHost && cookie.name == 'ctk')
      {
        if (gamefox_lib.getCookie('ctk'))
          gamefox_quickpost.updatePostKey();
      }
    } catch (e) {}
  },

  toggleAccessKeys: function(buttons) {
    var accessKeyPrefix = gamefox_utils.getAccesskeyPrefix();

    var button, accessKey;
    for (var i = 0; i < buttons.length; i++)
    {
      button = buttons[i];
      accessKey = button.getUserData('accessKey');

      if (button.accessKey)
      {
        button.accessKey = null;
        button.title = button.title.substr(0, button.title.indexOf(
              ' ['));
      }
      else if (accessKey)
      {
        button.accessKey = accessKey;
        button.title = button.title + ' [' + accessKeyPrefix + accessKey
          + ']';
      }
    }
  },

  /**
   * Create the post, preview and reset buttons
   *
   * @param {HTMLDocument} doc
   * @param {Array} showBtns
   *        List of buttons to show, e.g. ['Post Message', 'Reset']
   * @return {HTMLElement} Element containing the buttons
   */
  createPostButtons: function(doc, showBtns)
  {
    let btns =
    {
      'Post Message': ['button', 'quickpost', 'z', 'gamefox-quickpost-btn',
        gamefox_quickpost.post, 'elements.quickpost.button'],
      'Save': ['submit', '', 'z', '', gamefox_messages.saveEdit, ''],
      'Preview Message': ['submit', 'post', 'x', '', null,
        'elements.quickpost.otherbuttons'],
      'Preview and Spellcheck Message': ['submit', 'post', 'c', '', null,
        'elements.quickpost.otherbuttons'],
      'Reset': ['reset', '', 'v', '', gamefox_quickpost.resetPost,
        'elements.quickpost.otherbuttons'],
      'Cancel': ['submit', '', 'v', '', gamefox_messages.cancelEdit]
    };

    let el = doc.createElement('span');
    el.className = 'gamefox-post-buttons';

    showBtns.forEach(function(btn) {
      if (btns.hasOwnProperty(btn) && (!btns[btn][5] || gamefox_lib.prefs
            .getBoolPref(btns[btn][5])))
      {
        let this_btn = btns[btn];
        let btnEl = doc.createElement('input');
        btnEl.value = btn;
        btnEl.title = btn;
        btnEl.type = this_btn[0];
        if (this_btn[1]) btnEl.name = this_btn[1];
        btnEl.setUserData('accessKey', this_btn[2], null);
        if (this_btn[3]) btnEl.id = this_btn[3];
        if (this_btn[4]) btnEl.addEventListener('click', this_btn[4], false);
        btnEl.tabIndex = 3;

        el.appendChild(btnEl);
        el.appendChild(doc.createTextNode(' '));
      }
    });

    // Remove the last " " text node
    el.removeChild(el.lastChild);

    return el;
  }
};
