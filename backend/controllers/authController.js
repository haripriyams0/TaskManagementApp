const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ------------------ REGISTER ADMIN ------------------
exports.registerAdmin = async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already in use' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed, role: 'admin' });

  res.status(201).json({ message: 'Admin registered successfully' });
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  // Return user data (without password) along with token
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  
  res.json({ token, user: userData });
};

// ------------------ UPDATE ADMIN (Optional) ------------------
exports.updateAdmin = async (req, res) => {
  const { currentPassword, newEmail, newPassword } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) return res.status(404).json({ message: 'Admin not found' });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

  if (newEmail) {
    const emailTaken = await User.findOne({ email: newEmail });
    if (emailTaken && emailTaken._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    user.email = newEmail;
  }

  if (newPassword) {
    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();
  res.json({ message: 'Admin updated successfully' });
};
