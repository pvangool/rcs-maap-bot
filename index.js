'use strict'

const EventEmitter = require('events').EventEmitter
const request = require('request-promise')
const fs = require('fs');

const MESSAGE_STATUS_CANCELLED = 'cancelled';
const MESSAGE_STATUS_DISPLAYED = 'displayed';

const CALL_TYPE_PHONE = 'dialPhoneNumber';
const CALL_TYPE_ENRICHED = 'dialEnrichedCall';
const CALL_TYPE_VIDEO = 'dialVideoCall';

const ORIENTATION_VERTICAL = 'VERTICAL';
const ORIENTATION_HORIZONTAL = 'HORIZONTAL';

const ALIGNMENT_LEFT = 'LEFT';
const ALIGNMENT_RIGHT = 'RIGHT';

const MEDIA_SHORT_HEIGHT = 'SHORT_HEIGHT';
const MEDIA_MEDIUM_HEIGHT = 'MEDIUM_HEIGHT';
const MEDIA_TALL_HEIGHT = 'TALL_HEIGHT';

const CARD_WIDTH_SMALL = 'SMALL_WIDTH';
const CARD_WIDTH_MEDIUM = 'MEDIUM_WIDTH';

const SETTINGS_DISABLEANONYMIZATION = 'disableAnonymization';
const SETTINGS_ENABLEDISPLAYEDNOTIFICATIONS = 'enableDisplayedNotifications';

const RECORDING_TYPE_AUDIO = 'AUDIO';
const RECORDING_TYPE_VIDEO = 'VIDEO';

class Bot extends EventEmitter {

  constructor (opts) {
    super()

    opts = opts || {}

    if (!opts.token) {
      throw new Error('Missing token.')
    }
    this.token = opts.token

    if (!opts.api_url) {
      throw new Error('Missing API URL.')
    }
    this.api_url = opts.api_url

    if (!opts.bot_id) {
      throw new Error('Missing bot ID.')
    }
    this.bot_id = opts.bot_id
  }

  startTyping(recipient, cb) {
    var messageBody = {
      RCSMessage: {
        isTyping: 'active'
      },
      messageContact: {}
    };

    if (recipient instanceof MessageContact) {
      messageBody.messageContact = recipient.generate();
    } else {
      messageBody.messageContact = recipient;
    }

    let options = {
      method: 'POST',
      uri: this.api_url + '/' + this.bot_id + '/messages',
      json: messageBody
    }

    this.sendRequest(options, cb)
  }

  stopTyping(recipient, cb) {
    var messageBody = {
      RCSMessage: {
        isTyping: 'idle'
      },
      messageContact: {}
    };

    if (recipient instanceof MessageContact) {
      messageBody.messageContact = recipient.generate();
    } else {
      messageBody.messageContact = recipient;
    }

    let options = {
      method: 'POST',
      uri: this.api_url + '/' + this.bot_id + '/messages',
      json: messageBody
    }

    this.sendRequest(options, cb)
  }

  sendMessage(recipient, content, suggestions, cb) {
    var messageBody = {
      RCSMessage: {},
      messageContact: {}
    };

    if (recipient instanceof MessageContact) {
      messageBody.messageContact = recipient.generate();
    } else {
      messageBody.messageContact = recipient;
    }

    if (typeof content === 'string') {
      messageBody.RCSMessage.textMessage = content;
    } else if (content instanceof Richcard) {
      messageBody.RCSMessage.richcardMessage = content.generate();
    } else if (content instanceof RichcardCarousel) {
      messageBody.RCSMessage.richcardMessage = content.generate();
    } else if (content instanceof FileMessage) {
      messageBody.RCSMessage.fileMessage = content.generate();
    } else if (content instanceof AudioMessage) {
      messageBody.RCSMessage.audioMessage = content.generate();
    } else if (content instanceof GeolocationPushMessage) {
      messageBody.RCSMessage.geolocationPushMessage = content.generate();
    } else {
      throw new Error('Unsupported content type.')
    }

    if (suggestions) {
        if (suggestions instanceof Suggestions) {
            messageBody.RCSMessage.suggestedChipList = {
                suggestions: suggestions.generate()
            };
        } else {
            throw new Error('Unsupported suggestions type.')
        }
    }

    let options = {
      method: 'POST',
      uri: this.api_url + '/' + this.bot_id + '/messages',
      json: messageBody
    }

    this.sendRequest(options, cb)
  }

  getMessageStatus(messageId, cb) {
    let options = {
      method: 'GET',
      uri: this.api_url + '/' + this.bot_id + '/messages/' + messageId + '/status'
    }

    this.sendRequest(options, cb)
  }

