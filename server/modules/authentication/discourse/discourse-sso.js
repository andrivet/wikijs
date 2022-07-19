
const crypto = require('crypto')
const querystring = require('querystring')

const validServerRe = /(https?):\/\/((?:[a-zA-Z\d@:%_.+~#=]{2,256}\.[a-z]{2,6})|(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?))(?:\/([-a-zA-Z\d@:%_+~#?&/=]*))?/

const sso = function (config) {
  if (typeof config !== 'object' ||
    typeof config.discourse_url !== 'string' ||
    !config.discourse_url.match(validServerRe) ||
    typeof config.secret !== 'string') {
    throw Error('Bad configuration for discourse SSO')
  }

  this.config = config
  this.NONCE_TABLE = {}
}

sso.prototype.generateAuthRequest = function (returnUrl, opts) {
  const thiz = this
  return new Promise(function (resolve, reject) {
    const ret = {opts: opts}
    const hmac = crypto.createHmac('sha256', thiz.config.secret)
    crypto.randomBytes(16, function (err, buf) {
      if (err) throw err
      ret._created_at = new Date()
      ret.nonce = buf.toString('hex')
      const payload = 'nonce=' + ret.nonce + '&return_sso_url=' + returnUrl
      const payloadb64 = new Buffer(payload).toString('base64')
      hmac.update(payloadb64)
      ret.hex_sig = hmac.digest('hex')
      ret.urlenc_payload_b64 = encodeURIComponent(payloadb64)
      ret.url_redirect = thiz.config.discourse_url + '/session/sso_provider?sso=' + ret.urlenc_payload_b64 + '&sig=' + ret.hex_sig
      thiz.NONCE_TABLE[ret.nonce] = ret
      resolve(ret)
    })
  })
}

const getQstringRe = /.*\?(.*)/

sso.prototype.validateAuth = function (url) {
  const thiz = this
  let ret = null
  const m = getQstringRe.exec(url)
  if (m && m.length > 0) {
    const obj = querystring.parse(m[1])
    if (obj.sso && obj.sig) {
      const hmac = crypto.createHmac('sha256', thiz.config.secret)
      const decodedSso = decodeURIComponent(obj.sso)
      hmac.update(decodedSso)
      const hash = hmac.digest('hex')
      if (obj.sig === hash) {
        const b = new Buffer(obj.sso, 'base64')
        const innerQstring = b.toString('utf8')
        ret = querystring.parse(innerQstring)
        const origEeq = thiz.NONCE_TABLE[ret.nonce]
        if (ret.nonce && origEeq) {
          ret.opts = thiz.NONCE_TABLE[ret.nonce].opts
          delete thiz.NONCE_TABLE[ret.nonce]
          return ret
        } else {
          return null
        }
      } else {
        return null
      }
    } else {
      throw Error('Bad Param - discourse sso')
    }
  } else {
    throw Error('Bad URL - discourse sso')
  }
}

module.exports = sso
