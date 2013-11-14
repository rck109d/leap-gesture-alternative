//
// Startup
//
var _isDown, _points, _strokeID, _r, _g, _rc; // global variables
function onLoadEvent() {
  _points = new Array(); // point array for current stroke
  _strokeID = 0;
  //_r = new PDollarRecognizer();
  _isDown = false;
}
function getCanvasRect(canvas) {
  var w = canvas.width;
  var h = canvas.height;
  
  var cx = canvas.offsetLeft;
  var cy = canvas.offsetTop;
  while (canvas.offsetParent != null) {
    canvas = canvas.offsetParent;
    cx += canvas.offsetLeft;
    cy += canvas.offsetTop;
  }
  return {x: cx, y: cy, width: w, height: h};
}
function getScrollY() {
  var scrollY = 0;
  if (typeof(document.body.parentElement) != 'undefined'){
scrollY = document.body.parentElement.scrollTop; // IE
  } else if (typeof(window.pageYOffset) != 'undefined'){
scrollY = window.pageYOffset; // FF
  }
  return scrollY;
}
//
// Mouse Events
//
function mouseDownEvent(x, y, button) {
  document.onselectstart = function() { return false; } // disable drag-select
  document.onmousedown = function() { return false; } // disable drag-select
  if (button <= 1) {
    _isDown = true;
    x -= _rc.x;
    y -= _rc.y - getScrollY();
    if (_strokeID == 0) {// starting a new gesture 
  _points.length = 0;
  _g.clearRect(0, 0, _rc.width, _rc.height);
}
_points[_points.length] = new Point(x, y, ++_strokeID);
drawText("Recording stroke #" + _strokeID + "...");
var clr = "rgb(" + rand(0,200) + "," + rand(0,200) + "," + rand(0,200) + ")";
    _g.strokeStyle = clr;
    _g.fillStyle = clr;
    _g.fillRect(x - 4, y - 3, 9, 9);
  } else if (button == 2) {
    drawText("Recognizing gesture...");
  }
}
function mouseMoveEvent(x, y, button) {
  if (_isDown) {
    x -= _rc.x;
    y -= _rc.y - getScrollY();
    _points[_points.length] = new Point(x, y, _strokeID); // append
    drawConnectedPoint(_points.length - 2, _points.length - 1);
  }
}
function mouseUpEvent(x, y, button) {
  document.onselectstart = function() { return true; } // enable drag-select
  document.onmousedown = function() { return true; } // enable drag-select
  if (button <= 1) {
    if (_isDown) {
      _isDown = false;
      drawText("Stroke #" + _strokeID + " recorded.");
    }
  } else if (button == 2) { // segmentation with right-click 
if (_points.length >= 10) {
  var result = _r.Recognize(_points);
  drawText("Result: " + result.Name + " (" + round(result.Score,2) + ").");
} else {
  drawText("Too little input made. Please try again.");
}
_strokeID = 0; // signal to begin new gesture on next mouse-down
  }
}
function drawConnectedPoint(from, to) {
  _g.beginPath();
  _g.moveTo(_points[from].X, _points[from].Y);
  _g.lineTo(_points[to].X, _points[to].Y);
  _g.closePath();
  _g.stroke();
}
function drawText(str) {
  _g.fillStyle = "rgb(255,255,136)";
  _g.fillRect(0, 0, _rc.width, 20);
  _g.fillStyle = "rgb(0,0,255)";
  _g.fillText(str, 1, 14);
}
function rand(low, high) {
  return Math.floor((high - low + 1) * Math.random()) + low;
}
function round(n, d) { // round 'n' to 'd' decimals
  d = Math.pow(10, d);
  return Math.round(n * d) / d
}
//
// Multistroke Adding and Clearing
//
function onClickAddExisting() {
  if (_points.length >= 10) {
    var pointclouds = document.getElementById('pointclouds');
var name = pointclouds[pointclouds.selectedIndex].value;
var num = _r.AddGesture(name, _points);
drawText("\"" + name + "\" added. Number of \"" + name + "\"s defined: " + num + ".");
_strokeID = 0; // signal to begin new gesture on next mouse-down
  }
}
function onClickAddCustom() {
  var name = document.getElementById('custom').value;
  if (_points.length >= 10 && name.length > 0) {
    var num = _r.AddGesture(name, _points);
    drawText("\"" + name + "\" added. Number of \"" + name + "\"s defined: " + num + ".");
_strokeID = 0; // signal to begin new gesture on next mouse-down
  }
}
function onClickCustom() {
  document.getElementById('custom').select();
}
function onClickDelete() {
  var num = _r.DeleteUserGestures(); // deletes any user-defined templates
  alert("All user-defined gestures have been deleted. Only the 1 predefined gesture remains for each of the " + num + " types.");
  _strokeID = 0; // signal to begin new gesture on next mouse-down
}
function onClickClearStrokes() {
  _points.length = 0;
  _strokeID = 0;
  _g.clearRect(0, 0, _rc.width, _rc.height);
  drawText("Canvas cleared.");
}

