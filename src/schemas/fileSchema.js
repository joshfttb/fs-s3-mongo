'use strict';

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    metaDataId: Schema.Types.ObjectId, // link to METADATA
    userId: Schema.Types.ObjectId, // link to User Collection
    name: String, // if the resource is a folder, it ends in a '/'
    parent: String, // '/top/mid/'
});

module.exports = mongoose.model( 'File', fileSchema );
