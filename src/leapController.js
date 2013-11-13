/****************************************************************
    Options - arbitrary values that can be changed at any time
****************************************************************/
var leapControllerDelay = 8; /// The delay between frames in miliseconds
var inr = 0, /// inner radius of cursor
    outr = 12; /// outer radius of cursor
var timerDuration = 1500; /// time in ms for the timer to count down
var leapWidth = 400, /// the width in mm of the rect where Leap will read in real space
    leapHeight = 300, /// the height in mm of the rect where Leap will read in real space
    leapBottomHeight = leapHeight / 3; /// the height off the leap bottom in mm of the rect where Leap will read in real space
var gestureDebounceDelay = 250; // milliseconds between allowed same gestures

/*****************************************************************
    NOT options; don't change, unless you're a bad enough dude.
*****************************************************************/
var control = new Leap.Controller({ /// The controller for the Leap Service
    host: '127.0.0.1',
    port: 6437,
    enableGestures: true,
    frameEventName: 'animationFrame'
});
var svg = null; /// svg object
var resetTimeoutInit =  5 * 1000 / leapControllerDelay; // about 5 seconds 
var resetTimeoutRemaining = resetTimeoutInit; /// number of leap frames having no points before reset

var otherClickableElements = { /// jQuery selectors of elements other than beds that are clickable with the leap mapped to their click handlers
    '#capacityWidget' : function(element) {
        $(element).click();
    },
    '.resultsShowHide': function(element) {
        $(element).click();
    }
};

var displayMetrics = { // an object which provides window metrics and caches responses that are less than 1 second old
    stateAge: null,
    width: null,
    height: null,
    svgCTM: null,
    svgCTMinverse: null,
    get: function() {
        var now = Date.now();
        if(this.stateAge == null || now > this.stateAge + 1000) {
            this.stateAge = now;
            this.width = document.body.clientWidth
            this.height = document.body.clientHeight
        }
        return {
            windowBounds: [this.width, this.height]
        };
    }
};

function svg2screen(svg) {
    var p2 = document.querySelector('svg').createSVGPoint();
    p2.x = svg[0];
    p2.y = svg[1];
    var p = p2.matrixTransform(displayMetrics.get().svgCTM);
    return [p.x, p.y];
}

function screen2svg(screen) {
    var p2 = document.querySelector('svg').createSVGPoint();
    p2.x = screen[0];
    p2.y = screen[1];
    var p = p2.matrixTransform(displayMetrics.get().svgCTMinverse);
    return [p.x, p.y];
}

function leap2screen(leap) {
    var xRatio = 0.5 + leap[0] / leapWidth;
    var yRatio = (leap[1] - leapBottomHeight) / leapHeight;
    var wb = displayMetrics.get().windowBounds;
    var sx = wb[0] * xRatio;
    var sy = wb[1] * (1 - yRatio); // leap y goes up, screen y goes down
    return [sx, sy];
}

function screen2leap(screen) {
    var wb = displayMetrics.get().windowBounds;
    var xRatio = screen[0] / wb[0];
    var yRatio = screen[1] / wb[1]; 
    var lx = leapWidth * (xRatio - 0.5);
    var ly = leapHeight * (1 - yRatio) + leapBottomHeight; // leap y goes up, screen y goes down
    return [lx, ly];
}

function onNewFrame(f) {
    if(onNewFrame.handlers === undefined) {
        onNewFrame.handlers = [];
    }
    onNewFrame.handlers.push(f);
}

/** Called every frame for leap motion */
function grabNewFrame() {
    var frame = control.frame();
    var oldestPointable = null;
    
    frame.pointables.forEach(function(pointable) {
        if (pointable != null) {
            var tip = pointable.stabilizedTipPosition.slice(); /// make a copy of tipPosition
            if(oldestPointable == null || oldestPointable.timeVisible < pointable.timeVisible) {
                oldestPointable = pointable;
            }
        }
    });
    
    if(onNewFrame.handlers) {
        onNewFrame.handlers.forEach(function(handler) {
            handler.call(window, oldestPointable?oldestPointable.stabilizedTipPosition:null);
        });
    }
}

control.connect();
setInterval(grabNewFrame, leapControllerDelay);
