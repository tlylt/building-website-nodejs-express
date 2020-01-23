const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const createError = require('http-errors');
const bodyParser = require('body-parser');

const FeedbackService = require('./services/FeedbackService');
const SpeakersService = require('./services/SpeakerService');

// instantialize
const feedbackService = new FeedbackService('./data/feedback.json');
const speakersService = new SpeakersService('./data/speakers.json');

const routes = require('./routes'); // default to /index.js

const app = express();

const port = 3000;

// trust cookie through proxy
app.set('trust proxy', 1);

// cookie
app.use(
  cookieSession({
    name: 'session',
    keys: ['not_a_real_key', 'ditto_real_key'],
  })
);

// form
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// adding ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// use middleware to server static files
app.use(express.static(path.join(__dirname, './static')));

app.locals.siteName = 'ROUX Meetups';

app.use(async (request, response, next) => {
  try {
    const names = await speakersService.getNames();
    response.locals.speakerNames = names;
    return next();
  } catch (err) {
    return next(err);
  }
});

app.use(
  '/',
  routes({
    // same as feedbackService:feedbackService
    feedbackService,
    speakersService,
  })
);

app.use((request, response, next) => {
  return next(createError(404, 'File not found'));
});

// error handling middleware with four arguments
app.use((err, request, response) => {
  response.locals.message = err.message;
  console.error(err);
  const status = err.status || 500;
  response.locals.status = status;
  response.status(status);
  response.render('error');
});

app.listen(port, () => {
  console.log(`Express server listening on port ${port}!`);
});
