/* vim: set et sw=2 ts=2 sts=2: */

// TODO: this thing is huge. try to split it into multiple smaller files, it's
// nearly impossible to follow

function gamefox_log(msg) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage('GameFOX: ' + msg);
}

var GameFOX =
{
  contextMenuDisplay: function(event)
  {
    var doc     = gContextMenu.target.ownerDocument;
    var notOnGF = !doc.location.protocol.match(/^https?:$/i) || !doc.domain || !doc.domain.match(/^boards\.gamefaqs\.com$/i);
    var cxPrefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.context.');

    document.getElementById('gamefox-toggle-sidebar').hidden = !cxPrefs.getBoolPref('sidebar');
    document.getElementById('gamefox-tags').hidden           = !cxPrefs.getBoolPref('taglist');

    if (notOnGF)
    {
      document.getElementById('gamefox-context-quote').hidden = true;
      document.getElementById('gamefox-context-tag').hidden   = true;
      document.getElementById('gamefox-context-pages').hidden = true;
      return;
    }

    var cxQuote     = cxPrefs.getBoolPref('quote');
    var cxTag       = cxPrefs.getBoolPref('tag');
    var cxPageList  = cxPrefs.getBoolPref('pagelist');

    var onMyPosts   = doc.location.pathname.match(/^\/gfaqs\/myposts\.php$/i);
    var onMsgList;
    var onTopicList;

    if (onMyPosts)
    {
      onMsgList   = false;
      onTopicList = false;
    }
    else
    {
      var userNav = doc.evaluate('//div[@class="board_nav"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      onTopicList = !!userNav && !!doc.evaluate('//table[@class="topics"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      onMsgList   = !onTopicList && !!userNav && !!doc.evaluate('//table[@class="message"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    if (cxQuote) cxQuote = !!doc.getElementById('gamefox-message');

    if (!onMsgList || !cxQuote)
    {
      document.getElementById('gamefox-context-quote').hidden = true;
    }
    else
    {
      try
      {
        var node      = gContextMenu.target;
        var nodeName  = node.nodeName.toLowerCase();
        var nodeClass = node.className.toLowerCase();

        while (nodeName != 'table' || nodeClass != 'message')
        {
          node      = (nodeName == 'div') ? node.parentNode : node.offsetParent;
          nodeName  = node.nodeName.toLowerCase();
          nodeClass = node.className.toLowerCase();
        }

        document.getElementById('gamefox-context-quote').hidden = false;
      }
      catch (e)
      {
        document.getElementById('gamefox-context-quote').hidden = true;
      }
    }

    if (!onTopicList && !onMyPosts)
    {
      var hideCxTag = !onMsgList || !cxTag;
      if (!hideCxTag)
      {
        try
        {
          if (!doc.evaluate('//h1/following::h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
          {
            hideCxTag = true;
          }
        }
        catch (e)
        {
          hideCxTag = true;
        }
      }
      document.getElementById('gamefox-context-tag').hidden   = hideCxTag;
      document.getElementById('gamefox-context-pages').hidden = true;
    }
    else if (!cxTag && !cxPageList)
    {
      document.getElementById('gamefox-context-tag').hidden   = true;
      document.getElementById('gamefox-context-pages').hidden = true;
    }
    else
    {
      try
      {
        var node = gContextMenu.target;
        var nodeName = node.nodeName.toLowerCase();

        while (nodeName != 'td')
        {
          node = node.parentNode;
          nodeName = node.nodeName.toLowerCase();
        }

        nodeName = node.parentNode.cells[1].nodeName; // this is an error raiser, detects gamefox-pagelist, will be catched

        document.getElementById('gamefox-context-tag').hidden   = !cxTag;
        document.getElementById('gamefox-context-pages').hidden = !cxPageList;
      }
      catch (e)
      {
        document.getElementById('gamefox-context-tag').hidden   = true;
        document.getElementById('gamefox-context-pages').hidden = true;
      }
    }
  },

  processPage: function(event)
  {
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var doc = event.originalTarget;
    var inFrame = doc.defaultView.parent != doc.defaultView.self;
    var parentDoc = inFrame ? doc.defaultView.parent.document : doc;
    var titleChange = prefs.getBoolPref('elements.titlechange');

    if (prefs.getBoolPref('theme.disablegamefaqscss') && (doc.location.host.match(/(^|\.)gamefaqs\.com$/gi)))
    {
      var stylesheets = doc.getElementsByTagName('link');
      for (var i = 0; i < stylesheets.length; i++)
      {
        stylesheets[i].disabled = true;
      }
    }

    try
    {
      if (!doc.domain.match(/^boards\.gamefaqs\.com$/i))
      {
        throw Components.results.NS_ERROR_FAILURE;
      }
    }
    catch (e)
    {
      if (inFrame && parentDoc.originalTitle)
      {
        parentDoc.title = parentDoc.originalTitle;
        parentDoc.originalTitle = null;
      }
      return;
    }

    if (inFrame)
    {
      if (titleChange)
      {
        if (!parentDoc.originalTitle) parentDoc.originalTitle = parentDoc.title;
      }
      else if (parentDoc.originalTitle) // (!titleChange)
      {
        parentDoc.title = parentDoc.originalTitle;
        parentDoc.originalTitle = null;
      }
    }

    var posterIndex, anchor, vertmess;
    var msgsPerPage = prefs.getIntPref('msgsPerPage');
    try
    {
      vertmess = (doc.getElementsByTagName('tr')[0].getElementsByTagName('td').length == 1) ? true : false;
    }
    catch (e)
    {
      vertmess = false;
    }


  /* Active Messages List (myposts.php) */
    if (doc.location.pathname.match(/^\/gfaqs\/myposts\.php$/i))
    {
      doc.evaluate('//div[@class="board"]/table', doc, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.
        addEventListener('dblclick', GameFOX.topicDblclick, false);
    }
    else

  /* Posting & Preview */

    if (doc.location.pathname.match(/^\/gfaqs\/(post|preview)\.php$/ig))
    {
      var newTopic = doc.getElementsByName('topictitle')[0];

      try {
      if (titleChange)
      {
        var newTitle = 'GameFAQs: ' + (newTopic ? 'Create Topic' : 'Post Message');

        if (newTopic)
        {
          newTitle += ' - ' + doc.evaluate('//h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent.replace(/^\s+|\s+$/g, '');
        }
        else if (!newTopic)
        {
          newTitle += ' - ' + doc.getElementsByName('message')[0].parentNode.parentNode.getElementsByTagName('a')[0].textContent.replace(/^\s+|\s+$/g, '');
        }

        doc.title = newTitle;
        if (inFrame) parentDoc.title = doc.title;
      }}
      catch(e) {
        gamefox_log('Error when processing titleChange in Posting & Preview');
      }


      try {
      if (prefs.getBoolPref('elements.quickpost.button'))
      {
        var button = doc.createElement('input');
        button.setAttribute('id', 'gamefox-quickpost-btn');
        button.setAttribute('type', 'button');
        button.setAttribute('value', 'Post Message');
        button.addEventListener('click', GameFOX.quickPost, false);
        var refChild = doc.getElementsByName('post');
            refChild = (refChild[0].getAttribute('value').match(/post/i) ? refChild[1] : refChild[0]);
        refChild.parentNode.insertBefore(button, refChild);
        refChild.parentNode.insertBefore(doc.createTextNode(' '), refChild);
      }}
      catch(e) {
        gamefox_log('Error when processing elements.quickpost.button in Posting & Preview');
      }

    /* Posting sig */

      if (prefs.getBoolPref('signature.applyeverywhere')
          && (prefs.getComplexValue('signature.body', Components.interfaces.nsISupportsString).data != ''
           || prefs.getComplexValue('signature.presig', Components.interfaces.nsISupportsString).data != '')
          && !doc.documentElement.innerHTML.match(/\b(Error|Preview)\s*<\/h1>\s*<\/div>/ig))
      {
        doc.getElementsByName('message')[0].value = "\n" +
          GameFOX.formatSig(
              prefs.getComplexValue('signature.body', Components.interfaces.nsISupportsString).data,
              prefs.getComplexValue('signature.presig', Components.interfaces.nsISupportsString).data,
              prefs.getBoolPref('signature.newline')
              );
      }
    }

    else

  /* User Information */

    if (doc.location.pathname.match(/^\/gfaqs\/user\.php$/i) && titleChange)
    {
      doc.title = 'GameFAQs: ' + doc.getElementsByTagName('td')[1].textContent.replace(/^\s+|\s+$/g, '');
      if (inFrame) parentDoc.title = doc.title;
    }


  /* Topic List & Message List (including Message Detail) */

    var onTopicList, onMsgList, onMsgDetail, userNav;

    userNav     = doc.evaluate('//div[@class="board_nav"]//div[@class="user"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    onMsgList   = !!userNav && !!doc.evaluate('//table[@class="message"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    onTopicList = !onMsgList && !!userNav && !!doc.evaluate('//table[@class="topics"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    onMsgDetail = onMsgList && !!doc.evaluate('//table[@class="message"]/ancestor::div/following-sibling::div//h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (onMsgDetail) onMsgList = false;


  /* Message Detail */

    if (onMsgDetail && titleChange)
    {
      var topicName = doc.evaluate('//h1/following::h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent.replace(/^\s+|\s+$/g, '');
      doc.title = 'GameFAQs: Message Detail - ' + topicName;
      if (inFrame) parentDoc.title = doc.title;
    }


  /* Topic List & Message List only */

    if (!onMsgList && !onTopicList)
    {
      if (inFrame && titleChange) parentDoc.title = doc.title;
      return;
    }

    var highlightNames  = prefs.getCharPref('highlight.groups.1').replace(/^\s+|\s+$/g, '').split(/\s*,\s*/g);
    var switchColorAt   = highlightNames.length;
        highlightNames  = highlightNames.concat(prefs.getCharPref('highlight.groups.2').replace(/^\s+|\s+$/g, '').split(/\s*,\s*/g));
    var highlightColor1 = prefs.getCharPref('highlight.colors.1');
    var highlightColor2 = prefs.getCharPref('highlight.colors.2');
    var highlightIgnore = prefs.getBoolPref('highlight.ignore');


  /* Topic List */

    if (onTopicList)
    {
      if (prefs.getBoolPref('elements.quickpost.link')
      && doc.evaluate('.//a[contains(@href, "post.php")]', userNav, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
      {
        anchor = doc.createElement('a');
        anchor.setAttribute('id', 'gamefox-quickpost-link');
        anchor.setAttribute('href', '#');
        anchor.appendChild(doc.createTextNode(prefs.getCharPref('elements.quickpost.link.title')));
        anchor.addEventListener('click', GameFOX.showQuickPost, false);
        userNav.appendChild(doc.createTextNode(' | '));
        userNav.appendChild(anchor);
      }

      if (titleChange)
      {
        doc.title = 'GameFAQs: ' + doc.evaluate('//h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent.replace(/^\s+|\s+$/g, '');
        if (inFrame) parentDoc.title = doc.title;
      }

      doc.evaluate('//table[@class="topics"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.addEventListener('dblclick', GameFOX.topicDblclick, false);


      var onTrackedList   = doc.location.pathname.match(/\btrack(ed|s)?\.php$/i);
      var enableTopicLink = onTrackedList && prefs.getBoolPref('elements.tracked.boardlink');

      var enableHighlight = !onTrackedList && highlightNames.length > 0 && prefs.getBoolPref('highlight.topics');
      var enablePaging    = prefs.getBoolPref('paging.auto');

      if (enableHighlight || enablePaging || enableTopicLink)
      {
        var rows = doc.getElementsByTagName('table');
            rows = (rows[2] ? rows[2] : rows[0]).getElementsByTagName('tr');

        var pgLocation, pgPrefix, pgSep, pgSuffix, prefixHTML, suffixHTML;
        var numPages, topicLink, tr, td, link;
        var currentHiglightColor;

        if (enablePaging)
        {
          pgLocation = prefs.getIntPref('paging.location');
          pgPrefix   = prefs.getCharPref('paging.prefix');
          pgSep      = prefs.getCharPref('paging.separator');
          pgSuffix   = prefs.getCharPref('paging.suffix');

          prefixHTML = doc.createElement('span');
          prefixHTML.innerHTML = '';
          if (pgLocation == 2)
          {
            prefixHTML.appendChild(doc.createElement('br'));
          }
          prefixHTML.appendChild(doc.createTextNode(pgPrefix));
          prefixHTML = ' ' + prefixHTML.innerHTML.replace(/\s/g, '&nbsp;');

          suffixHTML = doc.createElement('span');
          suffixHTML.innerHTML = '';
          suffixHTML.appendChild(doc.createTextNode(pgSuffix));
          suffixHTML = suffixHTML.innerHTML.replace(/\s/g, '&nbsp;');
        }

        for (var i = 1; i < rows.length; i++)
        {

    /* topic-linking */
          if (enableTopicLink)
          {
            try
            {
              rows[i].cells[2].innerHTML = '<a href="' + rows[i].cells[1].getElementsByTagName('a')[0].getAttribute('href').replace(/message(?=\.)/i, 'topic').replace(/(&topic=[0-9-]+|\btopic=[0-9-]+&)/i, '') + '">' + rows[i].cells[2].textContent.replace(/^\s+|\s+$/g, '') + '</a>';
            }
            catch(e) {
              gamefox_log('Error when processing enableTopicLink on TrackedList');
            }
          }

    /* highlighting */
          if (enableHighlight)
          {
            try {
              posterIndex = highlightNames.indexOf(rows[i].getElementsByTagName('td')[2].textContent.replace(/^\s+|\s+$/g, ''));

              if (posterIndex != -1)
              {
                currentHiglightColor = (posterIndex < switchColorAt ? highlightColor1 : highlightColor2);

                rows[i].setAttribute('class',
                    (rows[i].getAttribute('class') ? rows[i].getAttribute('class') : '')
                    + ' gamefox-highlight-' + (posterIndex < switchColorAt ? 'one' : 'two'));
                rows[i].style.setProperty('background-color', currentHiglightColor, 'important');

                for (var cellIndex = 0; cellIndex < rows[i].cells.length; cellIndex++)
                {
                  rows[i].cells[cellIndex].style.setProperty('background-color', currentHiglightColor, 'important');
                  rows[i].cells[cellIndex].setAttribute('class',
                      (rows[i].cells[cellIndex].getAttribute('class') ? rows[i].cells[cellIndex].getAttribute('class') : '')
                      + ' gamefox-highlight-' + (posterIndex < switchColorAt ? 'one' : 'two'));
                }
              }
            }
            catch(e) {
              gamefox_log('Error when processing enableHighlight in Topic List: ' + e);
            }
          }

    /* paging */
          if (enablePaging) // must be the last "if" so that it can "continue" properly
          {
            try {
              numPages = Math.ceil(rows[i].cells[3].textContent/msgsPerPage);
              if (numPages <= 1) continue;

              topicLink = rows[i].cells[1].getElementsByTagName('a')[0].getAttribute('href');

              if (!pgLocation)
              {
                tr = doc.createElement('tr');
                tr.setAttribute('class', 'gamefox-pagelist');
                tr.style.display = 'table-row';
                td = doc.createElement('td');
                td.setAttribute('colspan', '5');
              }
              else
              {
                tr = rows[i].cells[1];
                td = doc.createElement('span');
                td.setAttribute('class', 'gamefox-pagelist');
                td.setAttribute('tag', pgLocation);
              }

              td.innerHTML = '' + prefixHTML;

              for (var j = 0; j < numPages; j++)
              {
                link = doc.createElement('a');
                link.setAttribute('href', topicLink + (j ? '&page=' + j : ''));
                link.innerHTML = j+1;

                td.appendChild(link);

                if (j < numPages-1)
                {
                  td.appendChild(doc.createTextNode(pgSep));
                }
              }

              td.innerHTML += suffixHTML;

              tr.appendChild(td);
              if (!pgLocation)
              {
                rows[i].parentNode.insertBefore(tr, rows[i].nextSibling);
                i++;
              }
            }
            catch(e) {
              gamefox_log('Error when processing enablePaging in Topic List');
            }
          }

        }
      }
    }


  /* Message List */

    if (!onMsgList)
    {
      return;
    }


    var numberMsgs    = prefs.getBoolPref('elements.msgnum');
    var numberMsgsStyle = prefs.getIntPref('elements.msgnum.style');
    var highlightMsgs = prefs.getBoolPref('highlight.msgs');
    var pageNum       = doc.location.search.match(/\bpage=([0-9]+)/i);
    pageNum           = pageNum ? parseInt(pageNum[1]) : 0;
    var contentdiv    = doc.evaluate('//table[@class="message"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (prefs.getBoolPref('elements.quickpost.form')
    && doc.evaluate('.//a[contains(@href, "post.php")]', userNav, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue)
    {
      var quickpostdiv = doc.createElement('div');
      quickpostdiv.id = 'gamefox-quickpost-normal';

      var footer = doc.evaluate('//div[@id="footer"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      footer.parentNode.insertBefore(quickpostdiv, footer);

      GameFOX.appendQuickPost(doc, 'gamefox-quickpost-normal', false);
    }

    if (titleChange)
    {
      doc.title = 'GameFAQs:' + (pageNum != 0 ? pageNum+1 + ':' : '') + ' ' + doc.evaluate('//h1/following::h1', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent.replace(/^\s+|\s+$/g, '');
      if (inFrame) parentDoc.title = doc.title;
    }

    contentdiv.addEventListener('dblclick', GameFOX.msglistDblclick, false);

    try {
    if (numberMsgs || ((highlightMsgs || highlightIgnore) && !(highlightNames + '').match(/^\s*,\s*$/)))
    {
      var divs = doc.getElementsByTagName('td');
      var msgNum = pageNum * msgsPerPage;

      if (vertmess)
      {
        var messHead = false;
        for (var i = 0; i < divs.length; i++)
        {
          try
          {
            messHead = (divs[i].offsetParent.rows[divs[i].parentNode.rowIndex + 1].className == 'even' ? true : false);
          }
          catch (e)
          {
            messHead = false;
          }

          if (messHead)
          {
            ++msgNum;
            var msgNumString = '000'.substr(0, 3 - msgNum.toString().length) + msgNum;
            divs[i].id = 'p' + msgNumString;

            if (numberMsgs)
            {
              switch (numberMsgsStyle)
              {
                case 1:
                  // Reversed message numbering: #001 | message detail
                  divs[i].insertBefore(doc.createTextNode('#' + msgNumString), divs[i].getElementsByTagName('a')[1]);
                  divs[i].insertBefore(doc.createTextNode(' | '), divs[i].getElementsByTagName('a')[1]);
                  break;
                case 2:
                  // New message numbering: #001
                  divs[i].getElementsByTagName('a')[1].innerHTML = '#' + msgNumString;
                  break;
                case 3:
                  // Mixed message numbering: message #001
                  divs[i].getElementsByTagName('a')[1].innerHTML = 'message #' + msgNumString;
                  break;
                default:
                case 0:
                  // Original message numbering: message detail | #001
                  divs[i].appendChild(doc.createTextNode(' | #' + msgNumString));
                  break;
              }
            }

            posterIndex = highlightNames.indexOf(divs[i].getElementsByTagName('a')[0].textContent);

            if (posterIndex != -1)
            {
              if (highlightMsgs)
              {
                //divs[i].setAttribute('class', 'gamefox-highlight-' + (posterIndex < switchColorAt ? 'one' : 'two'));
                divs[i].setAttribute('class',
                (divs[i].getAttribute('class') ? divs[i].getAttribute('class') : '')
                + ' gamefox-highlight-' + (posterIndex < switchColorAt ? 'one' : 'two'));


                divs[i].style.setProperty('background-color', (posterIndex < switchColorAt ? highlightColor1 : highlightColor2), 'important');
              }

              if (posterIndex >= switchColorAt && highlightIgnore)
              {
                divs[i+1].style.setProperty('font-size', '0pt', 'important');
                divs[i+1].style.setProperty('display', 'none', 'important');

                anchor = doc.createElement('a');
                anchor.setAttribute('href', '#');
                anchor.appendChild(doc.createTextNode('[Show]'));
                anchor.addEventListener('click', GameFOX.showPost, false);
                divs[i].appendChild(doc.createTextNode(' | '));
                divs[i].appendChild(anchor);
              }
            }
          }
        }
      }
      else
      {
        for (var i = 0; i < divs.length; i++)
        {
          if (divs[i].className == 'author')
          {
            ++msgNum;
            var msgNumString = '000'.substr(0, 3 - msgNum.toString().length) + msgNum;
            divs[i].id = 'p' + msgNumString;

            if (numberMsgs)
            {

              switch (numberMsgsStyle) {
                case 1:
                  // Reversed message numbering: #001 <br/> message detail
                  divs[i].insertBefore(doc.createTextNode('#' + msgNumString), divs[i].getElementsByTagName('a')[1]);
                  divs[i].insertBefore(doc.createElement('br'), divs[i].getElementsByTagName('a')[1]);
                  break;
                case 2:
                  // New message numbering: #001
                  divs[i].getElementsByTagName('a')[1].innerHTML = '#' + msgNumString;
                  break;
                case 3:
                  // Mixed message numbering: message #001
                  divs[i].getElementsByTagName('a')[1].innerHTML = 'message #' + msgNumString;
                  break;
                default:
                case 0:
                  // Original message numbering: message detail <br/> #001
                  divs[i].appendChild(doc.createElement('br'));
                  divs[i].appendChild(doc.createTextNode('#' + msgNumString));
                  break;
              }
            }

            posterIndex = highlightNames.indexOf(divs[i].getElementsByTagName('a')[0].textContent);

            if (posterIndex != -1)
            {
              if (highlightMsgs) /* Message highlighting */
              {
                // Use a class as a means for CSS developers to not completely break highlighting
                divs[i].setAttribute('class',
                (divs[i].getAttribute('class') ? divs[i].getAttribute('class') : '')
                + ' gamefox-highlight-' + (posterIndex < switchColorAt ? 'one' : 'two'));
                //divs[i].setAttribute('class', 'gamefox-highlight-' + (posterIndex < switchColorAt ? 'one' : 'two'));
                divs[i].style.setProperty('background-color', (posterIndex < switchColorAt ? highlightColor1 : highlightColor2), 'important');
              }

              if (posterIndex >= switchColorAt && highlightIgnore)
              {
                divs[ i ].style.setProperty('font-size', '0pt', 'important');
                divs[i+1].style.setProperty('font-size', '0pt', 'important');

                anchor = doc.createElement('a');
                anchor.setAttribute('href', '#');
                anchor.style.setProperty('font-size', '10px', 'important');
                anchor.appendChild(doc.createTextNode('[Show]'));
                anchor.addEventListener('click', GameFOX.showPost, false);
                divs[i].appendChild(doc.createElement('br'));
                divs[i].appendChild(anchor);
              }
            }
          }
        }
      }
    }}
    catch(e) {
      gamefox_log('Error when processing something in Message List');
    }

    if (prefs.getBoolPref('elements.tag.link'))
    {
      anchor = doc.createElement('a');
      anchor.setAttribute('id', 'gamefox-tag-link');
      GameFOXTags.read();
      var queryStr = doc.location.search
      var boardID  = queryStr.match(/\bboard=([0-9-]+)/i)[1];
      var topicID  = queryStr.match(/\btopic=([0-9-]+)/i)[1];
      var tagID    = boardID + ',' + topicID;
      anchor.setAttribute('href', '#' + tagID);

      if (boardID in GameFOXTags.tags && topicID in GameFOXTags.tags[boardID].topics)
      {
        anchor.textContent = 'Untag Topic';
        anchor.addEventListener('click', GameFOX.untagTopic, false);
      }
      else
      {
        anchor.textContent = 'Tag Topic';
        anchor.addEventListener('click', GameFOX.tagTopic, false);
      }
      userNav.appendChild(doc.createTextNode(' | '));
      userNav.appendChild(anchor);
    }
  },

  tagTopic: function(event)
  {
    event.preventDefault();
    if (GameFOXTags.add(event))
    {
      event.target.removeEventListener('click', GameFOX.tagTopic, false);
      event.target.addEventListener('click', GameFOX.untagTopic, false);
      event.target.textContent = 'Untag Topic';
    }
  },

  untagTopic: function(event)
  {
    event.preventDefault();
    GameFOXTags.remove(event.target.hash.substring(1));
    event.target.removeEventListener('click', GameFOX.untagTopic, false);
    event.target.addEventListener('click', GameFOX.tagTopic, false);
    event.target.textContent = 'Tag Topic';
  },

  appendQuickPost: function(doc, divID, forNewTopic)
  {
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');

    doc.getElementById(divID).innerHTML
    += '<div id="gamefox-quickpost-title">QuickPost</div>'
    + '<form id="gamefox-quickpost-form" action="post.php' + doc.location.search.replace(/&(action|message|search)=[^&]*(?=&|$)|\b(action|message|search)=[^&]*&/ig, '').replace(/&/, '&amp;') + '" method="post">'
    + (forNewTopic ? '<input type="text" id="gamefox-topic" name="topictitle" size="60" maxlength="80" value=""/><br/>' : '')
    + '<textarea name="message" wrap="virtual" id="gamefox-message" rows="15" cols="60"></textarea><br/>'
    + '<input type="button" id="gamefox-quickpost-btn" name="quickpost" value="Post Message"/> '
    + '<input type="submit" name="post" value="Preview Message"/> '
    + '<input type="submit" name="post" value="Preview and Spellcheck Message"/> '
    + '<input type="reset" value="Reset"/> '
    + (forNewTopic ? '<input type="button" id="gamefox-quickpost-hide" value="Hide"/> ' : '')
    + '</form>';

    doc.getElementById('gamefox-quickpost-btn').addEventListener('click', GameFOX.quickPost, false);
    if (
        (prefs.getComplexValue('signature.body', Components.interfaces.nsISupportsString).data != ''
         || prefs.getComplexValue('signature.presig', Components.interfaces.nsISupportsString).data != '')
        && prefs.getIntPref('signature.addition') == 2)
    {
      doc.getElementById('gamefox-message').value = "\n" +
        GameFOX.formatSig(
            prefs.getComplexValue('signature.body', Components.interfaces.nsISupportsString).data,
            prefs.getComplexValue('signature.presig', Components.interfaces.nsISupportsString).data,
            prefs.getBoolPref('signature.newline')
            );
    }
    doc.getElementById('gamefox-quickpost-form').addEventListener('submit', GameFOX.autoAppendSignature, false);
    doc.getElementById('gamefox-message').setSelectionRange(0, 0);

    if (!prefs.getBoolPref('elements.quickpost.button'))
    {
      doc.getElementById('gamefox-quickpost-btn').style.display = 'none';
    }
    if (forNewTopic)
    {
      doc.getElementById('gamefox-quickpost-hide').addEventListener('click', GameFOX.showQuickPost, false);
    }
  },

  autoAppendSignature: function(event)
  {
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');

    if (
        (prefs.getComplexValue('signature.body', Components.interfaces.nsISupportsString).data != ''
         || prefs.getComplexValue('signature.presig', Components.interfaces.nsISupportsString).data != ''
        ) && prefs.getIntPref('signature.addition') == 1
       )
    {
      event.target.ownerDocument.getElementById('gamefox-message').value += "\n" +
        GameFOX.formatSig(
            prefs.getComplexValue('signature.body', Components.interfaces.nsISupportsString).data,
            prefs.getComplexValue('signature.presig', Components.interfaces.nsISupportsString).data,
            prefs.getBoolPref('signature.newline')
            );
    }
  },

  showQuickPost: function(event)
  {
    event.preventDefault();

    var doc = event.target.ownerDocument;
    var div = doc.getElementById('gamefox-quickpost-afloat');

    if (div)
    {
      div.style.display = div.style.display == 'none' ? 'block' : 'none';
      return;
    }

    div = doc.createElement('div');
    div.setAttribute('id', 'gamefox-quickpost-afloat');
    div.style.display = 'block';

    doc.getElementsByTagName('body')[0].appendChild(div);
    //var footer = doc.evaluate('//div[@id="footer"]', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    //footer.parentNode.insertBefore(div, footer);

    GameFOX.appendQuickPost(doc, 'gamefox-quickpost-afloat', true);
  },

  msglistDblclick: function(event)
  {
    var prefs        = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var dblclickHead = prefs.getIntPref('message.header.dblclick');
    var dblclickMsg  = prefs.getBoolPref('message.dblclick');

    if (dblclickHead == 0 && !dblclickMsg)
    {
      return;
    }

    var node = event.target;
    var doc = node.ownerDocument;

    // ignore double-click on images
    if (node.nodeName.toLowerCase() == 'img')
    {
      return;
    }

    var nodeName  = node.nodeName.toLowerCase();
    var nodeClass = node.className.toLowerCase();
    try
    {
      var tableNode      = (nodeName == 'div') ? node.parentNode : node.offsetParent;
      var tableNodeName  = tableNode.nodeName.toLowerCase();
      var tableNodeClass = tableNode.className.toLowerCase();

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
    catch (e)
    {
      return;
    }


    var vertmess = (doc.getElementsByTagName('tr')[0].getElementsByTagName('td').length == 1) ? true : false;

    if (dblclickHead != 0 && ((vertmess && node.parentNode.className != 'even') || nodeClass.match(/author/)))
    {
      switch (dblclickHead)
      {
        case 1:
          GameFOX.quickWhois(event);
          break;
        case 2:
          GameFOX.quote(event);
          break;
      }
      return;
    }

    if (dblclickMsg)
    {
      GameFOX.quote(event);
    }
  },

  topicDblclick: function(event)
  {
    var onMyPosts = event.target.ownerDocument.location.pathname.match(/\bmyposts\./i);
    var switcher  = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getIntPref('gamefox.' + (onMyPosts ? 'myposts' : 'topic') + '.dblclick');
    switch (switcher)
    {
      case 0:
        break;
      case 1:
        GameFOX.showPages(event);
        break;
      case 2:
        GameFOX.gotoLastPage(event);
        break;
      case 3:
        GameFOXTags.add(event);
        break;
    }
  },

  quote: function(event)
  {
    var doc = event.target.ownerDocument;

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
    catch (e)
    {
      return;
    }


    var prefs = Components.classes['@mozilla.org/preferences-service;1'].
      getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');

    if (!doc.getElementById('gamefox-message'))
      return;

    var vertmess = (doc.getElementsByTagName('tr')[0].getElementsByTagName('td').length == 1) ? true : false;
    var quoteHead, quoteMsg, msgNum;

    /* Test for selection quoting */
    //var focusedWindow = new XPCNativeWrapper(document.commandDispatcher.focusedWindow, 'document', 'getSelection()');
    //var selection = focusedWindow.getSelection().toString();
    //var x = doc.evaluate('//td', doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    //if (gContextMenu) alert(focusedWindow.getSelection());

    // in message header
    if ((vertmess && node.parentNode.className != 'even') || nodeClass.match('author'))
    {
      quoteHead = node.textContent;
      msgNum = '#' + node.id.substr(1);

      if (vertmess)
      {
        node = tableNode.rows[node.parentNode.rowIndex + 1].cells[0];
      }
      else
      {
        node = node.parentNode.cells[1];
      }

      quoteMsg = node.innerHTML;
    }
    else
    // in message body
    if ((vertmess && node.parentNode.className == 'even') || !nodeClass.match('author'))
    {
      quoteMsg = node.innerHTML;

      if (vertmess)
      {
        node = tableNode.rows[node.parentNode.rowIndex - 1].cells[0];
      }
      else
      {
        node = node.parentNode.cells[0];
      }

      quoteHead = node.textContent;
      msgNum = '#' + node.id.substr(1);
    }
    else
    {
      GameFOXUtils.log('GameFOX.quote: nothing to do');
      return;
    }

    GameFOX.quoteProcessing(event, quoteHead, quoteMsg, msgNum);
  },


  quoteProcessing: function(event, quoteHead, quoteMsg, msgNum)
  {
    var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).
      getBranch('gamefox.');

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
      replace(/&(amp|AMP);/g, '&').
      replace(/^\s+|\s+$/g, '');

   // Get rid of signature
    if (prefs.getBoolPref('quote.removesignature'))
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
    if (prefs.getBoolPref('quote.header.username')) qhead += username;
    if (prefs.getBoolPref('quote.header.date')) qhead += " | Posted " + postdate;
    if (prefs.getBoolPref('quote.header.messagenum') && postnum) qhead += " (" + postnum + ")";

    if (prefs.getCharPref('quote.style') != 'gfcode_full')
    {
      if (prefs.getBoolPref('quote.header.italic')) qhead = "<i>" + qhead + "</i>";
      if (prefs.getBoolPref('quote.header.bold')) qhead = "<b>" + qhead + "</b>";
    }

    switch (prefs.getCharPref('quote.style'))
    {
      case 'normal':
        var qbody = "";
        qbody = body;
        if (prefs.getBoolPref('quote.message.italic')) qbody = "<i>" + qbody + "</i>";
        if (prefs.getBoolPref('quote.message.bold')) qbody = "<b>" + qbody + "</b>";

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
        var quoteTemplate = prefs.getComplexValue('quote.style.custom', Components.interfaces.nsISupportsString).data;
        var quote = quoteTemplate.
          replace(/\%u/g, username).
          replace(/\%d/g, postdate).
          replace(/\%n/g, postnum).
          replace(/\%m/g, body);
        break;
    }

    var quickpost = event.target.ownerDocument.getElementById('gamefox-message');
    if (prefs.getIntPref('signature.addition') == 1)
      quickpost.value += quote + "\n";
    else
    {
      // holy crap this is so mindnumbingly simple and it solves everything
      var length = quickpost.value.substring(0, quickpost.selectionStart).length + quote.length + 1;
      quickpost.value = quickpost.value.substring(0, quickpost.selectionStart)
                      + quote + "\n"
                      + quickpost.value.substring(quickpost.selectionEnd, quickpost.value.length);
    }
    quickpost.focus();
    // Move the caret to the end of the last quote
    quickpost.setSelectionRange(length, length);
  },

  quickWhois: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;
    var nodeName = node.nodeName.toLowerCase();

    try
    {
      while (nodeName != 'td' && node.className != 'whitebox')
      {
        node = node.parentNode;
        nodeName = node.nodeName.toLowerCase();
      }
    }
    catch (e)
    {
      return;
    }

    var div = node.getElementsByTagName('div');

    if (div.length > 0)
    {
      div[0].style.display = div[0].style.display == 'block' ? 'none' : 'block';
      div[0].style.top     = window.content.scrollY + event.clientY + 'px';
      div[0].style.left    = window.content.scrollX + event.clientX + 'px';
      return;
    }

    function GameFOXFindInfo(what, where)
    {
      var pattern = new RegExp('<td\\b[^>]*>(\\s*<a\\b[^>]*>)?\\s*' + what + '(\\s*</a>)?\\s*</td>\\s*<td\\b[^>]*>([^\\0]*?)</td>', 'gi');
      var matches = pattern.exec(where);

      if (matches)
      {
        return matches[3].replace(/^\s+|\s+$/g, '');
      }

      return '';
    }

    div = doc.createElement('div');
    div.setAttribute('class', 'gamefox-quickwhois');
    div.style.display = 'block';
    div.style.setProperty('font-size', '10pt', '');
    div.style.top     = window.content.scrollY + event.clientY + 'px';
    div.style.left    = window.content.scrollX + event.clientX + 'px';
    div.innerHTML     = 'Loading QuickWhois...'
    node.appendChild(div);

    var request = new XMLHttpRequest();
    request.open('GET', node.getElementsByTagName('a')[0].href);
    request.onreadystatechange = function ()
    {
      if (request.readyState == 4)
      {
        var profileFieldsHTML = '';
        var profileFields = new Array(
          'User ID', 'User ID',
          'Board User Level', 'User Level',
          'Account Created', 'Created At',
          'Last Visit', 'Last Visit',
          'E-Mail', 'Email',
          'Website', 'Website',
          'AIM', 'AIM',
          'Yahoo IM', 'Yahoo IM',
          'Windows Live \\(MSN\\)', 'MSN',
          'Google Talk', 'Google Talk',
          'ICQ', 'ICQ',
          'Xbox Live', 'Xbox Live',
          'PlayStation Network', 'PSN',
          'DS Friend Code', 'DS Friend Code',
          'Wii Number', 'Wii Number',
          'Wii Friend Code', 'Wii Friend Code',
          'Skype', 'Skype',
          'Steam', 'Steam',
          'xfire', 'xfire',
          'Quote', 'Quote',
          'Karma', 'Karma'
        );
        for (var i = 0; i < profileFields.length; i += 2) {
          if ((profileField = GameFOXFindInfo(profileFields[i], request.responseText)) != '') {
            if (profileFields[i] == 'Board User Level') {
              profileField = profileField.split(/<br\s*\/?>/gi)[0].replace(/<\/?b>/ig, '');
            }
            profileFieldsHTML += '<b>' + profileFields[i+1] + ':</b> ' + profileField.replace(/<br\s*\/?>/gi, '<br/>') + '<br/>';
          }
        }
        div.innerHTML = profileFieldsHTML.replace(/<br\/>$/, '')
          + GameFOXFindInfo('Contributor Page', request.responseText).replace(/^</, '<br/><')
          + GameFOXFindInfo('My Games', request.responseText).replace(/^</, '<br/><');
      }
    };
    request.send(null);
  },

  gotoLastPage: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;
    var nodeName = node.nodeName.toLowerCase();

    try
    {
      while (nodeName != 'td')
      {
        node = node.parentNode;
        nodeName = node.nodeName.toLowerCase();
      }

      var myposts = doc.location.pathname.match(/\/myposts\./i) ? true : false;
      var msgsCell = myposts ? node.parentNode.cells[2] : node.parentNode.cells[3];
      var pageNum = Math.floor((msgsCell.textContent-1)/Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getIntPref('gamefox.msgsPerPage'));
      doc.location.href = node.parentNode.cells[1].getElementsByTagName('a')[0].href + (pageNum ? '&page=' + pageNum : '');
    }
    catch (e)
    {
      return;
    }
  },

  showPages: function(event)
  {
    var node = event.target;
    var doc = node.ownerDocument;
    var nodeName = node.nodeName.toLowerCase();
    var topicLink, msgsCell;

    try
    {
      while (nodeName != 'td')
      {
        node = node.parentNode;
        nodeName = node.nodeName.toLowerCase();
      }

      var myposts = doc.location.pathname.match(/\/myposts\./i) ? true : false;

      topicLink = node.parentNode.cells[1].getElementsByTagName('a')[0].getAttribute('href');

      msgsCell = myposts ? node.parentNode.cells[2] : node.parentNode.cells[3];
    }
    catch (e)
    {
      return;
    }

    var boardID   = topicLink.match(/\bboard=([0-9-]+)/i)[1];
    var topicID   = topicLink.match(/\btopic=([0-9-]+)/i)[1];
    var numPages  = Math.ceil(msgsCell.textContent/Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch).getIntPref('gamefox.msgsPerPage'));
    var pageList  = document.getElementById('gamefox-pages-menu');
    var i, item, link, tr, td;

    if ('type' in event) // triggered from double-click event
    {
      var pgPrefs    = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.paging.');
      var pgLocation = pgPrefs.getIntPref('location');
      node = node.parentNode.cells[1];

      try {
        if (node.parentNode.nextSibling.className == 'gamefox-pagelist')
        {
          node.parentNode.nextSibling.style.display = (!pgLocation && node.parentNode.nextSibling.style.display != 'table-row') ? 'table-row' : 'none';
          if (!pgLocation)
          {
            try {
              node.getElementsByTagName('span')[0].style.display = 'none';
            } catch(e){;}
            return;
          }
        }
      } catch(e){;}

      var notNewElement = (node.getElementsByTagName('span').length > 0);
      if (notNewElement)
      {
        td = node.getElementsByTagName('span')[0];
        try {
          if (parseInt(td.getAttribute('tag')) == pgLocation)
          {
            td.style.display = (td.style.display == 'none') ? '' : 'none';
            if (td.style.display == 'none')
            return;
          }
          else if (!pgLocation)
          {
            td.style.display = 'none';
          }
        } catch(e){;}

        if (pgLocation)
        {
          tr = node;
          td.setAttribute('tag', pgLocation);
          td.style.display = '';
        }
      }
      else if (pgLocation)
      {
        tr = node;
        td = doc.createElement('span');
        td.setAttribute('class', 'gamefox-pagelist');
        td.setAttribute('tag', pgLocation);
      }

      if (!pgLocation)
      {
        tr = doc.createElement('tr');
        tr.setAttribute('class', 'gamefox-pagelist');
        tr.style.display = 'table-row';
        td = doc.createElement('td');
        td.setAttribute('colspan', '5');
      }

      var pgPrefix = pgPrefs.getCharPref('prefix');
      var pgSep    = pgPrefs.getCharPref('separator');
      var pgSuffix = pgPrefs.getCharPref('suffix');

      td.innerHTML = '';
      td.appendChild(doc.createTextNode(pgSuffix));

      var suffixHTML = td.innerHTML.replace(/\s/g, '&nbsp;');

      td.innerHTML = '';
      if (pgLocation == 2)
      {
        td.appendChild(doc.createElement('br'));
      }
      td.appendChild(doc.createTextNode(pgPrefix));
      td.innerHTML = ' ' + td.innerHTML.replace(/\s/g, '&nbsp;');

      for (i = 0; i < numPages; i++)
      {
        link = doc.createElement('a');
        link.setAttribute('href', topicLink + (i ? '&page=' + i : ''));
        link.innerHTML = i+1;

        td.appendChild(link);

        if (i < numPages-1)
        {
          td.appendChild(doc.createTextNode(pgSep));
        }
      }

      td.innerHTML += suffixHTML;

      tr.appendChild(td);
      if (!pgLocation) node.parentNode.parentNode.insertBefore(tr, node.parentNode.nextSibling);
    }
    else // triggered from context menu
    {
      while (pageList.hasChildNodes())
      {
        pageList.removeChild(pageList.childNodes[0]);
      }

      for (i = 0; i < numPages; i++)
      {
        item = document.createElement('menuitem');
        item.setAttribute('label', i+1);
        item.setAttribute('oncommand', 'GameFOXTags.open("' + boardID + ',' + topicID + ',' + i + '", 2)');
        item.setAttribute('onclick', 'if (event.button == 1) GameFOXTags.open("' + boardID + ',' + topicID + ',' + i + '", 0)');
        pageList.appendChild(item);
      }
    }
  },

  toggleSidebar: function()
  {
    toggleSidebar('viewGamefoxSidebar');
  },

  quickPost: function(event)
  {
    var doc     = event.target.ownerDocument;
    var prefs   = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');
    var previewRequest = new XMLHttpRequest();
    var postRequest;

    var path     = '/gfaqs/'; // was for gfaqs9
    var postFile = 'post.php';
    var psearch  = doc.location.search.replace(/&(action|message|search)=[^&]*(?=&|$)|\b(action|message|search)=[^&]*&/ig, '');

    event.target.setAttribute('disabled', 'disabled');
    event.target.blur();
    // NOTE TO uG: The 'click' event still fires even if the button is disabled
    event.target.removeEventListener('click', GameFOX.quickPost, false);
    previewRequest.open('POST', 'http://boards.gamefaqs.com' + path + postFile + psearch);
    previewRequest.onreadystatechange = function()
    {
      if (previewRequest.readyState == 4)
      {
        var postId = previewRequest.responseText.match(/\bname="post_id"[^>]+?\bvalue="([^"]*)"/i);

        if (!postId || postId[1].match(/^\s*0?\s*$/))
        {
          try
          {
            if (previewRequest.responseText.replace(/^\s+|\s+$/g, '').length == 0)
            {
              alert('Preview message request timed out. Please check your network connection and try again.');
            }
            else
            {
              // Thanks to KSOT's Secondary FAQ for all of these errors
              var badWord    = previewRequest.responseText.match(/<p>Banned word found: <b>(.+?)<\/b>/i);
              var tooBig     = previewRequest.responseText.match(/The maximum allowed size for a message is 4096 characters\. Your message is ([0-9]+) characters long\./i);
              var tTitle     = previewRequest.responseText.match(/Topic titles must be between 5 and 80 characters\./i);
              var allCapsT   = previewRequest.responseText.match(/Topic titles cannot be in all uppercase\.  Turn off your CAPS LOCK\./i);
              var allCapsM   = previewRequest.responseText.match(/Messages cannot be in all uppercase\.  Turn off your CAPS LOCK\./i);
              var noTopics   = previewRequest.responseText.match(/You are not authorized to create topics on this board\./i);
              var noPosts    = previewRequest.responseText.match(/You are not authorized to post messages on this board\./i);
              var bigWordT   = previewRequest.responseText.match(/Your topic title contains a single word over 25 characters in length\.  This can cause problems for certain browsers, and is not allowed\./i);
              var bigWordM   = previewRequest.responseText.match(/Your message contains a single word over 80 characters in length\.  This can cause problems for certain browsers, and is not allowed\./i);
              var badHTML    = previewRequest.responseText.match(/Your HTML is not well-formed - please check for unmatched quotes and tags\./i);
              var closedT    = previewRequest.responseText.match(/This topic is closed/i);
              var deletedT   = previewRequest.responseText.match(/This topic is no longer available for viewing/i);

              if (badWord)
              {
                alert('Your post includes the word "' + badWord[1] + '", which is a bad word. Didn\'t anyone ever tell you "' + badWord[1] + '" was a bad word?');
              }
              else if (tooBig)
              {
                alert('Your post is too big! A message can only contain 4096 characters, while yours has ' + tooBig[1] + '.');
              }
              else if (tTitle)
              {
                alert('You know, the 80 character limit on topic titles is there for a reason.');
              }
              else if (allCapsT)
              {
                alert('Turn off your Caps Lock key and try typing the topic title again.');
              }
              else if (allCapsM)
              {
                alert('Turn off your Caps Lock key and try typing your message again.');
              }
              else if (noTopics)
              {
                alert('You are not allowed to post topics here.');
              }
              else if (noPosts)
              {
                alert('You are not allowed to post messages here.');
              }
              else if (bigWordT)
              {
                alert('Your topic title contains a word over 25 characters in length. This makes CJayC unhappy because it stretches his 640x480 screen resolution, so he doesn\'t allow it.');
              }
              else if (bigWordM)
              {
                alert('Your message contains a word over 80 characters in length. This makes CJayC unhappy because it stretches his 640x480 screen resolution, so he doesn\'t allow it.');
              }
              else if (badHTML)
              {
                alert('Your HTML is not well-formed. Please make it well-formed and try again.');
              }
              else if (closedT)
              {
                alert('The topic was closed while you were typing your message. Type faster next time.');
              }
              else if (deletedT)
              {
                alert('The topic is gone! Damn moderators...');
              }
              else if (!previewRequest.responseText.match(/<body/i) && previewRequest.responseText.match(/maintenance/i))
              {
                alert('The site is temporarily down for maintenance... please check back later.');
              }
              else
              {
                throw Components.results.NS_ERROR_FAILURE;
              }
            }
          }
          catch (e)
          {
            alert('Your post encountered a new or rare error while being previewed. Try posting again without QuickPost to try and find the problem.');
          }
          event.target.removeAttribute('disabled');
          event.target.addEventListener('click', GameFOX.quickPost, false);
          return;
        }
        else
        {
          if (previewRequest.responseText.match(/<div class="head"><h1>Post Warning<\/h1><\/div>/i) && !confirm('Your message contains some content that makes GameFAQs suspect it might break the ToS. If you post this message, it will automatically be flagged for a moderator to look at. Are you sure you want to post this message?'))
          {
            event.target.removeAttribute('disabled');
            event.target.addEventListener('click', GameFOX.quickPost, false);
            return;
          }
          postRequest = new XMLHttpRequest();
          postRequest.open('POST', 'http://boards.gamefaqs.com' + path + postFile + psearch);
          postRequest.onreadystatechange = function()
          {
            if (postRequest.readyState == 4)
            {
              if (!postRequest.responseText.match(/You should be returned to the Message List automatically in five seconds./i)) // won't work if the user has this in their sig haha
              {
                try
                {
                  if (postRequest.responseText.replace(/^\s+|\s+$/g, '').length == 0)
                  {
                    alert('Post message request timed out. Please check your network connection and try again.');
                  }
                  else
                  {
                    var flooding   = postRequest.responseText.match(/To prevent flooding,/i);
                    var closedT    = postRequest.responseText.match(/This topic is closed/i);
                    var deletedT   = postRequest.responseText.match(/This topic is no longer available for viewing/i);

                    if (flooding)
                    {
                      alert('You are posting too quickly and have hit one of the flooding limits.');
                    }
                    else if (closedT)
                    {
                      alert('The topic was closed while you were typing your message. Type faster next time!');
                    }
                    else if (deletedT)
                    {
                      alert('The topic is gone! Damn moderators...');
                    }
                    else
                    {
                      throw Components.results.NS_ERROR_FAILURE;
                    }
                  }
                }
                catch (e)
                {
                  alert('Your post encountered a new or rare error while being posted. Try posting again without QuickPost to try and find the problem.');
                }
                event.target.removeAttribute('disabled');
                event.target.addEventListener('click', GameFOX.quickPost, false);
                return;
              }
              doc.location = 'http://boards.gamefaqs.com' + path + ((doc.getElementsByName('topictitle')[0]) ? 'gentopic.php' : 'genmessage.php') + psearch;
              return;
            }
          };

          // This was a new field added to the post form. If it isn't provided, the request is ignored, so
          // we have to extract it
          var uid = previewRequest.responseText.match(/\bname="uid"[^>]+?\bvalue="([^"]*)"/i);

          postRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          postRequest.send(
              'post_id=' + postId[1] +
              '&post=Post+Message' +
              '&uid=' + uid[1]
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
        event.target.addEventListener('click', GameFOX.quickPost, false);
        alert('Topic titles must be at least 5 characters long.');
        return;
      }
      postBody = 'topictitle=' + GameFOX.URLEncode(topicTitle[0].value) + '&';
    }

    var message = doc.getElementsByName('message')[0].value;

    if (
        !doc.location.pathname.match(/^\/gfaqs\/(post|preview).php$/ig)
        && (
          prefs.getComplexValue('signature.body', Components.interfaces.nsISupportsString).data != ''
          || prefs.getComplexValue('signature.presig', Components.interfaces.nsISupportsString).data != ''
          )
        && prefs.getIntPref('signature.addition') == 1
      )
    {
      message += "\n" +
        GameFOX.formatSig(
            prefs.getComplexValue('signature.body', Components.interfaces.nsISupportsString).data,
            prefs.getComplexValue('signature.presig', Components.interfaces.nsISupportsString).data,
            prefs.getBoolPref('signature.newline')
            );
    }

    previewRequest.send(postBody + 'message=' + GameFOX.URLEncode(message) + '&post=Preview+Message');
  },

  URLEncode: function(str)
  {
    str = escape(str).replace(/\+/g, '%2B').replace(/%20/g, '+').replace(/\//g, '%2F').replace(/@/g, '%40');

    // 4 hex characters to 2 hex characters conversion table for some Unicode chars borrowed from ToadKing's releases and modified
    // I tried using Mozilla's localization and conversion interfaces to convert from ISO-8859-1 to Unicode, vice versa, Unicode to UTF-8, vice versa,
    // and all other sorts of shit but to no avail. This seems to be the only way to do it, unless CJayC changes GameFAQ's character encoding to UTF-8 or Unicode
    var hex2  = ['80', '82', '83', '84', '85', '86', '87', '88', '89', '8A', '8B', '8C', '8E', '91',
                 '92', '93', '94', '95', '96', '97', '98', '99', '9A', '9B', '9C', '9E', '9F'];
    ['20AC', '201A', '0192', '201E', '2026', '2020', '2021', '02C6', '2030', '0160', '2039', '0152', '017D', '2018',
     '2019', '201C', '201D', '2022', '2013', '2014', '02DC', '2122', '0161', '203A', '0153', '017E', '0178'].forEach
    (
      function(element, index, array)
      {
        str = str.replace(new RegExp('%[Uu]' + element, 'g'), '%' + hex2[index]);
      }
    );

    return str;
  },

  showPost: function(event)
  {
    event.preventDefault();

    var button          = event.target;
    var doc             = button.ownerDocument;
    var buttonContainer = button.offsetParent; // td
    var postMsg;

    var vertmess = (doc.getElementsByTagName('tr')[0].getElementsByTagName('td').length == 1) ? true : false;
    if (vertmess)
    {
      postMsg = buttonContainer.offsetParent.rows[buttonContainer.parentNode.rowIndex + 1].cells[0];
      if (postMsg.style.fontSize == '0pt')
      {
        postMsg.style.removeProperty('font-size');
        postMsg.style.removeProperty('display');
        postMsg.removeAttribute('style');
        button.textContent = '[Hide]';
      }
      else
      {
        postMsg.style.setProperty('font-size', '0pt',  'important');
        postMsg.style.setProperty('display', 'none', 'important');
        button.textContent = '[Show]';
      }
    }
    else
    {
      postMsg = buttonContainer.parentNode.cells[1];
      if (postMsg.style.fontSize == '0pt')
      {
        postMsg.style.removeProperty('font-size');
        postMsg.removeAttribute('style');
        buttonContainer.style.removeProperty('font-size');
        button.textContent = '[Hide]';
      }
      else
      {
        postMsg.style.setProperty('font-size', '0pt',  'important');
        buttonContainer.style.setProperty('font-size', '0pt',  'important');
        button.textContent = '[Show]';
      }
    }
  },

  formatSig: function(sig, sigPre, sigNewline)
  {
    // Restrict signature to 2 lines, presignature to 1
    sig = sig.split("\n");
    if (sig.length >= 2)
      sig = sig[0] + "\n" + sig[1];
    else
      sig = sig[0];

    sigPre = sigPre.split("\n");
    sigPre = sigPre[0];

    var str = (sigNewline ? "\n" : "") +
      (sigPre != "" ? sigPre + (sig != "" ? "\n" : "") : "") +
      (sig != "" ? "---\n" + sig : "");
    return str;
  }
};

function GameFOXLoader()
{
  window.removeEventListener('load', GameFOXLoader, false);
  document.getElementById('appcontent').addEventListener(
      'DOMContentLoaded', GameFOX.processPage, false);
  document.getElementById('contentAreaContextMenu').addEventListener(
      'popupshowing', GameFOX.contextMenuDisplay, false);

  var prefs = Components.classes['@mozilla.org/preferences-service;1'].
    getService(Components.interfaces.nsIPrefService).getBranch('gamefox.');

  try
  {
    var lastversion = prefs.getCharPref('version');
  }
  catch (e if e.name == "NS_ERROR_UNEXPECTED") // the pref isn't set, we can assume this is a first run
  {
    GameFOXCSS.init();
    GameFOXUtils.importBoardSettings();
    GameFOXUtils.importSignature();
    window.openDialog('chrome://gamefox/content/options.xul', 'GameFOX',
        'chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar');
  }

  var version = Components.classes['@mozilla.org/extensions/manager;1'].
    getService(Components.interfaces.nsIExtensionManager).
    getItemForID('{6dd0bdba-0a02-429e-b595-87a7dfdca7a1}').version;
  var compareVersions = Components.classes['@mozilla.org/xpcom/version-comparator;1'].
    getService(Components.interfaces.nsIVersionComparator).compare(lastversion, version);
  if (compareVersions != 0)
    GameFOXCSS.init();

  prefs.setCharPref('version', version);

  GameFOXCSS.reload();
}

window.addEventListener('load', GameFOXLoader, false);
