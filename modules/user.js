const mongoose = require('mongoose')

const User = mongoose.model('User', {
  username: String,
  name: String,
  ofAge: Boolean,
  passwordHash: String,
  blogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }]
})

module.exports = User