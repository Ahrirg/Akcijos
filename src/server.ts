import "./utils/Parser";
const express = require('express');
const cors = require('cors')
const path = require('path');
const app = express();

const Port = 6969;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');



app.use(express.static(path.join(__dirname, "public")));
app.use('/api', require('./routes/api'))

app.get('/', (req : any, res : any) => {
    res.render('Main.ejs');
})

app.listen(Port, function() {
    console.log(`Server running on port: ${Port}.`);
})