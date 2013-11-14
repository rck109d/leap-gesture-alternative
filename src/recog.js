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

function addCircleElement(x, y) {
    var c = document.createElement('div');
    c.setAttribute('class', 'circle');
    c.style.width=circleRadius+'px';
    c.style.height=circleRadius+'px';
    c.style.left = x-circleRadius;
    c.style.top = y-circleRadius;
    document.body.appendChild(c);
}

function clearCircles() {
    $('.circle').remove();
}

(function() {
    var c = document.createElement('div');
    c.id = 'pointer';
    c.setAttribute('class', 'pointer');
    c.style.width=circleRadius+'px';
    c.style.height=circleRadius+'px';
    c.style.backgroundColor="#ff0000";
    document.body.appendChild(c);
})();

function addCirclesForPoints(points, scale, translate) {
    $.each(points, function(i, p) {
        addCircleElement(i,translate+p.X*scale,translate+p.Y*scale);
    });
}

onNewFrame(function(tip) {
    if(tip) {
        var c = document.getElementById('pointer');
        var screenPos = leap2screen(tip);
        c.style.left = screenPos[0]-circleRadius;
        c.style.top = screenPos[1]-circleRadius;
    }
});

onFingersSpread(function onSpread(bool) {
    console.log('onSpread ' + bool)
    if(bool &&!currentGesturePoints) {
        currentGesturePoints = [];
        clearCircles();
    } else {
        if(currentGesturePoints && currentGesturePoints.length>10) {
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
});

onNewFrame(function(tip) {
    if (tip && currentGesturePoints) {
        var screenPos = leap2screen(tip);
        addCircleElement(screenPos[0], screenPos[1]);
        currentGesturePoints.push({X:Math.round(screenPos[0]), Y:Math.round(screenPos[1]), ID:1});
    }
});

