/* global TrelloPowerUp */
// import { equalize } from './equalize.js';

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
              const customFieldModel = t.board('customFields');
              const card = t.card('all');
              return Promise.all([customFieldModel, card])
                .then(function(customFieldModel, card) {
                  console.log("Custom fields");
                  console.log(customFieldModel);
                  console.log("Card");
                  console.log(card);
                })
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
