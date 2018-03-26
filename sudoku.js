"use strict";

var colors = require('colors');

/*
 0  1  2 |  3  4  5 |  6  7  8
 9 10 11 | 12 13 14 | 15 16 17
18 19 20 | 21 22 23 | 24 25 26
---------|----------|----------
27 28 29 | 30 31 32 | 33 34 35
36 37 38 | 39 40 41 | 42 43 44
45 46 47 | 48 49 50 | 51 52 53
---------|----------|----------
54 55 56 | 57 58 59 | 60 61 62
63 64 65 | 66 67 68 | 69 70 71
72 73 74 | 75 76 77 | 78 79 80
*/

var ALL = 0b1111111110;

var IS_SOLVED = 0b0000000001;

var SOLVED = {
    1:     0b0000000011,
    2:     0b0000000101,
    3:     0b0000001001,
    4:     0b0000010001,
    5:     0b0000100001,
    6:     0b0001000001,
    7:     0b0010000001,
    8:     0b0100000001,
    9:     0b1000000001,
}

var POSSIBLE = {
    1:    0b0000000010,
    2:    0b0000000100,
    3:    0b0000001000,
    4:    0b0000010000,
    5:    0b0000100000,
    6:    0b0001000000,
    7:    0b0010000000,
    8:    0b0100000000,
    9:    0b1000000000,
};

var SOLVED_INVERSE = {
    0b0000000001: '!',
    0b0000000011: 1,
    0b0000000101: 2,
    0b0000001001: 3,
    0b0000010001: 4,
    0b0000100001: 5,
    0b0001000001: 6,
    0b0010000001: 7,
    0b0100000001: 8,
    0b1000000001: 9,
};

class Sudoku {
    constructor(puzzle) {
        if (typeof puzzle == 'string') {
            this.parse(puzzle);
        } else {
            this.puzzle = puzzle;
        }
        this.start_puzzle = Uint16Array.from(this.puzzle)
    }

    branch() {
        var puzzle_copy = Uint16Array.from(this.puzzle);
        return new Sudoku(puzzle_copy);
    }

    reset() {
        for (var i = 0; i < 81; ++i) {
            this.puzzle[i] = this.start_puzzle[i];
        }
    }

    parse(puzzle) {
        this.puzzle = new Uint16Array(81);
        var p = 0;
        for (var i = 0; i < puzzle.length; ++i) {
            if ([ '1', '2', '3', '4', '5', '6', '7', '8', '9' ].indexOf(puzzle[i]) != -1) {
                this.puzzle[p] = SOLVED[puzzle[i]];
                ++p;
            } else if (puzzle[i] == '.') {
                this.puzzle[p] = ALL;
                ++p;
            }
        }
    }

    print(start_puzzle, binary, return_str) {
        var str = '';
        for (var i = 0; i < 9; ++i) {
            for (var j = 0; j < 9; ++j) {
                var index = i * 9 + j;
                var bit = start_puzzle ? this.start_puzzle[index] : this.puzzle[index];
                var square = '';
                if (binary) {
                    square = bit.toString(2).padStart(10, '0');
                } else {
                    if (bit & IS_SOLVED) {
                        square = (SOLVED_INVERSE[bit]).toString() || '!';
                    } else {
                        square = '.';
                    }
                }
                if (this.no_possible_squares && this.no_possible_squares.indexOf(index) != -1) {
                    square = square.bgBlue;
                }
                if (this.conflict_squares && this.conflict_squares.indexOf(index) != -1) {
                    square = square.bgRed;
                }
                if (this.changed_squares && this.changed_squares.indexOf(index) != -1) {
                    square = square.underline;
                }
                str += square + ' ';
                if (j != 8 && j % 3 == 2) str += '| ';
            }
            str += '\n';
            if (i % 3 == 2 && i != 8) {
                if (binary) {
                    str += '---------------------------------|----------------------------------|---------------------------------\n';
                } else {
                    str += '------|-------|-------\n';
                }
            }
        }
        if (return_str) {
            return str;
        } else {
            console.log(str);
        }
    }

    getRowIndexes(i) {
        var row = Math.floor(i / 9);
        return [
            row * 9 + 0,
            row * 9 + 1,
            row * 9 + 2,
            row * 9 + 3,
            row * 9 + 4,
            row * 9 + 5,
            row * 9 + 6,
            row * 9 + 7,
            row * 9 + 8,
        ];
    }

