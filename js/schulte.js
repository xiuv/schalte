const PB_KEY = 'schulte-pbs';

function Cell(number) {
    this.number = number;
    this.symbol = number;
    this.group = 0;
    this.traced = false;
    this.rightClick = false;
    this.cssClasses = {
        'rotate-90': false,
        'rotate-180': false,
        'rotate-270': false,
        'spin-right': false,
        'spin-left': false
    };
    this.isReact = false;
    this.colorStyle = 'color: white';
}

function Group (size) {
    this.size = size;
    this.currNum = 1;
    this.inverted = false;
    this.divergent = false;
}
Group.prototype.firstNumber = function () {
    if (this.inverted && !this.divergent) {
        return this.size;
    } else if (this.divergent && !this.inverted) {
        return Math.floor(this.size / 2);
    } else {
        return 1;
    }
}
Group.prototype.lastNumber = function () {
    if (!this.inverted) {
        return this.size;
    } else if (this.divergent) {
        return Math.floor(this.size / 2) + 1;
    } else {
        return 1;
    }
}
Group.prototype.nextNumber = function (currNum=this.currNum) {
    if (!this.divergent && !this.inverted) {
        return currNum + 1;
    } else if (!this.divergent) {
        return currNum - 1;
    } else {
        var h = Math.floor(this.size / 2);
        if (this.inverted) {
            if (currNum <= h) {
                return this.size - currNum + 1;
            } else { // currNum > h
                return 2 + (this.size - currNum);
            }
        } else {
            var evenSize = 2 * h;
            if (currNum == evenSize) {
                return evenSize + 1;
            } else if (currNum <= h) {
                return evenSize - currNum + 1;
            } else {
                return evenSize - currNum;
            }
        }
    }
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Click(x, y, correct) {
    this.x = x;
    this.y = y;
    this.correct = correct;
}

function ClickStats(groupN, number, time, err, inverse, divergent) {
    this.groupN = groupN;
    this.number = number;
    this.time = time;
    this.err = err;
    this.inverse = inverse;
    this.divergent = divergent;
}

var timeString = function(diff) {
    var millis = Math.floor(diff % 1000);
    diff = diff / 1000;
    var seconds = Math.floor(diff % 60);
    diff = diff / 60;
    var minutes = Math.floor(diff);

    return minutes + ':' +
           ("0" + seconds).slice (-2) + '.' +
           ("00" + millis).slice (-3);
};

var appData = {
    gridSize: 5,
    gridRange: [],
    cells: [],      // array of Cell

    rounds: 1,
    roundBreaks: true,
    showRounds: true,
    showTransitions: true,
    betweenRounds: false,

    personalBests: {},

    groupCount: 1,
    inverseCount: false,
    divergentCount: false,
    variousCounts: false,
    collateGroups: false,
    originalColors: false,
    spinTable: false,
    spinTableSpeed: 'speed1',
    noErrors: false,
    useClickSound: false,
    startOnClick: false,
    hasClickedYet: false,
    timerMode: false,
    timerMinutes: 5,
    frenzyCount: 3,
    currGroup: 0,
    colorGroups: false,
    groupType: 0,
    groups: [], // array of Group: setups in makeGridCells() method

    groupColorStyles: ['color: green', 'color: red', 'color: blue', 'color: magenta', 'color: brown'],

    gameStarted: false,

    hoverIndex: -1,
    clickIndex: -1,
    correctIndex: -1,

    clearCorrect: true,
    showHover: true,
    showClickResult: true,
    showClickAnimation: true,
    showTrace: false,
    showCenterDot: false,
    shuffleSymbols: false,
    turnSymbols: false,
    spinSymbols: false,
    frenzyMode: false,
    goalList: [[0, 1]],
    hideReact: false,
    hoverMode: false,
    blindMode: false,
    flashlightMode: false,
    mathMode: false,
    lettersMode: false,
    leftRightClick: false,
    lastClickButton: 0,
    tableSize: 450,
    fontSize: 70,
    nOffset: 0,

    mouseTracking: false,
    mouseMoves: [],   // array of Point
    mouseClicks: [],  // array of Click

    rowHeight: '20%',
    colWidth: '20%',
    tableWidth: 'calc(100vw - 100px)',
    tableHeight: 'calc(100vh - 100px)',
    cellFontSize: 'calc(8vmin - 8px)',
    selectTimeOut: 500,
    selectedTimerId: -1,
    gameTimerId: -1,

    dialogShowed: false,
    settingsTabVisible: true,
    statsTabVisible: false,
    mousemapTabVisible: false,
    clickSound: false,

    stats: {
        startTime: new Date(),
        stopTime: new Date(),
        lastTime: new Date(),
        correctClicks: 0,
        wrongClicks: 0,
        clicks: [], // array of ClickStats
        rounds: [],
        clear: function () {
            this.startTime = new Date();
            this.stopTime = new Date();
            this.lastTime = new Date();
            this.correctClicks = 0;
            this.wrongClicks = 0;
            this.clicks = [];
            this.rounds = [];
        },
        addClick: function (groupN, number, err, inverse, divergent) {
            var currTime = new Date();
            var time = ((currTime - this.lastTime) / 1000).toFixed(2);
            this.clicks.push(new ClickStats(groupN, number, time, err, inverse, divergent));
            this.lastTime = currTime;
        },
        resultTimeString: function () {
            const rounds = this.rounds.length;
            if (rounds < appData.rounds) return timeString(0);
            const total = this.totalTime();
            const time = timeString(total);

            if (rounds > 1) {
                const best = timeString(this.bestRoundTime());
                const avg = timeString(total / rounds);
                return `${time} (${avg} average, ${best} best)`;
            }

            return time;
        },
        totalCorrectClicks: function() {
            return this.correctClicks +
                this.rounds.reduce((a, r) => a + r.correctClicks, 0);
        },
        totalWrongClicks: function() {
            return this.wrongClicks +
                this.rounds.reduce((a, r) => a + r.wrongClicks, 0);
        },
        endRound: function() {
            const now = new Date();
            this.rounds.push({
                startTime: this.startTime,
                stopTime: now,
                clicks: this.clicks,
                correctClicks: this.correctClicks,
                wrongClicks: this.wrongClicks,
            });
            this.startTime = now;
            this.lastTime = now;
            this.clicks = [];
            this.correctClicks = 0;
            this.wrongClicks = 0;
        },
        roundTime: function(round) {
            const stat = this.rounds[round - 1];
            return stat ? stat.stopTime - stat.startTime : 0;
        },
        roundClicks: function(round) {
            const stat = this.rounds[round - 1];
            return stat ? stat.clicks : [];
        },
        bestRoundTime: function() {
            var result = Infinity;
            for (const round of this.rounds) {
                result = Math.min(result, round.stopTime - round.startTime);
            }
            return result;
        },
        roundTimeString: function(round) {
            return timeString(this.roundTime(round));
        },
        totalTime: function() {
            var result = 0;
            for (var i = 1; i <= this.rounds.length; i++) {
                result += this.roundTime(i);
            }
            return result;
        }
    }
};

Vue.directive('focus', {                   // https://jsfiddle.net/LukaszWiktor/cap43pdn/
    inserted: function (el) {
        el.focus();
    },
    update: function (el) {
        Vue.nextTick(function () {
            el.focus();
        })
    }
});

vueApp = new Vue({
    el: '#app',
    data: appData,
    created: function () {
        this.initGame();
        this.clickSound = new Audio("js/bep.mp3");
        appData.personalBests =
            JSON.parse(localStorage.getItem(PB_KEY)) || {};
    },
    mounted: function () {
        this.execDialog('settings');
    },
    updated: function () {
        if (this.dialogShowed && this.mousemapTabVisible) {
            this.drawMousemap();
        }
        if (this.dialogShowed && this.statsTabVisible) {
            this.drawRoundGraph();
        }
    },
    watch: {
        gridSize: function (val) {
            if (typeof(val) === 'string') {
                this.gridSize = parseInt(val); // recursion !!!
                return;
            }
            this.rowHeight = 100 / val + '%';
            this.colWidth = 100 / val + '%';

            this.initGame();
        },
        rounds: function(val) {
            if (typeof(val) === 'string') {
                val = parseInt(val);
            }

            this.initGame();
        },
        groupType: function (val) {
            if (typeof(val) === 'string') {
                val = parseInt(val);
            }
            if (val == 0) {
                this.groupCount = 1;
                this.colorGroups = false;
            } else {
                this.groupCount = val;
                this.colorGroups = true;
            }
            this.initGame();
        },
        inverseCount: function () {
            this.initGame();
        },
        divergentCount: function () {
            this.initGame();
        },
        variousCounts: function () {
            this.initGame();
        },
        collateGroups: function () {
            this.initGame();
        },
        originalColors: function () {
            this.initGame();
        },
        clearCorrect: function () {
            this.initGame();
        },
        spinSymbols: function () {
            this.updateSymbolSpins();
        },
        turnSymbols: function () {
            this.updateSymbolTurns();
        },
        frenzyMode: function () {
            this.initGame();
        },
        blindMode: function () {
            this.initGame();
        },
        hideReact: function () {
            this.initGame();
        },
        hoverMode: function () {
            this.initGame();
        },
        spinTable: function() {
            this.initGame();
        },
        tableSize: function() {
            setTimeout(() => document.getElementById('tableSize').focus(), 0);
        },
        fontSize: function() {
            setTimeout(() => document.getElementById('fontSize').focus(), 0);
        },
        nOffset: function() {
            setTimeout(() => document.getElementById('nOffset').focus(), 0);
        },
    },
    computed: {
        clickedCell: function () {
            return this.clickIndex;
        },
        hoveredCell: {
            get: function () {
                return this.hoverIndex;
            },
            set: function (cellIdx) {
                this.hoverIndex = cellIdx;
            }
        }
    },
    methods: {
        initGame: function () {
            this.gameStarted = false;
            this.initTable();
            this.stats.clear();
            this.mouseMoves.length = 0;
            this.mouseClicks.length = 0;
            this.mouseTracking = false;
            this.setTableMargin(50);
            this.hasClickedYet = false;
        },
        initTable: function () {
            this.clearIndexes();
            this.currGroup = 0;
            this.makeGridCells();
            this.shuffleCells();
            this.updateSymbolTurns();
            this.updateSymbolSpins();
            this.update69Underline();
            this.updateColorStyles();
        },
        startGame: function () {
            this.initGame();
            if (this.timerMode) {
                clearTimeout(this.gameTimerId);
                this.gameTimerId = setTimeout(this.gameTimerOut, this.timerMinutes * 60 * 1000);
            }
            this.startMouseTracking();
            this.gameStarted = true;
        },
        setTableMargin: function(margin) {
            document.getElementsByTagName('body')[0].style.margin = `${margin}px`;
            this.tableWidth = parseInt(this.tableSize) + "px";
            this.tableHeight = parseInt(this.tableSize) + "px";
            this.cellFontSize = (parseInt(this.tableSize) * this.fontSize / this.gridSize / 133) + "px";
        },
        breakBetweenRounds: function() {
            this.stats.stopTime = new Date();
            this.stats.endRound();
            this.betweenRounds = true;
            this.stopMouseTracking();
            for (var i = 0; i < this.cells.length; i++) {
                this.cells[i].symbol = '';
            }
        },
        killResultAnimations: function() {
            this.showTransitions = false;
            setTimeout(() => this.showTransitions = true, 0);
        },
        startNextRound: function() {
            this.initTable();
            this.killResultAnimations();
            this.stats.startTime = new Date();
            this.stats.lastTime = this.stats.startTime;
            this.hasClickedYet = false;
            this.betweenRounds = false;
            this.restartMouseTracking();
        },
        currentRoundNumber: function() {
            return this.stats.rounds.length +
                (this.betweenRounds ? 0 : 1);
        },
        stopGame: function () {
            this.clearIndexes();
            clearTimeout(this.selectedTimerId);
            this.gameStarted = false;
            this.stopMouseTracking();
        },
        updatePB: function() {
            const time = this.stats.totalTime();
            const category = this.category();
            const currentPB = this.personalBests[category];
            if (!currentPB || currentPB > time) {
                this.personalBests[category] = time;
                localStorage.setItem(
                    PB_KEY,
                    JSON.stringify(this.personalBests),
                );
            }
        },
        pbTimeString: function() {
            const pb = this.personalBests[this.category()];
            return pb ? timeString(pb) : '';
        },
        clearIndexes: function () {
            this.hoverIndex = -1;
            this.clickIndex = -1;
            this.correctIndex = -1;
        },
        setHoveredCell: function (cellIdx, event) {
            this.hoveredCell = cellIdx;
            if (this.gameStarted && this.hoverMode) {
                this.clickIndex = cellIdx;
                if (this.isCellCorrect(this.clickIndex)) {
                    this.nextTurn();
                }
            }
        },
        setClickedCell: function (cellIdx, event) {
            if (this.leftRightClick) {
                this.lastClickButton = event.button;
            } else if (event.button != 0) return;
            if (this.betweenRounds) return;
            if (this.gameStarted) {
                if (this.startOnClick && !this.hasClickedYet) {
                    this.stats.startTime = new Date();
                    this.hasClickedYet = true;
                }
                this.clickIndex = cellIdx;
                if (this.showClickResult) {
                    if (this.showClickAnimation) {
                        clearTimeout(this.selectedTimerId);
                    }
                    this.showClickAnimation = true;
                    this.selectedTimerId = setTimeout(this.hideSelect, this.selectTimeOut);
                } else {
                    this.showClickAnimation = false;
                }

                // append mouseClick
                if (this.mouseTracking) {
                    let shiftX = (window.innerWidth - this.tableWidth) / 2;
                    let shiftY = (window.innerHeight - this.tableHeight) / 2;
                    let nx = (event.clientX - shiftX); 
                    let ny = (event.clientY - shiftY);
                    this.mouseClicks.push(
                        new Click(nx, ny, this.isCellCorrect(this.clickIndex))
                    );
                }

                this.nextTurn();
            }
        },
        nextTurn: function () {
            if (this.clickIndex >= 0 && this.clickIndex < this.cells.length) {
                let correctClick = this.isCellCorrect(this.clickIndex);
                if (this.leftRightClick) {
                    if ((this.cells[this.clickIndex].rightClick && this.lastClickButton != 2) || (!this.cells[this.clickIndex].rightClick && this.lastClickButton != 0)) correctClick = false;
                }
                
                if (correctClick) {
                    if (this.clickSound && this.useClickSound) {
                        // play click sound and copy so they can overlap
                        newBoop = this.clickSound.cloneNode();
                        newBoop.play();
                        newBoop = null;
                    }
                    this.stats.correctClicks ++;
                    this.stats.addClick(this.currGroup, this.cells[this.clickIndex].number, false, this.groups[this.currGroup].inverted, this.groups[this.currGroup].divergent);
                    this.cells[this.clickIndex].traced = true;
                    if (this.clearCorrect) {
                        this.cells[this.clickIndex].symbol = '';
                    }
                    if (this.frenzyMode) {
                        this.cells[this.clickIndex].symbol = '';
                        if (this.frenzyCount == 1) {
                            this.cells[this.clickIndex].isReact = false;
                        }
                        var nextGoal = Math.min(this.cells.length - 1, (this.stats.correctClicks + parseInt(this.frenzyCount) - 1));
                        for (var i=0; i<this.cells.length; i++) {
                            if (this.cells[i].group == this.goalList[nextGoal][0] &&
                                this.cells[i].number == this.goalList[nextGoal][1]) {
                                if (!(this.frenzyCount == 1 && this.hideReact)) {
                                    this.cells[i].symbol = '' + this.cells[i].number;
                                }
                                if (this.frenzyCount == 1) {
                                    this.cells[i].isReact = true;
                                }
                            }
                        }
                    }
                    if (this.blindMode) {
                        if (this.stats.correctClicks == 1) {
                            for (var i = 0; i < this.cells.length; i++) {
                                this.cells[i].blindSymbol = this.cells[i].symbol;
                                this.cells[i].symbol = '';
                            }
                        }
                    }
                    if (this.shuffleSymbols) {
                        this.shuffleCells();
                        this.correctIndex = this.indexOfCorrectCell();
                        this.clickIndex = this.correctIndex;
                    } else {
                        this.correctIndex = this.clickIndex;
                    }

                    if (this.timerMode) {
                        if (this.stats.correctClicks > 0 && this.stats.correctClicks % this.cells.length === 0) {
                            this.initTable(); // jump to next table
                        } else {
                            this.nextNum();
                        }
                    } else {
                        if (this.stats.correctClicks === this.cells.length) {
                            if (this.currentRoundNumber() >= this.rounds) {
                                this.stats.endRound();
                                this.stopGame();
                                this.updatePB();
                                this.execDialog('stats');
                            } else {
                                this.breakBetweenRounds();
                                if (!this.roundBreaks) {
                                    this.startNextRound();
                                }
                            }
                        } else {
                            this.nextNum();
                        }
                    }
                } else {
                    if (this.noErrors) {
                        return this.execDialog('settings');
                    }
                    if (this.blindMode && this.stats.correctClicks >= 1 && !this.cells[this.clickIndex].traced) {
                        // unclear this cell, but add 10 seconds
                        this.cells[this.clickIndex].symbol = this.cells[this.clickIndex].blindSymbol + "";
                        this.stats.startTime -= 10000;
                    }
                    this.stats.wrongClicks ++;
                    this.stats.addClick(this.currGroup, this.cells[this.clickIndex].number, true, this.groups[this.currGroup].inverted, this.groups[this.currGroup].divergent);
                    this.correctIndex = -1;
                }
            }
        },
        isCellCorrect: function (cellIdx) {
            return (this.cells[cellIdx].group === this.currGroup) &&
                   (this.cells[cellIdx].number === this.groups[this.currGroup].currNum);
        },
        indexOfCorrectCell: function () {
            var index = -1;
            for (var i = 0; i < this.cells.length; i++) {
                if (this.isCellCorrect(i)) {
                    index = i;
                    break;
                }
            }
            return index;
        },
        indexOfCellByNumber: function (number) {
            var index = -1;
            for (var i = 0; i < this.cells.length; i++) {
                if (this.cells[i].number === number) {
                    index = i;
                    break;
                }
            }
            return index;
        },
        nextNum: function () {
            var isLast = (this.groups[this.currGroup].lastNumber() == this.groups[this.currGroup].currNum);
            this.groups[this.currGroup].currNum = this.groups[this.currGroup].nextNumber();

            if (isLast || this.collateGroups) {
                this.nextGroup();
            }
        },
        nextGroup: function () {
            this.currGroup = (this.currGroup + 1) % this.groupCount; // round it
        },
        groupRange: function (groupIdx) {
            if (groupIdx >= 0 && groupIdx < this.groups.length) {
                if (this.groups[groupIdx].divergent) {
                    var h = Math.floor(this.groups[groupIdx].size / 2);
                    if (this.groups[groupIdx].inverted) {
                        return '1&rarr;|' + '&larr;' +  this.groups[groupIdx].size;
                    } else {
                        return '&larr;' + h + '|' + (h + 1) + '&rarr;';
                    }
                } else {
                    if (this.groups[groupIdx].inverted) {
                        return this.groups[groupIdx].size + '&rarr;1';
                    } else {
                        return '1&rarr;'+ this.groups[groupIdx].size;
                    }
                }
            }
            return '?..?';
        },
        tracedCell: function (cellIdx) {
            return this.cells[cellIdx].traced;
        },
        makeRange: function (begin, end) {
            //range = Array.from({length: val}, (v, k) => k);
            var range = [];
            for (var i = begin; i <= end; i++) {
                range.push(i);
            }
            return range;
        },
        makeGridCells: function () {
            var g, i;
            this.groups.length = 0;
            var cellCount = this.gridSize * this.gridSize;
            this.gridRange = this.makeRange(0, this.gridSize - 1);
            var numsInGroup = Math.floor(cellCount / this.groupCount);
            for (g = 0; g < this.groupCount; g ++) {
                this.groups.push(new Group(numsInGroup));
            }
            for (var i = 0; i < cellCount % this.groupCount; i++) {
                this.groups[i].size++;
            }

            if (this.variousCounts) {
                var various = [ {divergent: false, inverted: false},
                                {divergent: false, inverted: true},
                                {divergent: true,  inverted: false},
                                {divergent: true,  inverted: true}
                ];
                for (g = 0; g < this.groupCount; g++) {
                    this.groups[g].inverted = various[g%4].inverted;
                    this.groups[g].divergent = various[g%4].divergent;
                }
            } else {
                for (g = 0; g < this.groupCount; g++) {
                    this.groups[g].divergent = this.divergentCount;
                    this.groups[g].inverted = this.inverseCount;
                }
            }
            for (g = 0; g < this.groupCount; g++) {
                this.groups[g].currNum = this.groups[g].firstNumber();
            }

            var range = [];
            var cell = null;
            for (g = 0; g < this.groupCount; g ++) {
                for (i = 1; i <= this.groups[g].size; i++) {
                    cell = new Cell(i);
                    cell.group = g;
                    if (!isNaN(parseInt(this.nOffset))) {
                        cell.symbol = (cell.number + parseInt(this.nOffset)) + "";
                    }
                    if (this.colorGroups) {
                        cell.colorStyle = this.groupColorStyles[g];
                    };
                    if (this.leftRightClick) {
                        cell.rightClick = (Math.random() > 0.5);
                    }
                    range.push(cell);
                }
            }
            this.cells = range;

            if (this.frenzyMode) {
                // generate goal list
                this.goalList = [[0, this.groups[0].currNum]];
                var groupNums = [];
                for (g=0; g<this.groupCount; g++) {
                    groupNums[g] = this.groups[g].currNum;
                }
                for (i=0; i<(this.gridSize * this.gridSize) - 1; i++) {
                    // code to compute next goal - taken from nextNum() and nextGroup()
                    var thisGroup = this.goalList[i][0], thisNum = this.goalList[i][1];
                    var isLast = (this.groups[thisGroup].lastNumber() == thisNum);
                    groupNums[thisGroup] = this.groups[thisGroup].nextNumber(thisNum);
                    if (isLast || this.collateGroups) {
                        thisGroup = (thisGroup + 1) % this.groupCount;
                    }
                    this.goalList.push([thisGroup, groupNums[thisGroup]]);
                }

                // clear symbols
                for (i=0; i<cellCount; i++) {
                    this.cells[i].symbol = '';
                }

                // set first few symbols
                for (i=0; i<this.frenzyCount; i++) {
                    for (g=0; g<cellCount; g++) {
                        if (this.cells[g].group == this.goalList[i][0] && this.cells[g].number == this.goalList[i][1]) {
                            if (!(this.frenzyCount == 1 && this.hideReact)) {
                                this.cells[g].symbol = '' + this.cells[g].number;
                            }
                            if (this.frenzyCount == 1) {
                                this.cells[g].isReact = true;
                            }
                        }
                    }
                }
            }
            if (this.mathMode) {
                // generate list of numbers
                var numberList = [[0, "0"]];
                integerMax = Math.floor(this.gridSize * this.gridSize / 2);
                for (i=1; i<=integerMax; i++) {
                    numberList.push([i, i+""]);
                    numberList.push([-i, "-"+i]);
                }
                fractionMax = Math.max(9, 2 * this.gridSize);
                for (i=2; i<=fractionMax; i++) {
                    numberList.push([1/i, "1/" + i]);
                    numberList.push([-1/i, "-1/" + i]);
                    if (i > 2) {
                        numberList.push([1 - (1/i), (i-1) + "/" + i]);
                        numberList.push([-1 + (1/i), "-" + (i-1) + "/" + i]);
                    }
                }
                for (i=3; i<=integerMax; i += 2) {
                    numberList.push([i/2, i+"/2"]);
                    numberList.push([-i/2, "-"+i+"/2"]);
                }
                if (this.gridSize >= 5) {
                    numberList.push([2.71828, "e"]);
                    numberList.push([-2.71828, "-e"]);
                    numberList.push([3.14159, "π"]);
                    numberList.push([-3.14159, "-π"]);
                    numberList.push([6.28318, "2π"]);
                    numberList.push([-6.28318, "-2π"]);
                }
                
                // choose random values
                for (var i=0; i<numberList.length; i++) {
                    var other = i + Math.floor(Math.random() * (numberList.length - i));
                    if (other != i) {
                        var temp = numberList[i];
                        numberList[i] = numberList[other];
                        numberList[other] = temp;
                    }
                }
                numberList = numberList.slice(0, this.gridSize * this.gridSize);
                function comparePairs(a, b) {
                    return a[0] - b[0];
                };
                numberList.sort(comparePairs);
                
                // set cells' symbols to those values
                for (i=0; i<cellCount; i++) {
                    this.cells[i].symbol = numberList[this.cells[i].number - 1][1];
                }
            }
            else if (this.lettersMode) {
                // set cells' symbols to those values
                for (i=0; i<cellCount; i++) {
                    this.cells[i].symbol = String.fromCharCode(this.cells[i].number + 64);
                }
            }
        },
        shuffleCells: function () {
            for (var i=0; i<this.cells.length; i++) {
                var other = i + Math.floor(Math.random() * (this.cells.length - i));
                if (other != i) {
                    var temp = this.cells[i];
                    this.cells[i] = this.cells[other];
                    this.cells[other] = temp;
                }
            }
        },
        hideSelect: function () {
            this.showClickAnimation = false;
        },
        gameTimerOut: function () {
            this.stopGame();
            clearTimeout(this.gameTimerId);
            this.execDialog('stats');
        },
        execDialog: function (tabName) {
            this.stopGame();
            this.changeDialogTab(tabName);
            this.stats.stopTime = new Date();
            this.dialogShowed = true;
            this.stopMouseTracking();
        },
        changeDialogTab: function (tabName) {
            this.statsTabVisible = false;
            this.settingsTabVisible = false;
            this.mousemapTabVisible = false;

            if (tabName === 'stats') {
                this.statsTabVisible = true;
            } else if (tabName === 'mousemap') {
                this.mousemapTabVisible = true; // see 'updated' section
            } else {
                this.settingsTabVisible = true;
            }
        },
        onEsc: function() {
            if (this.betweenRounds) {
                this.startNextRound();
            } else if (this.dialogShowed) {
                this.hideDialog();
            } else {
                this.execDialog('settings');
            }
        },
        onSpace: function() {
            this.dialogShowed = false;
            if (this.betweenRounds) {
                this.startNextRound();
            } else {
                this.startGame();
            }
        },
        hideDialog: function () {
            this.dialogShowed = false;
            if (!this.gameStarted) {
                this.startGame();
            } else {
                this.restartMouseTracking();
            }
        },
        changeGridSize: function (event) {
            var val = parseInt(event.target.value);
            if (!isNaN(val) && val >= 2 && val <= 9) {
                this.gridSize = val;
            }
        },
        updateSymbolSpins: function () {
            for (var i = 0; i < this.cells.length; i++) {
                this.cells[i].cssClasses['spin-left'] = false;
                this.cells[i].cssClasses['spin-right'] = false;
                if (this.spinSymbols) {
                    var rnd = Math.floor(Math.random() * 2);
                    if (rnd === 0) {
                        this.cells[i].cssClasses['spin-left'] = true;
                    } else {
                        this.cells[i].cssClasses['spin-right'] = true;
                    }
                }
            }
        },
        updateSymbolTurns: function () {
            for (var i = 0; i < this.cells.length; i++) {
                this.cells[i].cssClasses['rotate-90'] = false;
                this.cells[i].cssClasses['rotate-180'] = false;
                this.cells[i].cssClasses['rotate-270'] = false;
                if (this.turnSymbols) {
                    var rnd = Math.floor(Math.random() * 4);
                    switch (rnd) {
                        case 0:
                            this.cells[i].cssClasses['rotate-90'] = true;
                            break;
                        case 1:
                            this.cells[i].cssClasses['rotate-180'] = true;
                            break;
                        case 2:
                            this.cells[i].cssClasses['rotate-270'] = true;
                            break;
                        default:
                            // no turn
                    }
                }
            }
        },
        update69Underline: function () {
            if (!this.turnSymbols && !this.spinSymbols && !this.spinTable) return;
            const confusing = new Set([6, 9, 66, 99, 68, 98, 86, 89]);
            for (var i = 0; i < this.cells.length; i++) {
                if (confusing.has(this.cells[i].number)) {
                    this.cells[i].cssClasses['underline'] = true;
                }
            }
        },
        updateColorStyles: function () {
            if (this.originalColors) {
                this.groupColorStyles = ['color: #232323', 'color: #5A5A5A', 'color: #919191', 'color: #C8C8C8', 'color: #FFFFFF'];
            } else {
                this.groupColorStyles = ['color: #FEB2FD', 'color: #C2FEB2', 'color: #FAFF85', 'color: #FEB2B2', 'color: #B2F9FE'];
            }
        },
        category: function () {
            // things ignored: collate; original colors; show hover; show click result; show center dot
            var category = this.gridSize + "x" + this.gridSize;
            if (this.rounds > 1) {
                category += " " + this.rounds + "r";
                category += this.roundBreaks ? 'b' : '';
            }
            if (this.groupCount > 1) {
                category += " " + this.groupCount + "c";
            }
            if (this.variousCounts) {
                category += " Various";
            } else {
                if (this.inverseCount) category += " Inverse";
                if (this.divergentCount) category += " Divergent";
            }
            if (this.shuffleSymbols) {
                category += " Shuffle";
            }
            if (this.spinSymbols) {
                category += " Spin";
            } else if (this.turnSymbols) {
                category += " Turn";
            }
            if (this.spinTable) {
                category += " Ts";
                if (this.spinTableSpeed === 'speed1') category += "L";
                if (this.spinTableSpeed === 'speed2') category += "M";
                if (this.spinTableSpeed === 'speed3') category += "H";
                if (this.spinTableSpeed === 'speed4') category += "CL";
                if (this.spinTableSpeed === 'speed5') category += "CM";
                if (this.spinTableSpeed === 'speed6') category += "CH";
            }
            if (this.noErrors) {
                category += " NE"
            }
            if (this.frenzyMode) {
                if (this.frenzyCount == 1) {
                    category += " React";
                } else {
                    category += " Frenzy " + this.frenzyCount;
                }
            } else if (this.blindMode) {
                category += " Blind";
            }
            if (this.hoverMode) {
                category += " Hover";
            }
            if (!this.showTrace) {
                category += " -SC";
            }
            if (!this.clearCorrect) {
                category += " -EC";
            }
            if (this.startOnClick) {
                category += " ST";
            }
            if (this.flashlightMode) {
                category += " FL";
            }
            if (this.leftRightClick) {
                category += " LR";
            }
            if (!isNaN(parseInt(this.nOffset)) && parseInt(this.nOffset) != 0) {
                category += " Offset " + parseInt(this.nOffset);
            }
            if (this.mathMode) {
                category += " Math";
            }
            if (this.lettersMode) {
                category += " Letters";
            }
            return category;
        },
        startMouseTracking: function () {
            this.mouseMoves.length = 0;
            this.mouseClicks.length = 0;
            this.mouseTracking = true;
        },
        restartMouseTracking: function () {
            this.mouseTracking = true;
        },
        stopMouseTracking: function () {
            this.mouseTracking = false;
        },
        appendMouseMove: function(event) {
            if (this.flashlightMode) {
                x = event.x;
                y = event.y;
                for (i=0; i<this.gridSize; i++) {
                    for (j=0; j<this.gridSize; j++) {
                        elem = document.getElementById("cell."+i+"."+j);
                        rect = elem.getBoundingClientRect();
                        cellMidX = rect.x + rect.width/2;
                        cellMidY = rect.y + rect.height/2;
                        dist = Math.sqrt((cellMidX - x)*(cellMidX - x) + (cellMidY - y)*(cellMidY - y));
                        opacity = (this.tableSize * 0.35 - dist) / (this.tableSize * 0.1);
                        if (opacity > 1) opacity = 1;
                        if (opacity < 0.5) opacity = 0;
                        elem.style.opacity = opacity;
                    }
                }
            }
            if (this.mouseTracking) {
                const shiftX = (window.innerWidth - this.tableWidth) / 2;
                const shiftY = (window.innerHeight - this.tableHeight) / 2;
                const nx = (event.clientX - shiftX);
                const ny = (event.clientY - shiftY);
                this.mouseMoves.push(
                    new Point(nx, ny)
                );
            }
        },
        drawRoundGraph: function() {
            const canvas = this.$refs['roundGraphCanvas'];
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                const { width, height } = canvas;

                const roundTimes = this.stats.rounds.map(r => r.stopTime - r.startTime);
                const rounds = roundTimes.length;
                const min = roundTimes.reduce((r, t) => Math.min(r, t));
                const tMin = 50 * (Math.floor(min / 50) - 1);
                const max = roundTimes.reduce((r, t) => Math.max(r, t));
                const tMax = 50 * (Math.ceil(max / 50) + 1);
                const tAvg = roundTimes.reduce((a, b) => a + b) / rounds;

                const x0 = 20 + Math.max(Math.floor(Math.log10(tMax) * 4), 4);
                const y0 = 10;
                const gWidth = width - x0;
                const gHeight = height - y0 * 2;
                ctx.clearRect(0, 0, width, height);

                // axes
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'black';
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x0, y0 + gHeight);
                ctx.lineTo(x0 + gWidth, y0 + gHeight);
                ctx.stroke();

                // vertical axis labels
                const tLabels = 5;
                const tMinY = y0 + gHeight - 6;
                const tMaxY = y0 + 6;
                const dt = (tMax - tMin) / (tLabels - 1);
                const dy = (tMaxY - tMinY) / (tLabels - 1);

                ctx.textBaseline = 'middle';
                ctx.textAlign = 'end';
                for (let i = 0; i < tLabels; i++) {
                    let text = (Math.floor(tMin + i * dt) / 1000).toString();
                    text = text.includes('.') ? text : text + '.';
                    const trailingZeros = Math.max(0, 3 - (text.length - 1 - text.indexOf('.')));
                    text = text + '0'.repeat(trailingZeros);
                    ctx.fillText(text, x0 - 4, tMinY + i * dy);
                }

                const yForT = t => 4 + gHeight - (t - tMin) / (tMax - tMin) * (tMinY - tMaxY);

                // average line
                const tAvgY = yForT(tAvg);
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.moveTo(x0, tAvgY);
                ctx.lineTo(x0 + gWidth, tAvgY);
                ctx.stroke();

                // graph lines
                const px0 = x0 + 10;
                const dx = (gWidth - 20) / (rounds - 1);
                const points = [];
                ctx.setLineDash([0, 0]);
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'blue';
                ctx.fillStyle = 'blue';
                roundTimes.forEach((time, i) => {
                    const x = px0 + i * dx;
                    const y = yForT(time);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    points.push([x, y]);
                });
                ctx.stroke();

                // graph points
                if (points.length <= 50) {
                    const r = rounds <= 10 ? 4 : 2;
                    points.forEach(([x, y]) => {
                        ctx.beginPath();
                        ctx.arc(x, y, r, 0, 2 * Math.PI);
                        ctx.stroke();
                        ctx.fill();
                    });
                }
            }
        },
        drawMousemap: function () {
            var canvas = this.$refs['mousemap_canvas']; // if mousemapTab visible
             if (canvas) {
                var ctx = canvas.getContext('2d');
                if (ctx) {
                    // clear canvas
                    var W = canvas.width;
                    var H = canvas.height;
                    ctx.fillStyle = 'white';
                    ctx.clearRect(0, 0, W, H);

                    this.drawMousemapGrid(ctx, W, H);
                    this.drawMousemapMoves(ctx, W, H);
                    this.drawMousemapClicks(ctx, W, H)
                }
            }
        },
        drawMousemapGrid: function (ctx, W,  H) {
            if (ctx && this.gridSize > 0) {
                var rowH = H / this.gridSize;
                var colW = W / this.gridSize;
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (var i = 1; i < this.gridSize; i ++) {
                    ctx.moveTo(i*colW, 0);
                    ctx.lineTo(i*colW, H);
                    ctx.moveTo(0, i*rowH);
                    ctx.lineTo(W, i*rowH);
                }
                ctx.stroke();
                ctx.closePath();
            }
        },
        drawMousemapMoves: function (ctx, W,  H) {
            if (ctx) {
                ctx.beginPath();
                ctx.strokeStyle = '#1f6ef7'; //'#f78383';
                ctx.lineWidth = 2;
                for (var i = 0; i + 1 < this.mouseMoves.length; i ++) {
                    var x0 = this.mouseMoves[i].x * W;
                    var y0 = this.mouseMoves[i].y * H;
                    var x1 = this.mouseMoves[i+1].x * W;
                    var y1 = this.mouseMoves[i+1].y * H;
                    ctx.moveTo(x0, y0);
                    ctx.lineTo(x1, y1);
                }
                ctx.stroke();
                ctx.closePath();
            }
        },
        drawMousemapClicks: function (ctx, W,  H) {
            if (ctx) {
                ctx.lineWidth = 2;
                var radius = 5;
                for (var i = 0; i < this.mouseClicks.length; i ++) {
                    var centerX = this.mouseClicks[i].x * W;
                    var centerY = this.mouseClicks[i].y * H;
                    ctx.beginPath();
                    if (this.mouseClicks[i].correct) {
                        ctx.fillStyle = '#52a352'; //'#6ac46a';
                        ctx.strokeStyle = '#52a352';
                    } else {
                        ctx.fillStyle = '#ba2a29'; //'#f44f4d';
                        ctx.strokeStyle = '#ba2a29';
                    }
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    }
});
