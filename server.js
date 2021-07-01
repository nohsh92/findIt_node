const express = require('express')
const mongoose = require("mongoose")
const dotenv = require('dotenv').config();
const multer=require('multer')
const path= require('path')
const model = require('./model')

const connectionString = 'mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@finditcluster.b7xew.mongodb.net/test?authSource=admin&replicaSet=atlas-jly7ul-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true'
const dbusername = process.env.DB_USERNAME
const dbpassword = process.env.DB_PASSWORD
const port = process.env.PORT

var jwt = require('jsonwebtoken');

var crypto = require('crypto');

const KEY = process.env.JWTKEY;

const app = express();

// TODO: Use the encryption scheme to save and retrievethe encrypted password to MongoDB

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
app.post('/signup', express.urlencoded(), async (req, res) => {
  // in a production environment you would ideally add salt and store that in the database as well
  // or even use bcrypt instead of sha256. No need for external libs with sha256 though
  const {email, password} = req.body;
  var encryptedPassword = crypto.createHash('sha256').update(password).digest('hex');
  let user = await User.findOne({email});
  if(user) {
    console.error("can't create user " + req.body.email);
    res.status(409);
    res.send("An user with that username already exists");
  } else {
    console.log("Can create user " + req.body.email);
    console.log("User submitted password: " + req.body.password);
    console.log("Encrypted password: " + encryptedPassword);
    user = new User({
      email,
      password,
    });
    console.log(user)

    await user.save();
    res.status(201);
    var token = jwt.sign({ id: user.id }, "password");
    res.json({token:token});
    // res.send("Success");
  }
});

  // login route api
  app.post('/login', express.urlencoded(), async (req, res) => {
    if(req.body.email == null) {
      console.log("There's something wrong with the user email")
      res.send("There's no user matching that");
    } 
    else {
      console.log("")
      console.log("")
      console.log("") 
      console.log(req.body.email + " attempted login");
      const {email, password} = req.body;
      let user = await User.findOne({email});
      console.log("") 
      console.log("email submitted for login is : ", email)
      console.log("password submitted for login is : ", password)
      console.log("status of user is ", user)
      console.log("")
      console.log("User retrieved from Mongo is: ", user.email)
      console.log("User retrieved from payload is: ", req.body.email)
      console.log("")
      console.log("Password retrieved from Mongo is: ", user.password)
      console.log("Password retrieved from payload is: ", req.body.password)
      var encryptedPassword = crypto.createHash('sha256').update(password).digest('hex');
      if(user.email == req.body.email && user.password == req.body.password) {
        var payload = {
          email: req.body.email,
        };
        var token = jwt.sign(payload, KEY, {algorithm: 'HS256', expiresIn: 30});
        console.log("Success");
        res.send(token);
      } else {
        console.error("Failure");
        res.status(401)
        res.send("There's no user matching that");
      }
      console.log("")
      console.log("")
      console.log("")
    }
  });

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


app.get('/data', function(req, res) {
  var str = req.get('Authorization');
  try {
    jwt.verify(str, KEY, {algorithm: 'HS256'});
    res.send("Very Secret Data");
  } catch {
    res.status(401);
    res.send("Bad Token");
  }
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
