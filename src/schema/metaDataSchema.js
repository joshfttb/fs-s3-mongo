'use strict';

const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;

// SCHEMAS
// define our file schema
const metaDataSchema = new Schema({
    guid: String, // s3 guid
    mimeType: String, // http://www.freeformatter.com/mime-types-list.html (includes folder type)
    size: Number, // in bytes
    dateCreated: Date, // https://docs.mongodb.org/v3.0/reference/method/Date/
    lastModified: Date, // https://docs.mongodb.org/v3.0/reference/method/Date/
    children: [String], // an array of file and folder names

});

// and attach it to our model
Meta = mongoose.model( 'Meta', metaDataSchema );
