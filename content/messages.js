/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFmessages =
{
  updateDelay: 100,

  delayedUpdateMessageCount: function(event)
  {
    if (this.timeoutId)
      clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(GFmessages.updateMessageCount,
        GFmessages.updateDelay, event);
  },

  updateMessageCount: function(event)
  {
    var doc = GFlib.getDocument(event);
    var messageLength = GFutils.encodedMessageLength(
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

    this.timeoutId = setTimeout(GFmessages.updateTitleCount,
        GFmessages.updateDelay, event);
  },

  updateTitleCount: function(event)
  {
    var doc = GFlib.getDocument(event);
    var titleLength = GFutils.encodedTitleLength(
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

  deletePost: function(event)
  {
    event.preventDefault();

    var closeTopic = event.target.textContent == 'close';
    var deleteTopic = !closeTopic && event.target.parentNode.id == 'p001';

    if (deleteTopic)
      var str = 'Delete this topic?';
    else if (closeTopic)
      var str = 'Close this topic?';
    else
      var str = 'Delete this post?';
    if (!GFlib.confirm(str)) return false;

    var doc = GFlib.getDocument(event);
    var uri = event.target.href;

    var get = new XMLHttpRequest();
    get.open('GET', uri);
    get.onreadystatechange = function()
    {
      if (get.readyState == 4)
      {
        if (get.responseText.indexOf('<h1>Delete this Message</h1>') == -1 &&
            get.responseText.indexOf('<h1>Close this Topic</h1>') == -1)
        {
          GFlib.alert('No action is available.');
          return false;
        }

        var post = new XMLHttpRequest();
        if (closeTopic)
          post.open('POST', uri + '&action=closetopic');
        else
          post.open('POST', uri + '&action=delete');
        post.onreadystatechange = function()
        {
          if (post.readyState == 4)
          {
            if (post.responseText.indexOf('<title>401 Error') != -1)
              GFlib.alert('Can\'t delete this message.');
            else if (deleteTopic)
              doc.location = GFlib.domain + GFlib.path + 'gentopic.php?board='
                + GFutils.parseQueryString(doc.location.search)['board'];
            else
            {
              if (!closeTopic)
                doc.location.hash = '#' + event.target.parentNode.id;
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
