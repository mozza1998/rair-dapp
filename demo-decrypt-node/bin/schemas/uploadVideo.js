const Joi = require('joi');

module.exports = Joi.object({
  title: Joi.string()
    .min(1)
    .max(30)
    .required(),
  description: Joi.string()
    .min(1)
    .max(300)
    .required(),
  contractAddress: Joi.string()
    .min(3)
    .max(150)
    .required()
});