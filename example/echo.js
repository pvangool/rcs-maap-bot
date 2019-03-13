'use strict'

const http = require('http')
const Maap = require('../')

let bot = new Maap.Bot({
  token: 'TOKEN',
  api_url: 'API_URL',
  bot_id: 'BOT_ID'
})

bot.on('message', (payload, reply) => {
  reply(
    "You wrote: " + payload.RCSMessage.textMessage,
    null,
    (err, body) => {
      if (err) throw err
      console.log(body)
    }
  )
})

http.createServer(bot.handleWebhook()).listen(3000)

console.log('Echo chatbot server running on port 3000.')
