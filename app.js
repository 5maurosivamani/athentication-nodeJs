require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

const app = express()

app.use(bodyParser.urlencoded({extended:true}))

app.set('view engine', 'ejs');

app.use(express.static("public"))

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true 
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema)

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

    console.log(req.body);

    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if(err) {
            console.log(err);
            res.redirect("/register")
        } else {           
            passport.authenticate('local')(req, res, () => {
                res.redirect('/secrets');
            })        
        } 
    })
})

// LOGIN EXISTING USER WITH CREDENTIAL
app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, (err)=>{
        if(err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, ()=>{
                res.redirect('/secrets');
            })
        }
    })
})

// Logout
app.get("/logout", function(req, res){
    req.logout((err)=>{
        if(!err) {
            res.redirect("/");
        }
    });

});


// Secret route

app.get("/secrets", (req, res)=> {
    if(req.isAuthenticated){
        User.find({secret: {$ne: null}}, (err, foundUsers) => {
            if(!err) {
                if(foundUsers) {
                    res.render("secrets", {foundUsers : foundUsers})
                }
            }
        })
    } else {
        res.redirect("/login")
    }
})

// SUBMIT A SECRET 
app.get("/submit", (req, res) => {
    res.render("submit")
})

app.post("/submit", (req, res) => {

    User.findById(req.user._id, (err, foundUser) => {
        if(!err) {
            foundUser.secret = req.body.secret
            foundUser.save((err) => {
                if(!err) {
                    console.log("Successfully secret added!");
                    res.redirect("/secrets")
                }
            })
        }
    })
})

const port = 3000

app.listen(port, (err)=>{
    if(!err) {
        console.log("Sever running on port: " + port);
    }
})