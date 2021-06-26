const mongoose = require('mongoose');

const itemSchema= mongoose.Schema(
  {
    name: 'string',
    category: 'string',
    keepdrop: 'string',
    location: 'string',
    details: 'string',
    image:{
        type: String,
        required: true
    },
  }
);

module.exports = mongoose.model("Images", itemSchema)

// Schema for login
