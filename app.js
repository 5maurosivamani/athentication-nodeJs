require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const encrypt  = require("mongoose-encryption")

const app = express()

app.use(bodyParser.urlencoded({extended:true}))

app.set('view engine', 'ejs');

app.use(express.static("public"))

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const encryptKey = process.env.ENCRYPTKEY

userSchema.plugin(encrypt, { secret: encryptKey,  encryptedFields: ["password"] })

const User = mongoose.model("User", userSchema)

app.get("/", (req, res)=>{
    res.render("home")
})

app.get("/register", (req, res)=>{
    res.render("register")
})

app.get("/login", (req, res)=>{
    res.render("login")
})

// REGISTER A NEW USER 
app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save((err) => {
        if(!err) {
            console.log("Successfully Inserted a new user.");
            res.render("secrets")
        }
    })
})

// LOGIN EXISTING USER WITH CREDENTIAL
app.post("/login", (req, res) => {
    const userName = req.body.username
    const password = req.body.password

    User.findOne({email: userName}, (err, foundResult) => {
        if(err) {
            res.send(err)
        } else {
            if(foundResult) {
                if(foundResult.password === password) {
                    res.render("secrets")
                } 
            } 
        }
    })
})


const port = 3000

app.listen(port, (err)=>{
    if(!err) {
        console.log("Sever running on port: " + port);
    }
})