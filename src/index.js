'use strict';

/* eslint no-unused-vars: 0 */

const mongo = require( './mongo.js' );
const s3 = require( './s3.js' );
const utils = require( './utils.js' );
const Meta = require( './schemas/metaDataSchema.js' );
const File = require( './schemas/fileSchema.js' );

module.exports.schema.meta = Meta;
module.exports.schema.file = File;


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
