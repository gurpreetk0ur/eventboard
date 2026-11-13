const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  isAdmin: { type: Boolean, default: false },
});

userSchema.plugin(passportLocalMongoose, {
  passwordValidator(password, cb) {
    if (!password || password.length < 6) {
      return cb(new Error('Password must be at least 6 characters long.'));
    }
    return cb(null);
  },
});

// Only these fields are ever sent to the client
userSchema.methods.toPublic = function toPublic() {
  return { _id: this._id, username: this.username, isAdmin: this.isAdmin };
};

module.exports = mongoose.model('User', userSchema);
