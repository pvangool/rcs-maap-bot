# rcs-maap-bot
[![npm version](https://img.shields.io/npm/v/rcs-maap-bot.svg)](https://www.npmjs.com/package/rcs-maap-bot)
[![dependencies](https://david-dm.org/pvangool/rcs-maap-bot.svg)](https://david-dm.org/pvangool/rcs-maap-bot)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

A Node client for [RCS MaaP chatbots](https://www.gsma.com/futurenetworks/wp-content/uploads/2017/11/FNW.11_v1.0.pdf).

Requires Node >=4.0.0.

## Installation

```bash
npm install rcs-maap-bot
```

## Example

See more examples in [the example folder](https://github.com/pvangool/rcs-maap-bot/tree/master/example).

```js
const http = require('http')
const Maap = require('rcs-maap-bot')

let bot = new Maap.Bot({
  token: 'TOKEN',
  api_url: 'API_URL',
  bot_id: 'BOT_ID'
})

bot.on('error', (err) => {
  console.log(err.message)
})

bot.on('message', (payload, reply) => {
  reply(
    "You wrote: " + payload.RCSMessage.textMessage,
    null,
    (err, body) => {
      if (err) throw err
    }
  )
})

http.createServer(bot.handleWebhook()).listen(3000)

console.log('Echo bot server running on port 3000.')
```

`reply` Is a convenience function that calls `bot.sendMessage`, with the recipient already set to the message
sender.

An example of calling `bot.sendMessage` with `suggestions` is below:

```js
bot.on('message', (payload, reply) => {
  let suggestions = new Maap.Suggestions();
  suggestions.addReply('English', 'Language_en');
  suggestions.addReply('日本語', 'Language_jp');

  bot.sendMessage(
    payload.messageContact,
    "What language do you prefer?",
    suggestions,
    (err, body) => {
      if (err) throw err
    }
  )
})
```

Specifiying the `recipient` can be done by creating a `MessageContact` object:

```js
bot.on('message', (payload, reply) => {
  let suggestions = new Maap.Suggestions();
  suggestions.addReply('English', 'Language_en');
  suggestions.addReply('日本語', 'Language_jp');

  bot.sendMessage(
    new Maap.MessageContact("+18055551234", null),
    "What language do you prefer?",
    suggestions,
    (err, body) => {
      if (err) throw err
    }
  )
})
```

## Usage

### Bot Functions

#### constructor(opts)

Returns a new `Bot` instance.

`opts` - Object

* `token` - String: The authentication token for your bot.
* `api_url` - String: The URL to the MaaP gateway endpoint (http://host:port/serverRoot/rcs/bot/v1).
* `bot_id` - String: The identifier for your bot.

#### sendMessage(recipient, content, [suggestions], [cb])

Sends a message with `content` and optional `suggestions` to the target `recipient`, and calls the callback if any. Returns a promise.

* `recipient` - Object: A `MessageContact` object.
* `content` - Object: The message payload. Either a string, an `AudioMessage` object, a `FileMessage` object, a `GeolocationPushMessage` object, a `Richcard` object, or a `RichcardCarousel` object.
* `suggestions` - (Optional) Object: A `Suggestions` object.
* `cb` - (Optional) Function: Called with `(err, body)` once the request has completed. `err` contains an error, if any, and `body` contains the response from the MaaP gateway.

#### getMessageStatus(messageId, [cb])

Gets the status of a message with `messageId`, and calls the callback if any. Returns a promise.

* `messageId` - String: The message identifier.
* `cb` - (Optional) Function: Called with `(err, body)` once the request has completed. `err` contains an error, if any, and `body` contains the response from the MaaP gateway.

#### updateMessageStatus(messageId, status, [cb])

Updates the status of a message with `messageId` to `status`, and calls the callback if any. Returns a promise.

* `messageId` - String: The message identifier.
* `status` - String: The requested status. Needs to be either `Maap.MESSAGE_STATUS_CANCELLED` or `Maap.MESSAGE_STATUS_DISPLAYED`.
* `cb` - (Optional) Function: Called with `(err, body)` once the request has completed. `err` contains an error, if any, and `body` contains the response from the MaaP gateway.

#### getContactCapabilities(userContact, chatId, [cb])

Gets the capabilities for a subscriber, and calls the callback if any. Returns a promise. Either `userContact` or `chatId` needs to be specified.

* `userContact` - String: The subscriber's MSISDN.
* `chatId` - String: The user's anonymous token.
* `cb` - (Optional) Function: Called with `(err, body)` once the request has completed. `err` contains an error, if any, and `body` contains the response from the MaaP gateway.

#### uploadFile(path, url, fileType, until, [cb])

Uploads a file of type `fileType` to the MaaP content storage until it expires at date `until`, and calls the callback if any. Returns a promise. Either `path` or `url` needs to be specified.

* `path` - String: The path to the file.
* `url` - String: The URL to the file.
* `fileType` - String: The file's content type.
* `until` - Date: The date at which time the content should be expired.
* `cb` - (Optional) Function: Called with `(err, body)` once the request has completed. `err` contains an error, if any, and `body` contains the response from the MaaP gateway.

#### deleteFile(fileId, [cb])

Deletes a file with identifier `fileId` from the MaaP content storage, and calls the callback if any. Returns a promise.

* `fileId` - String: The file identifier.
* `cb` - (Optional) Function: Called with `(err, body)` once the request has completed. `err` contains an error, if any, and `body` contains the response from the MaaP gateway.

#### getFile(fileId, [cb])

Gets info for a file with identifier `fileId` from the MaaP content storage, and calls the callback if any. Returns a promise.

* `fileId` - String: The file identifier.
* `cb` - (Optional) Function: Called with `(err, body)` once the request has completed. `err` contains an error, if any, and `body` contains the response from the MaaP gateway.

#### startTyping(recipient, [cb])

Starts the 'is typing' indicator for the target `recipient`, and calls the callback if any. Returns a promise.

* `recipient` - Object: A `MessageContact` object.
* `cb` - (Optional) Function: Called with `(err, body)` once the request has completed. `err` contains an error, if any, and `body` contains the response from the MaaP gateway.

#### stopTyping(recipient, [cb])

Stops the 'is typing' indicator for the target `recipient`, and calls the callback if any. Returns a promise.

* `recipient` - Object: A `MessageContact` object.
* `cb` - (Optional) Function: Called with `(err, body)` once the request has completed. `err` contains an error, if any, and `body` contains the response from the MaaP gateway.

#### handleWebhook()

The main middleware for your bot's webhook. Returns a function.

#### handleRequest(json)

The underlying method used by `bot.handleWebhook()` to parse the message payload, and fire the appropriate events.

### FileMessage Functions

An `FileMessage` object representes a file and has the following properties:

| Property | Type | Mandatory | Description |
| --- | --- | --- | --- |
| `fileUrl` | String | Yes | The URL of the file. |
| `fileName` | String | No | The file name. |
| `fileMIMEType` | String | No | The MIME type of the file. |
| `fileSize` | Number | No | The size of the file. |
| `thumbnailUrl` | String | No | The URL of the thumbnail. |
| `thumbnailFileName` | String | No | The file name of the thumbnail. |
| `thumbnailMIMEType` | String | No | The MIME type of the thumbnail. |
| `thumbnailFileSize` | Number | No | The size of the thumbnail. |

#### constructor(fileUrl)

Returns a new `FileMessage` instance.

* `fileUrl` - String: The URL of the file.

#### setFileName(fileName)

Set the `fileName` property.

* `fileName` - String: The file name.

#### setFileMIMEType(fileMIMEType)

Set the `fileMIMEType` property.

* `fileMIMEType` - String: The MIME type of the file.

#### setFileSize(fileSize)

Set the `fileSize` property.

* `fileSize` - Number: The size of the file.

#### setThumbnailUrl(thumbnailUrl)

Set the `thumbnailUrl` property.

* `thumbnailUrl` - String: The URL of the thumbnail.

#### setThumbnailFileName(thumbnailFileName)

Set the `thumbnailFileName` property.

* `thumbnailFileName` - String: The file name of the thumbnail.

#### setThumbnailMIMEType(thumbnailMIMEType)

Set the `thumbnailMIMEType` property.

* `thumbnailMIMEType` - String: The MIME type of the thumbnail.

#### setThumbnailFileSize(thumbnailFileSize)

Set the `thumbnailFileSize` property.

* `thumbnailFileSize` - Number: The size of the thumbnail.

### AudioMessage Functions

An `AudioMessage` object representes an audio file and has the following properties:

| Property | Type | Mandatory | Description |
| --- | --- | --- | --- |
| `fileUrl` | String | Yes | The URL of the file. |
| `fileName` | String | No | The file name. |
| `fileMIMEType` | String | No | The MIME type of the file. |
| `fileSize` | Number | No | The size of the file. |
| `playingLength` | Number | No | The playing length of the audio. |

#### constructor(fileUrl)

Returns a new `AudioMessage` instance.

* `fileUrl` - String: The URL of the file.

#### setFileName(fileName)

Set the `fileName` property.

* `fileName` - String: The file name.

#### setFileMIMEType(fileMIMEType)

Set the `fileMIMEType` property.

* `fileMIMEType` - String: The MIME type of the file.

#### setFileSize(fileSize)

Set the `fileSize` property.

* `fileSize` - Number: The size of the file.

#### setPlayingLength(playingLength)

Set the `playingLength` property.

* `playingLength` - Number: The playing length of the audio.

### GeolocationPushMessage

| Property | Type | Mandatory | Description |
| --- | --- | --- | --- |
| `pos` | String | Yes | This are the coordinates in WGS 84 (latitude, longitude) decimal notation. Example "26.118 1289 - 80.1283921" |
| `label` | String | No | This can be used to tag the nature of the location. |
| `timestamp` | String | No | This is the time when the location information was pushed. |
| `expiry` | String | No | This is an absolute date at which time the recipient is no longer permitted to possess the location information. |
| `timeOffset` | Number | No | This is the time zone where the location information was pushed, expressed as the number of minutes away from UTC. |
| `radius` | Number | No | The radius of the circle will be represented in meters. |

#### constructor(pos)

Returns a new `GeolocationPushMessage` instance. This is a geolocation push to be sent via RCS Geolocation Push.

* `pos` - String: This are the coordinates in WGS 84 (latitude, longitude) decimal notation.

#### setLabel(label)

Set the `label` property.

* `label` - String: This can be used to tag the nature of the location.

#### setTimestamp(timestamp)

Set the `timestamp` property.

* `timestamp` - String: This is the time when the location information was pushed.

#### setExpiry(expiry)

Set the `expiry` property.

* `expiry` - String: This is an absolute date at which time the recipient is no longer permitted to possess the location information.

#### setTimeOffset(timeOffset)

Set the `timeOffset` property.

* `timeOffset` - Number: This is the time zone where the location information was pushed, expressed as the number of minutes away from UTC.

#### setRadius(radius)

Set the `radius` property.

* `radius` - Number: The radius of the circle will be represented in meters.

### Richcard Functions

#### constructor()

Returns a new `Richcard` instance.

#### setCardOrientation(cardOrientation)

Set the orientation of the card.

* `cardOrientation` - String: Either `Maap.ORIENTATION_HORIZONTAL` or `Maap.ORIENTATION_VERTICAL`.

#### setImageAlignment(imageAlignment)

Set the alignment of the image on the card.

* `imageAlignment` - String: Either `Maap.ALIGNMENT_LEFT` or `Maap.ALIGNMENT_RIGHT`.

#### setMedia(mediaUrl, mediaContentType, mediaFileSize, height, [thumbnailUrl], [thumbnailContentType], [thumbnailFileSize], [contentDescription])

Set the media (image) to be displayed on the richcard.

* `mediaUrl` - String: The URL to the image.
* `mediaContentType` - String: The content type of the image.
* `mediaFileSize` - Number: The size of the image.
* `height` - String: Either `Maap.MEDIA_SHORT_HEIGHT` or `Maap.MEDIA_MEDIUM_HEIGHT` or `Maap.MEDIA_TALL_HEIGHT`.
* `thumbnailUrl` - (Optional) String: The URL to the thumbnail for the image.
* `thumbnailContentType` - (Optional) String: The content type of the thumbnail.
* `thumbnailFileSize` - (Optional) Number: The size of the thumbnail.
* `contentDescription` - (Optional) String: Textual description of media content.

The `thumbnailUrl` property is optional, but if used, `thumbnailContentType` and `thumbnailFileSize` must be provided as well.

#### setTitle(title)

Set the title of the card.

* `title` - String: The title.

#### setDescription(description)

Set the description of the card.

* `description` - String: The description.

#### setSuggestions(suggestions)

Add suggestions to the card.

* `suggestions` - Suggestions: The suggestions.

### RichcardCarousel Functions

#### constructor()

Returns a new `RichcardCarousel` instance.

#### setCardWidth(cardWidth)

Set the width of the cards in the carousel.

* `cardWidth` - String: Either `Maap.CARD_WIDTH_SMALL` or `Maap.CARD_WIDTH_MEDIUM`.

#### addRichcard(richcard)

Add a card to the carousel.

* `richcard` - Richcard: The `Richcard` object.

### Suggestions Functions

Suggested Replies consist of a display text and a set of postback data.

Suggested Actions are grouped into seven different categories supporting a total of twelve different suggested actions:

* urlAction:
  * openUrl - Opens a web site or app via deep linking.
* dialerAction:
  * dialPhoneNumber - Calls a phone number via the user's dialer app.
  * dialEnrichedCall - Start an Enriched Call via the user’s dialer app.
  * dialVideoCall - Start a video call via the user’s dialer app.
* mapAction:
  * showLocation - Show location(s) on a map for given coordinates or search query.
  * requestLocationPush - Request for a one-time geo location push.
* calendarAction:
  * createCalendarEvent - Creates a new event on the user's calendar.
* composeAction:
  * composeTextMessage - Compose a draft text message.
  * composeRecordingMessage - Compose a draft message and start recording audio or video.
* deviceAction:
  * requestDeviceSpecifics - Request for a one-time share of device specifics (device model, operating system version, messaging client identifier and version, and remaining battery charge in minutes).
* settingsAction:
  * disableAnonymization - Ask the user to disable the anonymization setting.
  * enableDisplayedNotifications - Ask the user to enable sending displayed notifications.

Most actions allow fallback URLs in case a user does not have any app of the required type installed. Chatbot platforms can use the fallback URL to suggest an appropriate app to the user.

#### constructor()

Returns a new `Suggestions` instance.

#### addReply(displayText, postbackData)

On-the-wire example:

```json
{
  "reply": {
    "displayText": "Yes",
    "postback": {
      "data": "set_by_chatbot_reply_yes"
    }
  } 
}
```

#### addUrlAction(displayText, postbackData, url)

On-the-wire example:

```json
{
  "action": {
    "urlAction": {
      "openUrl": {
        "url": "https://www.google.com"
      }
    },
    "displayText": "Open website or deep link",
    "postback": {
      "data": "set_by_chatbot_open_url"
    }
  }
}
```

#### addDialerAction(displayText, postbackData, dialType, phoneNumber, fallbackUrl, [subject])

On-the-wire example:

```json
{
  "action": {
    "dialerAction": {
      "dialPhoneNumber": {
        "phoneNumber": "+1650253000"
      }
    },
    "displayText": "Call a phone number",
    "postback": {
      "data": "set_by_chatbot_dial_phone_number"
    }
  }
},
{
  "action": {
    "dialerAction": {
      "dialEnrichedCall": {
        "phoneNumber": "+1650253000",
        "subject": "The optional subject for the enriched call"
      }
    },
    "displayText": "Start enriched call",
    "postback": {
      "data": "set_by_chatbot_dial_enriched_call"
    }
  }
},
{
  "action": {
    "dialerAction": {
      "dialVideoCall": {
        "phoneNumber": "+1650253000"
      }
    },
    "displayText": "Start video call",
    "postback": {
      "data": "set_by_chatbot_dial_video_call"
    }
  }
}
```

#### addRequestLocationPushMapAction(displayText, postbackData)

On-the-wire example:

```json
{
  "action": {
    "mapAction": {
      "requestLocationPush": {}
    },
    "displayText": "Request a geo location",
    "postback": {
      "data": "set_by_chatbot_request_location_push"
    }
  }
}
```

#### addShowLocationMapAction(displayText, postbackData, latitude, longitude, label, query, fallbackUrl)

On-the-wire example:

```json
{
  "action": {
    "mapAction": {
      "showLocation": {
        "location": {
          "latitude": 37.4220041,
          "longitude": -122.0862515,
          "label": "Googleplex"
        },
        "fallbackUrl": "https://www.google.com/maps/@37.4219162,-122.078063,15z"
      }
    },
    "displayText": "Show location on a map",
    "postback": {
      "data": "set_by_chatbot_show_location"
    }
  }
},
{
  "action": {
    "mapAction": {
      "showLocation": {
        "location": {
          "query": "restaurants"
        },
        "fallbackUrl": "https://www.google.com/maps/search/restaurants"
      }
    },
    "displayText": "Search location(s) on map",
    "postback": {
      "data": "set_by_chatbot_search_locations"
    }
  }
}
```

#### addCalendarAction(displayText, postbackData, startTime, endTime, title, description, fallbackUrl)

On-the-wire example:

```json
{
  "action": {
    "calendarAction": {
      "createCalendarEvent": {
        "startTime": "2017-03-14T00:00:00Z",
        "endTime": "2017-03-14T23:59:59Z",
        "title": "Meeting",
        "description": "GSG review meeting"
      }
    },
    "displayText": "Schedule Meeting",
    "postback": {
      "data": "set_by_chatbot_create_calendar_event"
    }
  }
}
```

#### addTextComposeAction(displayText, postbackData, phoneNumber, text)

On-the-wire example:

```json
{
  "action": {
    "composeAction": {
      "composeTextMessage": {
        "phoneNumber": "+1650253000",
        "text": "Draft to go into the send message text field."
      }
    },
    "displayText": "Draft a text message",
    "postback": {
      "data": "set_by_chatbot_compose_text_message"
    }
  }
}
```

#### addRecordingComposeAction(displayText, postbackData, phoneNumber, type)

On-the-wire example:

```json
{
  "action": {
    "composeAction": {
      "composeRecordingMessage": {
        "phoneNumber": "+1650253000",
        "type": "VIDEO"
      }
    },
    "displayText": "Record audio or video",
    "postback": {
      "data": "set_by_chatbot_compose_recording_message"
    }
  }
}
```

#### addDeviceAction(displayText, postbackData)

On-the-wire example:

```json
{
  "action": {
    "deviceAction": {
      "requestDeviceSpecifics": {}
    },
    "displayText": "Request device specifics",
    "postback": {
      "data": "set_by_chatbot_request_device_specifics"
    }
  }
}
```

#### addSettingsAction(displayText, postbackData, settingsType)

On-the-wire example:

```json
{
  "action": {
    "settingsAction": {
      "disableAnonymization": {}
    },
    "displayText": "Share your phone number",
    "postback": {
      "data": "set_by_chatbot_disable_anonymization"
    }
  }
},
{
  "action": {
    "settingsAction": {
      "enableDisplayedNotifications": {}
    },
    "displayText": "Send read receipts",
    "postback": {
      "data": "set_by_chatbot_enable_displayed_notifications"
    }
  }
}
```

### Events

A different event is triggered for each type of event an RCS MaaP chatbot can receive. Below are all
the possible events with an example of the payload they provide.

#### on('message', (payload, reply))

Triggered when a 'message' event is sent to the bot.

* `payload` - Object: An object containing the 'message' event payload.
* `reply` - Function: A convenience function that calls `bot.sendMessage`, with the recipient already set to the message sender.

Example usage:

```js
bot.on('message', (payload, reply) => {
  reply('we got your message!', null, (err, info) => {})
})
```

Sample payload:

```json
{
  "RCSMessage": {
    "msgId": "Xs8CI3tdf",
    "textMessage": "hello world",
    "timestamp": "2017-09-26T01:33:20.315Z"
  },
  "messageContact": {
    "userContact": "+14251234567"
  },
  "event": "message"
}
```

#### on('isTyping', (payload, reply))

Triggered when an 'isTyping' event is sent to the bot.

* `payload` - Object: An object containing the 'isTyping' event payload.
* `reply` - Function: A convenience function that calls `bot.sendMessage`, with the recipient already set to the message sender.

Example usage:

```js
bot.on('isTyping', (payload, reply) => {
  reply('we see you are typing!', null, (err, info) => {})
})
```

Sample payload:

```json
{
  "RCSMessage": {
    "msgId": "Xs8CI3tdf",
    "isTyping": "active",
    "timestamp": "2017-09-26T01:33:20.315Z"
  },
  "messageContact": {
    "userContact": "+14251234567"
  },
  "event": "isTyping"
}
```

#### on('messageStatus', (payload, reply))

Triggered when a 'messageStatus' event is sent to the bot.

* `payload` - Object: An object containing the 'messageStatus' event payload.
* `reply` - Function: A convenience function that calls `bot.sendMessage`, with the recipient already set to the message sender.

Example usage:

```js
bot.on('messageStatus', (payload, reply) => {
  reply('you read our message!', null, (err, info) => {})
})
```

Sample payload:

```json
{
  "RCSMessage": {
    "msgId": "MzJmajlmamVzZGZ8bmk5MHNlbmRmZTAz",
    "status": "displayed",
    "timestamp": "2017-09-26T01:33:20.315Z"
  },
  "messageContact": {
    "userContact": "+14251234567"
  },
  "event": "messageStatus"
}
```

#### on('fileStatus', (payload))

Triggered when a 'fileStatus' event is sent to the bot.

* `payload` - Object: An object containing the 'fileStatus' event payload.

Example usage:

```js
bot.on('fileStatus', (payload) => {
  console.log('was the file uploaded?')
})
```

Sample payload:

```json
{
  "file": {
    "fileId": "MzJmajlmamVzZGZ8bmk5MHNlbmRmZTAz",
    "fileUrl": "http://www.example.com/files/f.jpg",
    "fileSize": 123456,
    "status": "ready",
    "validity": "2017-10-03T22:31:00.597Z"
  },
  "event": "fileStatus"
}
```

#### on('response', (payload, reply))

Triggered when a 'response' event is sent to the bot.

* `payload` - Object: An object containing the 'response' event payload.
* `reply` - Function: A convenience function that calls `bot.sendMessage`, with the recipient already set to the message sender.

Example usage:

```js
bot.on('response', (payload, reply) => {
  reply('you clicked on a button?', null, (err, info) => {})
})
```

Sample payload:

```json
{
  "RCSMessage": {
    "msgId": "MzJmajlmamVzZGZ8bmk5MHNlbmRmZTAz",
    "suggestedResponse": {
      "response": {
        "action": {
          "displayText": "Visit Website",
          "postback": {
            "data": "set_by_chatbot_reply_yes"
          }
        }
      }
    },
    "timestamp": "2017-09-26T01:33:20.315Z"
  },
  "messageContact": {
    "userContact": "+14251234567"
  },
  "event": "response"
}
```

#### on('alias', (payload, reply))

Triggered when a 'alias' event is sent to the bot.

* `payload` - Object: An object containing the 'alias' event payload.
* `reply` - Function: A convenience function that calls `bot.sendMessage`, with the recipient already set to the message sender.

Example usage:

```js
bot.on('alias', (payload, reply) => {
  reply('thank you for sharing your info', null, (err, info) => {})
})
```

Sample payload:

```json
{
  "RCSMessage": {
    "msgId": "MzJmajlmamVzZGZ8bmk5MHNlbmRmZTAz",
    "timestamp": "2017-09-26T01:33:20.315Z"
  },
  "messageContact": {
    "userContact": "+14251234567",
    "chatId": "93JF93SEIJFE"
  },
  "event": "alias"
}
```

#### on('newUser', (payload, reply))

Triggered when a 'newUser' event is sent to the bot.

* `payload` - Object: An object containing the 'newUser' event payload.
* `reply` - Function: A convenience function that calls `bot.sendMessage`, with the recipient already set to the message sender.

Example usage:

```js
bot.on('newUser', (payload, reply) => {
  reply('welcome!', null, (err, info) => {})
})
```

Sample payload:

```json
{
  "RCSMessage": {
    "msgId": "MzJmajlmamVzZGZ8bmk5MHNlbmRmZTAz",
    "suggestedResponse": {
      "response": {
        "reply": {
          "displayText": "Start Chat",
          "postback": {
            "data": "new_bot_user_initiation"
          }
        }
      }
    },
    "timestamp": "2017-09-26T01:33:20.315Z"
  },
  "messageContact": {
    "userContact": "+14251234567"
  },
  "event": "newUser"
}
```

## To Do

* Verify constraints before sending
* Look for missing fields like trafficType (there may be more)

