// import "./utils/Parser";
import "./utils/Temp";
import "./managers/Cron";
import { CONFIG } from "./utils/Config";

const express = require('express');
const cors = require('cors')
const path = require('path');
const app = express();
import { Request, Response } from 'express';

const Port = CONFIG.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');


const webPath = path.join(__dirname, '../akcijos_frontend/build/web');

app.use(express.static(webPath));
app.use(express.static(path.join(__dirname, "public")));
app.use('/api', require('./routes/api'))


app.get('/', (req : Request, res : Response) => {
  res.sendFile(path.join(webPath, 'index.html'));
});

app.listen(Port, function () {
    console.log(`Server running on port: ${Port}.`);
})