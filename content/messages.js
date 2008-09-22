/* vim: set et sw=2 ts=2 sts=2 tw=79: */

var GFmessages =
{
  updateDelay: 1200,

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
  }
};

GFmessages.delayedUpdateMessageCount = function(event)
{
  if (this.timeoutId) clearTimeout(this.timeoutId);
  this.timeoutId = setTimeout(GFmessages.updateMessageCount, GFmessages.updateDelay, event);
};

GFmessages.delayedUpdateTitleCount = function(event)
{
  if (this.timeoutId) clearTimeout(this.timeoutId);
  this.timeoutId = setTimeout(GFmessages.updateTitleCount, GFmessages.updateDelay, event);
};
