'use strict';

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

const metadataSchema = new Schema({
    guid: String,         // s3 guid
    mimeType: String,     // http://www.freeformatter.com/mime-types-list.html (includes folder type)
    size: Number,         // in bytes
    dateCreated: Date,
    lastModified: Date,
    children: [String],
});

// and attach it to our model
module.exports = mongoose.model( 'Meta', metadataSchema );
