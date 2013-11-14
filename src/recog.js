/* jshint undef: true, unused: true*//*global $, document, leap2screen, onNewFrame, onFingersSpread, Origin, PDollarRecognizer, Resample, Scale, TranslateTo, GreedyCloudMatch */
// TODO use strict

var recognizer = new PDollarRecognizer();
var circleRadius = 10;
var gestureScoreHistories = {};
$.each(recognizer.PointClouds, function(i, c) {
    gestureScoreHistories[c.Name] = [];
});
var gestureHistoryLimit = 10; // how many history items to keep per gesture
var plot = null;
var currentGesturePoints=null;

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
        c.push(gestureScoreHistories[k]);
    });
    return c;
}

function clapCircleRadius(r) {
    return Math.min(Math.max(r, 10), 150);
}

function addCircleElement(x, y, r) {
    var c = document.createElement('div');
    c.setAttribute('class', 'circle');
    r = clapCircleRadius(r);
    c.style.width=2*r+'px';
    c.style.height=2*r+'px';
    c.style.left = x-r;
    c.style.top = y-r;
    document.body.appendChild(c);
}

function clearCircles() {
    $('.circle').remove();
}

(function() {
    var c = document.createElement('div');
    c.id = 'pointer';
    c.setAttribute('class', 'pointer');
    c.style.width='10px';
    c.style.height='10px';
    document.body.appendChild(c);
})();

function addCirclesForPoints(points, scale, translate) {
    $.each(points, function(i, p) {
        addCircleElement(i,translate+p.X*scale,translate+p.Y*scale, 10);
    });
}

onNewFrame(function(tip) {
    if(tip) {
        var c = document.getElementById('pointer');
        var screenPos = leap2screen(tip);
        var x = screenPos[0];
        var y = screenPos[1];
        var height = Math.max(1, tip[2]);
        var xDif = (x-(document.body.clientWidth/2))/500 * height;
        var yDif = (y-(document.body.clientHeight/2))/500 * height;
        var radius = clapCircleRadius(tip[2]);
        c.style.boxShadow = xDif+'px '+yDif+'px '+height+'px '+height+'px rgba(25, 25, 25, .3)';
        c.style.left = x-radius;
        c.style.top = y-radius;
        c.style.width = 2*radius + 'px';
        c.style.height = 2*radius + 'px';
    }
});

onNewFrame(function(tip) {
    if (tip) {
        if(tip[2]<0) {
            if(!currentGesturePoints) {
                currentGesturePoints = [];
                clearCircles();
            }
        } else {
            if(currentGesturePoints) {
                if(currentGesturePoints.length > 10) {
                    var scores = [];
                    var normalizedPoints = TranslateTo(Scale(Resample(currentGesturePoints, 32)), Origin);
                    $.each(recognizer.PointClouds, function(i) {
                        var cloud = recognizer.PointClouds[i];
                        var score = GreedyCloudMatch(normalizedPoints, cloud);
                        scores.push({name:cloud.Name, score:score});
                        addGestureScoreToHistory(cloud.Name, score);
                    });
                    if(plot) {
                        plot.destroy();
                    }
                    plot = $.jqplot ('chartdiv', getScoreHistoriesToChart(), {
                        legend: {
                            renderer: $.jqplot.EnhancedLegendRenderer,
                            show:true,
                            labels:Object.keys(gestureScoreHistories)
                        }
                    });
                }
                currentGesturePoints = null;
            }
        }
        if(currentGesturePoints) {
            var screenPos = leap2screen(tip);
            addCircleElement(screenPos[0], screenPos[1], tip[2]);
            currentGesturePoints.push({X:Math.round(screenPos[0]), Y:Math.round(screenPos[1]), ID:1});
        }
    }
});

