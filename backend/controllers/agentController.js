const Agent = require('../models/Agent');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // ✅ ADD THIS LINE

exports.addAgent = async (req, res) => {
    const { name, email, phone, password } = req.body;
    const exists = await Agent.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Agent already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const agent = new Agent({ name, email, phone, password: hashedPassword});
    await agent.save();
    res.status(201).json(agent);
};

exports.getAgents = async (req, res) => {
    const agents = await Agent.find().select('-password'); // Exclude password field
    res.json(agents);
};

exports.agentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login body:", req.body);

    const agent = await Agent.findOne({ email });
    console.log("Agent from DB:", agent);

    if (!agent) return res.status(400).json({ message: 'Invalid credentials' });

    console.log("Stored password:", agent.password);
    const match = await bcrypt.compare(password, agent.password);

    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: agent._id, role: 'agent' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error("Agent login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
