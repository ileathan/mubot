// Description:
//   A Marking U Bot.
//
// Dependencies:
//   bitmarkd must be running
//   bitmark-cli must be in path
//   wallet must be funded
//
// Configuration:
//
//
// Commands:
//   + <times> <user> <reason>        -   Marks the specified user.
//   withdraw <address> <amount>      -   withdraw to address amount.
//   deposit                          -   Display your address.
//   marks [user]                     -   Balance for a user.
//
// Author:
//   Project Bitmark
//

(function() {
  var adapter, deposit_marks, exec, from_URI, irc_server, last, marks, secret, slack_team, symbol, to_URI, transfer_marks, why_context, withdraw_marks;

  exec = require('child_process').exec;

  marks = {};

  symbol = '₥';

  last = 'Mubot';

  secret = process.env.HUBOT_DEPOSIT_SECRET;

  why_context = '';

  if (process.env.HUBOT_ADAPTER === 'irc') {
    adapter = 'irc';
    irc_server = process.env.HUBOT_IRC_SERVER;
  } else if (process.env.HUBOT_ADAPTER === 'slack') {
    adapter = 'slack';
    slack_team = process.env.HUBOT_SLACK_TEAM;
  } else if (process.env.HUBOT_ADAPTER === 'shell') {
    adapter = 'shell';
  } else {
    adapter = 'discord' || (function() {
      throw new Error('HUBOT_ADAPTER env variable is required');
    })();
  }

  to_URI = function(id) {
    if (id.indexOf(':') !== -1) {
      return id;
    } else if (adapter === 'irc') {
      return 'irc://' + id.toLowerCase() + '@' + irc_server + '/';
    } else if (adapter === 'slack') {
      return 'https://' + slack_team + '.slack.com/team/' + id.toLowerCase() + '#this';
    } else if (adapter === 'shell') {
      return 'urn:shell:' + id.toLowerCase();
    } else {
      return id;
    }
  };

  from_URI = function(URI) {
    if (URI.indexOf('irc://') === 0 && adapter === 'irc') {
      return URI.split(":")[1].substring(2).split('@')[0];
    } else if (URI.indexOf('https://' + slack_team + '.slack.com/team/') === 0 && URI.indexOf('#this') !== -1 && adapter === 'slack') {
      return URI.split(":")[1].substring(2).split('/')[2].split('#')[0];
    } else {
      return URI;
    }
  };

  deposit_marks = function(msg, URI, amount, robot) {
    var base;
    if ((base = robot.brain.data.marks)[URI] == null) {
      base[URI] = 0;
    }
    robot.brain.data.marks[URI] += parseFloat(amount);
    return msg.send(amount + symbol + ' to ' + from_URI(URI) + '.');
  };

  transfer_marks = function(msg, URI, amount, robot) {
    var base;
    if (why_context == null) {
      why_context = "N/A";
    }
    if (robot.brain.data.marks[to_URI(msg.message.user.id)] >= parseFloat(amount)) {
      if ((base = robot.brain.data.marks)[URI] == null) {
        base[URI] = 0;
      }
      robot.brain.data.marks[URI] += parseFloat(amount);
      robot.brain.data.marks[to_URI(msg.message.user.id)] -= parseFloat(amount);
      return msg.send(msg.message.user.name + ' has marked ' + robot.brain.data.users[URI].name + ' ' + amount + symbol + '. ( ' + why_context + ' )');
    } else {
      return msg.send('Sorry, but you dont have enough marks. Try the deposit command or get marked more.');
    }
  };

  withdraw_marks = function(msg, address, amount, robot) {
    var command;
    if (robot.brain.data.marks[to_URI(msg.message.user.name)] >= parseFloat(amount)) {
      command = 'bitmark-cli sendtoaddress ' + address + ' ' + (parseFloat(amount) / 1000.0);
      console.log(command);
      return exec(command, function(error, stdout, stderr) {
        console.log(error);
        console.log(stdout);
        console.log(stderr);
        robot.brain.data.marks[to_URI(msg.message.user.name)] -= parseFloat(amount);
        return msg.send(stdout);
      });
    } else {
      return msg.send('Sorry, you have not been marked that many times yet.');
    }
  };

  module.exports = function(robot) {
    robot.brain.on('loaded', function() {
      var base, base1;
      if ((base = robot.brain.data).marks == null) {
        base.marks = {};
      }
      marks = robot.brain.data.marks || {};
      robot.brain.resetSaveInterval(1);
      return (base1 = robot.brain.data.marks)['183771581829480448'] != null ? base1['183771581829480448'] : base1['183771581829480448'] = 12000;
    });
    robot.hear(/^\+(\d+)\s+<@?!?(\d+)>\s*(.*)?$/i, function(msg) {
      var plus;
      if (msg.match[2] === '329612596397342721') {
        msg.send("Sorry but I am currently unmarkable.");
        return;
      }
      if (msg.match[2] === msg.message.user.id) {
        msg.send("Sorry but you cannot mark yourself.");
        return;
      }
      why_context = msg.match[3];
      plus = msg.match[1];
      if (plus <= 25) {
        return transfer_marks(msg, to_URI(msg.match[2]), plus, robot);
      } else {
        return msg.send('Max is +25');
      }
    });
    robot.hear(/withdraw\s+([\w\S]+)\s+(\d+)\s*$/i, function(msg) {
      var destination;
      destination = msg.match[1];
      return withdraw_marks(msg, destination, msg.match[2], robot);
    });
    robot.hear(/^marks\s+<@?!?(\d+)>$/i, function(msg) {
      var URI, base;
      if (robot.brain.data.users[msg.match[1]]) {
        URI = to_URI(msg.match[1]);
        if ((base = robot.brain.data.marks)[URI] == null) {
          base[URI] = 0;
        }
        return msg.send(robot.brain.data.users[msg.match[1]].name + ' has ' + robot.brain.data.marks[URI] + symbol + '.');
      } else {
        return msg.send("Sorry, I can't find that user.");
      }
    });
    robot.hear(/^marks\s*$/i, function(msg) {
      var URI, base;
      URI = to_URI(msg.message.user.id);
      if ((base = robot.brain.data.marks)[URI] == null) {
        base[URI] = 0;
      }
      return msg.send('You have ' + robot.brain.data.marks[URI] + symbol + '.');
    });
    return robot.router.get("/" + robot.name + "/marks", function(req, res) {
      return res.end(robot.brain.data.marks);
    });
  };

}).call(this);