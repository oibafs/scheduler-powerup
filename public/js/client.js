/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;

var BLACK_ROCKET_ICON = 'https://cdn.glitch.com/1b42d7fe-bda8-4af8-a6c8-eff0cea9e08a%2Frocket-ship.png?1494946700421';

function getCustomFields(items, fieldsModel) {
  let json = {};

  // Process custom field items
  for (let i = 0; i < items.length; i ++) {

    // Find custom field model
    const model = fieldsModel.filter(model => model.id == items[i].idCustomField);
    const name = model[0].name;

    if (items[i].value) {

      // Direct value
      const value = Object.values(items[i].value)[0];
      json[name] = value;

    } else {

      // Get value from options
      const value = Object.values(model[0].options.filter(model => model.id == items[i].idValue)[0].value)[0];
      json[name] = value;

    }

  }

  // Get custom field ids and values
  for (let i = 0; i < fieldsModel.length; i ++) {
    const name = fieldsModel[i].name;
    const customFieldId = "idCustomField" + name;
    json[customFieldId] = fieldsModel[i].id;

    for (let j = 0; j < (fieldsModel[i].options ? fieldsModel[i].options.length : 0); j ++) {
      const idValue = fieldsModel[i].options[j].id;
      const value = fieldsModel[i].options[j].value.text;
      const customFieldIdValue = "idCustomFieldValue" + name + value;
      json[customFieldIdValue] = idValue;
    }

  }

  return json;
}

// function equalize(card, customFieldModel) {
//   let work = {};
//   work.start = card.badges.start;
//   work.customFields = card.customFieldItems ? getCustomFields(card.customFieldItems, customFieldModel) : {};
//   console.log(work);
// }

var authenticationSuccess = function(t) {
  console.log('Successful authentication');
  t.set('member', 'private', 'token', window.Trello.token());
};

var authenticationFailure = function() {
  console.log('Failed authentication');
  t.closePopup();
};

function equalize(t) {

  if (!window.Trello.authorized()) {

    t.get('member', 'private', 'token', null)
      .then((token) => {

        if (token) {
          window.Trello.setToken(token);
        } else {

          window.Trello.authorize({
            type: 'popup',
            name: 'Scheduler',
            scope: {
              read: 'true',
              write: 'true' },
            expiration: 'never',
            success: authenticationSuccess(t),
            error: authenticationFailure
          });    
      
        }

      })

  } else {
    console.log('Already authorized!');
  }

  // const authorized = authorize();
  // console.log(authorized);
    // .then(() => {

    //   window.Trello.cards.get(id, {
    //     customFields: 'true',
    //     customFieldItems: 'true',
    //     checklists: 'all'
    //   })
    //     .then((card) => {
    //       console.log(JSON.stringify(card, null, 2))
    //     })
  
    // })

  }

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
         items: [{
           // We'll use the client on the authorization page to make an example request.
           text: 'Postpone card',
           callback: function(t) {
             return t.card('all')
              .then(function(card) {
                console.log(JSON.stringify(card, null, 2));
              })
           }
         }, {
            text: 'Equalize dates',
            callback: function(t) {
              // const customFieldModel = t.board('customFields');
              // const card = t.card('all');
              // return Promise.all([customFieldModel, card])
              //   .then(function(result) {
              //     equalize(result[1], result[0].customFields);
              //     t.closePopup();
              //   })

              // const card = t.card('id')
              //   .then(function(card) {
              //     equalize(card.id);
              //   })

              equalize(t);
            }
          }, {
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
         }]
       })
     }
   });
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
  }
}, {
  // appKey: 'your_key_here',
  appKey: '039f30a96f8f3e440addc095dd42f87d',
  appName: 'Scheduler'
});