  updateMessageStatus(messageId, status, cb) {
    var messageBody = {
      RCSMessage: {
        status: status
      }
    };

    let options = {
      method: 'PUT',
      uri: this.api_url + '/' + this.bot_id + '/messages/' + messageId + '/status',
      json: messageBody
    }

    this.sendRequest(options, cb)
  }

  getContactCapabilities(userContact, chatId, cb) {
    let qs = {}

    if (userContact) {
      qs['userContact'] = userContact
    }
    if (chatId) {
      qs['chatId'] = chatId
    }

    let options = {
      method: 'GET',
      uri: this.api_url + '/' + this.bot_id + '/contactCapabilities',
      qs: qs
    }

    this.sendRequest(options, cb)
  }

  uploadFile(path, url, fileType, until, cb) {
    if (!until) {
      let date = new Date();
      until = new Date(date.setTime(date.getTime() + 30 * 86400000));
    }

    let options = {
      method: 'POST',
      uri: this.api_url + '/' + this.bot_id + '/files',
      formData: {
        fileType: fileType,
        until: until.toISOString()
      }
    }

    if (path) {
      options.formData.fileContent = fs.createReadStream(path)
    } else {
      options.formData.fileUrl = url
    }

    this.sendRequest(options, cb)
  }

  deleteFile(fileId, cb) {
    let options = {
      method: 'DELETE',
      uri: this.api_url + '/' + this.bot_id + '/files/' + fileId
    }

    this.sendRequest(options, cb)
  }

  getFile(fileId, cb) {
    let options = {
      method: 'GET',
      uri: this.api_url + '/' + this.bot_id + '/files/' + fileId
    }

    this.sendRequest(options, cb)
  }

  handleWebhook () {
    return (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })

      if (req.method !== 'POST') return res.end()

      let body = ''

      req.on('data', (chunk) => {
        body += chunk
      })

      req.on('end', () => {
        try {
          let json = JSON.parse(body)

          if (json.event !== null) {
            this.handleRequest(json)
          }
        } catch (e) {
          console.error(e);
        }

        res.end(JSON.stringify({status: 'ok'}))
      })
    }
  }

  handleRequest(json) {
    if (json.messageContact !== null) {
      this.emit(json.event, json, this.sendMessage.bind(this, json.messageContact))
    } else {
      this.emit(json.event, json)
    }
  }

  sendRequest(options, cb) {
    options.headers = {
      'Authorization': 'Bearer ' + this.token
    }

    return request(options)
      .then(body => {
        if (body.error) return Promise.reject(body.error)
        if (!cb) return body
        cb(null, body)
      })
      .catch(err => {
        if (!cb) return Promise.reject(err)
        cb(err)
      })
  }

}

class MessageContact {

  constructor (userContact, chatId) {
    this._userContact = userContact;
    this._chatId = chatId;
  }

  generate() {
    return {
      userContact: this._userContact,
      chatId: this._chatId
    }
  }

}

class Suggestions {

  constructor () {
    this._suggestions = new Array();
  }

