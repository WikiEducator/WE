$(function() {
  var form;

  function API(data, success, failure) {
    data.action || (data.action = 'query');
    data.format || (data.format = 'json');
    return $.ajax({
      url: window.wgServer + '/api.php',
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
        titles: wgPageName
    });
    // get a promise of an edit token
    getToken = API({
        prop: 'info',
        intoken: 'edit',
        titles: wgPageName
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
        if (tkd && tkd.query && tkd.query.pages) {
          for (i in tkd.query.pages) {
            if (i > 0) {
              token = tkd.query.pages[i].edittoken;
            }
          }
        }

        // insert at the last </ol>
        p = text.lastIndexOf('</ol>');
        text = text.slice(0, p) + unc + text.slice(p);
        API({
          action: 'edit',
          token: token,
          summary: 'add a new uncertainty',
          text: text,
          title: wgPageName
        }, function() {
          window.location.replace(wgServer + '/' + wgPageName + '?weToken=' + Math.random());
        });
      })
      .fail(function() {
        alert("Unable to record your vote now.\nPlease try later.");
      });
    return false;
  }

  // if not logged in, you can't add things
  if (!wgUserName) {
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
  form += '<input type="submit" value="Submit" id="weUncSub" name="weUncSub" /><img id="weAddUncSpinner" src="/skins/common/images/Ajax-loader.gif" height=16 width=16 style="display: none;" />';
  form += '</form>';

  $('#weAddUncertainty').click(function() {
    $('#weAddUncertainty').hide('fast').after(form);
    $('#weUncForm').show('slow');
    $('#weUncSub').click(addUncertainty);
    return false;
  });
  
  return;
});
