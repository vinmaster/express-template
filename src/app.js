const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
// const favicon = require('serve-favicon');
const path = require('path');

// Create express application
const app = express();
const env = app.get('env');
const Helper = require(`${process.cwd()}/src/lib/helper`);

// Load .env for development before process.env is used
if (env === 'development' || env === 'test') {
  require('dotenv').config(); // eslint-disable-line
}

// Morgan
if (env === 'development') {
  app.use(morgan('dev', { skip: Helper.skipReq }));
} else if (env !== 'test') {
  app.use(morgan('[:date[clf]] ":method :url" :status :response-time ms', { skip: Helper.skipReq }));
}

// Handle node errors
process.on('unhandledRejection', error => {
  console.error(`unhandledRejection ${error.stack}`); // eslint-disable-line no-console
  throw error;
});
process.on('uncaughtException', error => {
  console.error(`uncaughtException ${error.stack}`); // eslint-disable-line no-console
  throw error;
});

const models = require(`${process.cwd()}/src/models/index`);
const force = process.env.DB_FORCE_SYNC === 'true';
const SequelizeStore = require('connect-session-sequelize')(session.Store);

models.sequelize.sync({ force }).then(() => {
  console.log('Sequelize synced'); // eslint-disable-line no-console
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new SequelizeStore({
    checkExpirationInterval: 60 * 60 * 1000, // 60 minutes. The interval at which to cleanup expired sessions in milliseconds.
    expiration: 7 * 24 * 60 * 60 * 1000, // 7 days. The maximum age (in milliseconds) of a valid session.
    db: models.sequelize,
  }),
}));

// Allow CORS
app.use(cors());

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Cookie parser
app.use(cookieParser());

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set views directory
app.set('views', path.join(__dirname, '/views'));

// Set up public folder
app.use(express.static(`${process.cwd()}/public`));

// Favicon
// app.use(favicon(path.join(`${process.cwd()}/public`, 'favicon.ico')));

// Register routes
const routes = require(`${process.cwd()}/src/routes`);
app.use('/', routes);

module.exports = app;
