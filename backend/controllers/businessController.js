const Business = require('../models/Business');

exports.saveProfile = async (req, res, next) => {
  try {
    // Upsert: Update if exists, Create if not
    const profile = await Business.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });
    res.json(profile);
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const profile = await Business.findOne();
    res.json(profile);
  } catch (error) {
    next(error);
  }
};
