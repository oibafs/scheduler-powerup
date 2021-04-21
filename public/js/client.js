const e = require("express");

/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;

var BLACK_ROCKET_ICON = 'https://cdn.glitch.com/1b42d7fe-bda8-4af8-a6c8-eff0cea9e08a%2Frocket-ship.png?1494946700421';
var WHITE_ICON = 'https://cdn.hyperdev.com/us-east-1%3A3d31b21c-01a0-4da2-8827-4bc6e88b7618%2Ficon-white.svg';
var BLACK_ICON = 'https://cdn.hyperdev.com/us-east-1%3A3d31b21c-01a0-4da2-8827-4bc6e88b7618%2Ficon-black.svg';

var restApiCardButtonCallback = function (t) {

  return t.getRestApi()
    .isAuthorized()
    .then(function (authorized) {

      if (!authorized) {

        // You might be tempted to call client.authorize from a capability handler like the one we are in right now.
        // Unfortunately this does not register as a click by the browser, and it will block the popup. Instead, we need to
        // open a t.popup from our capability handler, and load an iframe that contains a button that calls client.authorize.
        return t.popup({
          title: "Authorize Trello's REST API",
          url: './api-client-authorize.html',
        })

      } else {

        return t.popup({
          title: "Choose an action",
          items: [
            {
              text: 'Postpone card',
              callback: function (t) {
                return t.popup({
                  title: 'Postpone card',
                  url: './postpone-card.html'
                })
              }
            },
            {
              text: 'Next action -> Check list',
              callback: function (t) {
                return t.popup({
                  title: 'Next action -> Check list',
                  url: './equalize-dates.html'
                })
              }
            },
            {
              text: 'Check list -> Next action',
              callback: function (t) {
                return t.popup({
                  title: 'Check list -> Next action',
                  url: './checklist-next-action.html'
                })
              }
            },
            {
              // You can de-authorize the REST API client with a call to .clearToken()
              text: 'Unauthorize',
              callback: function (t) {
                return t.getRestApi()
                  .clearToken()
                  .then(function () {
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

const fieldValue = (customFields, customFieldItems, name) => {
  try {
    const model = customFields.filter(i => i.name === name)[0];
    const field = customFieldItems.filter(i => i.idCustomField === model.id)[0];
    switch (model.type) {
      case ("list"):
        return model.options.findIndex(i => i.id === field.idValue).toString();
      case ("checkbox"):
        return field.value.checked;
      default:
        return field.value[model.type];
    }
  }
  catch (err) {
    return "null";
  }
}

const sortPriorityCallback = (t, opts) => {
  // Trello will call this if the user clicks on this sort
  // opts.cards contains all card objects in the list
  return t.board("customFields")
    .then((board) => {

      const cards = opts.cards.map((item) => {
        return {
          id: item.id,
          sorter: (
            fieldValue(board.customFields, item.customFieldItems, "Priority")
            + fieldValue(board.customFields, item.customFieldItems, "Next action")
            + item.due
            + fieldValue(board.customFields, item.customFieldItems, "Start date"))
        }
      })

      const sortedCards = cards.sort(
        (a, b) => {
          if (a.sorter > b.sorter) {
            return 1;
          } else if (b.sorter > a.sorter) {
            return -1;
          }
          return 0;
        });

      return {
        sortedIds: sortedCards.map(function (c) { return c.id; })
      };

    })
}

const todayResponse = (response) => {
  console.log(response);
}

const onTodayClick = (t, opts) => {

  const tomorrow = () => {
    const today = new Date();
    const midNight = new Date(today.setHours(0, 0, 0, 0));
    return new Date(midNight.setDate(midNight.getDate() + 1));
  }

  t.board("customFields", "labels")
    .then((board) => {
      const lblToday = board.labels.filter(i => i.name === "today")[0];
      t.lists("id", "name")
        .then((lists) => {
          let doneList = lists.filter(i => i.name === "Done")[0];
          doneList = doneList ? doneList.id : "";
          t.cards("id", "idList", "customFieldItems", "labels")
            .then((cards) => {

              const cardsStatus = cards.map((item) => {
                const nextAction = fieldValue(board.customFields, item.customFieldItems, "Next action");
                const today = nextAction != "null" ? new Date(nextAction) < tomorrow() : false;
                const labelToday = item.labels ? item.labels.filter(i => i.name === "today").length > 0 : false;
                const addLabel = today && !labelToday && item.idList != doneList;
                const deleteLabel = (!today && labelToday) || item.idList === doneList;
                return {
                  id: item.id,
                  addLabel: addLabel,
                  deleteLabel: deleteLabel
                }
              });

              const cardsToChange = cardsStatus.filter(item => item.addLabel || item.deleteLabel);
              console.log(cardsToChange);

              if (cardsToChange.length > 0) {

                t.getRestApi()
                  .getToken()
                  .then((token) => {

                    if (token) {
                      window.Trello.setToken(token);

                      cardsToChange.map((item) => {

                        if (item.addLabel) {
                          console.log("POST");
                          window.Trello.post(`cards/${item.id}/idLabels/?value=${lblToday.id}`, null, todayResponse, todayResponse);
                        } else if (item.deleteLabel) {
                          console.log("DELETE");
                          window.Trello.delete(`cards/${item.id}/idLabels/${lblToday.id}`, null, todayResponse, todayResponse);
                        };

                      });

                    } else {
                      t.alert("Not authorized!");
                    }

                  })

              }

            })
        })

    })

}

const onImportanceClick = (t, opts) => {

  t.board("customFields", "labels")
    .then((board) => {
      const lblStar = board.labels.filter(i => i.name === "star")[0];

      t.lists("id", "name")
        .then((lists) => {
          let doneList = lists.filter(i => i.name === "Done")[0];
          doneList = doneList ? doneList.id : "";

          t.cards("id", "idList", "customFieldItems", "labels")
            .then((cards) => {

              const cardsImportance = cards.map((item) => {
                const priority = fieldValue(board.customFields, item.customFieldItems, "Priority");
                const star = item.labels ? item.labels.filter(i => i.name === "star").length > 0 : false;
                const due = item.due ? new Date(item.due) : new Date("2999/12/31");
                const category = fieldValue(board.customFields, item.customFieldItems, "Category");
                let nextAction = fieldValue(board.customFields, item.customFieldItems, "Next action");
                const importance = fieldValue(board.customFields, item.customFieldItems, "Importance");
                let newImportance = 2;

                switch (priority) {
                  case "Urgent":
                    newImportance += 3;
                    break;

                  case "Important":
                    newImportance += 2;
                    break;

                  case "Medium":
                    newImportance += 1;
                    break;

                  default:
                    break;
                }

                newImportance += star ? 1 : 0;

                const today = new Date();

                // Calculate difference between two dates in days
                const dateDiff = (originalDate, futureDate) => {
                  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
                  return Math.floor((futureDate - originalDate) / _MS_PER_DAY);
                }

                const daysToDue = dateDiff(today, due);

                if (daysToDue < 0) {
                  newImportance += 6;
                } else if (daysToDue < 1) {
                  newImportance += 5;
                } else if (daysToDue < 2) {
                  newImportance += 3;
                } else if (daysToDue < 7) {
                  newImportance += 2;
                } else if (daysToDue < 14) {
                  newImportance += 1;
                }

                newImportance += (category === "Work") ? 1 : 0;

                nextAction = (nextAction === "null") ? new Date("2999/12/31") : nextAction;

                if (nextAction < 0) {
                  newImportance += 2;
                } else if (nextAction < 1) {
                  newImportance += 1;
                }

                return {
                  id: item.id,
                  importance: importance,
                  newImportance: newImportance,
                }

              })

              const cardsToChange = cardsImportance.filter(item => item.newImportance != item.importance);

              if (cardsToChange.length > 0) {

                cardsToChange.map((item) => {
                  console.log(cardsToChange);
                })

                /*
                          t.getRestApi()
                            .getToken()
                            .then((token) => {
                
                              if (token) {
                                window.Trello.setToken(token);
                
                                cardsToChange.map((item) => {
                
                                  if (item.addLabel) {
                                    console.log("POST");
                                    window.Trello.post(`cards/${item.id}/idLabels/?value=${lblToday.id}`, null, todayResponse, todayResponse);
                                  } else if (item.deleteLabel) {
                                    console.log("DELETE");
                                    window.Trello.delete(`cards/${item.id}/idLabels/${lblToday.id}`, null, todayResponse, todayResponse);
                                  };
                
                                });
                
                              } else {
                                t.alert("Not authorized!");
                              }
                
                            })
                */

              }

            })

        })

    })

}

const getBadges = (t) => {

  return t.board("customFields")
    .then((board) => {
      return t.card("customFieldItems")
        .then((card) => {
          const nextAction = fieldValue(board.customFields, card.customFieldItems, "Next action");

          if (nextAction != "null") {
            const next = new Date(nextAction);
            const now = new Date();

            const color = (next, now) => {
              if (next < now) {
                return "red";
              } else if (next.getDate() === now.getDate()) {
                return "yellow";
              } else {
                return null;
              }
            }

            const printNext = Intl.DateTimeFormat("default", {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            }).format(next);

            return [{
              text: `Next action: ${printNext}`,
              color: color(next, now)
            }];

          } else {
            return [];
          }

        })
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
  'card-buttons': function (t, options) {
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
  },
  'board-buttons': function (t, opts) {
    return [
      {
        // we can either provide a button that has a callback function
        icon: {
          dark: WHITE_ICON,
          light: BLACK_ICON
        },
        text: 'Today',
        callback: onTodayClick,
        condition: 'edit'
      },
      {
        icon: {
          dark: WHITE_ICON,
          light: BLACK_ICON
        },
        text: 'Importance',
        callback: onImportanceClick,
        condition: 'edit'
      },
    ];
  },
  'card-badges': (t, opts) => {
    return getBadges(t);
  }
}, {
  // appKey: 'your_key_here',
  appKey: '039f30a96f8f3e440addc095dd42f87d',
  appName: 'Scheduler'
});
