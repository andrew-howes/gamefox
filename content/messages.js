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
 * Message posting, editing, deleting, and other related functions
 * @namespace
 */
var gamefox_messages =
{
  updateDelay: 100,

  delayedUpdateMessageCount: function(event)
  {
    if (this.timeoutId)
      clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(
        function() { gamefox_messages.updateMessageCount(event.target); },
        gamefox_messages.updateDelay);

    // Auto-expand quick edit textarea
    if (event.target.form.className == 'gamefox-edit')
      event.target.style.height = event.target.scrollHeight + 'px';
  },

  updateMessageCount: function(element)
  {
    var doc = gamefox_lib.getDocument(element);
    var form = gamefox_utils.findClosest(element, 'form');
    var count = form.getElementsByClassName('gamefox-message-count')[0];
    var message = form.elements.namedItem('messagetext');
    var sig = form.elements.namedItem('custom_sig');

    if (!count) return;

    var str = message.value.trim();
    if (sig && sig.type != 'hidden')
      str += '\n---\n' + sig.value.trim();
    var length = gamefox_utils.encodedMessageLength(str);

    count.textContent = length + ' / 4096 characters';

    if (length > 4096)
    {
      count.textContent += '(!!)';
      count.style.setProperty('font-weight', 'bold', '');
    }
    else
      count.style.setProperty('font-weight', '', '');

    // Auto-contract quick edit textarea (separate from auto-expand to prevent
    // lag)
    if (form.className == 'gamefox-edit')
      window.setTimeout(function() {
        message.style.height = 'auto';
        message.style.height = message.scrollHeight + 'px';
      }, 10);
  },

  delayedUpdateTitleCount: function(event)
  {
    if (this.timeoutId)
      clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(
        function() { gamefox_messages.updateTitleCount(event); },
        gamefox_messages.updateDelay);
  },

  updateTitleCount: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    var length = gamefox_utils.encodedTitleLength(doc.getElementsByName(
          'topictitle')[0].value);

    var count = doc.getElementById('gamefox-title-count');
    if (!count)
      return;

    count.textContent = length + ' / 80 characters';

    if (length > 80)
    {
      count.textContent += '(!!)';
      count.style.setProperty('font-weight', 'bold', '');
    }
    else
      count.style.setProperty('font-weight', '', '');
  },

  deletePost: function(event, context)
  {
    context || event.preventDefault();

    var doc = gamefox_lib.getDocument(event);
    var msgComponents = gamefox_utils.getMsgComponents(event.target, doc);
    var deleteType = msgComponents.header.getUserData('gamefox_deleteType');

    var closeTopic = deleteType == 'close';
    var deletePost = deleteType == 'deletepost';
    var deleteTopic = deleteType == 'deletetopic';

    if (deleteTopic)
      var str = 'Delete this topic?';
    else if (closeTopic)
      var str = 'Close this topic?';
    else if (deletePost)
      var str = 'Delete this post?';
    else
      return;

    if (!gamefox_lib.confirm(str)) return false;

    var doc = gamefox_lib.getDocument(event);
    var uri = msgComponents.header.getElementsByTagName('a')[2].href;

    var get = new XMLHttpRequest();
    get.open('GET', uri);
    var ds = gamefox_lib.thirdPartyCookieFix(get);
    get.onreadystatechange = function()
    {
      if (get.readyState == 4)
      {
        if (get.responseText.indexOf('>Delete this Message</h2>') == -1 &&
            get.responseText.indexOf('>Close this Topic</h2>') == -1)
        {
          gamefox_lib.alert('No action is available.');
          return false;
        }

        var post = new XMLHttpRequest();
        post.open('POST', uri + '?action=' + (closeTopic ? 'closetopic' : 'delete'));
        var ds = gamefox_lib.thirdPartyCookieFix(post);
        post.onreadystatechange = function()
        {
          if (post.readyState == 4)
          {
            if (post.responseText.indexOf('<title>401 Error') != -1)
              gamefox_lib.alert('Can\'t delete this message.');
            else if (deleteTopic)
              doc.location = gamefox_utils.newURI(
                  gamefox_utils.parseBoardLink(doc.location.pathname)['board'],
                  null, null, null, doc.location.pathname);
            else
            {
              if (!closeTopic)
                doc.location.hash = '#' + msgComponents.id;
              doc.location.reload();
            }
          }
        }
        post.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        post.send('key=' + get.responseText.match(/<input\b[^>]+?\bname="key"[^>]+?\bvalue="([^"]*)"[^>]*>/)[1] +
            '&YES=1');
      }
    }
    get.send(null);
  },

  edit: function(event, context)
  {
    context || event.preventDefault();

    var doc = gamefox_lib.getDocument(event);
    var msgComponents = gamefox_utils.getMsgComponents(event.target, doc);
    var msgBody = msgComponents.body;

    if (msgBody.getUserData('gamefox_editing') === true)
    {
      gamefox_messages.cancelEdit(event);
      return;
    }

    var uri = msgComponents.header.getUserData('gamefox_editURI');

    var get = new XMLHttpRequest();
    get.open('GET', uri);
    var ds = gamefox_lib.thirdPartyCookieFix(get);
    get.onreadystatechange = function()
    {
      if (get.readyState == 4)
      {
        var msg = get.responseText
          .match(/name="messagetext"[^>]*>([\S\s]*?)<\/textarea>/m);
        if (!msg)
        {
          gamefox_lib.alert('You can\'t edit this post anymore.');
          return;
        }
        msg = gamefox_utils.convertNewlines(gamefox_utils.specialCharsDecode(
              msg[1]));

        var key = gamefox_utils.parseFormInput('key', get.responseText);

        gamefox_messages.loadLatestEdit(msgComponents);
        gamefox_messages.getEditMenu(msgComponents).disabled = true;

        msgBody.setUserData('gamefox_editing', true, null);
        msgBody.setUserData('gamefox_originalPost', msgBody.innerHTML, null);
        msgBody.innerHTML = '';

        var editForm = doc.createElement('form');
        editForm.className = 'gamefox-edit';
        editForm.method = 'post';
        editForm.action = uri;

        if (gamefox_quickpost.htmlButtonsEnabled)
        {
          editForm.appendChild(gamefox_quickpost.createHTMLButtons(doc, true));
          editForm.appendChild(doc.createElement('br'));
        }

        var keyField = doc.createElement('input');
        keyField.name = 'key';
        keyField.type = 'hidden';
        keyField.value = key;
        editForm.appendChild(keyField);

        var editBox = doc.createElement('textarea');
        editBox.name = 'messagetext';
        editBox.style.width = '100%';
        editBox.textContent = msg;
        editBox.addEventListener('focus', function() {
          doc.gamefox.lastFocusedPostForm = editForm; }, false);
        editForm.appendChild(editBox);

        editForm.appendChild(gamefox_quickpost.createPostButtons(doc, ['Save',
                'Preview Message', 'Preview and Spellcheck Message', 'Cancel'],
              true));

        if (gamefox_lib.prefs.getBoolPref('elements.charcounts'))
        {
          var msgCount = doc.createElement('span');
          msgCount.className = 'gamefox-message-count';
          editBox.addEventListener('input',
              gamefox_messages.delayedUpdateMessageCount, false);
          editForm.appendChild(msgCount);
          gamefox_messages.updateMessageCount(editForm);
        }

        msgBody.appendChild(editForm);
        editBox.focus();
      }
    };
    get.send(null);
  },

  cancelEdit: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    var msgComponents = gamefox_utils.getMsgComponents(event.target, doc);
    var msgBody = msgComponents.body;

    msgBody.innerHTML = msgBody.getUserData('gamefox_originalPost');
    msgBody.setUserData('gamefox_editing', false, null);
    gamefox_messages.getEditMenu(msgComponents).disabled = false;
    doc.gamefox.lastFocusedPostForm = doc.getElementById(
        'gamefox-quickpost-form');
  },

  saveEdit: function(event)
  {
    event.preventDefault();
    event.target.disabled = true;
    event.target.blur();

    var doc = gamefox_lib.getDocument(event);
    var msgComponents = gamefox_utils.getMsgComponents(event.target, doc);
    var editForm = msgComponents.body.firstChild;

    var editURI = msgComponents.header.getUserData('gamefox_editURI');
    var editKey = editForm.elements.namedItem('key').value;

    gamefox_messages.post('', editForm.elements.namedItem('messagetext').value,
        '', editKey, gamefox_utils.parseQueryString(editURI),
        function(result, msg, data) {
          if (msg)
          {
            gamefox_lib.alert(msg);
            event.target.removeAttribute('disabled');
          }
          else if (result == 'SUCCESS')
          {
            doc.location.hash = msgComponents.id;
            doc.location.reload();
          }
        });
  },

  post: function(title, message, sig, key, params, callback, lastTry)
  {
    var strbundle = document.getElementById('gamefox-overlay-strings');

    if (!callback)
      callback = function(result, msg, data) {
        if (msg) gamefox_lib.alert(msg);
      };

    var uri = gamefox_lib.domain + gamefox_lib.path + 'post.php?board=' +
      gamefox_utils.URLEncode(params['board']) +
      (params['topic'] ? '&topic=' + params['topic'] : '') +
      (params['message'] ? '&message=' + params['message'] : '');

    var preview = new XMLHttpRequest();
    preview.open('POST', uri);
    var ds = gamefox_lib.thirdPartyCookieFix(preview);
    preview.onreadystatechange = function()
    {
      if (preview.readyState != 4) return;

      var text = preview.responseText;
      var postId = gamefox_utils.parseFormInput('post_id', text);
      var uid = gamefox_utils.parseFormInput('uid', text);
      var responseKey = gamefox_utils.parseFormInput('key', text);

      if (!postId) // error
      {
        var error;

        if (error = gamefox_messages.detectPostError(text, preview.status))
          callback(error[0], error[1]);
        else if (!responseKey)
          callback('E_NO_RESPONSE_KEY', strbundle.getString('gamefoxError') +
              ' ' + strbundle.getString('cannotFindKey'));
        else if (!key || key != responseKey)
        {
          gamefox_quickpost.setPostKey(responseKey);

          if (!lastTry)
            gamefox_messages.post(title, message, sig, responseKey, params,
                callback, true);
          else
            callback(!key ? 'E_NO_KEY' : 'E_KEY_MISMATCH',
                strbundle.getString('gamefoxError') + ' ' +

                (!key ? strbundle.getString('missingKey') :
                 strbundle.getString('keyMismatch')), responseKey);
        }
        else
          callback('E_PREVIEW_UNEXPECTED',
              strbundle.getString('unexpectedPostError'));

        return;
      }

      if (text.indexOf('<h2 class="title">Post Warning</h2>') != -1)
      {
        var warning = text.match(/message:<\/b><\/p>(.*)You may go ahead/);
        warning = warning ? warning[1].replace(/<P>/g, '\n\n').trim() :
          'Your post contains a word that may be bad.';
        if (!gamefox_lib.confirm(warning + '\n\nSubmit this post?'))
        {
          callback('E_AUTOFLAG');
          return;
        }
      }

      // Preview was a success - make the post
      var post = new XMLHttpRequest();
      post.open('POST', uri);
      var ds = gamefox_lib.thirdPartyCookieFix(post);
      post.onreadystatechange = function()
      {
        if (post.readyState != 4) return;

        var text = post.responseText;
        if (text.indexOf('<h2 class="title">Message Posted</h2>') == -1 &&
            text.indexOf('<table class="board message"') == -1 &&
            // GameFAQs bug puts us on a nonexistent page when the last
            // post of a page is made
            text.indexOf('<div class="details"><p>No messages') == -1)
        { // error
          var error;

          if (error = gamefox_messages.detectPostError(text, post.status))
            callback(error[0], error[1]);
          else
          {
            gamefox_lib.log('Unknown QuickPost error on post request');
            gamefox_lib.log('QuickPost response text:\n\n' + text, 3);

            callback('E_POST_UNEXPECTED',
                strbundle.getString('unexpectedPostError'));
          }

          return;
        }

        callback('SUCCESS', '',
            title ? text.match(/\/boards\/[^\/]+\/(\d+)/) : '');
      }

      post.setRequestHeader('Content-Type',
          'application/x-www-form-urlencoded');
      post.send(
          'post_id=' + postId + '&' +
          'uid=' + uid + '&' +
          'key=' + key + '&' +
          'post=Post+Message'
          );
    }
    
    preview.setRequestHeader('Content-Type',
        'application/x-www-form-urlencoded');
    preview.send(
        (title ? 'topictitle=' + gamefox_utils.URLEncode(title) + '&' : '') +
        'messagetext=' + gamefox_utils.URLEncode(message) + '&' +
        (sig ? 'custom_sig=' + gamefox_utils.URLEncode(sig) + '&' : '') +
        'key=' + key + '&' +
        'post=Preview+Message'
        );
  },

  detectPostError: function(text, status)
  {
    var strbundle = document.getElementById('gamefox-overlay-strings');
    var error;

    if (!/\S/.test(text))
      return ['E_TIMEOUT', strbundle.getString('requestTimeout')];
    else if (status == 503)
      return ['E_MAINTENANCE', strbundle.getString('maintenance')];
    else if (text.indexOf('<title>404 Error') != -1 ||
        text.indexOf('<title>403 Error') != -1)
    {
      error = (text.match(new RegExp('<p>The error message from the ' +
              'server is: <b>(.*)</b>([^<]+)</p>')) || []);
      error = error[1] + error[2];

      if (error.indexOf('closed') != -1)
        return ['E_TOPIC_CLOSED',
            strbundle.getString('closedTopicPostError')];
      else if (error.indexOf('no longer available') != -1)
        return ['E_TOPIC_DELETED',
            strbundle.getString('deletedTopicPostError')];
      else
        return ['E_SERVER', error];
    }
    else if (text.indexOf('<h2 class="title">Post Error</h2>') != -1)
    {
      // Extract the error message from the post page
      error = text.match(new RegExp('<h2 class="title">Post Error</h2>' +
            '</div>\\s*<div class="body">\\s*<div class="details">\\s*' +
            '(.*)\\s*</div>')) || [];

      // Convert HTML to plain text
      error = error[1]
        .replace(/(message:)\s*<\/b>\s+([^<])/, '$1<li>$2')
        .replace(/<li>/ig, '\n    * ')
        .replace(/<p>/ig, '\n\n')
        .replace(/<\/?(b|ul|p|li)>/ig, '')
        .trim();

      return ['E_GENERIC', error];
    }
    else
      return false;
  },

  fetchEdits: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    var select = event.target;

    if (select.tagName != 'SELECT' || select.getUserData('state') == 'loading')
      return;

    select.setUserData('state', 'loading', null);

    select.remove(0);
    var option = doc.createElement('option');
    option.textContent = 'Loading edit history...';
    select.add(option, null);

    var uri = select.parentNode.parentNode.getElementsByTagName('a')[2].href;
    var req = new XMLHttpRequest();
    req.open('GET', uri);
    var ds = gamefox_lib.thirdPartyCookieFix(req);
    req.onreadystatechange = function()
    {
      if (req.readyState != 4) return;

      select.remove(0);

      var pattern = '<td class="author">[\\s\\S]*?Posted: (.*?)\\s*</td>\\s*' +
        '<td>([\\s\\S]*?)</td>';
      var edits = req.responseText.match(new RegExp(pattern, 'g'));

      // The latest edit is actually the first match, but subsequent matches
      // are in ascending order
      edits.push(edits.shift());
      edits.reverse();

      var matches, option, editNum, date, text;
      for (var i = 0; i < edits.length; i++)
      {
        editNum = edits.length - i - 1;
        matches = edits[i].match(new RegExp(pattern));
        date = matches[1];

        // For the latest edit, use the HTML from the message list rather than
        // the detail page to keep anchors/extension processing
        if (i == 0)
          text = gamefox_utils.getMsgComponents(select, doc).body.innerHTML;
        else
          text = matches[2];

        option = doc.createElement('option');
        option.textContent = (editNum == 0 ? 'original' : 'edit #' + editNum) +
          ': ' + (gamefox_date.enabled ? gamefox_date.parseFormat(date,
                gamefox_date.getFormat('message')) : date);
        option.setUserData('text', text, null);
        select.add(option, null);
      }

      var viewEdit = function() {
        var classNames = ['gamefox-edit-view-header',
            'gamefox-edit-view-body'];
        var msgComponents = gamefox_utils.getMsgComponents(select, doc);

        msgComponents.body.innerHTML = select.options[select.selectedIndex]
          .getUserData('text');
        gamefox_page_msgs.wrapSigs(msgComponents.body);

        var headerRow = msgComponents.header.parentNode;
        var bodyRow = msgComponents.body.parentNode;
        if (!msgComponents.leftMsgData)
        {
          headerRow = headerRow.parentNode;
          bodyRow = bodyRow.parentNode;
        }

        if (select.selectedIndex != 0)
        {
          headerRow.classList.add(classNames[0]);
          bodyRow.classList.add(classNames[1]);
          msgComponents.body.setUserData('gamefox_edit_view', true, null);
        }
        else
        {
          headerRow.classList.remove(classNames[0]);
          bodyRow.classList.remove(classNames[1]);
          msgComponents.body.setUserData('gamefox_edit_view', false, null);
        }
      };
      select.addEventListener('change', viewEdit, false);
      select.addEventListener('keyup', viewEdit, false);
    }
    req.send(null);
  },

  /**
   * Gets the edit history menu element of a message
   *
   * @param {Object} msgComponents
   * @return {Object} HTMLSelectElement or empty object
   */
  getEditMenu: function(msgComponents)
  {
    var doc = gamefox_lib.getDocument(msgComponents.header);

    try {
      return msgComponents.header.getElementsByClassName('gamefox-edit-list')
        [0].firstChild;
    }
    catch (e if e.name == 'TypeError') { return {}; }
  },

  loadLatestEdit: function(msgComponents)
  {
    var doc = gamefox_lib.getDocument(msgComponents.header);
    var select = gamefox_messages.getEditMenu(msgComponents);

    if (select.tagName && msgComponents.body.getUserData('gamefox_edit_view'))
    {
      select.selectedIndex = 0;

      var evt = doc.createEvent('HTMLEvents');
      evt.initEvent('change', false, false);
      select.dispatchEvent(evt);
    }
  }
};
