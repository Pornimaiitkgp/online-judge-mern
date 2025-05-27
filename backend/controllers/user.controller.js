import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';

export const updateUser = async (req, res) => {
  try {
    // Hash password if it's included
    if (req.body.password) {
      const salt = bcryptjs.genSaltSync(10);
      req.body.password = bcryptjs.hashSync(req.body.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );

    const { password, ...rest } = updatedUser._doc; // Exclude password from response
    res.status(200).json(rest);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};
