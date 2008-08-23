/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFMessages =
{
  updateMessageCount: function(event)
  {
    var doc = GFlib.getDocument(event);
    var message = doc.getElementsByName('message')[0].value;
    message =
      GameFOXUtils.trim(GameFOXUtils.decodeValidTags(GameFOXUtils.specialCharsEncode(message))).
          replace(/\n/g, '<br/>');

    var messageCount = doc.getElementById('gamefox-message-count');
    messageCount.innerHTML = message.length + ' / 4096 characters';

    if (message.length > 4096)
    {
      messageCount.innerHTML += '(!!)';
      messageCount.style.setProperty('font-weight', 'bold', '');
    }
    else
      messageCount.style.setProperty('font-weight', '', '');
  },

  updateTitleCount: function(event)
  {
    var doc = GFlib.getDocument(event);
    var title = doc.getElementsByName('topictitle')[0].value;
    title =
      GameFOXUtils.trim(GameFOXUtils.specialCharsEncode(title)).
          replace(/&quot;/, '"');

    var titleCount = doc.getElementById('gamefox-title-count');
    titleCount.innerHTML = title.length + ' / 80 characters';

    if (title.length > 80)
    {
      titleCount.innerHTML += '(!!)';
      titleCount.style.setProperty('font-weight', 'bold', '');
    }
    else
      titleCount.style.setProperty('font-weight', '', '');
  }
};
