exports.isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    req.flash("error", "You must log in first!");
    return res.redirect("/login");
  }
  next();
};
