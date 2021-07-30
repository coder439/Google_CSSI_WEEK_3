let googleUserId;

window.onload = event => {
  // Firebase authentication goes here.
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // Console log the user to confirm they are logged in
      console.log("Logged in as: " + user.displayName);
      googleUserId = user.uid;
      getNotes(googleUserId);
    } else {
      // If not logged in, navigate back to login page.
      window.location = "index.html";
    }
  });
};

//Given a list of notes, render them in HTML
const renderDataAsHtml = data => {
  const filterName = document.querySelector("#filterTag").value;
  
  let cards = "";

  // TODO - implement display all & nothing is select option
  // If no filters are selected - display all
  if (filterName == undefined || filterName == null) {
    for (const noteItem in sortAlphabetical(data)) {
      const note = data[noteItem];
      console.log(noteItem);
      cards += createCard(note, noteItem);
    }
  }
  // If a filter is selected
  else {
    console.log(`Filter ${filterName} selected`);
    console.log("before filtered loop");
    for (const noteItem in sortAlphabetical(data)) {
      // Check if type follows filter
      const note = data[noteItem];
      if (note.label === filterName) {
        cards += createCard(note, noteItem);
      }
    }
  }
  document.querySelector("#app").innerHTML = cards;
};

function sortAlphabetical(data) {
  // Initialize vars
  const arr = [];
  const newData = {};
  // Create list of titles
  for (const noteItem in data) {
    const note = data[noteItem];
    arr.push(note.title);
  }
  // Sort titles in alphabetical order
  arr.sort(function(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
  // For each title, find the note associated with title, add to newData
  // Now newData is in order alphabetically
  arr.forEach(title => {
    for (const noteItem in data) {
      const note = data[noteItem];
      if (note.title === title) {
        newData[noteItem] = note;
      }
    }
  });
  return newData;
}

function convertUTCDateToLocalDate(date) {
  var newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

  var offset = date.getTimezoneOffset() / 60;
  var hours = date.getHours();

  newDate.setHours(hours - offset);

  return newDate;
}

const PASTEL_HEX_DIGITS = {
  A: 11,
  B: 12,
  C: 13,
  D: 14,
  E: 15,
  F: 16
};

const returnPastelHexColor = () => {
  let hex = "#";
  for (let i = 0; i < 6; i++) {
    hex += Object.keys(PASTEL_HEX_DIGITS)[Math.floor(Math.random() * 6)];
  }
  return hex;
};

const darkenPastelHexColor = originalColor => {
  let hexCodes = originalColor.slice(1);
  let darkHex = "#";

  for (let i = 0; i < hexCodes.length; i++) {
    let hex = hexCodes[i];
    let number = PASTEL_HEX_DIGITS[hex];
    darkHex += Object.keys(PASTEL_HEX_DIGITS)[Math.max(number - 14, 0)];
  }
  return darkHex;
};

// Return a note object converted into an HTML card
const createCard = (note, noteId) => {
  // milisecond to minute
  const customNoteDateTime = convertUTCDateToLocalDate(new Date(note.date));

  //const randomColor = Math.floor(Math.random()*16777215).toString(16);
  const randomPastelColor = returnPastelHexColor();
  const darkenColor = darkenPastelHexColor(randomPastelColor);

  console.log(darkenColor);
  return `
         <div class="column is-one-quarter">
         <div class="card" id="card" style="background-color: ${randomPastelColor};">
           <header class="card-header" style="background-color: ${darkenPastelHexColor}!important;">
             <p class="card-header-title">${note.title}</p>
           </header>
           <div class="card-content">
             <div class="content">${note.text}</div>
           </div>
           <header style="background-color: ${darkenPastelHexColor} !important;">
              <p class="card-header-title" style="font-weight: 400!important;"">${customNoteDateTime.toTimeString()}</p>
           </header>
           <footer class="card-footer">
             <a id="${noteId}" class="card-footer-item" onclick="editNote(this.id)">Edit</a>
             <a id="${noteId}" href="#" class="card-footer-item"
               onclick="deleteNote('${noteId}')">
               Delete
             </a>
           </footer>
         </div>
       </div> `;
};

// Helper functions to modify note database
const getNotes = userId => {
  const notesRef = firebase.database().ref(`users/${userId}`);

  notesRef.on("value", snapshot => {
    const data = snapshot.val();
    renderDataAsHtml(data);
    // THIS IS THE ISSUE <-- We MUST have an input for renderDataAsHtml
    // BUUUUUUT in the button event, we called the renderDataAsHtml() which is incorrect

    const filter = document.querySelector("#filterTag");
    filter.addEventListener("change", event => {
      renderDataAsHtml(data);
    });
  });
};
const deleteNote = noteId => {
  const confirmDeleteButton = document.querySelector("#confirmDeleteButton");
  toggleDeleteModal();
  confirmDeleteButton.addEventListener("click", event => {
    console.log("clicked!");
    firebase
      .database()
      .ref(`users/${googleUserId}/${noteId}`)
      .remove();
    toggleDeleteModal();
  });
};
const toggleDeleteModal = () => {
  const deleteNoteModal = document.querySelector("#deleteNoteModal");
  deleteNoteModal.classList.toggle("is-active");
};
const closeEditModal = () => {
  const editNoteModal = document.querySelector("#editNoteModal");
  editNoteModal.classList.toggle("is-active");
};
const saveEditedNote = () => {
  const noteId = document.querySelector("#editNoteId").value;
  const noteTitle = document.querySelector("#editTitleInput").value;
  const noteText = document.querySelector("#editTextInput").value;
  const noteEdits = {
    title: noteTitle,
    text: noteText
  };
  firebase
    .database()
    .ref(`users/${googleUserId}/${noteId}`)
    .update(noteEdits);
  closeEditModal();
};
const editNote = noteId => {
  const editNoteModal = document.querySelector("#editNoteModal");
  const notesRef = firebase.database().ref(`users/${googleUserId}`);
  notesRef.on("value", snapshot => {
    const data = snapshot.val();
    const noteDetails = data[noteId];
    document.querySelector("#editNoteId").value = noteId;
    document.querySelector("#editTitleInput").value = noteDetails.title;
    document.querySelector("#editTextInput").value = noteDetails.text;
  });

  editNoteModal.classList.toggle("is-active");
};
