'use strict';

/* eslint no-unused-vars: 0 */

const utils = require( './utils.js' );
const Meta = require( './schemas/metaDataSchema.js' );
const File = require( './schemas/fileSchema.js' );
const Schema = require( './schemas/schema.js' );


module.exports.search = function search( pathObj ) {
    // TODO: hit mongo and search
    return Promise.reject( 'NOT_IMPLEMENTED' );
};

module.exports.update = function update( pathObj, data ) {
    // TODO: hit mongo and update

    //

    return Promise.reject( 'NOT_IMPLEMENTED' );
};

module.exports.destroy = function destroy( pathObj ) {
    // TODO: hit mongo and delete

    return Promise.reject( 'NOT_IMPLEMENTED' );
};
