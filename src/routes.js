const express = require('express');
const RateLimit = require('express-rate-limit');

const Helper = require(`${process.cwd()}/src/lib/helper`);
const ApplicationController = require(`${process.cwd()}/src/controllers/application`);
const router = express.Router();
const limiter = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit requests per window
  delayMs: 0,
  skip: Helper.skipReq,
});
const passSessionUserToView = (req, res, next) => {
  const keysToPass = ['userId', 'username'];
  if (req.session && keysToPass.every(key => Object.keys(req.session).includes(key))) {
    Helper.updateObjectWithSource(res.locals, req.session, { allowed: keysToPass });
  }
  next();
};

router.use(limiter);
router.use(passSessionUserToView);

// HTML routes
router.get('/', Helper.asyncWrap(ApplicationController.home));
router.all('/register', Helper.asyncWrap(ApplicationController.register));
router.all('/login', Helper.asyncWrap(ApplicationController.login));
router.all('/logout', Helper.asyncWrap(ApplicationController.logout));

// API routes
const apiRouter = express.Router();
router.use('/api', apiRouter);
apiRouter.get('/config(.json)?', Helper.asyncWrap(ApplicationController.config));
apiRouter.get('/test(.json)?', Helper.asyncWrap(ApplicationController.test));
apiRouter.get('/error', Helper.asyncWrap(ApplicationController.error));

// Create 404 Not Found for next middleware
apiRouter.use((req, res, next) => {
  next(Helper.createError('Not Found', 404));
});

// Final error middleware
apiRouter.use((err, req, res, _next) => {
  const {
    status, message, info, error,
  } = Helper.digestError(err);
  console.error(error); // eslint-disable-line no-console
  // res.format({
  //   // Based on the `Accept` http header
  //   'text/html': () => res.render(info), // Form Submit, Reload the page
  //   'application/json': () => res.json(info), // Ajax call, send JSON back
  // });
  // info = error.stack.replace(/(?:\r\n|\r|\n)/g, '<br/>');
  // info = info.replace(/ /g, '&nbsp;');
  // info = info.replace(/[a-z_-\d]+.js:\d+:\d+/gi, '<mark>$&</mark>');
  // return res.send(info);

  res.status(status).json({
    status,
    error: {
      message,
      info,
    },
    payload: null,
  });
});

router.use((req, res, next) => {
  next(Helper.createError('Not Found', 404));
});
router.use((err, req, res, _next) => {
  const {
    status, message, error,
  } = Helper.digestError(err);
  let {
    info,
  } = Helper.digestError(err);
  console.error(error); // eslint-disable-line no-console
  info = error.stack.replace(/(?:\r\n|\r|\n)/g, '<br/>');
  info = info.replace(/ /g, '&nbsp;');
  info = info.replace(/[a-z_-\d]+.js:\d+:\d+/gi, '<mark>$&</mark>');
  return res.status(status).render('error', { status, message, info });
});

module.exports = router;
