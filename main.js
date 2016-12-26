(function($) {
  var players = {};
  var playerGen = function*() {
    let i = 0;
    while (i < 4) {
      i++;
      var player = {
        id: i,
        name: 'Player ' + i,
      };
      players[i] = player;
      let input = $('<input />')
        .addClass('player-name')
        .attr('id', 'player-name-' + i)
        .attr('tabindex', i)
        .attr('placeholder', player.name)
        .data('player', player)
        .blur(function(ev) {
          var player = $(ev.target).data('player');
          player.name = $(ev.target).val();
          if (player.name === '') {
            player.name = 'Player ' + player.id;
          }
          $('#scores-name-player-' + player.id).text(player.name);
        });
      let c = $('<td />')
        .addClass('entry-name-cell')
        .append(input);
      yield $('<tr />')
        .addClass('entry-row')
        .attr('id', 'entry-player-' + i)
        .append(c);
    }
  }
  var roundGen = function*() {
    let i = 0;
    while (true) {
      i++;
      let ch = $('<th />')
        .text(i);
      $('#entry-header').append(ch);
      $.each(players, function(j, p) {
        let ri = $('<input />')
          .addClass('entry-round-input')
          .addClass('entry-input-round-' + i)
          .addClass('entry-input-player-' + p.id)
          .attr('tabindex', (i + 1) * 4 + p.id)
          .attr('type', 'number')
          .attr('min', 0)
          .attr('step', 1)
          .data('player', p)
          .data('round', i)
          .blur(function(ev) {
            testInputs();
          });
        let c = $('<td />')
          .addClass('entry-round-cell')
          .append(ri);
        $('#entry-player-' + p.id).append(c);
      });
      yield i;
    }
  }
  var rg = roundGen();
  var pg = playerGen();
  var round;
  var recalculate = function() {
    var x;
    $('#scores-values').empty();
    var currentScores = {};
    var scoreCells = {};
    $.each(players, function(i, p) {
      currentScores[i] = 0;
    });
    for (x = 1; x < round; x++) {
      $.each(players, function(i, p) {
        p.rawScores = [];
      });
      var winner = $('.winner.entry-input-round-' + x);
      var inputs = $('.entry-input-round-' + x).not(winner).sort(function(a, b) {
        return parseInt($(b).val(), 10) - parseInt($(a).val(), 10);
      });
      var winningScore = parseInt(winner.val(), 10);
      var winningPlayer = winner.data('player').rawScores;
      winningPlayer.push(winningScore);
      winningPlayer.push(winningScore);
      winningPlayer.push(winningScore);
      var otherScores = [];
      var otherPlayers = [];
      inputs.each(function(j, input) {
        input = $(input);
        let p = input.data('player');
        p.rawScores.push(-winningScore);
        otherScores.push(parseInt(input.val(), 10));
        otherPlayers.push(p);
      });
      otherPlayers[0].rawScores.push(otherScores[0] - otherScores[1]);
      otherPlayers[0].rawScores.push(otherScores[0] - otherScores[2]);
      otherPlayers[1].rawScores.push(otherScores[1] - otherScores[0]);
      otherPlayers[1].rawScores.push(otherScores[1] - otherScores[2]);
      otherPlayers[2].rawScores.push(otherScores[2] - otherScores[0]);
      otherPlayers[2].rawScores.push(otherScores[2] - otherScores[1]);
      scoreCells[x] = {};
      $.each(players, function(i, player) {
        scoreCells[x][i] = {
          pos: [],
          neg: []
        };
        if (x > 1) {
          var c = {total: true, value: currentScores[i]};
          if (currentScores[i] < 0) {
            scoreCells[x][i].neg.push(c);
          } else {
            scoreCells[x][i].pos.push(c);
          }
        }
        currentScores[i] = currentScores[i] + player.rawScores.reduce(function(a, b) {
          return a + b;
        });
        $.each(player.rawScores, function(j, score) {
          if (score === 0) {
            return true;
          }
          var c = {total: false, value: score};
          if (score < 0) {
            scoreCells[x][i].neg.push(c);
          } else {
            scoreCells[x][i].pos.push(c);
          }
        });
      });
      if (x + 1 === round) {
        scoreCells[x + 1] = {};
        $.each(currentScores, function(i, score) {
          scoreCells[x + 1][i] = {
            pos: [],
            neg: []
          };
          var c = {total: true, value: score};
          if (score < 0) {
            scoreCells[x + 1][i].neg.push(c);
          } else {
            scoreCells[x + 1][i].pos.push(c);
          }
        });
      }
    }
    $.each(scoreCells, function(round, cells) {
      var roundContainer = $('<div/>')
        .addClass('scores-values')
        .attr('id', 'scores-values-round-' + x);
      $('#scores-values').append(roundContainer);
      $.each(cells, function(p, scores) {
        var playerContainer = $('<div/>')
        .addClass('scores-player scores-values-player-' + p);
        roundContainer.append(playerContainer);
        var scoresContainer = $('<div/>');
        playerContainer.append(scoresContainer);
        $.each(['pos', 'neg'], function(q, type) {
          var valContainer = $('<div/>').addClass(type);
          scoresContainer.append(valContainer);
          $.each(scores[type], function(j, cell) {
            var c = $('<div />').text(cell.value);
            if (cell.total) {
              c.addClass('total');
            }
            valContainer.append(c);
          });
        });
      });
    });
  };
  var testInputs = function() {
    var rcomp = 0;
    var inputs = $('.entry-input-round-' + round);
    var filled;
    inputs.each(function(p, e) {
      var textScore = $(e).val();
      var score = parseInt(textScore, 10);
      if (textScore !== '' && !isNaN(score)) {
        filled = $(e);
        rcomp++;
      }
    });
    if (rcomp === 1) {
      inputs.removeClass('winner');
      filled.addClass('winner');
    }
    if (rcomp === 4) {
      round = rg.next().value;
      inputs.prop('disabled', true);
      recalculate();
    }
  };
  $(function() {
    var entryTable = $('#entry');
    var p = pg.next();
    while (!p.done) {
        entryTable.append(p.value);
        p = pg.next();
    }
    round = rg.next().value;
  });
})(jQuery);
