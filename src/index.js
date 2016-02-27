'use strict';

/* eslint no-unused-vars: 0 */
/* eslint no-else-return: 0 */

const s3 = require( './s3.js' );
const utils = require( './utils.js' );
const File = require( './schemas/fileSchema.js' );
const mongo = require( './mongo.js' );

module.exports.schema = {
    file: File,
};

module.exports.alias = function alias( userId, operation, fullPath ) {
    return mongo.alias( fullPath, userId, operation );
};

module.exports.read = function read( path ) {
    return s3.read( path )
    .catch( utils.handleError );
};

module.exports.search = function search( searchObj ) {
    return mongo.search( searchObj )
    .catch( utils.handleError );
};

module.exports.write = function write( path, content ) {
    return s3.write( path, content )
    .then(( rawData ) => {
        // Configure data

        return rawData;
    })
    .then(( data ) => {
        mongo.update( path, data );
    })
    .catch( utils.handleError );
};

module.exports.update = function update( path, content ) {
    return s3.write( path, content )
    .then(( rawData ) => {
        // Configure data

        return rawData;
    })
    .then(( data ) => {
        mongo.update( path, data );
    })
    .catch( utils.handleError );
};

module.exports.copy = function copy( path, destination ) {
    return s3.copy( path, destination )
    .then(( rawData ) => {
        // Configure data

        return rawData;
    })
    .then(( data ) => {
        mongo.update( path, data );
    })
    .catch( utils.handleError );
};

module.exports.destroy = function destroy( path ) {
    return s3.destroy( path )
    .then(( rawData ) => {
        // Configure data

        return rawData;
    })
    .then( mongo.destroy )
    .catch( utils.handleError );
};
