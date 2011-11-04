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

var gamefox_messages =
{
  updateDelay: 100,

  delayedUpdateMessageCount: function(event)
  {
    if (this.timeoutId)
      clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(
        function() { gamefox_messages.updateMessageCount(event); },
        gamefox_messages.updateDelay);
  },

  updateMessageCount: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    var messageLength = gamefox_utils.encodedMessageLength(
        doc.getElementsByName('messagetext')[0].value);

    var messageCount = doc.getElementById('gamefox-message-count');
    messageCount.innerHTML = messageLength + ' / 4096 characters';

    if (messageLength > 4096)
    {
      messageCount.innerHTML += '(!!)';
      messageCount.style.setProperty('font-weight', 'bold', '');
    }
    else
      messageCount.style.setProperty('font-weight', '', '');
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
    var titleLength = gamefox_utils.encodedTitleLength(
        doc.getElementsByName('topictitle')[0].value);

    var titleCount = doc.getElementById('gamefox-title-count');
    titleCount.innerHTML = titleLength + ' / 80 characters';

    if (titleLength > 80)
    {
      titleCount.innerHTML += '(!!)';
      titleCount.style.setProperty('font-weight', 'bold', '');
    }
    else
      titleCount.style.setProperty('font-weight', '', '');
  },

  deletePost: function(event, context)
  {
    context || event.preventDefault();

    var doc = gamefox_lib.getDocument(event);
    var msgComponents = gamefox_utils.getMsgComponents(event.target, doc);
    var deleteType = msgComponents.header.getAttribute('gfdeletetype');

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
                  null, null, null, null, doc.location.pathname);
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
    var editLink = msgComponents.header.getAttribute('gfedit');

    doc.location = gamefox_lib.domain + gamefox_lib.path + editLink;
  },

  post: function(title, message, sig, key, params, callback)
  {
    var strbundle = document.getElementById('overlay-strings');

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
      var postId = gamefox_utils.parseFormInput('post_id', text)[1];
      var uid = gamefox_utils.parseFormInput('uid', text)[1];
      var responseKey = gamefox_utils.parseFormInput('key', text)[1];

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

          callback(!key ? 'E_NO_KEY' : 'E_KEY_MISMATCH',
              strbundle.getString('gamefoxError') + ' ' +

              (!key ? strbundle.getString('missingKey') :
               strbundle.getString('keyMismatch')) +

              '\n\n' + strbundle.getString('retryToFix'), responseKey);
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
        'custom_sig=' + gamefox_utils.URLEncode(sig) + '&' +
        'key=' + key + '&' +
        'post=Preview+Message'
        );
  },

  detectPostError: function(text, status)
  {
    var strbundle = document.getElementById('overlay-strings');
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
  }
};
