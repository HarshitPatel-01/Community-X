const Joi = require("joi");

/*  USER VALIDATION  */
const userSchema = Joi.object({
  user: Joi.object({
    username: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }).required()
});


/*  POST VALIDATION  */
const postSchema = Joi.object({
  post: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow("", null),
    image: Joi.object({
      url: Joi.string().allow("", null),
      filename: Joi.string().allow("", null)
    }).optional()
  }).required()
});


/*  COMMENT VALIDATION  */
const commentSchema = Joi.object({
  comment: Joi.object({
    text: Joi.string().required()
  }).required()
});


module.exports = {
  userSchema,
  postSchema,
  commentSchema
};
