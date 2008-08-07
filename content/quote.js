/* vim: set et sw=2 sts=2 ts=2: */

var GFQuote =
{
  quote: function(event)
  {
    var doc = event.target.ownerDocument;
    var leftMsgData = GameFOXUtils.getMsgDataDisplay(doc);

    var node           = event.target;
    var nodeName       = node.nodeName.toLowerCase();
    var nodeClass      = node.className.toLowerCase();
    var tableNode      = (nodeName == 'div') ? node.parentNode : node.offsetParent;
    var tableNodeName  = tableNode.nodeName.toLowerCase();
    var tableNodeClass = tableNode.className.toLowerCase();
    try
    {
      while (tableNodeName != 'table' || tableNodeClass != 'message')
      {
        node           = tableNode;
        nodeName       = tableNodeName;
        nodeClass      = tableNodeClass;
        tableNode      = (nodeName == 'div') ? node.parentNode : node.offsetParent;
        tableNodeName  = tableNode.nodeName.toLowerCase();
        tableNodeClass = tableNode.className.toLowerCase();
      }
    }
    catch (e) { return; }

    if (!doc.getElementById('gamefox-message'))
      return;

    var quoteHead, quoteMsg, msgNum;
    // in message header
    if ((!leftMsgData && node.parentNode.className != 'even') || nodeClass.match('author'))
    {
      quoteHead = node.textContent;
      msgNum = '#' + node.id.substr(1);

      if (!leftMsgData)
        node = tableNode.rows[node.parentNode.rowIndex + 1].cells[0];
      else
        node = node.parentNode.cells[1];

      quoteMsg = node.innerHTML;
    }

    // in message body
    else if ((!leftMsgData && node.parentNode.className == 'even') || !nodeClass.match('author'))
    {
      quoteMsg = node.innerHTML;

      if (!leftMsgData)
        node = tableNode.rows[node.parentNode.rowIndex - 1].cells[0];
      else
        node = node.parentNode.cells[0];

      quoteHead = node.textContent;
      msgNum = '#' + node.id.substr(1);
    }
    
    GFQuote.format(event, quoteHead, quoteMsg, msgNum);
  },
  
  format: function(event, quoteHead, quoteMsg, msgNum)
  {
    var doc = event.target.ownerDocument;

    /* Parse message header */
    var head = quoteHead.replace(/\|/g, '').split("\n");
    for (var i = 0; i < head.length; i++)
      head[i] = head[i].replace(/^\s+|\s+$/g, '');
    var username = head[1];
    var postdate = head[2].replace('Posted ', '');
    var postnum  = msgNum;

    /* Parse message body */
    var body = quoteMsg.
      replace(/<br\s*\/?>/ig, '\n').
      replace(/<img\b[^<>]+\bsrc="([^"]*)"[^<>]*>/ig, '$1').
      replace(/<\/?(img|a|font|span|div|table|tbody|th|tr|td|wbr)\b[^<>]*\/?>/gi, '').
      replace(/^\s+|\s+$/g, '');

   // Get rid of signature
    if (GameFOX.prefs.getBoolPref('quote.removesignature'))
      body = body.replace(/---(\n.*\n?){0,2}$/, ''); // Only a simple regexp is needed because extraneous
                                                     // signatures are no longer allowed
    body = GameFOXUtils.specialCharsDecode(body.replace(/^\s+|\s+$/g, ''));
    // Prevent too much GFCode quote nesting
    var loops = 0;
    while (body.match(/(<i><p>[\s\S]*?){3,}/) != null)
    { // the number at the end of the regexp (e.g., {3,}) is max number of recursive quotes
      if (loops > 6) // too many nests from when this wasn't enforced, just give up
                     // and quote the last guy
      {
        body = body.replace(/\n*<i><p>[\s\S]*<\/p><\/i>\n*/, "");
        break;
      }
      body = body.replace(/\n*<i><p>(?:(?=([^<]+))\1|<(?!i>))*?<\/p><\/i>\n*/, "\n");
      loops++;
    }

    /* Prepare quote header */
    var qhead = "";
    if (GameFOX.prefs.getBoolPref('quote.header.username')) qhead += username;
    if (GameFOX.prefs.getBoolPref('quote.header.date')) qhead += " | Posted " + postdate;
    if (GameFOX.prefs.getBoolPref('quote.header.messagenum') && postnum) qhead += " (" + postnum + ")";

    if (GameFOX.prefs.getCharPref('quote.style') != 'gfcode_full')
    {
      if (GameFOX.prefs.getBoolPref('quote.header.italic')) qhead = "<i>" + qhead + "</i>";
      if (GameFOX.prefs.getBoolPref('quote.header.bold')) qhead = "<b>" + qhead + "</b>";
    }

    switch (GameFOX.prefs.getCharPref('quote.style'))
    {
      case 'normal':
        var qbody = "";
        qbody = body;
        if (GameFOX.prefs.getBoolPref('quote.message.italic')) qbody = "<i>" + qbody + "</i>";
        if (GameFOX.prefs.getBoolPref('quote.message.bold')) qbody = "<b>" + qbody + "</b>";

        var quote = qhead + "\n" + qbody;
        break;
      case 'gfcode_body':
        var qbody = "<i><p>" + body + "</p></i>";

        var quote = qhead + "\n" + qbody;
        break;
      case 'gfcode_full':
        var qhead = "<i><p><strong>" + qhead + "</strong>";

        var quote = qhead + "\n" + body + "</p></i>";
        break;
      case 'custom':
        var quoteTemplate = GameFOXUtils.getString('quote.style.custom');
        var quote = quoteTemplate.
          replace(/\%u/g, username).
          replace(/\%d/g, postdate).
          replace(/\%n/g, postnum).
          replace(/\%m/g, body);
        break;
    }
    var quickpost = doc.getElementById('gamefox-message');
    // insert quote at cursor position, doesn't have to deal with signature
    // crap
    var endQuotePosition = quickpost.selectionStart + quote.length + 1; // +1 is for counting newline character
    quickpost.value = quickpost.value.substring(0, quickpost.selectionStart)
                    + quote + "\n"
                    + quickpost.value.substring(quickpost.selectionEnd, quickpost.value.length);
    quickpost.focus();
    // Move the caret to the end of the last quote
    quickpost.setSelectionRange(endQuotePosition, endQuotePosition);
  }
}