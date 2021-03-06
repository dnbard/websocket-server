'use strict';

const CryptoJS = require('crypto-js');

const logger = require('../core/logger').child({widget_type: 'loginController'});
const configs = require('../configs');
const Users = require('../db/users');
const Tokens = require('../db/tokens');

const SECRET_KEY = configs.get('secret');

exports.login = function(req, res, next){
    const login = req.body.login;
    const password = req.body.password;

    if (!login){
        return res.status(400).send('No login provided');
    }

    if (!password){
        return res.status(400).send('No password provided');
    }

    Users.findOne({ login: login }).exec().then(user => {
        if (!user){
            throw res.status(404).send(`User(login="${login}") not found"`);
        }

        const checkString = CryptoJS.SHA256(password + user.salt + SECRET_KEY).toString();
        logger.info(`User(id="${user._id}", login="${user.login}") are logging in`);

        if (checkString === user.password){
            return new Tokens({ userId: user._id }).save()
        } else {
            throw res.status(404).send('Invalid password');
        }
    }).then(token => {
        logger.info(`Token(id="${token._id}") for User(id="${token.userId}") was created`);
        return res.send(token);
    });
}
