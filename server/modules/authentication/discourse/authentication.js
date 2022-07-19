/* global WIKI */

// ------------------------------------
// Discourse
// ------------------------------------

const DiscourseStrategy = require('./strategy.js')

module.exports = {
  init (passport, conf) {
    passport.use(conf.key,
      new DiscourseStrategy({
        secret: conf.discourseSecret,
        discourse_url: conf.discourseURL,
        callbackURL: conf.callbackURL,
        discourseGroups: conf.discourseGroups
      }, async (req, accessToken, refreshToken, profile, cb) => {
        try {
          const user = await WIKI.models.users.processProfile({
            providerKey: req.params.strategy,
            profile: {
              ...profile,
              displayName: profile.username
            }
          })
          cb(null, user)
        } catch (err) {
          cb(err, null)
        }
      }
      ))
  }
}