    getColIndexes(i) {
        var col = Math.floor(i % 9);
        return [
            col + 9*0,
            col + 9*1,
            col + 9*2,
            col + 9*3,
            col + 9*4,
            col + 9*5,
            col + 9*6,
            col + 9*7,
            col + 9*8,
        ];
    }

    getBlockIndexes(i) {
        var row = Math.floor(i / 9);
        var col = Math.floor(i % 9);
        var block_row = Math.floor(row / 3) * 3
        var block_col = Math.floor(col / 3) * 3
        return [
            (block_row + 0) * 9 + block_col + 0,
            (block_row + 0) * 9 + block_col + 1,
            (block_row + 0) * 9 + block_col + 2,
            (block_row + 1) * 9 + block_col + 0,
            (block_row + 1) * 9 + block_col + 1,
            (block_row + 1) * 9 + block_col + 2,
            (block_row + 2) * 9 + block_col + 0,
            (block_row + 2) * 9 + block_col + 1,
            (block_row + 2) * 9 + block_col + 2,
        ];
    }

    isSolved() {
        for (var i = 0; i < 81; ++i) {
            if (!(this.puzzle[i] & IS_SOLVED)) return false;
        }
        return true;
    }

    sanityCheck(output_report) {
        var sets = [
            // rows
            [ 0,  1,  2,  3,  4,  5,  6,  7,  8  ],
            [ 9,  10, 11, 12, 13, 14, 15, 16, 17 ],
            [ 18, 19, 20, 21, 22, 23, 24, 25, 26 ],
            [ 27, 28, 29, 30, 31, 32, 33, 34, 35 ],
            [ 36, 37, 38, 39, 40, 41, 42, 43, 44 ],
            [ 45, 46, 47, 48, 49, 50, 51, 52, 53 ],
            [ 54, 55, 56, 57, 58, 59, 60, 61, 62 ],
            [ 63, 64, 65, 66, 67, 68, 69, 70, 71 ],
            [ 72, 73, 74, 75, 76, 77, 78, 79, 80 ],

            // cols
            [ 0,  9,  18, 27, 36, 45, 54, 63, 72 ],
            [ 1,  10, 19, 28, 37, 46, 55, 64, 73 ],
            [ 2,  11, 20, 29, 38, 47, 56, 65, 74 ],
            [ 3,  12, 21, 30, 39, 48, 57, 66, 75 ],
            [ 4,  13, 22, 31, 40, 49, 58, 67, 76 ],
            [ 5,  14, 23, 32, 41, 50, 59, 68, 77 ],
            [ 6,  15, 24, 33, 42, 51, 60, 69, 78 ],
            [ 7,  16, 25, 34, 43, 52, 61, 70, 79 ],
            [ 8,  17, 26, 35, 44, 53, 62, 71, 80 ],

            // blocks
            [ 0,  1,  2,  9,  10, 11, 18, 19, 20 ],
            [ 3,  4,  5,  12, 13, 14, 21, 22, 23 ],
            [ 6,  7,  8,  15, 16, 17, 24, 25, 26 ],
            [ 27, 28, 29, 36, 37, 38, 45, 46, 47 ],
            [ 30, 31, 32, 39, 40, 41, 48, 49, 50 ],
            [ 33, 34, 35, 42, 43, 44, 51, 52, 53 ],
            [ 54, 55, 56, 63, 64, 65, 72, 73, 74 ],
            [ 57, 58, 59, 66, 67, 68, 75, 76, 77 ],
            [ 60, 61, 62, 69, 70, 71, 78, 79, 80 ],
        ];

        var sane = true;
        if (output_report) {
            this.no_possible_squares = [];
            this.conflict_squares = [];
            this.changed_squares = [];
        }

        for (var i = 0; i < 81; ++i) {
            if (this.puzzle[i] == 0) {
                if (output_report) {
                    sane = false;
                    this.no_possible_squares.push(i);
                } else {
                    return false;
                }
            }
        }

        for (var i = 0; i < sets.length; ++i) {
            var set = sets[i];
            var set_or = 0;
            var set_xor = 0;
            for (var j = 0; j < set.length; ++j) {
                if (this.puzzle[set[j]] & IS_SOLVED) {
                    set_or = set_or | this.puzzle[set[j]];
                    set_xor = set_xor ^ this.puzzle[set[j]];
                }
            }

            if (set_or) {
                set_xor = set_xor | IS_SOLVED;
                if (set_or != set_xor) {
                    if (output_report) {
                        sane = false;
                        var bad_bit = (set_or ^ set_xor) | IS_SOLVED;
                        for (var j = 0; j < set.length; ++j) {
                            if (this.puzzle[set[j]] == bad_bit) {
                                this.conflict_squares = this.conflict_squares.concat(set[j]);
                            }
                        }
                    } else {
                        return false;
                    }
                }
            }
        }

        if (this.start_puzzle) {
            for (var i = 0; i < 81; ++i) {
                if (this.start_puzzle[i] & IS_SOLVED && this.start_puzzle[i] != this.puzzle[i]) {
                    if (output_report) {
                        sane = false;
                        this.changed_squares.push(i);
                    } else {
                        return false;
                    }
                }
            }
        }

        if (output_report && !sane) {
            var print = this.print(false, false, true);
            var bin_print = this.print(false, true, true);
            var spaces = '                                                                                 ';
            print = print.replace(/^/g, '| ').replace(/\n/g, spaces + '|\n| ').replace(/\n\| $/, '');
            bin_print = bin_print.replace(/^/g, '| ').replace(/ \n/g, '\n').replace(/\n/g, ' |\n| ').replace(/\n\| $/, '');
            console.log();
            console.log(' -------------------------------------------------------------------------------------------------------- ');
            console.log('|   NOT SANE                                                                                             |');
            console.log('|   no possible: ', this.no_possible_squares.join(', '));
            console.log('|   conflict:    ', this.conflict_squares.join(', '));
            console.log('|   changed:     ', this.changed_squares.join(', '));
            console.log('|                                                                                                        |');
            console.log(print);
            console.log('|                                                                                                        |');
            console.log(bin_print);
            console.log('|                                                                                                        |');
            console.log(' -------------------------------------------------------------------------------------------------------- ');
            console.log();
        }

        return sane;
    }

