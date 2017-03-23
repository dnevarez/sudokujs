var Sudoku = ( function ( $ ){
    var _instance, _game,
        defaultConfig = {
          // If set to true, the game will validate the numbers
    			// as the player inserts them. If it is set to false,
    			// validation will only happen at the end.
    			'validate_on_insert': true,
          // If set to true, the system will display the elapsed
          // time it took for the solver to finish its operation.
          'show_solver_timer': true,
          // If set to true, the recursive solver will count the
    			// number of recursions and backtracks it performed and
    			// display them in the console.
    			'show_recursion_counter': true,
          // If set to true, the solver will test a shuffled array
    			// of possible numbers in each empty input box.
    			// Otherwise, the possible numbers are ordered, which
    			// means the solver will likely give the same result
    			// when operating in the same game conditions.
    			'solver_shuffle_numbers': true
        },
        paused = false,
        counter = 0;

    /**
  	 * Initialize the singleton
  	 * @param {Object} config Configuration options
  	 * @returns {Object} Singleton methods
  	 */
    function init( config ) {
      conf = $.extend( {}, defaultConfig, config );
      _game = new Game( conf );

      /** Public Methods **/
      return {
        /**
			 * Return a visual representation of the board
			 * @returns {jQuery} Game table
			 */
       getGameBoard: function(){
            return _game.buildGUI();
       },

 			/**
 			 * Reset the game board.
 			 */
       reset: function(){
            return _game.resetGame();
       },

       /**
			 * Call for a validation of the game board.
			 * @returns {Boolean} Whether the board is valid
			 */
       validate: function(){
         var isValid;

         isValid = game.validateMatrix();
         $( '.sudoku-container' ).toggleClass( 'valid-matrix', isValid );
       },

       /**
			 * Call for the solver routine to solve the current
			 * board.
			 */
       solve: function() {
            var isValid, starttime, endtime, elapsed;
            // Make sure the board is valid first
            if ( !_game.validateMatrix() ) {
                  return false;
            }
            // Reset counters
            _game.recursionCounter = 0;
            _game.backtrackCounter = 0;

            // Check start time
            starttime = Date.now();

            // Solve the game
            isValid = _game.solveGame( 0, 0 );

            // Get solving ned time
            endtime = Date.now();

            // Visual indication of whether the game was solved
            $( '.sudoku-container' ).toggleClass( 'valid-matrix', isValid );
            if ( isValid ) {
                $( '.valid-matrix input' ).attr( 'disabled', 'disabled' );
            }

            // Display elapsed time
            if ( _game.config.show_solver_timer ) {
                elapsed = endtime - starttime;
                window.console.log( 'Solver elapsed time: ' + elapsed + 'ms' );
            }
            // Display number of recursions and backtracks
            if ( _game.config.show_recursion_counter ) {
                window.console.log( 'Solver recursions: ' + _game.recursionCounter );
                window.console.log( 'Solver backtracks: ' + _game.backtrackCounter );
            }
       }
      };
    }


	/**
	 * Sudoku singleton engine
	 * @param {Object} config Configuration options
	 */
    function Game( config ) {
          this.config = config;

          // Initialize game parameters
          this.recursionCounter = 0;
          this.$cellMatrix = {};
          this.matrix = {};
          this.validation = {};

          this.resetValidationMatrices();
          return this;
    }
    /**
  	 * Game engine prototype methods
  	 * @property {Object}
  	 */
    Game.prototype = {
   /**
		 * Build the game GUI
		 * @returns {jQuery} Table containing 9x9 input matrix
		 */
     buildGUI: function() {
       var $td, $tr,
              $table = $( '<table>' )
                        .addClass( 'sudoku-container' );

       for ( var i = 0; i < 9; i++ ) {
         $tr = $( '<tr>' );
         this.$cellMatrix[i] = {};

         for ( var j = 0; j < 9; j++ ) {
                // Build in input
                this.$cellMatrix[i][j] = $( '<input>' )
                              .attr( 'maxlength', 1 )
                              .data( 'row', i )
                              .data( 'col', j )
                              .on( 'keyup', $.proxy( this.onKeyUp, this) );
                $td = $( '<td>' ).append( this.$cellMatrix[i][j] );
                // Calculate section ID
                sectIDi = Math.floor( i / 3 );
                sectIDj = Math.floor( j / 3 );
                // Set the design for different sections
                if ( (sectIDi + sectIDj ) % 2 === 0 ) {
                    $td.addClass( 'sudoku-section-one' );
                } else {
                  $td.addClass( 'sudoku-section-two' );
                }
                // Build the row
                $tr.append( $td );
         }
        //  Append to table
        $table.append( $tr )
       }
       //  Return the GUI table
       return $table
     },

    };

    // helper functions

    // Singleton public Methods
    return {
      // Get the Singleton instance
      getInstance: function( config ) {
        if (!_instance) {
          _instance = init (config);
        }
        return _instance;
      }
    }
} ) ( jQuery );

