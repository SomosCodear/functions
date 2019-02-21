if (process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}

const domain = process.env.MAILGUN_DOMAIN;
const apiKey = process.env.MAILGUN_API_KEY;
const listName = process.env.MAILGUN_LIST;

const mailgun = require('mailgun-js');
const statuses = require('statuses');
const { json, send } = require('micro');
const microCors = require('micro-cors')
const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;

const handler = async(req, res) => {
  if (req.method === 'OPTIONS') {
    return send(res, statuses['ok']) ;
  }

  const { address } = await json(req);

  if (address && address.match(emailRegex)) {
    return mailgun({ apiKey, domain })
      .lists(listName)
      .members()
      .create(
        {
          subscribed: true,
          address
        },
        (err, data) => {
          if (err) {
            send(res, statuses['bad request'], err.message);
          } else {
            send(res, statuses['created'], 'The address was successfully subscribed');
          }
        }
      );
  }

  return send(res, statuses['bad request'], 'Invalid email address');
}

const cors = microCors({ allowMethods: ['POST'], origin: 'https://webconf.tech'});
module.exports = cors(handler);
