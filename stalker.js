const db = firebase.firestore();

function deleteFromFirestore(docId) {
    db.collection("trainings").doc(docId).delete().then(() => {
        console.log("Document successfully deleted!");
    }).catch((error) => {
        console.error("Error removing document: ", error);
    });
}

function deleteFromStorage(imageUrl) {
    let imageRef;
    if (imageUrl.startsWith('https://')) {
        imageRef = firebase.storage().refFromURL(imageUrl);
    } else {
        imageRef = firebase.storage().ref(imageUrl);
    }

    imageRef.delete().then(() => {
        console.log("Image successfully deleted!");
    }).catch((error) => {
        console.error("Error removing image: ", error);
    });
}


document.addEventListener("DOMContentLoaded", function() {
    const btn = document.querySelector("button");
    const modal = document.getElementById("modal");
    const closeBtn = document.querySelector(".close-btn");
    const form = document.getElementById("training-form");

    db.collection("trainings").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            displayData(data.name, data.imageUrl, doc.id);
        });
    });

    btn.addEventListener("click", function() {
        modal.style.display = "block";
    });

    closeBtn.addEventListener("click", function() {
        modal.style.display = "none";
    });

    form.addEventListener("submit", function(e) {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const image = document.getElementById("image").files[0];

        if (image) {
            const storageRef = firebase.storage().ref('images/' + image.name);
            storageRef.put(image).then((snapshot) => {
                snapshot.ref.getDownloadURL().then((downloadURL) => {
                    db.collection("trainings").add({
                        name: name,
                        imageUrl: downloadURL
                    })
                    .then((docRef) => {
                        console.log("Document written with ID: ", docRef.id);
                        displayData(name, downloadURL, docRef.id);
                        modal.style.display = "none";
                    })
                    .catch((error) => {
                        console.error("Error adding document: ", error);
                    });
                });
            });
        } else {
            db.collection("trainings").add({
                name: name
            })
            .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
                displayData(name, null, docRef.id);
                modal.style.display = "none";
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
            });
        }

        // Réinitialisez les champs du formulaire après le traitement
        document.getElementById("name").value = "";
        document.getElementById("image").value = "";
    });
});

function displayData(name, imageUrl, docId) {
    const displayDiv = document.createElement('div');
    displayDiv.classList.add('training-card'); // Ajoutez la classe CSS au div
    displayDiv.innerHTML = `
        <h3>${name}</h3>
        ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : ''}
        <button class="delete-btn" data-id="${docId}" data-image="${imageUrl}">Supprimer</button>
    `;

    // Sélectionnez le conteneur et ajoutez le div d'entraînement à celui-ci
    const container = document.querySelector('.training-container');
    container.appendChild(displayDiv);

    const deleteBtn = displayDiv.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function(e) {
        const docId = e.target.getAttribute('data-id');
        const imageUrl = e.target.getAttribute('data-image');
        deleteFromFirestore(docId);
        deleteFromStorage(imageUrl);

        e.target.parentElement.remove();
    });

    // Ajoutez un écouteur d'événements click à displayDiv pour rediriger vers la page de détail de l'entraînement
    displayDiv.addEventListener('click', function(e) {
        if (e.target !== deleteBtn) {  // Ignorez le clic sur le bouton Supprimer
            window.location.href = `training_detail.html?id=${docId}`;
        }
    });
}
