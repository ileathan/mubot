// Description:
//   Dictionary definitions with the Wordnik API.
//
// Dependencies:
//   None
//
// Configuration:
//   WORDNIK_API_KEY
//
// Commands:
//   hubot define me <word> - Grabs a dictionary definition of a word.
//   hubot pronounce me <word> - Links to a pronunciation of a word.
//   hubot spell me <word> - Suggests correct spellings of a possible word.
//   hubot bigram me <word> - Grabs the most frequently used bigram phrases containing this word
//
// Notes:
//   You'll need an API key from http://developer.wordnik.com/
//   FIXME This should be merged with word-of-the-day.coffee
//
// Author:
//   Aupajo
//   markpasc

(function() {
  var fetch_wordnik_resource;

  module.exports = function(robot) {
    robot.respond(/define( me)? (.*)/i, function(msg) {
      var word;
      word = msg.match[2];
      return fetch_wordnik_resource(msg, word, 'definitions', {})(function(err, res, body) {
        var definitions, lastSpeechType, reply;
        definitions = JSON.parse(body);
        if (definitions.length === 0) {
          return msg.send("No definitions for \"" + word + "\" found.");
        } else {
          reply = "Definitions for \"" + word + "\":\n";
          lastSpeechType = null;
          definitions = definitions.forEach(function(def) {
            if (def.partOfSpeech !== lastSpeechType) {
              if (def.partOfSpeech !== void 0) {
                reply += " (" + def.partOfSpeech + ")\n";
              }
            }
            lastSpeechType = def.partOfSpeech;
            return reply += "  - " + def.text + "\n";
          });
          return msg.send(reply);
        }
      });
    });
    robot.respond(/(pronounce|enunciate)( me)? (.*)/i, function(msg) {
      var word;
      word = msg.match[3];
      return fetch_wordnik_resource(msg, word, 'audio', {})(function(err, res, body) {
        var pronunciation, pronunciations;
        pronunciations = JSON.parse(body);
        if (pronunciations.length === 0) {
          return msg.send("No pronounciation for \"" + word + "\" found.");
        } else {
          pronunciation = pronunciations[0];
          return msg.send(pronunciation.fileUrl);
        }
      });
    });
    robot.respond(/spell(?: me)? (.*)/i, function(msg) {
      var word;
      word = msg.match[1];
      return fetch_wordnik_resource(msg, word, '', {
        includeSuggestions: 'true'
      })(function(err, res, body) {
        var list, wordinfo;
        wordinfo = JSON.parse(body);
        if (wordinfo.canonicalForm) {
          return msg.send("\"" + word + "\" is a word.");
        } else if (!wordinfo.suggestions) {
          return msg.send("No suggestions for \"" + word + "\" found.");
        } else {
          list = wordinfo.suggestions.join(', ');
          return msg.send("Suggestions for \"" + word + "\": " + list);
        }
      });
    });
    return robot.respond(/bigram( me)? (.*)/i, function(msg) {
      var word;
      word = msg.match[2];
      return fetch_wordnik_resource(msg, word, 'phrases', {})(function(err, res, body) {
        var phrases, reply;
        phrases = JSON.parse(body);
        if (phrases.length === 0) {
          return msg.send("No bigrams for \"" + word + "\" found.");
        } else {
          reply = "Bigrams for \"" + word + "\":\n";
          phrases = phrases.forEach(function(phrase) {
            if (phrase.gram1 !== void 0 && phrase.gram2 !== void 0) {
              return reply += phrase.gram1 + " " + phrase.gram2 + "\n";
            }
          });
          return msg.send(reply);
        }
      });
    });
  };

  fetch_wordnik_resource = function(msg, word, resource, query, callback) {
    if (process.env.WORDNIK_API_KEY === void 0) {
      msg.send("Missing WORDNIK_API_KEY env variable.");
      return;
    }
    return msg.http("http://api.wordnik.com/v4/word.json/" + (escape(word)) + "/" + (escape(resource))).query(query).header('api_key', process.env.WORDNIK_API_KEY).get(callback);
  };

}).call(this);
