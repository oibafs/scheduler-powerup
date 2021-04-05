// Calculate dates
const setDates = (json) => {
  let putJson = {};

  // Set standard start date the same as custom field start date
  if (json.customFields["Start date"] && (json.start != json.customFields["Start date"])) {
    json.start = json.customFields["Start date"];

    putJson.main = {
      params : {
        start : JSON.parse(JSON.stringify(json.start))
      }
    };

  }

  // Set first custom field date the same as custom field next action
  putJson.checkListItems = [];

  if (json.checkListItems.length > 0) {

    if (json.customFields["Next action"] && (json.checkListItems[0].due != json.customFields["Next action"])) {
      json.checkListItems[0].due = json.customFields["Next action"];
  
      putJson.checkListItems.push({
        id : json.checkListItems[0].id,
        params : {
          due : JSON.parse(JSON.stringify(json.checkListItems[0].due))
        }
      })
  
    }
  
  }

  return putJson;
}

// Success on putting new start date
const putStartDateSuccess = (response) => {
  const newStart = new Intl.DateTimeFormat('default', {dateStyle: 'short', timeStyle: 'long'}).format(new Date(response.start));
  $("#response").append(`<sm>Start date: ${newStart}<br></sm>`);
  $("#response").show();
}

// Equalize dates
const equalize = (t, token) => {

  t.card('id')
    .then((card) => {
      window.Trello.setToken(token);

      window.Trello.cards.get(card.id, {
          customFields: 'true',
          customFieldItems: 'true',
          checklists: 'all'
        }, getCardSuccess, requestFailure)
        .then((card) => {

          // Calculate new dates
          let work = {};
          work.start = card.start;
          work.customFields = (card.customFieldItems && card.customFields) ? getCustomFields(card.customFieldItems, card.customFields) : {};
          work.checkListItems = card.checklists ? getCheckListItems(card.checklists) : {};
          const output = setDates(work);

          // Start updates

          // Update main fields
          if (output.main) {
            window.Trello.put(`card/${card.id}`, output.main.params, putStartDateSuccess, requestFailure);
          }

          // Update check list items
          for(let i = 0; i < output.checkListItems.length; i ++) {
            window.Trello.put(`card/${card.id}/checkItem/${output.checkListItems[i].id}`, output.checkListItems[i].params, putCheckListSuccess, requestFailure);
          }

          //Nothing to update
          if (!output.main && output.checkListItems.length === 0) {
            $("#response").append(`<sm>Nothing to update!<br></sm>`);
            $("#response").show();            
          }

        })

    })

}