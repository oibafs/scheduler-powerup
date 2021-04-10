/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;

var BLACK_ROCKET_ICON = 'https://cdn.glitch.com/1b42d7fe-bda8-4af8-a6c8-eff0cea9e08a%2Frocket-ship.png?1494946700421';

var restApiCardButtonCallback = function(t) {

  return t.getRestApi()
   .isAuthorized()
   .then(function(authorized) {

      if (!authorized) {

        // You might be tempted to call client.authorize from a capability handler like the one we are in right now.
        // Unfortunately this does not register as a click by the browser, and it will block the popup. Instead, we need to
        // open a t.popup from our capability handler, and load an iframe that contains a button that calls client.authorize.
        return t.popup({
          title: 'Authorize Trello\'s REST API',   
          url: './api-client-authorize.html',
        })

      } else {

        return t.popup({
          title: "Choose an action",
          items: [
            {
              text: 'Postpone card',
              callback: function(t) {
                return t.popup({
                  title: 'Postpone card',
                  url: './postpone-card.html'
                })
              }
            },
            {
              text: 'Equalize dates',
              callback: function(t) {
                return t.popup({
                  title: 'Equalize dates',
                  url: './equalize-dates.html'
                })
              }
            },
            {
              // You can de-authorize the REST API client with a call to .clearToken()
              text: 'Unauthorize',
              callback: function(t) {
                return t.getRestApi()
                  .clearToken()
                  .then(function() {
                    t.alert('You\'ve successfully deauthorized!'); 
                    t.closePopup(); 
                  })
              }
            }
          ]

        })

      }
    
    });
 
  }

var sortPriorityCallback = (t, opts) => {
  // Trello will call this if the user clicks on this sort
  // opts.cards contains all card objects in the list
  return t.board("customFields")
  .then((board) => {
    
    const fieldValue = (customFields, customFieldItems, name) => {
      try {
        const model = customFields.filter(i => i.name === name)[0];
        const field = customFieldItems.filter(i => i.idCustomField === model.id)[0];
        switch(model.type) {
          case("list"):
            return model.options.findIndex(i => i.id === field.idValue).toString();
          case("checkbox"):
            return field.value.checked;
          default:
            return field.value[model.type];
        }
      }
      catch(err) {
        return null;
      }
    }

    const cards = opts.cards.map((item) => {
      return {
        id: item.id,
        sorter: (
          fieldValue(board.customFields, item.customFields, "Priority") 
          + fieldValue(board.customFields, item.customFields, "Next action")
          + item.due
          + fieldValue(board.customFields, item.customFields, "Start date"))
      }
    })

    console.log(cards);

    const sortedCards = cards.sort(
      (a, b) => {
        if (a.sorter > b.sorter) {
          return 1;
        } else if (b.sorter > a.sorter) {
          return -1;
        }
        return 0;
      });

    console.log(sortedCards);

    return {
      sortedIds: sortedCards.map(function (c) { return c.id; })
    };

  })
}

TrelloPowerUp.initialize({
  // Start adding handlers for your capabilities here!
	// 'card-buttons': function(t, options) {
	// return t.set("member", "shared", "hello", "world")
	// .then(function(){
	// 	  return [{
	// icon: BLACK_ROCKET_ICON,
	// 		  text: 'Estimate Size',
	//       callback: function(t) {
	//         return t.popup({
	//           title: "Estimation",
	//           url: 'estimate.html',
	//         });
	//       }
	// 	  }];
	// })
	// },
  'card-buttons': function(t, options) {
    return [{
      icon: BLACK_ROCKET_ICON,
      text: 'Scheduler',
      callback: restApiCardButtonCallback,
    }];
  },
  'list-sorters': function (t) {
    return t.list('name', 'id')
    .then(function (list) {
      return [{
        text: "Priority",
        callback: sortPriorityCallback
      }];
    });
  }  
}, {
  // appKey: 'your_key_here',
  appKey: '039f30a96f8f3e440addc095dd42f87d',
  appName: 'Scheduler'
});
