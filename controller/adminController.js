module.exports.getDashboard = (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      permission: true,
      message: `HELLO ADMIN: ${user.name}`,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
