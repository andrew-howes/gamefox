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

var GFquickpost =
{
  appendForm: function(doc, div, newTopic)
  {
    var charCounts = GameFOX.prefs.getBoolPref('elements.charcounts');
    var accesskeyPrefix = GFutils.getAccesskeyPrefix();

    var form = doc.createElement('form');
    div.appendChild(form);
    form.id = 'gamefox-quickpost-form';
    form.action = 'post.php' + GFutils.stripQueryString(doc.location.search);
    form.method = 'post';
    form.addEventListener('submit', GFquickpost.removeGFCodeWhitespaceListener,
        false);

    if (newTopic)
    {
      var topictitle = doc.createElement('input');
      form.appendChild(topictitle);
      topictitle.id = 'gamefox-topic';
      topictitle.type = 'text';
      topictitle.name = 'topictitle';
      topictitle.size = 60;
      topictitle.maxlength = 80;

      if (charCounts)
      {
        var titlecount = doc.createElement('span');
        form.appendChild(titlecount);
        titlecount.id = 'gamefox-title-count';

        GFmessages.updateTitleCount(doc);
        topictitle.addEventListener('input', GFmessages.delayedUpdateTitleCount,
            false);
      }
    }

    // HTML buttons
    if (GameFOX.prefs.getBoolPref('elements.quickpost.htmlbuttons'))
    {
      if (newTopic)
        form.appendChild(doc.createElement('br'));

      form.appendChild(GFquickpost.createHTMLButtons(doc));

      form.appendChild(doc.createElement('br'));
    }

    var message = doc.createElement('textarea');
    form.appendChild(message);
    message.id = 'gamefox-message';
    message.name = 'message';
    message.wrap = 'virtual';
    message.rows = 16;
    message.cols = 60;
    doc.gamefox.sig = GFsig.format(null, null, doc);
    if (GameFOX.prefs.getIntPref('signature.addition') == 1)
      form.addEventListener('submit', GFquickpost.appendSig, false);
    else
      message.value = doc.gamefox.sig;
    message.setSelectionRange(0, 0);

    var linebreak = doc.createElement('br');
    form.appendChild(linebreak);

    if (GameFOX.prefs.getBoolPref('elements.quickpost.button'))
    {
      var postbutton = doc.createElement('input');
      form.appendChild(postbutton);
      postbutton.id = 'gamefox-quickpost-btn';
      postbutton.type = 'button';
      postbutton.name = 'quickpost';
      postbutton.value = 'Post Message';
      postbutton.title = 'Post Message [' + accesskeyPrefix + 'z]';
      postbutton.accessKey = 'z';
      postbutton.addEventListener('click', GFquickpost.post, false);
    }

    if (GameFOX.prefs.getBoolPref('elements.quickpost.otherbuttons'))
    {
      var previewbutton = doc.createElement('input');
      form.appendChild(doc.createTextNode(' '));
      form.appendChild(previewbutton);
      previewbutton.type = 'submit';
      previewbutton.name = 'post';
      previewbutton.value = 'Preview Message';
      previewbutton.title = 'Preview Message [' + accesskeyPrefix + 'x]';
      previewbutton.accessKey = 'x';

      var spellchkbutton = doc.createElement('input');
      form.appendChild(doc.createTextNode(' '));
      form.appendChild(spellchkbutton);
      spellchkbutton.type = 'submit';
      spellchkbutton.name = 'post';
      spellchkbutton.value = 'Preview and Spellcheck Message';
      spellchkbutton.title = 'Preview and Spellcheck Message [' + accesskeyPrefix + 'c]';
      spellchkbutton.accessKey = 'c';

      var resetbutton = doc.createElement('input');
      form.appendChild(doc.createTextNode(' '));
      form.appendChild(resetbutton);
      resetbutton.type = 'reset';
      resetbutton.value = 'Reset';
      resetbutton.title = 'Reset [' + accesskeyPrefix + 'v]';
      resetbutton.accessKey = 'v';
      resetbutton.addEventListener('click', GFquickpost.resetPost, false);
    }

    if (newTopic)
    {
      var hidebutton = doc.createElement('input');
      form.appendChild(doc.createTextNode(' '));
      form.appendChild(hidebutton);
      hidebutton.id = 'gamefox-quickpost-hide';
      hidebutton.type = 'button';
      hidebutton.value = 'Hide';
      hidebutton.addEventListener('click', GFquickpost.toggleVisibility, false);
    }

    if (charCounts)
    {
      var messagecount = doc.createElement('span');
      form.appendChild(messagecount);
      messagecount.id = 'gamefox-message-count';

      GFmessages.updateMessageCount(doc);
      message.addEventListener('input', GFmessages.delayedUpdateMessageCount,
          false);
    }
  },

  appendSig: function(event)
  {
    var doc = GFlib.getDocument(event);
    if (!doc.gamefox.sigAdded)
    {
      doc.getElementById('gamefox-message').value += doc.gamefox.sig;
      doc.gamefox.sigAdded = true;
    }
  },

  toggleVisibility: function(event)
  {
    var doc = GFlib.getDocument(event);
    event.preventDefault();

    var qpDiv = doc.getElementById('gamefox-quickpost-afloat');
    if (qpDiv)
    {
      qpDiv.style.display = (qpDiv.style.display == 'none') ? 'block' : 'none';
      return;
    }

    qpDiv = doc.createElement('div');
    qpDiv.id = 'gamefox-quickpost-afloat';
    qpDiv.style.display = 'block';

    doc.getElementById('board_wrap').appendChild(qpDiv);
    GFquickpost.appendForm(doc, qpDiv, true);
  },

  post: function(event)
  {
    var doc = GFlib.getDocument(event);
    var query = GFutils.stripQueryString(doc.location.search);
    // make sure we're not trying to post a message to a topic that was
    // deleted by the user due to the topic list being on detail.php
    if (GFlib.onPage(doc, 'topics'))
      query = query.replace(/&topic=[^&]*/g, '');

    event.target.disabled = true;
    event.target.blur();
    // NOTE TO uG: The 'click' event still fires even if the button is disabled
    //   (this doesn't seem to be true)
    event.target.removeEventListener('click', GFquickpost.post, false);

    var previewRequest = new XMLHttpRequest();
    previewRequest.open('POST', GFlib.domain + GFlib.path + 'post.php' + query);
    var ds = GFlib.thirdPartyCookieFix(previewRequest);
    previewRequest.onreadystatechange = function()
    {
      if (previewRequest.readyState == 4)
      {
        var text = previewRequest.responseText;
        var postId = text.match(/\bname="post_id"[^>]+?\bvalue="([^"]*)"/);

        if (!postId || /^\s*0?\s*$/.test(postId[1]))
        { // error
          if (!/\S/.test(text))
            GFlib.alert('Request timed out. Check your network connection and try again.');
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
            var maintenance = text.indexOf('<body') == -1 && text.indexOf('maintenance') != -1;

            if (badWord)
              GFlib.alert('Your post includes the word "' + badWord[1] + '", which is a bad word. ' +
                  'Didn\'t anyone ever tell you "' + badWord[1] + '" was a bad word?');
            else if (tooBig)
              GFlib.alert('Your post is too big! A message can only contain 4096 characters, ' +
                  'but yours has ' + tooBig[1] + '.');
            else if (titleLength)
              GFlib.alert('Your topic title must be between 5 and 80 characters in length.');
            else if (allCapsTitle)
              GFlib.alert('Turn off your caps lock and try typing your topic title again.');
            else if (allCapsMessage)
              GFlib.alert('Turn off your caps lock and try typing your message again.');
            else if (noTopics)
              GFlib.alert('You are not allowed to post topics here.');
            else if (noMessages)
              GFlib.alert('You are not allowed to post messages here.');
            else if (longWordInTitle)
              GFlib.alert('Your topic title contains a word over 25 characters in length. ' +
                  'This makes CJayC unhappy because it stretches his 640x480 resolution ' +
                  'screen, so he doesn\'t allow it.');
            else if (longWordInMessage)
              GFlib.alert('Your message contains a word over 80 characters in length. ' +
                  'This makes CJayC unhappy because it stretches his 640x480 resolution ' +
                  'screen, so he doesn\'t allow it.');
            else if (blankMessage)
              GFlib.alert('Maybe you should actually type something...');
            else if (badHTML)
              GFlib.alert('Your HTML is not well-formed. Check for mismatched tags.');
            else if (nonASCIITitle)
              GFlib.alert('Topic titles cannot contain non-ASCII characters.');
            else if (closedTopic)
              GFlib.alert('The topic was closed while you were typing your message. ' +
                  'Type faster next time!');
            else if (deletedTopic)
              GFlib.alert('The topic is gone! Damn moderators...');
            else if (maintenance)
              GFlib.alert('The site is temporarily down for maintenance.');
            else
              GFlib.alert('Something went wrong but I don\'t know what. Try posting ' +
                  'without QuickPost, and if you think you\'ve found a bug ' +
                  'report it at Blood Money.');
          }
          event.target.removeAttribute('disabled');
          event.target.addEventListener('click', GFquickpost.post, false);
          return;
        }
        else
        {
          if (text.indexOf('<div class="head"><h1>Post Warning</h1></div>') != -1)
          {
            var warning = text.match(/message:<\/b><\/p>\s+(.*)/)[1].
              replace(/<P>/g, '\n\n');
            if (!GFlib.confirm(warning + 'Submit this post?'))
            {
              event.target.removeAttribute('disabled');
              event.target.addEventListener('click', GFquickpost.post, false);
              return;
            }
          }

          var postRequest = new XMLHttpRequest();
          postRequest.open('POST', GFlib.domain + GFlib.path + 'post.php' + query);
          var ds = GFlib.thirdPartyCookieFix(postRequest);
          postRequest.onreadystatechange = function()
          {
            if (postRequest.readyState == 4)
            {
              var text = postRequest.responseText;
              if (text.indexOf('<div class="head"><h1>Message Posted</h1></div>') == -1)
              { // error
                if (!/\S/.test(text))
                  GFlib.alert('Request timed out. Check your network connection and try again.');
                else
                {
                  var flooding = text.indexOf('Please wait and try your post again') != -1;
                  var closedTopic = text.indexOf('This topic is closed') != -1;
                  var deletedTopic = text.indexOf('This topic is no longer available') != -1;
                  var dupeTitle = text.indexOf('A topic with this title already exists') != -1;

                  if (flooding)
                    GFlib.alert('You have hit one of the time-based posting limits (e.g., 2 posts per minute).');
                  else if (closedTopic)
                    GFlib.alert('The topic was closed while you were typing your message. Type faster next time!');
                  else if (deletedTopic)
                    GFlib.alert('The topic is gone! Damn moderators...');
                  else if (dupeTitle)
                    GFlib.alert('A topic with this title already exists. Choose another title.');
                  else
                    GFlib.alert('Something went wrong but I don\'t know what. Try posting ' +
                        'without QuickPost, and if you think you\'ve found a bug ' +
                        'report it at Blood Money.');
                }
                event.target.removeAttribute('disabled');
                event.target.addEventListener('click', GFquickpost.post, false);
                return;
              }

              query = GFutils.parseQueryString(query);
              if (topicTitle) // new topic
              {
                switch (GameFOX.prefs.getIntPref('elements.quickpost.aftertopic'))
                {
                  case 0: // go to topic
                    doc.location = GFlib.domain + GFlib.path + 'genmessage.php?' +
                      'board=' + query['board'] + '&topic=' +
                      text.match(/genmessage\.php\?board=(?:[0-9-]+)&topic=([0-9]+)/)[1];
                    break;

                  case 1: // go to board
                    doc.location = GFlib.domain + GFlib.path + 'gentopic.php?' +
                      'board=' + query['board'];
                    break;
                }
              }
              else // new message
              {
                switch (GameFOX.prefs.getIntPref('elements.quickpost.aftermessage'))
                {
                  case 0: // go to last page/post
                    var msgsPerPage = GameFOX.prefs.getIntPref('msgsPerPage');
                    var end;

                    if (doc.gamefox.pages * msgsPerPage == doc.gamefox.msgnum)
                      end = '&page=' + doc.gamefox.pages; // next page
                    else if (doc.gamefox.pages > 1)
                      end = '&page=' + (doc.gamefox.pages - 1); // last page
                    else
                      end = ''; // first page

                    if (end.length)
                      end += GFutils.tcParam(doc.gamefox.tc);

                    if (doc.gamefox.msgnum > (doc.gamefox.pages - 1) * msgsPerPage &&
                        doc.gamefox.pages * msgsPerPage != doc.gamefox.msgnum)
                    { // on last page
                      var postnumStr = (doc.gamefox.msgnum + 1).toString();
                      end += '#p' + ('000'.substr(postnumStr.length)) + postnumStr;
                    }
                    else
                      end += '#last-post';

                    doc.location = GFlib.domain + GFlib.path + 'genmessage.php?' +
                      'board=' + query['board'] + '&topic=' + query['topic'] + end;

                    if ((query['page'] == (doc.gamefox.pages - 1) || doc.gamefox.pages == 1)
                        && doc.location.hash.length)
                      doc.location.reload(); // hash changes don't reload the page
                    break;

                  case 1: // go back to same page
                    doc.location = GFlib.domain + GFlib.path + 'genmessage.php?' +
                      'board=' + query['board'] + '&topic=' + query['topic'] +
                      (query['page'] ? '&page=' + query['page'] : '') +
                      GFutils.tcParam(doc.gamefox.tc);
                    break;

                  case 2: // go to first page
                    doc.location = GFlib.domain + GFlib.path + 'genmessage.php?' +
                      'board=' + query['board'] + '&topic=' + query['topic'];
                    break;
                }
              }

              return;
            }
          }

          postRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          postRequest.send(
              'post_id=' + postId[1] +
              '&uid=' + text.match(/\bname="uid"[^>]+?\bvalue="([^"]*)"/)[1] +
              '&post=Post+Message'
              );
        }
      }
    };

    previewRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    var postBody = '';
    var topicTitle = doc.getElementsByName('topictitle')[0];

    if (topicTitle)
      postBody = 'topictitle=' + GFutils.URLEncode(topicTitle.value) + '&';

    var message = GFquickpost.removeGFCodeWhitespace(doc
        .getElementsByName('message')[0].value);

    if (!GFlib.onPage(doc, 'post')
        && GameFOX.prefs.getIntPref('signature.addition') == 1)
      message += GFsig.format(null, null, doc);

    previewRequest.send(
        postBody +
        'message=' + GFutils.URLEncode(message) +
        '&post=Preview+Message'
        );
  },

  resetPost: function(event)
  {
    event.preventDefault();

    if (GameFOX.prefs.getBoolPref('elements.quickpost.resetconfirm') &&
        !GFlib.confirm('Are you sure? This will clear your entire post so far.'))
      return;

    var doc = GFlib.getDocument(event);
    var charCounts = GameFOX.prefs.getBoolPref('elements.charcounts');

    if (GameFOX.prefs.getBoolPref('elements.quickpost.resetnewsig'))
      doc.gamefox.sig = GFsig.format(null, null, doc);
    if (GameFOX.prefs.getIntPref('signature.addition') == 1)
    {
      doc.getElementById('gamefox-message').value = '';
      doc.gamefox.sigAdded = false;
    }
    else
      doc.getElementById('gamefox-message').value = doc.gamefox.sig;

    if (charCounts)
      GFmessages.updateMessageCount(doc);
    if (doc.getElementById('gamefox-topic'))
    {
      doc.getElementById('gamefox-topic').value = '';
      if (charCounts)
        GFmessages.updateTitleCount(doc);
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
    var doc = GFlib.getDocument(event);

    var quickpost = doc.getElementsByName('message')[0];
    var tagStrStart = GFquickpost.formatTag(this.name, false);
    var tagStrEnd = GFquickpost.formatTag(this.name, true);

    if (quickpost.selectionStart == quickpost.selectionEnd)
    {
      var endPosition = quickpost.selectionEnd + tagStrStart.length;

      quickpost.value = quickpost.value.substring(0, quickpost.selectionStart)
        + tagStrStart + (this.name != 'br' ? tagStrEnd : '')
        + quickpost.value.substring(quickpost.selectionEnd, quickpost.value.length);
    }
    else if (this.name != 'br')
    {
      // encapsulate selected text
      var endPosition = quickpost.selectionEnd + tagStrStart.length +
        tagStrEnd.length;

      quickpost.value = quickpost.value.substring(0, quickpost.selectionStart)
        + tagStrStart + quickpost.value.substring(quickpost.selectionStart,
            quickpost.selectionEnd) + tagStrEnd +
        quickpost.value.substring(quickpost.selectionEnd,
            quickpost.value.length);
    }

    quickpost.setSelectionRange(endPosition, endPosition);
    quickpost.focus();

    if (GameFOX.prefs.getBoolPref('elements.charcounts'))
      GFmessages.updateMessageCount(doc);
  },

  createHTMLButtons: function(doc)
  {
    var span = doc.createElement('span');
    span.id = 'gamefox-html-buttons';
    var tags = new Array(
        'b', 'Bold',
        'i', 'Italics',
        'em', 'Emphasis',
        'strong', 'Strong Emphasis',
        'p', 'Paragraph',
        'br', 'Break'
        );
    // GFCode
    if (GameFOX.prefs.getBoolPref('elements.quickpost.htmlbuttons.gfcode'))
      tags.push('i,p', 'Quote', 'em,p', 'Code');

    for (var i = 0; i < tags.length; i += 2)
    {
      var tagbutton = doc.createElement('input');
      span.appendChild(tagbutton);
      tagbutton.type = 'submit';
      tagbutton.value = tags[i + 1];
      tagbutton.name = tags[i];

      tagbutton.addEventListener('click', GFquickpost.insertTag, false);

      span.appendChild(doc.createTextNode(' '));
    }
    return span;
  },

  removeGFCodeWhitespace: function(str)
  {
    return str.replace(/<\/p>\s*<\/i>\n*/g, '</p></i>\n');
  },

  removeGFCodeWhitespaceListener: function(event)
  {
    if (!GameFOX.prefs.getBoolPref('quote.controlwhitespace'))
      return false;
    var message = event.target.elements.namedItem('message');
    message.value = GFquickpost.removeGFCodeWhitespace(message.value);
  }
};
