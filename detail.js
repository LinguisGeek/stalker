const urlParams = new URLSearchParams(window.location.search);
const trainingId = urlParams.get('id');

const db = firebase.firestore();

let isSaving = false;

// Obtenir la modale
var modal = document.getElementById("modal");

// Obtenir le bouton qui ouvre la modale
var btn = document.getElementById("myBtn");

// Obtenir l'élément <span> qui ferme la modale
var span = document.getElementsByClassName("close-btn")[0];

// Lorsque l'utilisateur clique sur le bouton, ouvre la modale
btn.onclick = function() {
  modal.style.display = "block";
}

// Lorsque l'utilisateur clique sur <span> (x), ferme la modale
span.onclick = function() {
  modal.style.display = "none";
}

// Lorsque l'utilisateur clique en dehors de la modale, ferme celle-ci
window.onclick = function(event) {
  if (event.target == modal && modal.style.display === "block") {
    modal.style.display = "none";
  }
}

function closeModal() {
    // Fermez la modale
    modal.style.display = "none";
    // Réinitialisez les champs du formulaire
    resetFormFields();
}

function resetFormFields() {
    const form = document.getElementById("detail-form");
    form.reset();
}

span.onclick = function() {
    closeModal();
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}


if (trainingId) {
    db.collection("TrainingDetails").doc(trainingId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            displayTrainingDetail(data.name, data.imageUrl);
            console.log('calling displayTrainingDetail from body');
        } else {
            console.error("No such document!");
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
    });
}


function loadTrainingDetails() {
    if (trainingId) {
        db.collection("TrainingDetails").doc(trainingId).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const trainings = data.trainings || [];
                const detailDiv = document.getElementById('training-detail');
                const container = document.querySelector('.training-container');
                container.innerHTML = '';  // Réinitialisez le conteneur ici

                // Supprimez tous les éléments enfants existants
                while (detailDiv.firstChild) {
                    detailDiv.removeChild(detailDiv.firstChild);
                }

                trainings.forEach(training => {
                    // Vérifiez chaque élément `training` ici
                    if (training) {
                        displayTrainingDetail(training);
                        console.log('calling displayTrainingDetail from loadTrainingDetails');
                    } else {
                        console.error('Invalid training data: ', training);
                    }
                });
            } else {
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
    }
}




function displayTrainingDetail(training) {
    console.log('Fonction displayTrainingDetail appelée avec les données suivantes :', training);
    const container = document.querySelector('.training-container');
    const trainingDiv = document.createElement('div');
    trainingDiv.className = 'training-card';

    // Vérifiez si les propriétés sont définies avant de les utiliser
    if (training && Object.keys(training).length > 0) {
        // Les données existent, vous pouvez générer le contenu HTML
        if (training.image) {
            trainingDiv.innerHTML += `<img src="${training.image}" alt="${training.name}">`;
        }
        if (training.name) {
            trainingDiv.innerHTML += `<h1>${training.name}</h1>`;
        }
        if (typeof training.series !== 'undefined') {
            trainingDiv.innerHTML += `<p>Séries: ${training.series}</p>`;
        }
        if (typeof training.recovery !== 'undefined') {
            trainingDiv.innerHTML += `<p>Récupération: ${training.recovery}</p>`;
        }
        if (training.weight) {
            trainingDiv.innerHTML += `<p>Poids: ${training.weight}</p>`;
        }
    } else {
        // Aucune donnée n'est disponible, masquez l'élément ou affichez un message
        console.log('Aucune donnée disponible, masquage de l\'élément.');
        trainingDiv.style.display = 'none'; // ou autre logique de masquage
    }

    container.appendChild(trainingDiv);
}





function saveTrainingDetails(trainingId, newTraining) {
    return new Promise((resolve, reject) => {  // Ajout d'une nouvelle Promesse
        if (isSaving) {
            console.warn('Save operation in progress, ignoring this save request.');
            reject('Save operation in progress');  // Rejet de la promesse si une opération de sauvegarde est déjà en cours
            return;
        }
        isSaving = true;  // Set the flag to true when starting a save operation

        db.collection("TrainingDetails").doc(trainingId).get().then(doc => {
            let trainings = [];
            if (doc.exists) {
                const data = doc.data();
                trainings = data.trainings || [];
            }
            trainings.push(newTraining);  // Add the new training to the array
            
            // Si le document existe, mettez-le à jour. Sinon, créez un nouveau document.
            if (doc.exists) {
                return db.collection("TrainingDetails").doc(trainingId).update({ trainings });  // Update the document
            } else {
                return db.collection("TrainingDetails").doc(trainingId).set({ trainings });  // Create a new document
            }
        }).then(() => {
            console.log("Document successfully updated!");
            loadTrainingDetails();
            resolve();  // Résolution de la promesse après la mise à jour réussie du document
        }).catch((error) => {
            console.error("Error updating document: ", error);
            reject(error);  // Rejet de la promesse en cas d'erreur
        }).finally(() => {
            isSaving = false;  // Reset the flag when the save operation is complete
        });
    });
}





// ... le reste de votre code ...
document.addEventListener("DOMContentLoaded", function() {
    loadTrainingDetails();
    const form = document.getElementById("detail-form");
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        const image = document.getElementById("image").files[0];
        const name = document.getElementById("name").value;
        const series = document.getElementById("series").value;
        const recovery = document.getElementById("recovery").value;
        const weight = document.getElementById("weight").value;

        if (trainingId) {
            // Upload image to Firebase Storage if provided
            if (image) {
                const storageRef = firebase.storage().ref();
                const imageRef = storageRef.child(`images/${trainingId}/${image.name}`);
                imageRef.put(image).then((snapshot) => {
                    snapshot.ref.getDownloadURL().then((downloadURL) => {
                        saveTrainingDetails(trainingId, {
                            image: downloadURL,
                            name,
                            series,
                            recovery,
                            weight
                        }).then(() => {
                            closeModal();  // fermez la modale après la sauvegarde réussie
                        });
                    });
                });
            } else {
                saveTrainingDetails(trainingId, { name, series, recovery, weight })
                .then(() => {
                    closeModal();  // fermez la modale après la sauvegarde réussie
                });
            }
        }
    });
});

