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
    var day = d3.time.format("%w");

    function week_diff(d, start) {
      var x = Math.floor((d-start)/(7*24*60*60*1000));
      return x;
    }

    function update(d, start) {
      var color = ['#dfdfdf', '#a7c3df', '#70a7df', '#388bdf', '#0070df'];
      var rect = activity.selectAll(".day")
          .data(d)
        .enter().append("rect")
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("x", function(d) {return week_diff(d.d, start) * cellPos;})
          .attr("y", function(d) {return labelHeight + day(d.d) * cellPos;})
          .style('fill', function(d) {
              return color[Math.round(Math.min(15, d.p.length-0.1)/4)];});
      rect.append("title")
        .text(function(d) {return d.p.join("\n");});
    }

    function tsToDateString(ts) {
      /* don't rely on ISO-8601 support from ECMAScript 5 */
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          mno = parseInt(ts.slice(4, 6), 10);
      return ts.slice(6, 8) + ' ' + months[mno-1] + ' ' +
        ts.slice(0, 4);
    }

    function showActivity(id, user, start, dcontinue) {
      var uc = {
        list: 'usercontribs',
        ucuser: user || wgUserName,
        uclimit: 500,
        ucprop: 'timestamp|title|flags',
        continue: ''
      };
      if (dcontinue) {
        uc.continue = dcontinue.continue;
        uc.uccontinue = dcontinue.uccontinue;
      }
      API(uc, function(d) {
        var data = {};
        var i, uc, ucl, dt, idate, cdate;
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
          idate = new Date(i + 'T00:00:00.000Z');
          if (idate < start) {
            break;
          }
          adata.push({d: idate, p: data[i]});
        }
        update(adata, start);
        if (d && d.continue ) {
          dcontinue = d.continue;
          cdate = new Date(tsToDateString(dcontinue.uccontinue.split('|')[0]));
          if (cdate >= start) {
            setTimeout(function() {showActivity(id, user, start, dcontinue);}, 0);
          }
        }
      });
    }

    $('#' + id + ' img').hide();

    // start 6 months in the past
    //   ("floor"ed to week that contains start of month)
    function startDate(today) {
      var start = new Date(today.toUTCString().replace(/\d\d:.*/,
        '00:00:00 +0000'));
      start.setMonth(start.getMonth() - 6);
      start.setDate(1);
      start.setDate(start.getDate() - start.getDay());
      return start;
    }

    var today = new Date();
    var start = startDate(today);

    var activity = d3.select('#' + id)
      .append('svg:svg')
      .attr('width', width)
      .attr('height', height);

    function labels(start, today) {
      var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var labelmo = new Date(start);
      // get the starting month, which is "next" month unless day==1
      if (labelmo.getDate() > 1) {
        labelmo.setDate(1);
        labelmo.setMonth(labelmo.getMonth() + 1);
      }
      do {
        activity.append("text")
          .attr('class', '.months')
          .style('text-anchor', 'left')
          .attr('transform', "translate(" + (week_diff(labelmo, start) * cellPos) +
                ', 10)')
          .text(monthNames[labelmo.getMonth()]);
          labelmo.setMonth(labelmo.getMonth() + 1);
      } while (labelmo <= today);
    }

    labels(start, today);

    showActivity(id, user, start);
  };
})();

