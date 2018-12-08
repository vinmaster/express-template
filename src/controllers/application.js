const Helper = require(`${process.cwd()}/src/lib/helper`);
const Logger = require(`${process.cwd()}/src/lib/logger`);
const Models = require(`${process.cwd()}/src/models/index`);
const { User } = Models;

module.exports = {
  async home(_req, res, _next) {
    res.render('home');
  },

  async register(req, res, _next) {
    if (req.method === 'GET') {
      res.render('register');
    } else if (req.method === 'POST') {
      const { username, password, passwordConfirmation } = req.body;
      if (password !== passwordConfirmation) {
        return res.render('register', { error: 'Password confirmation does not match' });
      }
      const user = await User.register(username, password);
      if (!user) {
        return res.render('register', { error: 'Error registering' });
      }
      return res.redirect('/login');
    }
  },

  async login(req, res, _next) {
    if (req.method === 'GET') {
      if (req.session && req.session.userId) {
        return res.redirect('/');
      }
      res.render('login');
    } else if (req.method === 'POST') {
      const { username, password } = req.body;
      let user = await User.login(username, password);
      if (!user) {
        return res.render('login', { error: 'Error Logging In' });
      }
      user.lastLoginAt = new Date();
      user = await user.save();
      req.session.userId = user.id;
      req.session.username = user.username;
      // Sometimes session doesn't get saved fast enough
      await new Promise(((resolve, reject) => {
        req.session.save(err => {
          if (err) reject(err);
          resolve();
        });
      }));
      return res.redirect('/');
    }
  },

  async logout(req, res, _next) {
    if (!req.session) return res.redirect('/login');
    req.session.destroy(_err => {
      res.redirect('/login');
    });
  },

  async config(req, res, _next) {
    Helper.renderSuccessJson(res, { version: '1.0' });
  },
  error(req, res, next) {
    // Logger.error('THIS IS TEST ERROR');
    try {
      // next(new Error('This is test error')); // 500
      throw Helper.createError('This is test error'); // 400
      // next(Helper.createError('This is test error')); // 400
      // next('This is test error'); // 400
      // throw new Error('test node error'); // 500
      // req.test.test; // 500
    } catch (err) {
      next(err);
    }
  },
  test(_req, res, _next) {
    Logger.info('THIS IS TEST INFO');
    Helper.renderSuccessJson(res, 'test');
  },
};
