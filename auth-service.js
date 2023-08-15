const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs'); 

const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: Date,
    userAgent: String
  }]
});

let User;

module.exports = {
  userSchema: userSchema,
  initialize: function () {
    return new Promise((resolve, reject) => {
      let db = mongoose.createConnection('mongodb+srv://preetp1024:February_1523@cluster0.hc7wyrh.mongodb.net/web322?retryWrites=true&w=majority');

      db.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        reject(err);
      });

      db.once('open', () => {
        User = db.model('User', userSchema);
        resolve();
      });
    });
  },

  registerUser: function (userData) {
    return new Promise((resolve, reject) => {
      if (userData.password !== userData.password2) {
        reject('Passwords do not match');
      } else {
        bcrypt.hash(userData.password, 10)
          .then(hash => {
            let newUser = new User({
              userName: userData.userName,
              password: hash,
              email: userData.email,
              loginHistory: []
            });

            newUser.save((err) => {
              if (err) {
                if (err.code === 11000) {
                  reject('User Name already taken');
                } else {
                  reject(`There was an error creating the user: ${err}`);
                }
              } else {
                resolve();
              }
            });
          })
          .catch(err => {
            reject('There was an error encrypting the password');
          });
      }
    });
  },

  checkUser: function (userData) {
    return new Promise((resolve, reject) => {
      User.find({ userName: userData.userName }, (err, users) => {
        if (err) {
          reject(`Unable to find user: ${userData.userName}`);
        } else if (users.length === 0) {
          reject(`Unable to find user: ${userData.userName}`);
        } else {
          bcrypt.compare(userData.password, users[0].password)
            .then(result => {
              if (!result) {
                reject(`Incorrect Password for user: ${userData.userName}`);
              } else {
                users[0].loginHistory.push({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent
                });

                users[0].update({ loginHistory: users[0].loginHistory }, (err) => {
                  if (err) {
                    reject(`There was an error verifying the user: ${err}`);
                  } else {
                    resolve(users[0]);
                  }
                });
              }
            })
            .catch(err => {
              reject(`There was an error verifying the user: ${err}`);
            });
        }
      });
    });
  }
};