/**
  * Handle Keyup events.
  *
  * @param {jQuery.event} e Keyup event
  */

onKeyUp: function( e ) {
  var sectRow, sectCol, secIndex,
      starttime, endtime, elapsed,
      isValid = true;
      val = $.trim( $( e.currentTarget ).val() ),
      row = $( e.currentTarget ).data( 'row' ),
      col = $( e.currentTarget ).data( 'col' );

  // Reset board validation class
  $( '.sudoku-container' ).removeClass( 'valid-matrix' );

  // Validate, but inly if validate_on_insert is set to true
  if ( this.config.validate_on_insert ) {
      isValid = this.validateNumber( val, row, col, this.matrix.row[row][col] );
      // Indicate error
      $( e.currentTarget ).toggleClass( 'sudoku-input-error', !isValid );
  }

  // Calculate section identifiers
  sectRow = Math.floor(row / 3);
  sectCol = Math.floor(col / 3);
  sectIndex = ( row % 3 ) * 3 + ( col % 3 );

  // Cache value in matrix
  this.matrix.row[row][col] = val;
  this.matrix.col[col][row] = val;
  this.matrix.sect[sectRow][sectCol][sectIndex] = val;
}

/**
 * Validate the current number inserted.
 *
 * @param {String} num The value that is inserted
 * @param {Number} rowID The row the number belongs to
 * @param {Number} colID The column the number belongs to
 * @param {String} oldNum The previous value
 * @returns {Boolean} Valid or invalid input
 */
validateNumber: function( num, rowID, colID, oldNum ) {
    var isValid: = true,
      // Section
      sectRow = Math.floor( rowID / 3 ),
      sectCol = Math.floor( colID / 3 );

    // This is given as the matrix component (old value in
    // case of change to the input) in the case of on-insert
    // validation. However, in the solver, validating the
    // old number is unnecessary.
    oldNum = oldNum || '';

    // Remove oldNum from the validation matrices,
    // if it exists in them.
    if ( this.validation.row[rowID].indexOf( oldNum ) > -1 ){
      this.validation.row[rowID].splice(
         this.validation.row[rowID].indexOf( oldNum ), 1
      );
    }
    if ( this.validation.col[colID].indexOf( oldNum ) > -1 ){
      this.validation.col[colID].splice(
         this.validation.col[colID].indexOf( oldNum ), 1
      );
    }
    if ( this.validation.sect[sectRow][sectCol].indexOf( oldNum ) > -1 ) {
        this.validation.sect[sectRow][sectCol].splice(
          this.validation.sect[sectRow][sectCol].indexOf( oldNum ), 1
        );
    }
    // Skip if empty value
    if ( num !== '' ) {
      // Validate value
      if (
        // Make sure value is numeric
        $.isNumeric( num ) &&
        // Make sure value is within range
        Number( num ) > 0 &&
        Number( num ) <= 9
      ) {
        // Check if it already exists in validation array
        if (
          $.inArray( num, this.validation.row[rowID] ) > -1 ||
          $.inArray( num, this.validation.col[colID] ) > -1 ||
          $.inArray( num, this.validation.sect[sectRow][sectCol] ) > -1
        ) {
          isValid = false;
        } else {
          isValid = true;
        }
      }

      // Insert new value into validation array even if it isn't
      // valid. This is on purpose: If there are two numbers in the same
      // row/col/section and one is replaced, the other still
      // exists and should be reflected in the validation.
      // The validation will keep records of dupicates so it can
      // remove them safely when validating later changes.
      this.validation.row[rowID].push( num );
      this.validation.col[colID].push( num );
      this.validation.sect[sectRow][sectCol].push( num )
    }
    return isValid;
}
