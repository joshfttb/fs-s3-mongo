'use strict';

/* eslint no-unused-vars: 0 */

module.exports.read = function read( path ) {
    // TODO: hit bucket and read

    return Promise.reject( 'NOT_IMPLEMENTED' );
};

module.exports.write = function write( path, content ) {
    // TODO: hit bucket and write

    return Promise.reject( 'NOT_IMPLEMENTED' );
};

module.exports.copy = function copy( path, destination ) {
    // TODO: hit bucket and copy

    return Promise.reject( 'NOT_IMPLEMENTED' );
};

module.exports.destroy = function destroy( path ) {
    // TODO: hit mongo and delete

    return Promise.reject( 'NOT_IMPLEMENTED' );
};