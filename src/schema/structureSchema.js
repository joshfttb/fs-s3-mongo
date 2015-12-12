var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//define our structure schema
var structureSchema  = new Schema({
  user: Objectid,
  children: [{
    fileId: Objectid,
    //denormalize permissions
    permissions: [{
      userId: Objectid,
      permissions: [String]
    }],
    children: []
  }]
});

//and attach it to our model
var Structure = mongoose.model('Structure', structureSchema);