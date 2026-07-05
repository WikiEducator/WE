/*
 * render a (FreeMind) .mm file using Javascript/Dracula
 *
 * Copyright 2011 by Jim Tittsler <jim@onjapan.net>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

Graph.Layout.Mindmap = function(graph) {
  this.graph = graph;
  this.midx = 400;
  this.midy = 400;
  this.layout();
}
Graph.Layout.Mindmap.prototype = {
  layout: function() {
    this.layoutPrepare();
    this.layoutCalcBounds();
  },

  layoutPrepare: function() {
    var i, j;
    var mindepth = 0, maxdepth = 0;
    var atdepth = {};
    for (i in this.graph.nodes) {
      var node = this.graph.nodes[i];
      node.layoutPosX = node.dir * node.depth;
      if (node.layoutPosX < mindepth) mindepth = node.layoutPosX;
      if (node.layoutPosX > maxdepth) maxdepth = node.layoutPosX;
      if (node.layoutPosX in atdepth) {
        atdepth[node.layoutPosX]++;
      } else {
        atdepth[node.layoutPosX] = 1;
      }
    }
    for (i=0; i<=maxdepth; ++i) {
      cnt = atdepth[i];
      var dy = 1/((i === 0) ? 1 : Math.pow(2,i));
      var y = - (cnt - 1) * dy / 2;
      for (j in this.graph.nodes) {
        node = this.graph.nodes[j];
        if (node.layoutPosX == i) {
          if (node.parent === null) {
            basey = 0;
          } else {
            basey = this.graph.nodes[node.parent].layoutPosY;
          }
          node.layoutPosY = basey + y;
          y += dy;
        }
      }
    }
    for (i=-1; i>=mindepth; --i) {
      cnt = atdepth[i];
      var dy = 1 / Math.pow(2,-i);
      var y = -(cnt - 1) * dy / 2;
      for (j in this.graph.nodes) {
        node = this.graph.nodes[j];
        if (node.layoutPosX == i) {
          if (node.parent === null) {
            basey = 0;
          } else {
            basey = this.graph.nodes[node.parent].layoutPosY;
          }
          node.layoutPosY = basey + y;
          y += dy;
        }
      }
    }
  },

  layoutCalcBounds: function() {
    var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    for (i in this.graph.nodes) {
      var x = this.graph.nodes[i].layoutPosX;
      var y = this.graph.nodes[i].layoutPosY;

      if (x > maxx) maxx = x;
      if (x < minx) minx = x;
      if (y > maxy) maxy = y;
      if (y < miny) miny = y;
    }
    this.graph.layoutMinX = minx;
    this.graph.layoutMaxX = maxx;
    this.graph.layoutMinY = miny;
    this.graph.layoutMaxY = maxy;
  }
};

function weMindmap(f, divid, width, height) {
  var g = new Graph();
  var weAPI = wgServer + '/api.php';
  var n = 0;

  function bareRender(r, n) {
    var label = n.label,
        tooltip = '';
    if (label.length > 18) {
      tooltip = label;
      label = label.substr(0, 14) + '...';
      var set = r.set().push(
        r.rect(n.point[0]-20, n.point[1]-13, 40, 40).attr({stroke: '#fff'}).tooltip(r.text(n.point[0], n.point[1]+10, tooltip)))
          .push(r.text(n.point[0]+2, n.point[1]+5, label)
            .attr({'font-size': '10px'}));
    } else {
      var set = r.set().push(
        r.rect(n.point[0]-20, n.point[1]-13, 40, 40).attr({stroke: '#fff'}))
          .push(r.text(n.point[0]+2, n.point[1]+5, n.label)
            .attr({'font-size': '10px'}));
    }
    return set;
  }

  var dirs = {};
  function graphNode(n, depth) {
    var pnode = $(n).attr('ID');
    var siblings = [];
    $(n).children('node').each(function() {
      var thisnode = $(this).attr('ID');
      var position = dirs[pnode] || $(this).attr('POSITION');
      dirs[thisnode] = position;
      var dir = (position == 'right') ? 1 : -1;
      //console.log('addNode: ' + $(this).attr('TEXT') + ' depth: ' + depth + ' dir: ' + dir);
      g.addNode(thisnode, {label: $(this).attr('TEXT'), render: bareRender, depth: depth+1, dir: dir, parent: pnode, n: n++});
      g.addEdge(pnode, thisnode);
      // keep grandchildren together
      if (depth > 0) {
        //for (var i=0; i<siblings.length; i++) {
        //  g.addEdge(siblings[i], thisnode, {stroke: '#f00', hidden: true});
        //} 
        siblings.push(thisnode);
      }
      graphNode($(this), depth+1);
    });
  }

  function graphMap(xml) {
    var root = $(xml).find('map > node');
    //console.log('root:', root);
    g.addNode($(root).attr('ID'), {label: $(root).attr('TEXT'), depth: 0, dir: 0, parent: null, n: n++});
    graphNode(root, 0);

    //console.log('layout');
    var layouter = new Graph.Layout.Mindmap(g);
    layouter.layout();

    //console.log('render');
    $('#img' + divid).hide();
    var renderer = new Graph.Renderer.Raphael(divid, g, width, height);
    renderer.draw();
  }

  function fetchFile(url) {
    //console.log('fetching: ' + url);
    $.ajax( {
      url: url,
      type: 'GET',
      dataType: 'xml',
      success: function(xml) {
        //console.log('contents:');
        //console.log(xml);
        graphMap(xml);
      }
    });
  }

  function getFileURL(f) {
    $.ajax( {
      url: weAPI,
      data: {
        action: 'query',
        format: 'json',
        prop: 'imageinfo',
        iiprop: 'url',
        titles: 'File:' + f
      },
      async: true,
      dataType: 'json',
      type: 'POST',
      success: function(data) {
        if (data && 'query' in data && 'pages' in data.query) {
          for (i in data.query.pages) {
            v = data.query.pages[i].imageinfo[0].url;
            break;
          }
          fetchFile(v);
        }
      }
    });
  }

  getFileURL(f);
}

