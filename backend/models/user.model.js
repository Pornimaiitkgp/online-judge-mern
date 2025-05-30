import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    avatar: {
        type: String,
        default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // Define possible roles
      default: 'user', // Default role for new users
    },
}, 
{timestamps: true});

const User = mongoose.model('User', userSchema);

export default User;