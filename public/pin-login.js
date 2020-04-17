// Création de la classe PinLogin pour l'utiliser dans index.html
class PinLogin {

    // On défini les variables qui serviront à cibler les éléments du DOM et à les modifiers
    constructor ({el, loginEndPoint, redirectTo, maxNumbers = Infinity}) {

        // ON DEFINI DES VARIABLES POUR LE RESTE DU FICHIER
    
        // Nouvelle variable mainDiv qui prends en compte toutes les div enfants transmise par "el"
        this.mainDiv = {

            // Main == div principale
            main: el,

            // numPad == toutes les touches que l'on va creer
            numPad: el.querySelector(".pin-login__numpad"),

            // textDisplay == input
            textDisplay: el.querySelector(".pin-login__text")
        };

        // On défnie toutes les variables restantes
        this.loginEndPoint = loginEndPoint;
        this.redirectTo = redirectTo;
        this.maxNumbers = maxNumbers;
        this.value = "";

        // On genere le pavé numérique, le "_" permet de nous dire que c'est une fonction privée
        this._generatePad();
    }

    _generatePad() {

        // variable qui definie le pavé numérique
        const padLayout = [
            "1", "2", "3",
            "4", "5", "6",
            "7", "8", "9",
            "backspace", "0", "done"
        ];

         // On crée une touche par élément du tableau
        padLayout.forEach(key => {

            // On recherche ici les chiffre 3, 6, 9 pour placer un <br>
            const insertBreak = key.search(/[369]/) !== -1;

             //On crée une div a chaque tour
            const keyEl = document.createElement("div");
            // On lui ajoute la classe : pin-loginKey 
            keyEl.classList.add("pin-login__key");
             // On lui ajoute la classe : material-icons si "key" n'est pas un "Number" 
            // => NaN = Not a Number, si key n'est pas un chiffre NaN = false et inversement
            keyEl.classList.toggle("material-icons", isNaN(key));
            // On ajoute le texte
            keyEl.textContent = key;
             // On ajoute un evenement qui amène à la fonction _handleKeyPress au clique
            keyEl.addEventListener("click", () => {
                this._handleKeyPress(key)
            })
            
            // La div que l'on vient de créer va dans la div numPad
            this.mainDiv.numPad.appendChild(keyEl);

            //Si il y a a besoin d'un break (après les touches 3, 6, 9) on les met
            if(insertBreak) {
                this.mainDiv.numPad.appendChild(document.createElement("br"));
            }
        });
    }

    //Fonction uttilisée au clique
    _handleKeyPress(key) {
        switch(key) {

            // Si la touche est le backspace, on enlève le dernier numéro entré
            case "backspace":
                this.value = this.value.substring(0, this.value.length - 1);
                break;

            // Si la touche est le done, on lance la fonction pour se login
            case "done":
                this._attemptLogin();
                break;

            // Sinon, si la touche est un chiffre, on l'ajoute à la variable value
            default:
                if(this.value.length < this.maxNumbers && !isNaN(key)) {
                    this.value += key;
                }
                break;
        }

        //On update l'affichage de value
        this._updateValueText();
    }

    //Fonction d'affichage de la variable value
    _updateValueText() {

        //On met un "_" pour chaque chiffre de value. Pour éviter qu'on puisse accéder au mot de passe en enlevant le type password par exemple
        this.mainDiv.textDisplay.value = "_".repeat(this.value.length);

        //On enlève la couleur d'erreur si elle est active
        this.mainDiv.textDisplay.classList.remove("pin-login__text--error")
    }

    //Fonction pour tenter de se connecter
    _attemptLogin() {

        //Si la valeur n'est pas nulle
        if(this.value.length > 0) {

            // On fetch l'URL dans laquelle est lancé node
            fetch('http://localhost:8080/login', {

                //méthode POST
                method: "POST",
                //On dit à l'application qu'on envoie du json et on accepte les informations de toutes les urls
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                //On fait passer la veleur dans le body
                body: JSON.stringify({
                    pincode: this.value
                })

            //Quand on a la réponse à la promesse
            }).then(response => {

                //Si le status est 200, on redirige vers le chat
                if(response.status === 200) {
                    window.location.href = this.redirectTo;

                //Sinon on met la classe d'erreur sur l'input
                } else {
                    this.mainDiv.textDisplay.classList.add("pin-login__text--error")
                }
            })
        }
    }

}