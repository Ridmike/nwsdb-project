const usersService = require('./users.service');

async function listUsers(req, res, next) {
  try {
    const users = await usersService.listUsers();
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
}

async function listDirectory(req, res, next) {
  try {
    const users = await usersService.listDirectory();
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await usersService.createUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { uid } = req.params;
    const { role, active } = req.body || {};

    if (uid === req.user.uid) {
      if (role !== undefined && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'You cannot remove your own administrator role.'
        });
      }
      if (active === false) {
        return res.status(400).json({
          success: false,
          message: 'You cannot disable your own account.'
        });
      }
    }

    const user = await usersService.updateUser(uid, req.body);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await usersService.createResetLink(req.params.uid, req.body?.continueUrl);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers, listDirectory, createUser, updateUser, resetPassword };