    basicSolve() {
        do {
            var changed = false;
            if (this.removePossibilitiesRowColBlock()) changed = true;
            if (this.removePossibilitiesFromTwins()) changed = true;
            if (this.fillInOnlyPossibleChoice()) changed = true;
        } while (changed);
    }

    deterministicSolve() {
        this.basicSolve();
        if (!this.isSolved() && this.checkForGuessErrors()) {
            return this.deterministicSolve();
        }
    }

    solve() {
        this.deterministicSolve();
        if (!this.isSolved()) {
            var guess = this.guess();
            if (guess && guess.isSolved() && guess.sanityCheck()) {
                this.puzzle = guess.puzzle;
            }
        }
    }

    removePossibilitiesRowColBlock() {
        var self = this;
        var changed = false;
        for (var i = 0; i < 81; ++i) {
            if (this.puzzle[i] & IS_SOLVED) continue;
            var row = this.getRowIndexes(i);
            var col = this.getColIndexes(i);
            var block = this.getBlockIndexes(i);
            var solved_mask = 0;
            for (var j = 0; j < 9; ++j) if (this.puzzle[row[j]] & IS_SOLVED) solved_mask |= this.puzzle[row[j]];
            for (var j = 0; j < 9; ++j) if (this.puzzle[col[j]] & IS_SOLVED) solved_mask |= this.puzzle[col[j]];
            for (var j = 0; j < 9; ++j) if (this.puzzle[block[j]] & IS_SOLVED) solved_mask |= this.puzzle[block[j]];
            var old_cell = this.puzzle[i];
            var new_cell = (this.puzzle[i] &= ~solved_mask);
            if (old_cell != new_cell) changed = true;
            if (self.possibilityCount(self.puzzle[i]) == 1) {
                self.puzzle[i] |= IS_SOLVED;
            }
        }
        return changed;
    }

    fillInOnlyPossibleChoice() {
        var self = this;
        var changed = false;
        for (var i = 0; i < 81; ++i) {
            if (this.puzzle[i] & IS_SOLVED) continue;
            var row = this.getRowIndexes(i);
            var col = this.getColIndexes(i);
            var block = this.getBlockIndexes(i);
            var sets = [ row, col, block ];
            for (var s = 0; s < 3; ++s) {
                for (var candidate = 1; candidate <= 9; ++candidate) {
                    if (self.puzzle[i] & POSSIBLE[candidate]) {
                        var clash_found = false;
                        for (var k = 0; k < 9; ++k) {
                            if (i == sets[s][k]) continue;
                            if (self.puzzle[sets[s][k]] & POSSIBLE[candidate]) clash_found = true;
                        }
                        if (!clash_found) {
                            self.puzzle[i] = SOLVED[candidate];
                            changed = true;
                        }
                    }
                }
            }
        }
        return changed;
    }

