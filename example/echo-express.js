'use strict'

const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const Maap = require('../')

let bot = new Maap.Bot({
  token: 'TOKEN',
  api_url: 'API_URL',
  bot_id: 'BOT_ID'
})

bot.on('message', (payload, reply) => {
  reply(
    'You wrote: ' + payload.RCSMessage.textMessage,
    null,
    (err, body) => {
      if (err) throw err
      console.log(body)
    }
  )
})

let app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

app.post('/', (req, res) => {
  bot.handleRequest(req.body)
  res.end(JSON.stringify({ status: 'ok' }))
})

http.createServer(app).listen(3000)

console.log('Echo chatbot server running on port 3000.')
