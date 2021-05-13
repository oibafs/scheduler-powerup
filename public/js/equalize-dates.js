// Calculate dates
const setDates = (json) => {
  let putJson = {};

  // Set standard start date the same as custom field start date
  if (json.customFields["Start date"] && (json.start != json.customFields["Start date"])) {
    json.start = json.customFields["Start date"];

    putJson.main = {
      params: {
        start: JSON.parse(JSON.stringify(json.start))
      }
    };

  }

  // Set first check list date the same as custom field next action
  putJson.checkListItems = [];

  if (json.checkListItems.length > 0) {
    json.checkListItems.sort((a, b) => (a.due > b.due) ? 1 : ((b.due > a.due) ? -1 : 0));

    if (json.due && (json.checkListItems[0].due != json.due)) {
      json.checkListItems[0].due = json.due;

      putJson.checkListItems.push({
        id: json.checkListItems[0].id,
        params: {
          due: JSON.parse(JSON.stringify(json.checkListItems[0].due))
        }
      })

    }

  }

  return putJson;
}

// Success on putting new start date
const putStartDateSuccess = (response) => {
  const newStart = new Intl.DateTimeFormat('default', { dateStyle: 'short', timeStyle: 'long' }).format(new Date(response.start));
  $("#response").append(`<sm>Start date: ${newStart}<br></sm>`);
  $("#response").show();
}

// Copy checklist to next action
const setDatesChecklistNextAction = (json) => {
  let putJson = {};

  // Set standard start date the same as custom field start date
  if (json.customFields["Start date"] && (json.start != json.customFields["Start date"])) {
    json.start = json.customFields["Start date"];

    putJson.main = {
      params: {
        start: JSON.parse(JSON.stringify(json.start))
      }
    };

  }

  // Set custom field next action the same as the first check list date
  putJson.customFields = [];

  if (json.checkListItems.length > 0) {
    json.checkListItems.sort((a, b) => (a.due > b.due) ? 1 : ((b.due > a.due) ? -1 : 0));

    if (json.due && (json.checkListItems[0].due != json.due)) {
      json.due = json.checkListItems[0].due;

      if (!putJson.main) {
        putJson.main = {
          params: {
            start: JSON.parse(JSON.stringify(json.due))
          }
        };
      } else {
        putJson.main.params.due = JSON.parse(JSON.stringify(json.due));
      }

    }

  }

  return putJson;
}

// Equalize dates
const equalize = (t, token) => {

  t.card('id', 'due')
    .then((card) => {
      window.Trello.setToken(token);

      window.Trello.cards.get(card.id, {
        // due,
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
          for (let i = 0; i < output.checkListItems.length; i++) {
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

// Copy first check list date to next action
const checklistNextAction = (t, token) => {

  t.card('id')
    .then((card) => {
      window.Trello.setToken(token);

      window.Trello.cards.get(card.id, {
        due,
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
          const output = setDatesChecklistNextAction(work);

          // Start updates

          // Update main fields
          if (output.main) {
            window.Trello.put(`card/${card.id}`, output.main.params, putStartDateSuccess, requestFailure);
          }

          // Update custom fields
          for (let i = 0; i < output.customFields.length; i++) {

            // fetch(`https://scheduler-ruby.vercel.app/api/1/trello/cards/${card.id}/customField/${output.customFields[i].idCustomField}/item?key=039f30a96f8f3e440addc095dd42f87d&token=${token}`, {
            fetch(`https://scheduler-git-new-webhook-oibafs.vercel.app/api/1/trello/cards/${card.id}/customField/${output.customFields[i].idCustomField}/item?key=039f30a96f8f3e440addc095dd42f87d&token=${token}`, {
              method: 'PUT',
              body: JSON.stringify(output.customFields[i].body),
              headers: {
                'Content-Type': 'application/json'
              }
            })
              .then(response => response.text()
                .then(text => {

                  if (response.ok) {
                    text = JSON.parse(text);
                    putCustomFieldSuccess(text);
                  } else {
                    putCustomFieldFailure(`Error ${response.status} - ${text}`);
                  }

                })
              )

          }

          //Nothing to update
          if (!output.main && output.customFields.length === 0) {
            $("#response").append(`<sm>Nothing to update!<br></sm>`);
            $("#response").show();
          }

        })

    })

}