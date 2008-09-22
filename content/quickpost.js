/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFquickpost =
{
  appendForm: function(doc, div, newTopic)
  {
    if (GameFOX.prefs.getIntPref('signature.addition') == 2)
      var sig = GFutils.specialCharsEncode(GFutils.formatSig(null, GameFOX.prefs.
            getBoolPref('signature.newline'), doc));
    else
      var sig = '';

    var query = GFutils.stripQueryString(doc.location.search);
    var action = 'post.php' + GFutils.specialCharsDecode(query);
    var otherbuttons = GameFOX.prefs.getBoolPref('elements.quickpost.otherbuttons');
    // TODO: use DOM?
    div.innerHTML += '\n' +
      '<div id="gamefox-quickpost-title">QuickPost</div>\n' +
      '  <form id="gamefox-quickpost-form" action="' + action + '" method="post">\n' +
      (newTopic ? '  <input type="text" id="gamefox-topic" name="topictitle" ' +
                      'size="60" maxlength="80" value=""/>\n' +
                     '<span id="gamefox-title-count"></span><br/>' : '') +
      '  <textarea name="message" wrap="virtual" id="gamefox-message" rows="15" ' +
          'cols="60">\n' + sig + '</textarea><br/>\n' +
      '  <input type="button" id="gamefox-quickpost-btn" name="quickpost" value="Post Message"/>\n' +
      (otherbuttons ? '  <input type="submit" name="post" value="Preview Message"/>\n' +
      '  <input type="submit" name="post" value="Preview and Spellcheck Message"/>\n' +
      '  <input type="reset" value="Reset"/>\n' : '') +
      (newTopic ? '  <input type="button" id="gamefox-quickpost-hide" value="Hide"/>\n' : '') +
      '  <span id="gamefox-message-count"></span>\n' +
      '</form>\n';

    if (GameFOX.prefs.getBoolPref('elements.charcounts'))
    {
      if (newTopic)
      {
        GFmessages.updateTitleCount(doc);
        doc.getElementById('gamefox-topic').addEventListener('input',
            GFmessages.delayedUpdateTitleCount, false);
        doc.getElementById('gamefox-quickpost-form').addEventListener('reset',
            function(event) {setTimeout(GFmessages.updateTitleCount, 0, event)}, false);
      }

      GFmessages.updateMessageCount(doc);
      doc.getElementById('gamefox-message').addEventListener('input',
          GFmessages.delayedUpdateMessageCount, false);
      doc.getElementById('gamefox-quickpost-form').addEventListener('reset',
          function(event) {setTimeout(GFmessages.updateMessageCount, 0, event)}, false);
    }

    doc.getElementById('gamefox-quickpost-btn').addEventListener('click',
        GFquickpost.post, false);

    doc.getElementById('gamefox-quickpost-form').addEventListener('submit',
        GFquickpost.appendSig, false);

    doc.getElementById('gamefox-message').setSelectionRange(0, 0);

    if (!GameFOX.prefs.getBoolPref('elements.quickpost.button'))
      doc.getElementById('gamefox-quickpost-btn').style.display = 'none';

    if (newTopic)
      doc.getElementById('gamefox-quickpost-hide').addEventListener('click',
          GFquickpost.toggleVisibility, false);
  },

  appendSig: function(event)
  {
    var doc = GFlib.getDocument(event);

    if (GameFOX.prefs.getIntPref('signature.addition') == 1)
      doc.getElementById('gamefox-message').value +=
        GFutils.formatSig(null,
            GameFOX.prefs.getBoolPref('signature.newline'), doc
            );
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
          if (text.indexOf('<div class="head"><h1>Post Warning</h1></div>') != -1 &&
              !GFlib.confirm('Your message contains an autoflagged word. Submit anyway?'))
          {
            event.target.removeAttribute('disabled');
            event.target.addEventListener('click', GFquickpost.post, false);
            return;
          }

          var postRequest = new XMLHttpRequest();
          postRequest.open('POST', GFlib.domain + GFlib.path + 'post.php' + query);
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
              doc.location = GFlib.domain + GFlib.path +
                ((doc.getElementsByName('topictitle')[0]) ? 'gentopic.php' :
                 'genmessage.php') + query;
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
    var topicTitle = doc.getElementsByName('topictitle');

    if (topicTitle[0])
    {
      if (topicTitle[0].value.length < 5)
      {
        GFlib.alert('Topic titles must be at least 5 characters long.');
        event.target.removeAttribute('disabled');
        event.target.addEventListener('click', GFquickpost.post, false);
        return;
      }
      postBody = 'topictitle=' + GFutils.URLEncode(topicTitle[0].value) + '&';
    }

    var message = doc.getElementsByName('message')[0].value;

    if (!GFlib.onPage(doc, 'post')
        && GameFOX.prefs.getIntPref('signature.addition') == 1)
      message +=
        GFutils.formatSig(null,
            GameFOX.prefs.getBoolPref('signature.newline'), doc);

    previewRequest.send(
        postBody +
        'message=' + GFutils.URLEncode(message) +
        '&post=Preview+Message'
        );
  }
};
