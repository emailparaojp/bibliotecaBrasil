'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/adminAuthController');

const router = Router();

router.post('/login', ctrl.login);

module.exports = router;
