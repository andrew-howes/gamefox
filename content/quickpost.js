/* vim: set et sw=2 ts=2 sts=2 tw=79:
 *
 * Copyright 2008, 2009 Brian Marshall, Michael Ryan, Andrianto Effendy
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
    var accesskeyPrefix = gamefox_utils.getAccesskeyPrefix();

    var form = doc.createElement('form');
    form.id = 'gamefox-quickpost-form';
    form.action = 'post.php' + gamefox_utils.stripQueryString(doc.location.search);
    form.method = 'post';
    form.addEventListener('submit', gamefox_quickpost.removeGFCodeWhitespaceListener,
        false);
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

    var message = doc.createElement('textarea');
    message.id = 'gamefox-message';
    message.name = 'message';
    message.wrap = 'virtual';
    message.rows = 16;
    message.cols = 60;
    message.tabIndex = 2;
    doc.gamefox.sig = gamefox_sig.format(null, null, doc);
    if (gamefox_lib.prefs.getIntPref('signature.addition') == 1)
      form.addEventListener('submit', gamefox_quickpost.appendSig, false);
    else
      message.value = doc.gamefox.sig;
    form.appendChild(message);
    try
    {
      message.setSelectionRange(0, 0);
    }
    catch (e) {}

    form.appendChild(doc.createElement('br'));

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

    if (gamefox_lib.isNightly())
    {
      var nightlyMsg = doc.createElement('span');
      nightlyMsg.id = 'gamefox-nightly-msg';
      nightlyMsg.appendChild(doc.createTextNode('GameFOX nightly build (pre-release)'));

      var age = gamefox_lib.getNightlyAge();
      if (age > 1)
      {
        nightlyMsg.appendChild(doc.createTextNode(' - '));
        var projectLink = doc.createElement('a');
        projectLink.href = 'http://beyondboredom.net/projects/gamefox/';
        projectLink.appendChild(doc.createTextNode(age + ' days out-of-date'));
        nightlyMsg.appendChild(projectLink);
      }

      form.appendChild(doc.createElement('br'));
      form.appendChild(nightlyMsg);
    }

    // Dragging for floating QuickPost
    if (newTopic)
    {
      // Set these manually here instead of in CSS for the drag script
      div.style.left = window.innerWidth * 0.20 + 'px';
      div.style.top = window.innerHeight * 0.30 + 'px';

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
      drag.offsetX = gamefox_utils.extractNumber(node.style.left);
      drag.offsetY = gamefox_utils.extractNumber(node.style.top);

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
      var left = gamefox_utils.extractNumber(element.style.left);
      if (left + element.offsetWidth < 50)
        element.style.left = (50 - element.offsetWidth) + 'px';
      else if (left > window.innerWidth - 50)
        element.style.left = (window.innerWidth - 50) + 'px';

      var top = gamefox_utils.extractNumber(element.style.top);
      if (top + element.offsetHeight < 50)
        element.style.top = (50 - element.offsetHeight) + 'px';
      else if (top > window.innerHeight - 150) // window chrome makes this weird
        element.style.top = (window.innerHeight - 150) + 'px';
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

    doc.getElementById('board_wrap').appendChild(qpDiv);
    gamefox_quickpost.appendForm(doc, qpDiv, true);
  },

  post: function(event)
  {
    var doc = gamefox_lib.getDocument(event);
    var query = gamefox_utils.stripQueryString(doc.location.search);
    var strbundle = document.getElementById('overlay-strings');
    // make sure we're not trying to post a message to a topic that was
    // deleted by the user due to the topic list being on detail.php
    if (gamefox_lib.onPage(doc, 'topics'))
      query = query.replace(/&topic=[^&]*/g, '');

    event.target.disabled = true;
    event.target.blur();

    var topicTitle = doc.getElementsByName('topictitle')[0];
    var message = gamefox_quickpost.removeGFCodeWhitespace(
        doc.getElementsByName('message')[0].value);
    if (gamefox_lib.prefs.getIntPref('signature.addition') == 1
        && !gamefox_lib.onPage(doc, 'post'))
      message += gamefox_sig.format(null, null, doc);

    if (/^\s*---(\n|$)/.test(message)
        && gamefox_lib.prefs.getBoolPref('elements.quickpost.blankPostWarning'))
    {
      var promptService = Cc['@mozilla.org/embedcomp/prompt-service;1'].
        getService(Ci.nsIPromptService);
      var neverWarn = {value:false};
      var flags = promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_YES +
        promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_NO;
      var button = promptService.confirmEx(null, 'GameFOX',
          strbundle.getString('warnBlankPost'), flags, '', '', '',
          strbundle.getString('neverWarnBlankPost'), neverWarn);

      if (neverWarn.value == true)
        gamefox_lib.prefs.setBoolPref('elements.quickpost.blankPostWarning', false);

      if (button == 1)
      {
        event.target.removeAttribute('disabled');
        return;
      }
    }

    var previewRequest = new XMLHttpRequest();
    previewRequest.open('POST', gamefox_lib.domain + gamefox_lib.path + 'post.php' + query);
    var ds = gamefox_lib.thirdPartyCookieFix(previewRequest);
    previewRequest.onreadystatechange = function()
    {
      if (previewRequest.readyState == 4)
      {
        var text = previewRequest.responseText;
        var postId = text.match(/<input\b[^>]+?\bname="post_id"[^>]+?\bvalue="([^"]*)"/);

        if (!postId)
        { // error
          if (!/\S/.test(text))
            gamefox_lib.alert('Request timed out. Check your network connection and try again.');
          else
          {
            var badWord = text.match(/<p>Banned word found: <b>([^<]+)<\/b>/i);
            var tooBig = text.match(/4096 characters\. Your message is ([0-9]+) characters/);
            var titleLength = text.indexOf('Topic titles must be between 5 and 80 characters') != -1;
            var allCapsTitle = text.indexOf('Topic titles cannot be in all uppercase') != -1;
            var allCapsMessage = text.indexOf('Messages cannot be in all uppercase') != -1;
            var noTopics = text.indexOf('You are not authorized to create topics on this board') != -1;
            var noMessages = text.indexOf('You are not authorized to post messages on this board') != -1;
            var longWordInTitle = text.indexOf('Your topic title contains a single word over 25 characters') != -1;
            var longWordInMessage = text.indexOf('Your message contains a single word over 80 characters') != -1;
            var blankMessage = text.indexOf('Messages cannot be blank') != -1;
            var badHTML = text.indexOf('Your HTML is not well-formed') != -1;
            var nonASCIITitle = text.indexOf('Topic titles cannot contain non-ASCII characters') != -1;
            var closedTopic = text.indexOf('This topic is closed') != -1;
            var deletedTopic = text.indexOf('This topic is no longer available') != -1;
            var maintenance = previewRequest.status == 503;

            if (badWord)
              gamefox_lib.alert('Your post includes the word "' + badWord[1] + '", which is a bad ' +
                  'word. Didn\'t anyone ever tell you "' + badWord[1] + '" was a bad word?');
            else if (tooBig)
              gamefox_lib.alert('Your post is too big! A message can only contain 4096 characters, ' +
                  'but yours has ' + tooBig[1] + '.');
            else if (titleLength)
              gamefox_lib.alert('Your topic title must be between 5 and 80 characters in length.');
            else if (allCapsTitle)
              gamefox_lib.alert('Turn off your caps lock and try typing your topic title again.');
            else if (allCapsMessage)
              gamefox_lib.alert('Turn off your caps lock and try typing your message again.');
            else if (noTopics)
              gamefox_lib.alert('You are not allowed to post topics here.');
            else if (noMessages)
              gamefox_lib.alert('You are not allowed to post messages here.');
            else if (longWordInTitle)
              gamefox_lib.alert('Your topic title contains a word over 25 characters in length. ' +
                  'This makes CJayC unhappy because it stretches his 640x480 resolution ' +
                  'screen, so he doesn\'t allow it.');
            else if (longWordInMessage)
              gamefox_lib.alert('Your message contains a word over 80 characters in length. ' +
                  'This makes CJayC unhappy because it stretches his 640x480 resolution ' +
                  'screen, so he doesn\'t allow it.');
            else if (blankMessage)
              gamefox_lib.alert('Maybe you should actually type something...');
            else if (badHTML)
              gamefox_lib.alert('Your HTML is not well-formed. Check for mismatched tags.');
            else if (nonASCIITitle)
              gamefox_lib.alert('Topic titles cannot contain non-ASCII characters.');
            else if (closedTopic)
              gamefox_lib.alert('The topic was closed while you were typing your message. ' +
                  'Type faster next time!');
            else if (deletedTopic)
              gamefox_lib.alert('The topic is gone! Damn moderators...');
            else if (maintenance)
              gamefox_lib.alert('The site is temporarily down for maintenance.');
            else
              gamefox_lib.alert('Something went wrong but I don\'t know what. Try posting ' +
                  'without QuickPost, and if you think you\'ve found a bug ' +
                  'report it at Blood Money.');
          }
          event.target.removeAttribute('disabled');
          return;
        }
        else
        {
          if (text.indexOf('<div class="head"><h2 class="title">Post Warning</h2></div>') != -1)
          {
            var warning = text.match(/message:<\/b><\/p>(.*)You may go ahead/);
            warning = warning ? warning[1].replace(/<P>/g, '\n\n').gamefox_trim() :
              'Your post contains a word that may be bad.';
            if (!gamefox_lib.confirm(warning + '\n\nSubmit this post?'))
            {
              event.target.removeAttribute('disabled');
              return;
            }
          }

          var postRequest = new XMLHttpRequest();
          postRequest.open('POST', gamefox_lib.domain + gamefox_lib.path + 'post.php' + query);
          var ds = gamefox_lib.thirdPartyCookieFix(postRequest);
          postRequest.onreadystatechange = function()
          {
            if (postRequest.readyState == 4)
            {
              var text = postRequest.responseText;
              if (text.indexOf('<div class="head"><h2 class="title">Message Posted</h2></div>') == -1)
              { // error
                if (!/\S/.test(text))
                  gamefox_lib.alert('Request timed out. Check your network connection and try again.');
                else
                {
                  var flooding = text.indexOf('Please wait and try your post again') != -1;
                  var closedTopic = text.indexOf('This topic is closed') != -1;
                  var deletedTopic = text.indexOf('This topic is no longer available') != -1;
                  var dupeTitle = text.indexOf('A topic with this title already exists') != -1;

                  if (flooding)
                    gamefox_lib.alert('You have hit one of the time-based posting limits (e.g., 2 posts per minute).');
                  else if (closedTopic)
                    gamefox_lib.alert('The topic was closed while you were typing your message. Type faster next time!');
                  else if (deletedTopic)
                    gamefox_lib.alert('The topic is gone! Damn moderators...');
                  else if (dupeTitle)
                    gamefox_lib.alert('A topic with this title already exists. Choose another title.');
                  else
                    gamefox_lib.alert('Something went wrong but I don\'t know what. Try posting ' +
                        'without QuickPost, and if you think you\'ve found a bug ' +
                        'report it at Blood Money.');
                }
                event.target.removeAttribute('disabled');
                return;
              }

              event.target.removeAttribute('disabled');
              query = gamefox_utils.parseQueryString(query);
              if (topicTitle) // new topic
              {
                switch (gamefox_lib.prefs.getIntPref('elements.quickpost.aftertopic'))
                {
                  case 0: // go to topic
                    doc.location = gamefox_lib.domain + gamefox_lib.path + 'genmessage.php?' +
                      'board=' + query['board'] + '&topic=' +
                      text.match(/genmessage\.php\?board=(?:[0-9-]+)&topic=([0-9]+)/)[1];
                    break;

                  case 1: // go to board
                    doc.location = gamefox_lib.domain + gamefox_lib.path + 'gentopic.php?' +
                      'board=' + query['board'];
                    break;
                }
              }
              else // new message
              {
                switch (gamefox_lib.prefs.getIntPref('elements.quickpost.aftermessage'))
                {
                  case 0: // go to last page/post
                    var msgsPerPage = gamefox_lib.prefs.getIntPref('msgsPerPage');
                    var end;

                    if (doc.gamefox.pages * msgsPerPage == doc.gamefox.msgnum)
                      end = '&page=' + doc.gamefox.pages; // next page
                    else if (doc.gamefox.pages > 1)
                      end = '&page=' + (doc.gamefox.pages - 1); // last page
                    else
                      end = ''; // first page

                    if (end.length)
                      end += gamefox_utils.tcParam(doc.gamefox.tc);

                    if (doc.gamefox.msgnum > (doc.gamefox.pages - 1) * msgsPerPage &&
                        doc.gamefox.pages * msgsPerPage != doc.gamefox.msgnum)
                    { // on last page
                      var postnumStr = (doc.gamefox.msgnum + 1).toString();
                      end += '#p' + ('000'.substr(postnumStr.length)) + postnumStr;
                    }
                    else
                      end += '#last-post';

                    doc.location = gamefox_lib.domain + gamefox_lib.path + 'genmessage.php?' +
                      'board=' + query['board'] + '&topic=' + query['topic'] + end;

                    if ((query['page'] == (doc.gamefox.pages - 1) || doc.gamefox.pages == 1)
                        && doc.location.hash.length)
                      doc.location.reload(); // hash changes don't reload the page
                    break;

                  case 1: // go back to same page
                    doc.location = gamefox_lib.domain + gamefox_lib.path + 'genmessage.php?' +
                      'board=' + query['board'] + '&topic=' + query['topic'] +
                      (query['page'] ? '&page=' + query['page'] : '') +
                      gamefox_utils.tcParam(doc.gamefox.tc);
                    break;

                  case 2: // go to first page
                    doc.location = gamefox_lib.domain + gamefox_lib.path + 'genmessage.php?' +
                      'board=' + query['board'] + '&topic=' + query['topic'];
                    break;

                  case 3: // go to board
                    doc.location = gamefox_lib.domain + gamefox_lib.path + 'gentopic.php?' +
                      'board=' + query['board'];
                    break;
                }
              }
            }
          };

          postRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          postRequest.send(
              'post_id=' + postId[1] +
              '&uid=' + text.match(/<input\b[^>]+?\bname="uid"[^>]+?\bvalue="([^"]*)"/)[1] +
              '&post=Post+Message'
              );
        }
      }
    };

    previewRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    previewRequest.send(
        (topicTitle ? 'topictitle=' + gamefox_utils.URLEncode(topicTitle.value) + '&' : '') +
        'message=' + gamefox_utils.URLEncode(message) +
        '&post=Preview+Message'
        );
  },

  resetPost: function(event)
  {
    event.preventDefault();

    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.resetconfirm') &&
        !gamefox_lib.confirm('Are you sure? This will clear your entire post so far.'))
      return;

    var doc = gamefox_lib.getDocument(event);
    var charCounts = gamefox_lib.prefs.getBoolPref('elements.charcounts');

    if (gamefox_lib.prefs.getBoolPref('elements.quickpost.resetnewsig'))
      doc.gamefox.sig = gamefox_sig.format(null, null, doc);
    if (gamefox_lib.prefs.getIntPref('signature.addition') == 1)
    {
      doc.getElementById('gamefox-message').value = '';
      doc.gamefox.sigAdded = false;
    }
    else
      doc.getElementById('gamefox-message').value = doc.gamefox.sig;

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

    var quickpost = doc.getElementsByName('message')[0];
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
      button.tabIndex = 4;
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
      button.tabIndex = 4;
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
      button.tabIndex = 4;
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
    var message = event.target.elements.namedItem('message');
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

    var msg = doc.getElementsByName('message')[0];
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

    var msg = doc.getElementsByName('message')[0];
    var endPosition = msg.selectionEnd + character.length;
    msg.value = msg.value.substr(0, msg.selectionEnd)
      + character
      + msg.value.substr(msg.selectionEnd);
    msg.setSelectionRange(endPosition, endPosition);
    msg.focus();

    if (gamefox_lib.prefs.getBoolPref('elements.charcounts'))
      gamefox_messages.updateMessageCount(doc);
  }
};
