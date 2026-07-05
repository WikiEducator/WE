(function() {
  var jQueryUI = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.21/jquery-ui.min.js',
      jQueryUICSS = 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.21/themes/smoothness/jquery-ui.css';

  var weAPI = wgServer + '/api.php';

  function mwAPI(data, success, failure) {
    if (!data.hasOwnProperty('format')) {
      data.format = 'json';
    }
    $.ajax({
      url: weAPI,
      data: data,
      async: false,
      dataType: 'json',
      type: 'POST',
      success: success,
      failure: failure || function() {} // silently fail!
    });
  }

  var options;
  var canonicalPagePrefix;
  var lastChapter = '';

  function addPages(d) {
    var done = false;
    console.log(d);
    if (d && d.hasOwnProperty('query') && d.query.hasOwnProperty('allpages')) {
      var allpages = d.query.allpages;
      console.log(allpages);
      for (page in allpages) {
        console.log(page, allpages[page].title);
        if (allpages[page].title.indexOf(canonicalPagePrefix) === 0) {
          rawtitle = allpages[page].title;
          parts = rawtitle.split('/');
          if (parts.length > 1) { // in theory, should always be true
            var basename = parts[parts.length-1];
            // ignore pages where basename starts with space
            if (basename.charAt(0) == ' ') {
              break;
            }
            // if the second component changes and there is no page
            // at that level, generate a chapter heading
            if ((parts[1].length > 0) && (parts[1] != lastChapter) && (parts.length>2)) {
              lastChapter = parts[1];
              console.log('chapter:', lastChapter, parts);
              collectionCall('AddChapter', [lastChapter]);
            }
          }
          if (allpages[page].ns > 0) {
            rawtitle = rawtitle.substring(rawtitle.indexOf(':')+1);
          }
          console.log(rawtitle);
          collectionCall('AddArticle', [wgNamespaceNumber, rawtitle, 0]);
          
          $('#WEbookmakerList').append('<li>' + allpages[page].title + '</li>');
        } else {
          done = true;
          break;
        }
      }
    }
    if (!done && d && d.hasOwnProperty('query-continue') && d['query-continue'].hasOwnProperty('allpages') && d['query-continue'].allpages.hasOwnProperty('apfrom')) {
      options.apfrom = d['query-continue'].allpages.apfrom;
      console.log('apfrom=', options.apfrom);
      setTimeout(findPages, 1);   // iterate, without blowing stack
    }
    return false;
  }

  function findPages() {
    mwAPI(options, addPages);
  }

  function bookmaker() {
    console.log('bookmaker');
    if($('#WEbookmaker').length === 0) {
      $('body').append('<div id="WEbookmaker" style="display:none"><ul id="WEbookmakerList" style="font-size: smaller;"></ul></div>');
    }
    $('#WEbookmaker').dialog({
      title: 'Bookmaker',
      width: 600,
      height: 400
    });
    collectionCall('AddArticle', [wgNamespaceNumber, wgTitle, 0]);
    canonicalPagePrefix = ((wgNamespaceNumber > 0) ? wgCanonicalNamespace + ':' : '') + wgTitle;
    $('#WEbookmakerList').append('<li>' + canonicalPagePrefix + '</li>');
    canonicalPagePrefix += '/';
    options = {
      action: 'query',
      list: 'allpages',
      apnamespace: wgNamespaceNumber,
      apprefix: wgTitle + '/',
      apfilterredir: 'nonredirects',
      aplimit: 10
    };
    findPages();
  }

  // if we don't already have jQueryUI, load it and its CSS
  if (typeof $().dialog == 'undefined') {
    console.log('fetching jQueryUI');
    $('head').append('<link rel="stylesheet" href="' + jQueryUICSS + '" type="text/css" />');
    $.getScript(jQueryUI, bookmaker);
  } else {
    bookmaker();
  }
}());

