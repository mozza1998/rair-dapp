const admin = require('./admin');
const addMedia = require('./addMedia');
const authentication = require('./authentication');
const createContract = require('./createContract');
const createUser = require('./createUser');
const getChallenge = require('./getChallenge');
const getFiles = require('./getFiles');
const getToken = require('./getToken');
const getUser = require('./getUser');
const newAdmin = require('./newAdmin');
const newAdminParams = require('./newAdminParams');
const removeMedia = require('./removeMedia');
const stream = require('./stream');
const uploadVideo = require('./uploadVideo');
const uploadVideoFile = require('./uploadVideoFile');
const updateContract = require('./updateContract');
const singleContract = require('./singleContract');

module.exports = {
  admin,
  addMedia,
  authentication,
  createContract,
  createUser,
  getChallenge,
  getFiles,
  getToken,
  getUser,
  newAdmin,
  newAdminParams,
  removeMedia,
  stream,
  uploadVideo,
  uploadVideoFile,
  updateContract,
  singleContract
};