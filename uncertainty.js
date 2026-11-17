(function () {
function main($) {
  var form;

  function API(data, success, failure) {
    data.action || (data.action = 'query');
    data.format || (data.format = 'json');
    return $.ajax({
      url: mw.config.get('wgServer') + '/api.php',
      type: 'POST',
      data: data,
      success: success,
      failure: failure
    });
  }

  function addUncertainty() {
    var p, getText, getToken, weUnc, weUncYes, weUncNo,
        unc = '',
        token = '',
        text = '',
        ts = new Date().getTime();
    $('#weUncSub').hide();
    $('#weAddUncSpinner').show();
    // get a promise for the text
    getText = API({
        prop: 'revisions',
        rvprop: 'content',
        titles: mw.config.get('wgPageName')
    });
    // get a promise of an edit token
    getToken = API({
        meta: 'tokens'
    });

    weUnc = $.trim($('#weUnc').val());
    weUncYes = $.trim($('#weUncYes').val());
    weUncNo = $.trim($('#weUncNo').val());
    if (weUnc === '' || weUncYes === '' || weUncNo === '') {
      alert('Please enter your suggested Uncertainty and Yes/No outcomes.');
      $('#weAddUncSpinner').hide();
      $('#weUncSub').show();
      return false;
    }
    
    unc += '<li style="margin-bottom: 2em">{{VoteTotal|style=font-weight: bold;|text=' + weUnc + "}}\n";
    unc += '<ol style="list-style-type: none; margin-left: 8em;">' + "\n";
    unc += '<li>{{VoteItem|id=' + ts + "1|text='''Yes:''' " + weUncYes + "}}</li>\n";
    unc += '<li>{{VoteItem|id=' + ts + "2|text='''No: ''' " + weUncNo + "}}</li>\n";
    unc += "</ol></li>\n";

    // once we have the text and token, we can modify text and save it
    $.when(getText, getToken)
      .done(function(tx, tk) {
        var i, txd, tkd;
        txd = tx[0];
        tkd = tk[0];
        // extract the text
        if (txd && txd.query && txd.query.pages) {
          for (i in txd.query.pages) {
            if (i > 0) {
              text = txd.query.pages[i].revisions[0]['*'];
            }
          }
        }
        // extract the token
        if (tkd && tkd.query && tkd.query.tokens) {
          token = tkd.query.tokens.csrftoken;
        }

        // insert at the last </ol>
        p = text.lastIndexOf('</ol>');
        text = text.slice(0, p) + unc + text.slice(p);
        API({
          action: 'edit',
          token: token,
          summary: 'add a new uncertainty',
          text: text,
          title: mw.config.get('wgPageName')
        }, function() {
          window.location.replace(mw.config.get('wgServer') + '/' + mw.config.get('wgPageName') + '?weToken=' + Math.random());
        });
      })
      .fail(function() {
        alert("Unable to record your vote now.\nPlease try later.");
      });
    return false;
  }

  // if not logged in, you can't add things
  if (!mw.config.get('wgUserName')) {
    $('#weAddUncertainty').attr('disabled', 'disabled');
    return;
  }

  form =  '<form id="weUncForm" style="margin-left: 10em; display: none;">';
  form += '<label for="weUnc" style="font-weight: bold;">Uncertainty</label>';
  form += '  <textarea name="weUnc" id="weUnc" cols="60"></textarea>';
  form += '<div style="margin-left: 8em;">';
  form += '  <label for="weUncYes" style="font-weight: bold;">Yes:</label>';
  form += '    <textarea name="weUncYes" id="weUncYes" cols="50"></textarea>';
  form += '  <label for="weUncNo" style="font-weight: bold;">No:</label>';
  form += '    <textarea name="weUncNo" id="weUncNo" cols="50"></textarea>';
  form += '</div>';
  form += '<input type="submit" value="Submit" id="weUncSub" name="weUncSub" /><span id="weAddUncSpinner" style="display: none;"></span>';
  form += '</form>';

  $('#weAddUncertainty').click(function() {
    $('#weAddUncertainty').hide('fast').after(form);
    mw.loader.using('jquery.spinner').then(function () {
      $('#weAddUncSpinner').append($.createSpinner({ size: 'small' }));
    });
    $('#weUncForm').show('slow');
    $('#weUncSub').click(addUncertainty);
    return false;
  });
  
  return;
}
// MediaWiki >= 1.27 loads mw/jQuery asynchronously and runs RLQ when ready;
// older versions have them loaded before the page body
if (window.jQuery && window.mw) {
  jQuery(main);
} else {
  (window.RLQ = window.RLQ || []).push(function () { jQuery(main); });
}
}());
