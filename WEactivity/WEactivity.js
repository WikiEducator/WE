(function() {
  "use strict";

  function API(data, success, failure) {
    "use strict";
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

  window.WEactivity = function (id, user) {
    "use strict";
    var width = 920,
        height = 160,
        cellSize = 15,
        cellPos = 17,
        labelHeight = cellPos,
        labelSize = cellPos * 4;
    var day = d3.time.format("%w"),
        week = d3.time.format("%U"),
        month = d3.time.format("%m"),
        format = d3.time.format("%Y-%m-%d");

    function update(d, start) {
      var week0 = week(start);
      var color = ['#dfdfdf', '#a7c3df', '#70a7df', '#388bdf', '#0070df'];
      var rect = activity.selectAll(".day")
          .data(d)
        .enter().append("rect")
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("x", function(d) {return (week(d.d)-week0) * cellPos;})
          .attr("y", function(d) {return labelHeight + day(d.d) * cellPos;})
          .style('fill', function(d) {
              return color[Math.round(Math.min(15, d.p.length-0.1)/4)];});
      rect.append("title")
        .text(function(d) {return d.p.join("\n");});
    }

    function showActivity(id, user, start, ucstart) {
      var uc = {
        list: 'usercontribs',
        ucuser: user || wgUserName,
        uclimit: 500,
        ucprop: 'timestamp|title|flags'
      };
      if (ucstart) {
        uc.ucstart = ucstart;
      }
      API(uc, function(d) {
        var data = {};
        var i, uc, ucl, dt, idate;
        if (d && d.query && d.query.usercontribs) {
          uc = d.query.usercontribs;
          ucl = uc.length;
          for (i=0; i<ucl; i++) {
            dt = uc[i].timestamp.split('T')[0];
            if (data.hasOwnProperty(dt)) {
              data[dt].push('  ' + uc[i].title);
            } else {
              // add dt display for debugging
              data[dt] = [dt, '  ' + uc[i].title];
            }
          }
        }
        // convert to array;
        var adata = [];
        for (i in data) {
          idate = new Date(i);
          if (idate < start) {
            break;
          }
          adata.push({d: new Date(i), p: data[i]});
        }
        update(adata, start);
        if (d && d['query-continue'] && d['query-continue'].usercontribs) {
          ucstart = d['query-continue'].usercontribs.ucstart;
          if (new Date(ucstart) >= start) {
            setTimeout(function() {showActivity(id, user, start, ucstart);}, 0);
          }
        }
      });
    }

    $('#' + id + ' img').hide();

    function startDate(today) {
      var start = new Date(today.toUTCString().replace(/\d\d:.*/,
        '00:00:00 +0000'));
      start.setMonth(start.getMonth() - 6);
      start.setDate(1);
      console.log('0th day', start);
      start.setDate(start.getDate() - start.getDay());
      console.log('start', start);
      return start;
    }

    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var today = new Date();
    var start = startDate(today);

    var activity = d3.select('#' + id)
      .append('svg:svg')
      .attr('width', width)
      .attr('height', height);

    function labels(d, start) {
      var week0 = week(start);
      var monthLabels = activity.selectAll(".months")
          .data(d)
        .enter().append("text")
          .attr('class', '.months')
          .style('text-anchor', 'left')
          .attr('transform', function(d, i) {
              var firstOfMonth = new Date(start);
              return "translate(" + ((week(new Date(2013, i, 1))-week0)*cellPos) +
                ', 10)';
            })
          .text(function(d) { return d; });
    }

    labels(monthNames, start);

    showActivity(id, user, start);
  };
})();

