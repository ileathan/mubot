// Description:
//   Allows sending messages over the max length for discord
//

(function() {
  var POWER_COMMANDS, POWER_USERS,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  POWER_COMMANDS = ['create.file', 'view.file', 'create.break', 'create.die'];

  POWER_USERS = ['leathan'];

  module.exports = function(robot) {
    robot.listenerMiddleware(function(context, next, done) {
      var ref, ref1;
      if (ref = context.listener.options.id, indexOf.call(POWER_COMMANDS, ref) >= 0) {
        if (ref1 = context.response.message.user.name, indexOf.call(POWER_USERS, ref1) >= 0) {
          return next();
        } else {
          context.response.send("I'm sorry, @" + context.response.message.user.name + ", but you don't have access to do that.");
          return done();
        }
      } else {
        return next();
      }
    });
    return robot.responseMiddleware(function(context, next, done) {
      var RecursAndQue, i;
      if (context.plaintext == null) {
        return;
      }
      i = 0;
      RecursAndQue = function() {
        var epad, fpad, m;
        if ((context.strings[i] != null) && context.strings[i].length > 2000) {
          fpad = "";
          epad = "";
          if (context.response.match[0].indexOf('view') === 0) {
            fpad = '```coffeescript\n';
            epad = '```';
          }
          if (context.response.match[0].indexOf('search') === 0) {
            fpad = '```\n';
            epad = '```';
          }
          m = context.strings[i].match(/^([\s\S]{0,1940}\n)/);
          if (!(m != null ? m[0] : void 0)) {
            m = context.strings[i].match(/^([\s\S]{0,1940})/);
          }
          context.strings.push(("" + fpad) + context.strings[i].slice(m[1].length));
          context.strings[i] = context.strings[i].slice(0, m[1].length) + epad;
          i++;
          return RecursAndQue();
        }
      };
      RecursAndQue(context.strings[i]);
      done();
      return next();
    });
  };

}).call(this);