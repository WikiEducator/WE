$(function() {
  var $ul = $('#bodyContent>ul'),
      $SCAN = $('<div id="SCANdiv"/>');

  $ul.wrap('<div class="weSCAN"/>').hide('fast');
  $ul = $ul.detach();
  $ul.children('li').each(function() {
    var $subul = $(this).find('ul').detach(),
        $children = $subul.children('li'),
        child_count = $children.length,
        $childrow = $('<div class="row"/>'),
        widths = ['100', '100', '50', '33'];
    $SCAN.append($(this).html());
    $children.each(function() {
      $childrow.append($(this).html());
    });
    $childrow.find('div').addClass('WEbox WEbox-' + widths[child_count])
      .css('padding', '0.4em 0')
      .children().wrap('<div style="text-align: center"></div>');
    $SCAN.append($childrow);
  });
  $SCAN.find('div>a').wrap('<div style="text-align: center"></div>');

  $('.weSCAN').append($SCAN).show('fast');
});
