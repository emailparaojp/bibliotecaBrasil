'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/authController');
const { authMembro } = require('../middleware/auth');

const router = Router();

router.post('/register', ...ctrl.registerValidators, ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authMembro, ctrl.me);
router.put('/me', authMembro, ctrl.updateMe);

module.exports = router;
