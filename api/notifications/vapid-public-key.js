// api/notifications/vapid-public-key.js
import { ok, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

const DEFAULT_VAPID_PUBLIC = 'BBa7ExBSDM7jqmWZaOqIdsspJn9IWm2lh0BmPkFjo6EI59Kieci3WrgGJwFYWWDkQS6AAaSnNaGWxRPgPAtDWiE'

async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET'])
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC
  return ok(res, { publicKey })
}

export default withErrorHandler(handler)