//var recognizer = new NDollarRecognizer(true);
var recognizer = new PDollarRecognizer();
var windowLimit = 100;
var recogInterval = windowLimit / 40;
var gestureScoreBar = 0.0;
var circleRadius = 10;
var leapOn = true;
var gestureScoreHistories = {}
$.each(recognizer.PointClouds, function(i, c) {
    gestureScoreHistories[c.Name] = [];
});
var gestureHistoryLimit = 20; // how many history items to keep per gesture
var plot = null;
var takingGesture = true;


function addGestureScoreToHistory(name, score) {
    var h = gestureScoreHistories[name];
    h.push(score);
    if(h.length > gestureHistoryLimit) {
        h.shift();
    }
}

function getScoreHistoriesToChart() {
    var c=[];
    Object.keys(gestureScoreHistories).forEach(function(k){
        c.push(gestureScoreHistories[k])
    });
    return c;
}


(function() {
    var c = document.createElement('div');
    c.id = 'pointer';
    c.setAttribute('class', 'circle');
    c.style.width=circleRadius+'px';
    c.style.height=circleRadius+'px';
    c.style.backgroundColor="#ff0000";
    document.body.appendChild(c);
    for(var i=0;i<windowLimit;i++) {
        c = document.createElement('div');
        c.id = 'circle_'+i;
        c.setAttribute('class', 'circle');
        c.style.width=circleRadius+'px';
        c.style.height=circleRadius+'px';
        document.body.appendChild(c);
    }
    var buttonHandlers = {
        'buttonLeapOn': function() {
            leapOn = true;
            $('#buttonLeapOn').prop('disabled', true);
            $('#buttonLeapOff').prop('disabled', false);
        },
        'buttonLeapOff': function() {
            leapOn = false;
            $('#buttonLeapOn').prop('disabled', false);
            $('#buttonLeapOff').prop('disabled', true);
        }
    }
    Object.keys(buttonHandlers).forEach(function(key) {
        $('#'+key).click(buttonHandlers[key]);
    })
})();

function positionCirclesForPoints(points, scale, translate) {
    for(var i=0; i<windowLimit; i++) {
        positionCircle(i,0,0);
    }
    $.each(points, function(i, p) {
        positionCircle(i,translate+p.X*scale,translate+p.Y*scale);
    });
}

function positionCircle(id, x, y) {
    var c = document.getElementById('circle_'+id);
    c.style.left = x-circleRadius;
    c.style.top = y-circleRadius;
}

function gConsoleAppend(str) {
    var gConsole = document.getElementById('gestureConsole');
    gConsole.value += '\r' + str;
    gConsole.scrollTop = gConsole.scrollHeight;
}

onNewFrame(function(tip) {
    if(tip) {
        var c = document.getElementById('pointer');
        var screenPos = leap2screen(tip);
        c.style.left = screenPos[0]-circleRadius;
        c.style.top = screenPos[1]-circleRadius;
    }
})


var recog = function recog(tip) {
    if(!leapOn || !takingGesture) {
        return
    }

    if (tip) {
        var x=Math.round(tip[0]);
        var y=Math.round(tip[1]);
        var z=Math.round(tip[2]);
        var screenPos = leap2screen(tip);
        positionCircle(recog.frame!=null?(recog.frame++)%windowLimit:recog.frame=0, screenPos[0], screenPos[1]);
        var toPush = {X:Math.round(screenPos[0]), Y:Math.round(screenPos[1]), ID:1};
        $('#toPush').html(JSON.stringify(toPush));
        recog.window.push(toPush);
        if(recog.window.length > windowLimit) {
            recog.window.shift();
            if(recog.sinceLastRecog === undefined) {
                recog.sinceLastRecog = 0;
            }
            recog.sinceLastRecog++;
            if(recog.sinceLastRecog > recogInterval) {
                recog.sinceLastRecog = 0;
                //var result = recognizer.Recognize([recog.window.slice(0)], true, false, true); //ndollar
                
                var scores = [];
                $.each(recognizer.PointClouds, function(i,p) {
                    var cloud = recognizer.PointClouds[i];
                    var score = GreedyCloudMatch(TranslateTo(Scale(Resample(recog.window.slice(0), 32)), Origin), cloud);
                    scores.push({name:cloud.Name, score:score});
                    addGestureScoreToHistory(cloud.Name, score);
                });
                //gConsoleAppend(JSON.stringify(scores));
                
                
                if(plot != null) {
                    plot.destroy();
                }
                plot = $.jqplot ('chartdiv', getScoreHistoriesToChart(), {
                    legend: {
                        renderer: $.jqplot.EnhancedLegendRenderer,
                        show:true,
                        labels:Object.keys(gestureScoreHistories)
                    }
                });
                
                /*else {
                    $.each(getScoreHistoriesToChart(), function(i, x) {
                        plot.series[i].data = x;
                    });
                    plot.replot();
                }*/
                
                /*
                var result = recognizer.Recognize(recog.window.slice(0));
                if(result.Score > gestureScoreBar) {
                    var gConsole = document.getElementById('gestureConsole');
                    gConsole.value +='\r'+JSON.stringify(result);
                    gConsole.scrollTop = gConsole.scrollHeight;
                    //recog.window = [];
                }
                */
            }
        }
    }
};
recog.window = [];


onNewFrame(recog);

