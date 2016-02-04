'use strict';

/* eslint no-unused-vars: 0 */

// Read content of s3 bucket by GUID
module.exports.read = function read( GUID ) {
    return Promise.reject( 'NOT_IMPLEMENTED' );
};

// Write GUID: content to s3 bucket
module.exports.write = function write( GUID, content ) {
    return Promise.reject( 'NOT_IMPLEMENTED' );
};

// Copy one GUID's content to another GUID
module.exports.copy = function copy( fromGUID, toGUID ) {
    return Promise.reject( 'NOT_IMPLEMENTED' );
};

// Delete from s3 by GUID
module.exports.destroy = function destroy( GUID ) {
    return Promise.reject( 'NOT_IMPLEMENTED' );
};

// Grab content by GUID, then compress and return to the client
module.exports.download = function download( GUID, compressionType ) {
    return Promise.reject( 'NOT_IMPLEMENTED' );
};
