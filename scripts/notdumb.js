
// notdumb

module.exports = bot => {
  bot.hear(RegExp('^' + bot.alias || bot.name + '\s+(is |so )[\S\s]*dumb', 'i'), msg => {
     msg.send("FUCK YOU!")
  });

};