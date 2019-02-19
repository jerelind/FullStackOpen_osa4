const mongoose = require('mongoose')

const url = 'mongodb://DATABASE:DATABASEPW@ds129462.mlab.com:29462/blogi'

mongoose.connect(url)

const Blog = mongoose.model('Blog', {
    title: String,
    author: String,
    url: String,
    likes: Number,
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
  })

module.exports = Blog