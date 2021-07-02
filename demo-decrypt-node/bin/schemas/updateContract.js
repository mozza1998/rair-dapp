const Joi = require('joi');

module.exports = Joi.object({
  title: Joi.string()
    .min(1)
    .max(30),
  royalty: Joi.number(),
  price: Joi.number()
});