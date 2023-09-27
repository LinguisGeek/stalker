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
                trainings.forEach((training, index) => {  // Notez l'argument `index` ajouté ici
                    // Vérifiez chaque élément `training` ici
                    if (training) {
                        displayTrainingDetail(training, index);  // Et passez l'`index` ici
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



function displayTrainingDetail(training, index) {
    console.log('Index avant la création du bouton:', index);
    console.log('Fonction displayTrainingDetail appelée avec les données suivantes :', training);
    const container = document.querySelector('.training-container');
    const trainingDiv = document.createElement('div');
    trainingDiv.className = 'training-card';
    trainingDiv.innerHTML += `<button class="edit-button" data-index="${index}">Modifier</button>`; 

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


function openEditModal(index) {
    console.log(index);
    // Convertit l'index en un nombre, si ce n'est pas déjà le cas
    index = Number(index);
    console.log('Index converti :', index);  // Affiche l'index converti dans la console
    document.getElementById("trainingIndex").value = index;  // stockez l'index dans un champ caché

    db.collection("TrainingDetails").doc(trainingId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();

            // Vérifie si l'index est dans la plage valide
            if (index >= 0 && index < data.trainings.length) {
                const training = data.trainings[index];
                if (training) {
                    // Remplir les champs de la modale avec les détails existants
                    document.getElementById("name").value = training.name;
                    document.getElementById("series").value = training.series;
                    document.getElementById("recovery").value = training.recovery;
                    document.getElementById("weight").value = training.weight;
                    // ... et d'autres champs si nécessaire

                    // Ouvrez la modale
                    modal.style.display = "block";
                } else {
                    console.error('Invalid training data: ', training);
                }
            } else {
                console.error('Index out of range:', index);
            }
        } else {
            console.log("No such document!");
        }
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
}



function saveTrainingDetails(trainingId, newTraining, index) {
    return new Promise((resolve, reject) => {
        if (isSaving) {
            console.warn('Save operation in progress, ignoring this save request.');
            reject('Save operation in progress');
            return;
        }
        isSaving = true;

        db.collection("TrainingDetails").doc(trainingId).get().then(doc => {
            let trainings = [];
            if (doc.exists) {
                const data = doc.data();
                trainings = data.trainings || [];
            }

            if (typeof index !== 'undefined' && index < trainings.length) {
                // Mettez à jour l'objet existant si l'index est fourni
                trainings[index] = newTraining;
            } else {
                // Si l'index n'est pas fourni, ajoutez le nouvel entraînement à la liste
                trainings.push(newTraining);
            }

            // Mettez à jour le document avec la nouvelle liste d'entraînements
            return db.collection("TrainingDetails").doc(trainingId).set({ trainings });
        }).then(() => {
            console.log("Document successfully updated!");
            loadTrainingDetails();
            resolve();
        }).catch((error) => {
            console.error("Error updating document: ", error);
            reject(error);
        }).finally(() => {
            isSaving = false;
        });
    });
}





// ... le reste de votre code ...
document.addEventListener("DOMContentLoaded", function() {
    loadTrainingDetails();
    const form = document.getElementById("detail-form");
    form.addEventListener("submit", function(e) {
        e.preventDefault();
        const index = document.getElementById("trainingIndex").value;
        const image = document.getElementById("image").files[0];
        const name = document.getElementById("name").value;
        const series = document.getElementById("series").value;
        const recovery = document.getElementById("recovery").value;
        const weight = document.getElementById("weight").value;
        
        let newTraining = { name, series, recovery, weight };  // Créez un objet newTraining ici

        if (!trainingId) {
            trainingId = db.collection("TrainingDetails").doc().id; // Générez un nouveau doc ID s'il n'en existe pas
        }
        // Upload image to Firebase Storage if provided
        if (image) {
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child(`images/${trainingId}/${image.name}`);
            imageRef.put(image).then((snapshot) => {
                snapshot.ref.getDownloadURL().then((downloadURL) => {
                    newTraining.image = downloadURL;  // Ajoutez l'URL de l'image à newTraining
                    console.log("Data to be saved: ", newTraining);  // Log the data to be saved
                    saveTrainingDetails(trainingId, newTraining, index).then(() => {  // passez l'index à saveTrainingDetails
                        closeModal();
                    });
                });
            });
        } else {
            console.log("Data to be saved: ", newTraining);  // Log the data to be saved
            saveTrainingDetails(trainingId, newTraining, index === '' ? undefined : index).then(() => {
                closeModal();
            });  // <-- Ajout de la parenthèse fermante ici
        }
    });
});




document.addEventListener('click', function(e) {
    if(e.target && e.target.classList.contains('edit-button')) {
        const index = e.target.getAttribute('data-index');
        console.log('Index récupéré de data-index:', index);  // Ajoutez cette ligne pour vérifier la valeur de l'index
        openEditModal(index);
    }
});  // Ici, vous aviez besoin de fermer la fonction et l'écouteur d'événements
