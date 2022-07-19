// Load modules.
const passport = require('passport-strategy')
const util = require('util')
const DiscourseSso = require('./discourse-sso.js')
let Provider = null

function Strategy(options, verify) {
  options = options || {}
  if (typeof verify !== 'function') throw new TypeError('passport-discourse requires a verify callback')

  if (!Provider) Provider = new DiscourseSso(options)

  passport.Strategy.call(this)
  this.name = 'discourse'
  this.callbackURL = options.callbackURL
  this.verify_cb = verify
  this.discourseGroups = options.discourseGroups
}

util.inherits(Strategy, passport.Strategy)

function validateGroups(userGroups, authorizedGroups) {
  for (const grp of userGroups) {
    if (authorizedGroups.includes(grp)) {
      return true
    }
  }
  return false
}

Strategy.prototype.authenticate = function (req, options) {
  const self = this

  if (!options) options = {}

  if (req.query.sso) {
    const ret = Provider.validateAuth(req.originalUrl)
    const profile = {}
    if (ret) {
      profile.username = ret.username
      profile.email = ret.email
      profile.displayName = ret.name
      profile.picture = ret.avatar_url
      profile.discourseGroups = ret.groups.split(',')
    }
    self.verify_cb(req, null, null, profile, function (error, user) {
      if (!validateGroups(profile.discourseGroups, self.discourseGroups)) {
        self.fail('Invalid groups')
      } else if (user) {
        self.success(user)
      } else {
        self.fail('Failed to validate user')
      }
    })
  } else {
    Provider.generateAuthRequest(this.callbackURL, options).then(function (ret) {
      self.redirect(ret.url_redirect)
    })
  }
}

// Expose constructor.
module.exports = Strategy