  addReply(displayText, postbackData) {
    let suggestion = {
      reply: {
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    this._suggestions.push(suggestion);
  }

  addUrlAction(displayText, postbackData, url) {
    let suggestion = {
      action: {
        urlAction: {
          openUrl: {
            url: url
          }
        },
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    this._suggestions.push(suggestion);
  }

  addDialerAction(displayText, postbackData, dialType, phoneNumber, fallbackUrl, subject) {
    let suggestion = {
      action: {
        dialerAction: {},
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    switch (dialType) {
      case CALL_TYPE_PHONE:
        suggestion.action.dialerAction.dialPhoneNumber = {};
        suggestion.action.dialerAction.dialPhoneNumber.phoneNumber = phoneNumber;
        suggestion.action.dialerAction.dialPhoneNumber.fallbackUrl = fallbackUrl;
        break;

      case CALL_TYPE_ENRICHED:
        suggestion.action.dialerAction.dialEnrichedCall = {};
        suggestion.action.dialerAction.dialEnrichedCall.phoneNumber = phoneNumber;
        suggestion.action.dialerAction.dialEnrichedCall.fallbackUrl = fallbackUrl;
        suggestion.action.dialerAction.dialEnrichedCall.subject = subject;
        break;

      case CALL_TYPE_VIDEO:
        suggestion.action.dialerAction.dialVideoCall = {};
        suggestion.action.dialerAction.dialVideoCall.phoneNumber = phoneNumber;
        suggestion.action.dialerAction.dialVideoCall.fallbackUrl = fallbackUrl;
        break;
    }

    this._suggestions.push(suggestion);
  }

  addRequestLocationPushMapAction(displayText, postbackData) {
    let suggestion = {
      action: {
        mapAction: {
          requestLocationPush: {}
        },
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    this._suggestions.push(suggestion);
  }

  addShowLocationMapAction(displayText, postbackData, latitude, longitude, label, query, fallbackUrl) {
    let suggestion = {
      action: {
        mapAction: {
          showLocation: {
            location: {
              latitude: latitude,
              longitude: longitude,
              label: label,
              query: query
            },
            fallbackUrl: fallbackUrl
          }
        },
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    this._suggestions.push(suggestion);
  }

  addCalendarAction(displayText, postbackData, startTime, endTime, title, description, fallbackUrl) {
    let suggestion = {
      action: {
        calendarAction: {
          createCalendarEvent: {
            startTime : startTime,
            endTime: endTime,
            title: title,
            description: description,
            fallbackUrl: fallbackUrl
          }
        },
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    this._suggestions.push(suggestion);
  }

  addTextComposeAction(displayText, postbackData, phoneNumber, text) {
    let suggestion = {
      action: {
        composeAction: {
          composeTextMessage: {
            phoneNumber: phoneNumber,
            text: text
          }
        },
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    this._suggestions.push(suggestion);
  }

  addRecordingComposeAction(displayText, postbackData, phoneNumber, type) {
    let suggestion = {
      action: {
        composeAction: {
          composeRecordingMessage: {
            phoneNumber: phoneNumber,
            type: type
          }
        },
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    this._suggestions.push(suggestion);
  }

  addDeviceAction(displayText, postbackData) {
    let suggestion = {
      action: {
        deviceAction: {
          requestDeviceSpecifics: {}
        },
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    this._suggestions.push(suggestion);
  }

  addSettingsAction(displayText, postbackData, settingsType) {
    let suggestion = {
      action: {
        settingsAction: {},
        displayText: displayText,
        postback: {
          data: postbackData
        }
      }
    };

    switch (settingsType) {
      case SETTINGS_DISABLEANONYMIZATION:
        suggestion.action.settingsAction.disableAnonymization = {};
        break;

      case SETTINGS_ENABLEDISPLAYEDNOTIFICATIONS:
        suggestion.action.settingsAction.enableDisplayedNotifications = {};
        break;
    }

    this._suggestions.push(suggestion);
  }

  generate() {
    return this._suggestions;
  }

}

class FileMessage {

  constructor (fileUrl) {
    this._fileUrl = fileUrl;
    this._fileName = null;
    this._fileMIMEType = null;
    this._fileSize = null;
    this._thumbnailUrl = null;
    this._thumbnailFileName = null;
    this._thumbnailMIMEType = null;
    this._thumbnailFileSize = null;
  }

  setFileName(fileName) {
    this._fileName = fileName;
  }

  setFileMIMEType(fileMIMEType) {
    this._fileMIMEType = fileMIMEType;
  }

  setFileSize(fileSize) {
    this._fileSize = fileSize;
  }

  setThumbnailUrl(thumbnailUrl) {
    this._thumbnailUrl = thumbnailUrl;
  }

  setThumbnailFileName(thumbnailFileName) {
    this._thumbnailFileName = thumbnailFileName;
  }

  setThumbnailMIMEType(thumbnailMIMEType) {
    this._thumbnailMIMEType = thumbnailMIMEType;
  }

  setThumbnailFileSize(thumbnailFileSize) {
    this._thumbnailFileSize = thumbnailFileSize;
  }

  generate() {
    return {
      fileUrl: this._fileUrl,
      fileName: this._fileName,
      fileMIMEType: this._fileMIMEType,
      fileSize: this._fileSize,
      thumbnailUrl: this._thumbnailUrl,
      thumbnailFileName: this._thumbnailFileName,
      thumbnailMIMEType: this._thumbnailMIMEType,
      thumbnailFileSize: this._thumbnailFileSize
    }
  }

}

class AudioMessage {

  constructor (fileUrl) {
    this._fileUrl = fileUrl;
    this._fileName = null;
    this._fileMIMEType = null;
    this._fileSize = null;
    this._playingLength = null;
  }

  setFileName(fileName) {
    this._fileName = fileName;
  }

  setFileMIMEType(fileMIMEType) {
    this._fileMIMEType = fileMIMEType;
  }

  setFileSize(fileSize) {
    this._fileSize = fileSize;
  }

  setPlayingLength(playingLength) {
    this._playingLength = playingLength;
  }

  generate() {
    return {
      fileUrl: this._fileUrl,
      fileName: this._fileName,
      fileMIMEType: this._fileMIMEType,
      fileSize: this._fileSize,
      playingLength: this._playingLength
    }
  }

}

class GeolocationPushMessage {

  constructor (pos) {
    this._pos = pos;
    this._label = null;
    this._timestamp = null;
    this._expiry = null;
    this._timeOffset = null;
    this._radius = null;
  }

  setLabel(label) {
    this._label = label;
  }

  setTimestamp(timestamp) {
    this._timestamp = timestamp;
  }

  setExpiry(expiry) {
    this._expiry = expiry;
  }

  setTimeOffset(timeOffset) {
    this._timeOffset = timeOffset;
  }

  setRadius(radius) {
    this._radius = radius;
  }

  generate() {
    return {
      pos: this._pos,
      label: this._label,
      timestamp: this._timestamp,
      expiry: this._expiry,
      timeOffset: this._timeOffset,
      radius: this._radius
    }
  }

}

class Richcard {

  constructor () {
    this._cardOrientation = ORIENTATION_VERTICAL;
    this._imageAlignment = null;
    this._media = null;
    this._title = null;
    this._description = null;
    this._suggestions = null;
  }

  setCardOrientation(cardOrientation) {
    this._cardOrientation = cardOrientation;
  }

  setImageAlignment(imageAlignment) {
    this._imageAlignment = imageAlignment;
  }

  setMedia(mediaUrl, mediaContentType, mediaFileSize, thumbnailUrl, thumbnailContentType, height) {
      this._media = {
          mediaUrl: mediaUrl,
          mediaContentType: mediaContentType,
          thumbnailUrl: thumbnailUrl,
          thumbnailContentType: thumbnailContentType,
          mediaFileSize: mediaFileSize,
          height: height
      };
  }

  setTitle(title) {
    this._title = title;
  }

  setDescription(description) {
    this._description = description;
  }

  setSuggestions(suggestions) {
    this._suggestions = suggestions;
  }

  generate() {
    let richcard = {
      message: {
        generalPurposeCard: {
          layout: {},
          content: {}
        }
      }
    };

    richcard.message.generalPurposeCard.layout.cardOrientation = this._cardOrientation;
    if (this._cardOrientation === ORIENTATION_HORIZONTAL) {
      richcard.message.generalPurposeCard.layout.imageAlignment = this._imageAlignment;
    }

    richcard.message.generalPurposeCard.content = this.generateContent();

    return richcard;
  }

  generateContent() {
    let content = {};

    if (this._media) {
      content.media = this._media;
    }

    if (this._title) {
      content.title = this._title;
    }

    if (this._description) {
      content.description = this._description;
    }

    if (this._suggestions) {
      content.suggestions = this._suggestions.generate();
    }

    return content;
  }

}

class RichcardCarousel {

  constructor () {
    this._cardWidth = CARD_WIDTH_SMALL;
    this._richcards = new Array();
  }

  setCardWidth(cardWidth) {
    this._cardWidth = cardWidth;
  }

  addRichcard(richcard) {
    this._richcards.push(richcard);
  }

  generate() {
    let richcardcarousel = {
      message: {
        generalPurposeCardCarousel: {
          layout: {},
          content: []
        }
      }
    };

    richcardcarousel.message.generalPurposeCardCarousel.layout.cardWidth = this._cardWidth;

    for (let i = 0; i < this._richcards.length; i++) {
      richcardcarousel.message.generalPurposeCardCarousel.content.push(this._richcards[i].generateContent());
    }

    return richcardcarousel;
  }

}

module.exports = {
  Bot, MessageContact, Suggestions, Richcard, RichcardCarousel,
  MESSAGE_STATUS_CANCELLED, MESSAGE_STATUS_DISPLAYED,
  CALL_TYPE_PHONE, CALL_TYPE_ENRICHED, CALL_TYPE_VIDEO,
  ORIENTATION_VERTICAL, ORIENTATION_HORIZONTAL,
  ALIGNMENT_LEFT, ALIGNMENT_RIGHT,
  MEDIA_SHORT_HEIGHT, MEDIA_MEDIUM_HEIGHT, MEDIA_TALL_HEIGHT,
  CARD_WIDTH_SMALL, CARD_WIDTH_MEDIUM,
  SETTINGS_DISABLEANONYMIZATION, SETTINGS_ENABLEDISPLAYEDNOTIFICATIONS,
  RECORDING_TYPE_AUDIO, RECORDING_TYPE_VIDEO
}
