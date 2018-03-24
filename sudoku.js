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

function parse(puzzle) {
    var arr = [];
    for (var i = 0; i < puzzle.length; ++i) {
        if ([ '1', '2', '3', '4', '5', '6', '7', '8', '9' ].indexOf(puzzle[i]) != -1) {
            arr.push(parseInt(puzzle[i]));
        } else if (puzzle[i] == '.') {
            arr.push('.');
        }
    }
    return arr;
}

function print(puzzle) {
    var str = '';
    for (var i = 0; i < 9; ++i) {
        for (var j = 0; j < 9; ++j) {
            str += puzzle[i * 9 + j] + ' ';
            if (j != 8 && j % 3 == 2) str += '| ';
        }
        str += '\n';
        if (i % 3 == 2 && i != 8) str += '------|-------|-------\n';
    }
    console.log(str);
}

function generatePossiblities(puzzle) {
    var arr = [];
    for (var i = 0; i < 81; ++i) {
        if (puzzle[i] == '.') arr.push([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        else arr.push([ puzzle[i] ]);
    }
    return arr;
}

function removePossibilitiesRowColBlock(puzzle, poss) {
    var changed = false;
    for (var i = 0; i < 81; ++i) {
        if (puzzle[i] != '.') continue;
        var row = getRow(puzzle, i);
        var col = getCol(puzzle, i);
        var block = getBlock(puzzle, i);
        var all = row.concat(col).concat(block);
        for (var j = 0; j < all.length; ++j) {
            var pi = poss[i].indexOf(all[j]);
            if (pi != -1) {
                poss[i].splice(pi, 1);
                changed = true;
            }
        }
        if (poss[i].length == 1) {
            puzzle[i] = poss[i][0];
        }
    }
    return changed;
}

function fillInOnlyPossibleChoice(puzzle, poss) {
    changed = false;
    for (var i = 0; i < 81; ++i) {
        if (puzzle[i] != '.') continue;
        var row = getRow(poss, i);
        var col = getCol(poss, i);
        var block = getBlock(poss, i);
        [ row, col, block ].forEach(function(set) {
            for (var j = 1; j <= 9; ++j) {
                if (poss[i].indexOf(j) != -1) {
                    var clash_found = false;
                    for (var k = 0; k < 9; ++k) {
                        if (poss[i] == set[k]) continue;
                        if (set[k].indexOf(j) != -1) clash_found = true;
                    }
                    if (!clash_found) {
                        poss[i] = [j];
                        puzzle[i] = j;
                        changed = true;
                    }
                }
            }
        });
    }
    return changed;
}

function removePossibilitiesFromTwins(puzzle, poss) {
    var changed = false;
    var rows   = [ 0,  1,  2,   3,   4,   5,   6,   7,   8  ];
    var cols   = [ 0,  9,  18,  27,  36,  45,  54,  63,  72 ];
    var blocks = [ 0,  3,  6,   27,  30,  33,  54,  57,  60 ];
    for (var i = 0; i < 9; ++i) {
        row = getRow(poss, rows[i]);
        for (var j = 0; j < 9; ++j) {
            var cell = row[j];
            if (cell.length == 2) {
                for (var k = 0; k < 9; ++k) {
                    if (k == j) continue;
                    if (row[k].length == 2 && row[k][0] == cell[0] && row[k][1] == cell[1]) {
                        changed = changed || clearTwins(row, j, k);
                    }
                }
            }
        }
    }
    return changed;
}

function clearTwins(row, i1, i2) {
    var changed = false;
    var n1 = row[i1][0];
    var n2 = row[i1][1];
    // todo: sanity check that i1 and i2 are twins
    for (var i = 0; i < 9; ++i) {
        if (i == i1 || i == i2) continue;
        for (var j = 0; j < row[i].length; ++j) {
            if (row[i][j] == n1 || row[i][j] == n2) {
                row[i].splice(j, 1);
                changed = true;
            }
        }
    }
    return changed;
}

function copy(puzzle, poss) {
    copy_puzzle = puzzle.concat();
    copy_poss = poss.concat();
    for (var k = 0; k < 81; ++k) {
        copy_poss[k] = copy_poss[k].concat();
    }
    return [ copy_puzzle, copy_poss ];
}

function checkForGuessErrors(puzzle, poss) {
    var changed = false;
    for (var i = 0; i < 81; ++i) {
        if (puzzle[i] != '.') continue;
        for (var j = 0; j < poss[i].length; ++j) {
            var copies = copy(puzzle, poss);
            var guess_puzzle = copies[0];
            var guess_poss = copies[1];
            guess_puzzle[i] = poss[i][j];
            guess_poss[i] = [ poss[i][j] ];
            basicSolve(guess_puzzle, guess_poss);

            if (!sanityCheck(guess_puzzle, puzzle, poss)) {
                poss[i].splice(j, 1);
                changed = true;
            }
        }
    }
    return changed;
}

function basicSolve(puzzle, poss) {
    do {
        changed = false;
        changed = changed || fillInOnlyPossibleChoice(puzzle, poss);
        changed = changed || removePossibilitiesRowColBlock(puzzle, poss);
        changed = changed || removePossibilitiesFromTwins(puzzle, poss);
    } while (changed);
}

function solve(puzzle, poss) {
    basicSolve(puzzle, poss);
    if (!isSolved(puzzle) && checkForGuessErrors(puzzle, poss)) {
        return solve(puzzle, poss);
    }
}

function getRow(puzzle, i) {
    var row = Math.floor(i / 9);
    return puzzle.slice(row * 9, row * 9 + 9);
}

function getCol(puzzle, i) {
    var col = Math.floor(i % 9);
    return [
        puzzle[col + 9*0],
        puzzle[col + 9*1],
        puzzle[col + 9*2],
        puzzle[col + 9*3],
        puzzle[col + 9*4],
        puzzle[col + 9*5],
        puzzle[col + 9*6],
        puzzle[col + 9*7],
        puzzle[col + 9*8],
    ];
}

function getBlock(puzzle, i) {
    var row = Math.floor(i / 9);
    var col = Math.floor(i % 9);

    var block_row = Math.floor(row / 3) * 3
    var block_col = Math.floor(col / 3) * 3

    return [
        puzzle[(block_row + 0) * 9 + block_col + 0],
        puzzle[(block_row + 0) * 9 + block_col + 1],
        puzzle[(block_row + 0) * 9 + block_col + 2],
        puzzle[(block_row + 1) * 9 + block_col + 0],
        puzzle[(block_row + 1) * 9 + block_col + 1],
        puzzle[(block_row + 1) * 9 + block_col + 2],
        puzzle[(block_row + 2) * 9 + block_col + 0],
        puzzle[(block_row + 2) * 9 + block_col + 1],
        puzzle[(block_row + 2) * 9 + block_col + 2],
    ];
}

function isSolved(puzzle) {
    for (var i = 0; i < 81; ++i) {
        if (puzzle[i] == '.') return false;
    }
    return true;;
}

function sanityCheck(puzzle, start_puzzle, poss) {
    var sane = true;
    if (poss) {
        for (var i = 0; i < 81; ++i) {
            if (poss[i].length == 0) return false;
        }
    }
    if (!rowSanity(getRow(puzzle, 0)))  return false;
    if (!rowSanity(getRow(puzzle, 9)))  return false;
    if (!rowSanity(getRow(puzzle, 18))) return false;
    if (!rowSanity(getRow(puzzle, 27))) return false;
    if (!rowSanity(getRow(puzzle, 36))) return false;
    if (!rowSanity(getRow(puzzle, 45))) return false;
    if (!rowSanity(getRow(puzzle, 54))) return false;
    if (!rowSanity(getRow(puzzle, 63))) return false;
    if (!rowSanity(getRow(puzzle, 72))) return false;

    if (!rowSanity(getCol(puzzle, 0)))  return false;
    if (!rowSanity(getCol(puzzle, 1)))  return false;
    if (!rowSanity(getCol(puzzle, 2)))  return false;
    if (!rowSanity(getCol(puzzle, 3)))  return false;
    if (!rowSanity(getCol(puzzle, 4)))  return false;
    if (!rowSanity(getCol(puzzle, 5)))  return false;
    if (!rowSanity(getCol(puzzle, 6)))  return false;
    if (!rowSanity(getCol(puzzle, 7)))  return false;
    if (!rowSanity(getCol(puzzle, 8)))  return false;

    if (!rowSanity(getBlock(puzzle, 0)))  return false;
    if (!rowSanity(getBlock(puzzle, 3)))  return false;
    if (!rowSanity(getBlock(puzzle, 6)))  return false;
    if (!rowSanity(getBlock(puzzle, 27)))  return false;
    if (!rowSanity(getBlock(puzzle, 30)))  return false;
    if (!rowSanity(getBlock(puzzle, 33)))  return false;
    if (!rowSanity(getBlock(puzzle, 54)))  return false;
    if (!rowSanity(getBlock(puzzle, 57)))  return false;
    if (!rowSanity(getBlock(puzzle, 60)))  return false;

    if (start_puzzle) {
        for (var i = 0; i < 81; ++i) {
            if (start_puzzle[i] != '.' && start_puzzle[i] != puzzle[i]) return false;
        }
    }
    return sane;
}

function rowSanity(row) {
    for (var i = 0; i < 9; ++i) {
        for (var j = 0; j < 9; ++j) {
            if (i != j && row[i] != '.' && row[i] == row[j]) return false;
        }
    }
    return true;
}

var n = 0;
function guess(puzzle, poss) { // too slow, keeping for reference
    if (++n % 1000 == 0) {
        console.log(++n);
        print(puzzle);
    }
    if (!sanityCheck(puzzle)) return false;

    if (isSolved(puzzle)) return puzzle;

    for (var i = 0; i < 81; ++i) {
        if (puzzle[i] != '.') continue;
        for (var j = 0; j < poss[i].length; ++j) {
            puzzle[i] = poss[i][j];
            result = guess(puzzle.concat(), poss);
            if (result) return result;
        }
        puzzle[i] = '.';
    }

    return false;
}

//var puzzles = require('./problems-why');
//var puzzles = require('./problems-hard');
var puzzles = require('./problems');

done_count = 0;
not_done_count = 0;
for (var i = 0; i < puzzles.length; ++i) {
    var puzzle = parse(puzzles[i]);
    var start_puzzle = puzzle.concat();
    var poss = generatePossiblities(puzzle);
    solve(puzzle, poss);
    var done = isSolved(puzzle);
    var sane = sanityCheck(puzzle, start_puzzle);
    done ? ++done_count : ++not_done_count;

    if (!done) {
        console.log('----------------------------------------');
        print(start_puzzle);
        print(puzzle);
        console.log(done ? 'done' : 'not done');
    }
    if (!sane) console.log('NOT SANE!!!!!!!!!!!');
}
console.log(not_done_count + ' not done');
console.log(done_count + ' done');
console.log(((done_count / puzzles.length) * 100).toFixed(1) + '% solved');
