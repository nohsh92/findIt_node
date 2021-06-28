const express = require('express')
const mongoose = require("mongoose")
const dotenv = require('dotenv').config();
const multer=require('multer')
const path= require('path')
const model = require('./model')
var jwt = require('jsonwebtoken');
var crypto = require('crypto');

const connectionString = 'mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@finditcluster.b7xew.mongodb.net/test?authSource=admin&replicaSet=atlas-jly7ul-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true'
const dbusername = process.env.DB_USERNAME
const dbpassword = process.env.DB_PASSWORD
const port = process.env.PORT

var jwt = require('jsonwebtoken');

const app = express();

//db
async function connectDB() {
    await mongoose.connect(connectionString, {
      dbName: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      pass: process.env.DB_PASSWORD,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
    });
        console.log("db connected");
}
connectDB()

app.get('/', (req, res) => {
  res.send('We are at home')
})

// this takes the post body
app.use(express.json({extended: false}));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});
app.use('/uploads', express.static(__dirname +'/uploads'));

// Schema for login
const schema = new mongoose.Schema({ email: 'string', password: 'string' });
const User = mongoose.model('User', schema);

// Multer configuration for picture files
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads')
  },

  filename: function(req,file,cb) {
    cb(null, /*new Date().toISOString()+*/file.originalname
    )
  }
})

// signup route api
app.post('/signup', async (req, res) => {
    const {email, password} = req.body;
    console.log(email);
    console.log(password);

    let user = await User.findOne({email});

    if(user) {
      return res.json({msg:"Email already taken"});
    }

    if(user==null) {
      return res.json({msg:"Null user not permitted"});
    }

    user = new User({
        email,
        password,
    });
    console.log(user)

    await user.save();
    var token = jwt.sign({ id: user.id }, "password");
    res.json({token:token});
})

  // login route api
app.post('/login', async (req, res) => {
  const {email, password} = req.body;
  console.log(email);
  console.log(password);

  let user = await User.findOne({email});
  console.log(user);

  if(!user) {
    return res.json({msg:"no user found with that email"});
  }

  if(user.password !== password) {
    return res.json({msg: "Password is not correct"});
  }

  var token = jwt.sign({ id: user.id }, "password");
  return res.json({token:token});

})

// upload route api
var upload = multer({storage: storage})
app.post('/upload', upload.single('myFile'), async(req, res, next) => {    
  const file = req.file    
  if (!file) {      
    const error = new Error('Please upload a file')      
    error.httpStatusCode = 400      
    return next("hey error")    
  }                  
  const imagepost= new model({        
    image: file.path,
    name: req.body.name,
    category: req.body.category,
  })

  // const uploadingFile = req.body.image
  const uploadingFile = imagepost.image
  console.log(uploadingFile)
  let imageFileExists = await model.findOne({image: uploadingFile});

  const itemName = imagepost.name;
  console.log('Item Name is ' + itemName);
  const itemCategory = imagepost.category;
  console.log('Item Category is ' + itemCategory);


  // Writing all the data to a DB
  if(imageFileExists) {
    console.log("This file already exists")
  }
  else{
    const savedimage= await imagepost.save()      
    res.json(savedimage) 
  }
       
})   

app.get('/image',async(req, res)=>{   
  const image = await model.find()   
  res.json(image)     
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
