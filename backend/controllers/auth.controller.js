import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';

export const signup = async (req, res, next) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({username, email, password: hashedPassword}); 
    try {
    await newUser.save()
    res.status(201).json('User created successfully');
    }
    catch (err) {
  console.error('MongoDB Save Error:', err);
    }

};

export const signin = async(req, res,next) => {
    const { email, password } = req.body;
    try {
        const ValidUser = await User.findOne({ email }); 
        if (!ValidUser)  return next(errorHandler(404,  'User not found') ); 
        const ValidUserPassword = bcryptjs.compareSync(password, ValidUser.password);
        if (!ValidUserPassword) return next(errorHandler(400, 'Wrong Credentials'));
        const token = jwt.sign({ id: ValidUser._id }, process.env.JWT_SECRET);
        const {password: pass, ...rest}= ValidUser._doc; // Exclude password from the response
        
        // Frontend's SignIn.jsx expects { user: rest, token } for email/password as well
        res.cookie('access_token', token, {httpOnly: true}).status(200).json({ user: rest, token }); 
     } catch (error) {
        next(error);
    }
};

export const signOutUser = (req, res) => {
  res.clearCookie('access_token'); // if you're using cookies
  res.status(200).json({ success: true, message: 'Signed out successfully' });
};

export const google = async (req, res, next) => {
    try {
        console.log('Google Signin Req Body:', req.body);

        const user = await User.findOne({email: req.body.email});
        if(user){
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            const {password: pass, ...rest} = user._doc; // Exclude password from the response  
            
            // *** FIX HERE: Send both 'user' and 'token' in the JSON response ***
            res.cookie('access_token', token, {httpOnly: true}).status(200).json({ user: rest, token }); 
        }
        else{
            const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) ;
            const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
            const newUser = new User({
                username: req.body.name.split(' ').join('').toLowerCase() + Math.random().toString(36).slice(-4),
                email: req.body.email,
                password: hashedPassword,
                avatar: req.body.avatar,
            });
          
            await newUser.save();
            const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
            const {password: pass, ...rest} = newUser._doc; // Exclude password from the response
            
            // *** FIX HERE: Send both 'user' and 'token' in the JSON response ***
            res.cookie('access_token', token, { httpOnly: true }).status(200).json({ user: rest, token });
        }
    }catch(error){
         next(error);
    }
};

export const signOut = async (req, res, next) => {
  try {
    res.clearCookie('access_token', {
    httpOnly: true, // Must match how it was set
    path: '/',
  });
      res.status(200).json({ success: true, message: 'User has been logged out!' });

    res.status(200).json('User has been logged out!');
    } catch (error) {
    console.error('Sign out error:', error); // Log the specific error for debugging
    next(error); // Pass the error to your Express error handling middleware
  }
};
  