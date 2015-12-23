'use strict';

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    _id: Objectid,
    metaDataId: Objectid, // link to METADATA
    userId: Objectid, // link to User Collection
    name: String, // if the resource is a folder, it ends in a '/'
    parent: String, // '/top/mid/'
});

File = mongoose.model( 'File', fileSchema );
