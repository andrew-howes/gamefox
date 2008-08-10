/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFQuickPost =
{
  appendForm: function(doc, div, newTopic)
  {
    if (GameFOX.prefs.getIntPref('signature.addition') == 2)
      var sig = GameFOXUtils.formatSig(null, null,
          GameFOX.prefs.getBoolPref('signature.newline'), doc);
    else
      var sig = '';

    var query = GameFOXUtils.stripQueryString(doc.location.search);
    var action = 'post.php' +
      GameFOXUtils.specialCharsDecode(query);
    div.innerHTML +=
      '\n<div id="gamefox-quickpost-title">QuickPost</div>\n' +
      '  <form id="gamefox-quickpost-form" action="' + action + '" method="post">\n' +
      (newTopic ? '  <input type="text" id="gamefox-topic" name="topictitle" size="60" maxlength="80" value=""/><br/>\n' : '') +
      '  <textarea name="message" wrap="virtual" id="gamefox-message" rows="15" cols="60">\n' + sig + '</textarea><br/>\n' +
      '  <input type="button" id="gamefox-quickpost-btn" name="quickpost" value="Post Message"/>\n' +
      '  <input type="submit" name="post" value="Preview Message"/>\n' +
      '  <input type="submit" name="post" value="Preview and Spellcheck Message"/>\n' +
      '  <input type="reset" name="reset" value="Reset"/>\n' +
      (newTopic ? '  <input type="button" id="gamefox-quickpost-hide" value="Hide"/>\n' : '') +
      '</form>\n';

    doc.getElementById('gamefox-quickpost-btn').addEventListener('click',
        GFQuickPost.post, false);

    doc.getElementById('gamefox-quickpost-form').addEventListener('submit',
        GFQuickPost.appendSig, false);

    doc.getElementById('gamefox-message').setSelectionRange(0, 0);

    if (!GameFOX.prefs.getBoolPref('elements.quickpost.button'))
      doc.getElementById('gamefox-quickpost-btn').style.display = 'none';

    if (newTopic)
      doc.getElementById('gamefox-quickpost-hide').addEventListener('click',
          GFQuickPost.toggleVisibility, false);
  },

  appendSig: function(event)
  {
    var doc = GFlib.getDocument(event);

    if (GameFOX.prefs.getIntPref('signature.addition') == 1)
      doc.getElementById('gamefox-message').value +=
        GameFOXUtils.formatSig(null, null,
            GameFOX.prefs.getBoolPref('signature.newline'), doc
            );
  },

  toggleVisibility: function(event)
  {
    var doc = GFlib.getDocument(event);
    event.preventDefault();

    var quickpost = doc.getElementById('gamefox-quickpost-afloat');
    if (quickpost)
    {
      quickpost.style.display = (quickpost.style.display == 'none') ? 'block' : 'none';
      return;
    }

    quickpost = doc.createElement('div');
    quickpost.setAttribute('id', 'gamefox-quickpost-afloat');
    quickpost.style.display = 'block';

    doc.getElementsByTagName('body')[0].appendChild(quickpost);
    GFQuickPost.appendForm(doc, doc.getElementById('gamefox-quickpost-afloat'),
        true);
  },

  post: function(event)
  {
    var doc = GFlib.getDocument(event);
    var query = GameFOXUtils.stripQueryString(doc.location.search);

    event.target.disabled = true;
    event.target.blur();
    // NOTE TO uG: The 'click' event still fires even if the button is disabled
    // ???
    event.target.removeEventListener('click', GFQuickPost.post, false);

    var previewRequest = new XMLHttpRequest();
    previewRequest.open('POST', GFlib.domain + GFlib.path + 'post.php' + query);
    previewRequest.onreadystatechange = function()
    {
      if (previewRequest.readyState == 4)
      {
        var text = previewRequest.responseText;
        var postId = text.match(/\bname="post_id"[^>]+?\bvalue="([^"]*)"/);

        if (!postId || postId[1].match(/^\s*0?\s*$/))
        { // error
          if (GameFOXUtils.trim(text).length == 0)
            alert('Request timed out. Check your network connection and try again.');
          else
          {
            // Thanks to KSOT's Secondary FAQ for all of these errors
            var badWord = text.match(/<p>Banned word found: <b>(.+?)<\/b>/);
            var tooBig = text.match(/4096 characters\. Your message is ([0-9]+) characters/);
            var titleLength = text.match(/Topic titles must be between 5 and 80 characters/);
            var allCapsTitle = text.match(/Topic titles cannot be in all uppercase/);
            var allCapsMessage = text.match(/Messages cannot be in all uppercase/);
            var noTopics = text.match(/You are not authorized to create topics on this board/);
            var noMessages = text.match(/You are not authorized to post messages on this board/);
            var longWordInTitle = text.match(/Your topic title contains a single word over 25 characters/);
            var longWordInMessage = text.match(/Your message contains a single word over 80 characters/);
            var badHTML = text.match(/Your HTML is not well-formed/);
            var closedTopic = text.match(/This topic is closed/);
            var deletedTopic = text.match(/This topic is no longer available/);
            var maintenace = !text.match(/<body/) && text.match(/maintenace/);

            if (badWord)
              alert('Your post includes the word "' + badWord[1] + '", which is a bad word. ' +
                  'Didn\'t anyone ever tell you "' + badWord[1] + '" was a bad word?');
            else if (tooBig)
              alert('Your post is too big! A message can only contain 4096 characters, ' +
                  'but yours has ' + tooBig[1] + '.');
            else if (titleLength)
              alert('Your topic title must be between 5 and 80 characters in length.');
            else if (allCapsTitle)
              alert('Turn off your caps lock and try typing your topic title again.');
            else if (allCapsMessage)
              alert('Turn off your caps lock and try typing your message again.');
            else if (noTopics)
              alert('You are not allowed to post topics here.');
            else if (noPosts)
              alert('You are not allowed to post messages here.');
            else if (longWordInTitle)
              alert('Your topic title contains a word over 25 characters in length. ' +
                  'This makes CJayC unhappy because it stretches his 640x480 resolution ' +
                  'screen, so he doesn\'t allow it.');
            else if (longWordInMessage)
              alert('Your message contains a word over 80 characters in length. ' +
                  'This makes CJayC unhappy because it stretches his 640x480 resolution ' +
                  'screen, so he doesn\'t allow it.');
            else if (badHTML)
              alert('Your HTML is not well-formed. Check for mismatched tags.');
            else if (closedTopic)
              alert('The topic was closed while you were typing your message. ' +
                  'Type faster next time.');
            else if (deletedTopic)
              alert('The topic is gone! Damn moderators...');
            else if (maintenace)
              alert('The site is temporarily down for maintenace.');
            else
              alert('Something went wrong but I don\'t know what. Try posting ' +
                  'without QuickPost, and if you think you\'ve found a bug ' +
                  'report it at Blood Money.');

            event.target.removeAttribute('disabled');
            event.target.addEventListener('click', GFQuickPost.post, false);
            return;
          }
        }
        else
        {
          if (text.match(/<div class="head"><h1>Post Warning<\/h1><\/div>/) &&
              !confirm('Your message contains an autoflagged word. Submit anyway?'))
          {
            event.target.removeAttribute('disabled');
            event.target.addEventListener('click', GFQuickPost.post, false);
            return;
          }

          var postRequest = new XMLHttpRequest();
          postRequest.open('POST', GFlib.domain + GFlib.path + 'post.php' + query);
          postRequest.onreadystatechange = function()
          {
            if (postRequest.readyState == 4)
            {
              var text = postRequest.responseText;
              if (!text.match(/<p>You should be returned to the Message List automatically/))
              {
                if (GameFOXUtils.trim(text).length == 0)
                  alert('Request timed out. Check your network connection and try again.');
                else
                {
                  var flooding = text.match(/To prevent flooding,/);
                  var closedTopic = text.match(/This topic is closed/);
                  var deletedTopic = text.match(/This topic is no longer available/);

                  if (flooding)
                    alert('You are posting too quickly and have hit one of the flooding limits.');
                  else if (closedTopic)
                    alert('The topic was closed while you were typing your message. Type faster next time!');
                  else if (deletedTopic)
                    alert('The topic is gone! Damn moderators...');
                  else
                    alert('Something went wrong but I don\'t know what. Try posting ' +
                        'without QuickPost, and if you think you\'ve found a bug ' +
                        'report it at Blood Money.');
                }
                event.target.removeAttribute('disabled');
                event.target.addEventListener('click', GFQuickPost.post, false);
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
              '&post=Post+Message' +
              '&uid=' + text.match(/\bname="uid"[^>]+?\bvalue="([^"]*)"/)[1]
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
        event.target.removeAttribute('disabled');
        event.target.addEventListener('click', GFQuickPost.post, false);
        alert('Topic titles must be at least 5 characters long.');
        return;
      }
      postBody = 'topictitle=' + GameFOXUtils.URLEncode(topicTitle[0].value) + '&';
    }

    var message = doc.getElementsByName('message')[0].value;

    if (!GFlib.onPage(doc, 'post')
        && GameFOX.prefs.getIntPref('signature.addition') == 1)
      message +=
        GameFOXUtils.formatSig(null, null,
            GameFOX.prefs.getBoolPref('signature.newline'), doc);

    previewRequest.send(postBody + 'message=' + GameFOXUtils.URLEncode(message) +
        '&post=Preview+Message');
  }
};
