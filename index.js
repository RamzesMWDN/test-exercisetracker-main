const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//process.env.MONGO_URI
//console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date,
  user: {type: mongoose.Types.ObjectId, ref: "User"}
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", (req, res) => 
{ 
  console.log("TEST GET");
  User.find((err,data)=>
  {
    if (err) return console.error(err);
    res.json(data);
  })
});

app.post("/api/users", (req, res) => 
{
  console.log("TEST1");
  let name = req.body.username;
  let userData = new User({username:name});
  userData.save((err,data)=>
  {
    if (err) return console.error(err);

    res.json(data);

  })
});

app.post("/api/users/:_id/exercises", (req, res) => 
{
  console.log("TEST2");
  let idUser = req.params._id;
  let desc = req.body.description;
  let dur = req.body.duration;

  console.log(idUser + " " + desc + " " + dur);
  User.findById(idUser,(err,user)=> 
  {
    if(err) return res.json(err);

    Exercise.create(
      {
        description: desc,
        duration: dur,
        date: new Date(req.body.date),
        user: user
      }, (err,exerc) => 
      {
        if(err) return res.json(err);

        res.json(
          {
            
              username: user.username,
              description: exerc.description,
              duration: exerc.duration,
              date: exerc.date.toDateString(),
              _id: exerc._id
          })

      }
    );

      }
    )
    //res.json(user);
    
  });

  app.get("/api/users/:_id/logs", (req, res) => 
  {
    let idUser = req.params._id;
    //from=2024-01-01&to=2025-01-01&limit=500
    let dateFrom = req.query.from;
    let dateTo = req.query.to;
    let limitRec = req.query.limit;
  
    User.findById(idUser,(err,user)=> 
    {
      if(err) return res.json(err);

      const id = ObjectId(idUser);

      let filter = {user:id}
      if(dateFrom && !dateTo)
        filter.date = { $gte: new Date(dateFrom)};
      else if(!dateFrom && dateTo)
        filter.date = { $lte: new Date(dateTo)};
      else if(dateFrom && dateTo)
        filter.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo)};

      let options = {};
      if(limitRec)
      {
        let num = Number.parseInt(limitRec);
        options = {limit:num};
      }

      // Exercise.find({user:id, date: {
      //   $gte: new Date(dateFrom), 
      //   $lte: new Date(dateTo)
      Exercise.find(filter, null, options, (err,data) => 
      {
        if(err) return res.json(err);
        res.json({
          username: user.username,
          count: data.length,
          _id: idUser,
          logs: data.map(d => ({ description: d.description, duration: d.duration, date:d.date.toDateString() }))
        });
      })
      // .select({ description: true,duration:true, date:true })
      // .exec();
  
    });
      
    });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
