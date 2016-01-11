'use strict';

// START MONGOOSE
const mongoose = require( 'mongoose' );

// todo: this needs to connect to something
// todo: differentiate database based on production vs staging
mongoose.connect( 'mongodb://localhost/test' );
