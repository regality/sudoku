var Sudoku = require('./sudoku')
  , puzzles = require('./puzzles/puzzles')
  , done_count = 0
  ;

for (var i = 0; i < puzzles.length; ++i) {
    var sudoku = new Sudoku(puzzles[i]);
    sudoku.sanityCheck(true);
    sudoku.solve();
    var sane = sudoku.sanityCheck(true);
    var solved = sudoku.isSolved();
    solved && ++done_count;

    console.log('----------------------------------');
    console.log();
    sudoku.print(true);
    sudoku.print();
    console.log(solved ? 'solved' : 'not solved')
    console.log();
    if (!sane) {
        sudoku.sanityReport();
    }
}
console.log(done_count + ' / ' + puzzles.length + ' solved');
console.log(((done_count / puzzles.length) * 100).toFixed(1) + '% solved');

