/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008 Brian Marshall, Michael Ryan, Andrianto Effendy
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

    this.timeoutId = setTimeout(gamefox_messages.updateMessageCount,
        gamefox_messages.updateDelay, event);
  },

  updateMessageCount: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    var messageLength = gamefox_utils.encodedMessageLength(
        doc.getElementsByName('message')[0].value);

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

    this.timeoutId = setTimeout(gamefox_messages.updateTitleCount,
        gamefox_messages.updateDelay, event);
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
    var uri = msgComponents.header.getElementsByTagName('a')[1].href;

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
        post.open('POST', uri + '&action=' + (closeTopic ? 'closetopic' : 'delete'));
        var ds = gamefox_lib.thirdPartyCookieFix(post);
        post.onreadystatechange = function()
        {
          if (post.readyState == 4)
          {
            if (post.responseText.indexOf('<title>401 Error') != -1)
              gamefox_lib.alert('Can\'t delete this message.');
            else if (deleteTopic)
              doc.location = gamefox_lib.domain + gamefox_lib.path + 'gentopic.php?board='
                + gamefox_utils.parseQueryString(doc.location.search)['board'];
            else
            {
              if (!closeTopic)
                doc.location.hash = '#' + msgComponents.header.id;
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
  }
};
