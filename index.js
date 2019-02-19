const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')
const Blog = require('./modules/blog')
const User = require('./modules/user')
const bcrypt = require('bcryptjs')
const loginRouter = require('./controllers/login')
const jwt = require('jsonwebtoken')

mongoose.connect('mongodb://blogi:blogi1@ds129462.mlab.com:29462/blogi')

app.use(cors())
app.use(bodyParser.json())
app.use('/api/login', loginRouter)

require('dotenv').config()

const formatBlog = (blog) => {
    return {
        title: blog.title,
        author: blog.author,
        url: blog.url,
        likes: blog.likes,
        id: blog._id,
        user: blog.user
    }
}

const formatUser = (user) => {
    return {
        id: user._id,
        username: user.username,
        name: user.name,
        ofAge: user.ofAge,
        blogs: user.blogs
    }
}

const getTokenFrom = (request) => {
    const auth = request.get('authorization')
    if(auth && auth.toLowerCase().startsWith('bearer ')) {
        return auth.substring(7)
    }
    return null
}

app.get('/', (req, res) => {
    res.send('<h1>Blogit</h1>')
})

app.get('/api/blogs', async (req, res) => {
  const blogs = await Blog
    .find({})
    .populate('user', {username: 1, name: 1})

    res.json(blogs.map(formatBlog))
})

app.post('/api/blogs', async (req, res) => {
    const body = req.body

    try {
        const token = getTokenFrom(req)
        const decodedToken = jwt.verify(token, process.env.SECRET)

        if (!token || !decodedToken.id) {
            return res.status(401).json({error: 'Token missing or invalid'})
        }

        if(body.title === undefined)  {
            return res.status(400).json({error: 'Content missing'})
        }

        const user = await User.findById(decodedToken.id)

        const blog = new Blog({
            title: body.title,
            author: body.author,
            url: body.url,
            likes: body.likes,
            user: user._id
        })
    
        const savedBlog = await blog.save()
    
        user.blogs = user.blogs.concat(savedBlog._id)
        await user.save()
    
        res.json(formatBlog(blog))
    } catch(exception) {
        if(exception.name === 'JsonWebTokenError') {
            res.status(401).json({error: exception.message})
        } else {
            console.log(exception)
            res.status(500).json({error: 'Something went wrong...'})
        }
    }
})

app.delete('/api/blogs/:id', (req , res) => {
    Blog
        .findOneAndDelete(req.params.id)
        .then(result => {
            res.status(204).end()
        })
        .catch(error => {
            console.log(error)
            res.status(400).send({error: 'Malformatted id'})
        })
})

app.put('/api/blogs/:id', (req, res) => {
    const body = req.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        id: body._id
    }

    Blog
        .findByIdAndUpdate(req.params.id, blog, {new: true})
        .then(updatedBlog => {
            res.json(formatBlog(updatedBlog))
        })
        .catch(error => {
            console.log(error)
            res.status(400).send({error: 'Malformatted id'})
        })
})

app.post('/api/users', async (req, res) => {
    try {
        const body = req.body

        const existingUser = User.find({username: body.username})
        if(existingUser.length > 0) {
            return res.status(400).json({error: 'Username must be unique'})
        }
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(body.password, saltRounds)

        const user = new User({
            username: body.username,
            name: body.name,
            ofAge: body.ofAge,
            passwordHash
        })

        const savedUser = await user.save()

        res.json(savedUser)
    } catch (exception) {
        console.log(exception)
        res.status(500).json({error: 'Something went wrong...'})
    }
})

app.get('/api/users', async (req, res) => {
    const users = await User
        .find({})
        .populate('blogs', {title: 1, author: 1, url: 1, likes: 1})

    res.json(users.map(formatUser))
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})