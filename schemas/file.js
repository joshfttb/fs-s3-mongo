'use strict';

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const fileSchema = new Schema({
    metaDataId: Schema.Types.ObjectId,      // id which links to the metadata schema
    userId: Schema.Types.ObjectId,          // id which links to the user schema
    name: String,                           // name of the resource
    parent: String,                         //  file path to the parent for this user
});

module.exports = mongoose.model( 'File', fileSchema );