    removePossibilitiesFromTwins() {
        var changed = false;
        var rows   = [ 0,  1,  2,   3,   4,   5,   6,   7,   8  ];
        var cols   = [ 0,  9,  18,  27,  36,  45,  54,  63,  72 ];
        var blocks = [ 0,  3,  6,   27,  30,  33,  54,  57,  60 ];
        for (var i = 0; i < 9; ++i) {
            var row = this.getRowIndexes(rows[i]);
            for (var j = 0; j < 9; ++j) {
                var cell = this.puzzle[row[j]];
                if (this.possibilityCount(cell) == 2) {
                    for (var k = 0; k < 9; ++k) {
                        if (k == j) continue;
                        var cell2 = this.puzzle[row[k]];
                        if (this.possibilityCount(cell2) == 2 && cell == cell2) {
                            changed = changed || this.clearTwins(row, j, k);
                        }
                    }
                }
            }
        }
        for (var i = 0; i < 9; ++i) {
            var col = this.getColIndexes(cols[i]);
            for (var j = 0; j < 9; ++j) {
                var cell = this.puzzle[col[j]];
                if (this.possibilityCount(cell) == 2) {
                    for (var k = 0; k < 9; ++k) {
                        if (k == j) continue;
                        var cell2 = this.puzzle[col[k]];
                        if (this.possibilityCount(cell2) == 2 && cell == cell2) {
                            changed = changed || this.clearTwins(col, j, k);
                        }
                    }
                }
            }
        }
        for (var i = 0; i < 9; ++i) {
            var block = this.getBlockIndexes(blocks[i]);
            for (var j = 0; j < 9; ++j) {
                var cell = this.puzzle[block[j]];
                if (this.possibilityCount(cell) == 2) {
                    for (var k = 0; k < 9; ++k) {
                        if (k == j) continue;
                        var cell2 = this.puzzle[block[k]];
                        if (this.possibilityCount(cell2) == 2 && cell == cell2) {
                            changed = changed || this.clearTwins(block, j, k);
                        }
                    }
                }
            }
        }
        return changed;
    }

    clearTwins(row, i1, i2) {
        var changed = false;
        var mask = this.puzzle[row[i1]];
        for (var i = 0; i < 9; ++i) {
            if (i == i1 || i == i2) continue;
            var old_cell = this.puzzle[row[i]];
            this.puzzle[row[i]] &= ~(mask);
            var new_cell = this.puzzle[row[i]];
            changed = changed || (old_cell != new_cell);
        }
        return changed;
    }

    possibilityCount(bits) {
        var count = 0;
        bits = bits >> 1; count += bits & 1;
        bits = bits >> 1; count += bits & 1;
        bits = bits >> 1; count += bits & 1;
        bits = bits >> 1; count += bits & 1;
        bits = bits >> 1; count += bits & 1;
        bits = bits >> 1; count += bits & 1;
        bits = bits >> 1; count += bits & 1;
        bits = bits >> 1; count += bits & 1;
        bits = bits >> 1; count += bits & 1;
        return count;
    }

    checkForGuessErrors() {
        var changed = false;
        var branch = this.branch();
        for (var i = 0; i < 81; ++i) {
            if (this.puzzle[i] & IS_SOLVED) continue;
            for (var j = 1; j <= 9; ++j) {
                if (!(this.puzzle[i] & POSSIBLE[j])) continue;
                branch.reset()
                branch.puzzle[i] = SOLVED[j];
                branch.basicSolve()

                if (!branch.sanityCheck()) {
                    this.puzzle[i] &= ~POSSIBLE[j];
                    if (this.possibilityCount(this.puzzle[i]) == 1) {
                        this.puzzle[i] |= IS_SOLVED;
                    }
                    changed = true;
                    break;
                }
            }
        }
        return changed;
    }

    guess() {
        this.deterministicSolve();

        if (!this.sanityCheck()) return false;

        if (this.isSolved()) return this;

        for (var i = 0; i < 81; ++i) {
            if (this.puzzle[i] & IS_SOLVED) continue;
            for (var j = 0; j <= 9; ++j) {
                if (this.puzzle[i] & POSSIBLE[j]) {
                    var branch = this.branch();
                    branch.puzzle[i] = SOLVED[j];
                    var guess = branch.guess();
                    if (guess) {
                        return guess;
                    }
                }
            }
        }

        return false;
    }

}

module.exports = Sudoku;
