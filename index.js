const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//process.env.MONGO_URI
//console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({ username: { type: String, required: true } });
const User = mongoose.model('User', userSchema);
const exerciseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: Date,
    user: {type: mongoose.Types.ObjectId, ref: "User"}
  });
const Exercise = mongoose.model("Exercise", exerciseSchema);
let countCall = 0;
app.get('/', (req, res) => 
{
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/users", (req, res) => 
{ 
  countCall++;
  console.log("GET USERS " + countCall);
  User.find((err,data)=>
  {
    if (err) return console.error(err);
    res.json(data);
  })
});

app.post("/api/users", (req, res) => 
{
  countCall++;
  console.log("ADD USERS " + countCall);
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
  countCall++;
  console.log("ADD Exercises " + countCall);
  let idUser = req.params._id;
  let desc = req.body.description;
  let dur = req.body.duration;
  let strDate = req.body.date;

  if(!strDate)
     strDate = new Date().toString();

  console.log(idUser + " " + desc + " " + dur + " " + strDate);
  User.findById(idUser,(err,user)=> 
  {
    if(err) return res.json(err);

    let exerciseData = new Exercise(
      {
        description: desc,
        duration: dur,
        date: new Date(strDate),
        user: user
      }
    );    
    exerciseData.save((err,exerc) => 
      {
        if(err) return res.json(err);
        //{"_id":"662bab250b80b70013c9be9c","username":"t2","date":"Fri Nov 11 2011","duration":90,"description":"tttt"}
        console.log(exerc);
        res.json(
          {
              _id: user._id,
              username: user.username,
              date: exerc.date.toDateString(),
              duration: exerc.duration,
              description: exerc.description,
          })

      }
    );

    });
    //res.json(user);
    
  });

  app.get("/api/users/:_id/logs", (req, res) => 
  {
    try
    {
    let idUser = req.params._id;
    //from=2024-01-01&to=2025-01-01&limit=500
    let dateFrom = req.query.from;
    let dateTo = req.query.to;
    let limitRec = req.query.limit;
  
    countCall++;
    console.log("GET log " + countCall);
    //console.log("GET " + idUser);
    console.log("Query " + req.query);
    User.findById(idUser,(err,user)=> 
    {
      if(err) return res.json(err);

      const id = ObjectId(idUser);

      let result = {};
      result._id = idUser;
      result.username = user.username;
      //"from":"Mon Jan 01 2024","to":"Wed Jan 01 2025","count":1
      let filter = {user:id}
      if(dateFrom && !dateTo)
      {
        var fromDate = new Date(dateFrom);
        filter.date = { $gte: fromDate};
        result.from = fromDate.toDateString();
      }
      else if(!dateFrom && dateTo)
      {
        var toDate = new Date(dateTo);
        filter.date = { $lte: toDate};
        result.to = toDate.toDateString();
      }
      else if(dateFrom && dateTo)
      {
        var fromDate = new Date(dateFrom);
        var toDate = new Date(dateTo);
        filter.date = { $gte: fromDate, $lte: toDate};
        result.from = fromDate.toDateString();
        result.to = toDate.toDateString();
      }

      let options = {};
      if(limitRec)
      {
        let num = Number.parseInt(limitRec);
        options = {limit:num};
      }

      Exercise.find(filter, null, options, (err,data) => 
      {
        if(err) return res.json(err);

        result.count = data.length;
        //result.log = data; 
        result.log = data.map(d => ({ description: d.description, duration: d.duration, date:d.date.toDateString() }));
        console.log(result);
        res.json(result);

          // username: user.username,
          // count: data.length,
          // _id: idUser,
          // logs: data.map(d => ({ description: d.description, duration: d.duration, date:d.date.toDateString() }))
      })
      // .select({ description: true,duration:true, date:true })
      // .exec();
  
    });
  }
  catch
  {
    console.error("Error on log call" );
  }
      
    });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
