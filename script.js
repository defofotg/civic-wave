document.addEventListener('DOMContentLoaded', async function () {
  const regionSelect = document.getElementById('region');
  const departementGroup = document.getElementById(
    'departement-group'
  );
  const departementSelect = document.getElementById('departement');
  const arrondissementGroup = document.getElementById(
    'arrondissement-group'
  );
  const arrondissementSelect =
    document.getElementById('arrondissement');
  const footer = document.getElementById('footer');

  // Optionnel : si tu veux afficher la localisation du centre sélectionné
  const resultContainer = document.getElementById('result');

  let departementsData = null;
  let centresData = null;

  // Charger régions
  try {
    const regionResponse = await fetch('regions.json');
    const regionData = await regionResponse.json();

    regionData.regions.forEach((region) => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Erreur lors du chargement des régions :', error);
  }

  // Charger départements
  try {
    const depResponse = await fetch('departements.json');
    departementsData = await depResponse.json();
  } catch (error) {
    console.error('Erreur chargement départements :', error);
  }

  // Charger centres
  try {
    const centresResponse = await fetch('centres.json');
    centresData = await centresResponse.json();
  } catch (error) {
    console.error('Erreur chargement centres :', error);
  }

  // Région → Départements
  regionSelect.addEventListener('change', function () {
    const selectedRegion = regionSelect.value;
    departementSelect.innerHTML = `<option value="">Sélectionnez un département</option>`;
    arrondissementSelect.innerHTML = `<option value="">Sélectionnez un arrondissement</option>`;
    departementGroup.classList.add('hidden');
    arrondissementGroup.classList.add('hidden');
    if (resultContainer) resultContainer.innerHTML = '';

    const key = Object.keys(departementsData).find(
      (k) =>
        departementsData[k].nom.toLowerCase() ===
        selectedRegion.toLowerCase()
    );

    if (key && departementsData[key].departements) {
      departementsData[key].departements.forEach((dep) => {
        const option = document.createElement('option');
        option.value = dep.nom;
        option.textContent = dep.nom;
        departementSelect.appendChild(option);
      });
      departementGroup.classList.remove('hidden');

      // scroll vers le champ département
      departementGroup.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });

  // Département → Centres (arrondissements)
  departementSelect.addEventListener('change', function () {
    const selectedDep = departementSelect.value.toLowerCase();
    arrondissementSelect.innerHTML = `<option value="">Sélectionnez un arrondissement</option>`;
    arrondissementGroup.classList.add('hidden');
    if (resultContainer) resultContainer.innerHTML = '';

    if (
      centresData &&
      centresData[selectedDep] &&
      centresData[selectedDep].centres
    ) {
      centresData[selectedDep].centres.forEach((centre) => {
        const option = document.createElement('option');
        option.value = centre.nom;
        option.textContent = centre.nom;
        arrondissementSelect.appendChild(option);
      });
      arrondissementGroup.classList.remove('hidden');

      // scroll vers le champ arrondissement
      arrondissementGroup.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  });

  // Lorsqu'un arrondissement est sélectionné → afficher la localisation
  arrondissementSelect.addEventListener('change', function () {
    const selectedDep = departementSelect.value.toLowerCase();
    const selectedCentreName = arrondissementSelect.value;

    if (!selectedDep || !selectedCentreName) {
      resultContainer.innerHTML = '';
      return;
    }

    const centre = centresData[selectedDep]?.centres.find(
      (c) => c.nom === selectedCentreName
    );

    if (centre) {
      let html = `
      <div class="bg-gray-100 px-4 py-6 rounded-md shadow mt-10">
        <h3 class="text-green-900 text-2xl font-semibold mb-4">${centre.nom}</h3>
        <p><strong>Localisation :</strong><br />${centre.localisation}</p>
    `;

      // S'il y a des groupements
      if (centre.regroupements && centre.regroupements.length > 0) {
        html += `<div class="mt-4"><strong>Groupements / Quartiers / Villages rattachés :
        </strong>
        <br>
        <p>`;
        centre.regroupements.forEach((g) => {
          html += `${g}, `;
        });

        html += `</p>`;
      }

      html += `</div>`;
      resultContainer.innerHTML = html;
    } else {
      resultContainer.innerHTML = `<p class="text-red-600 text-sm">Aucune information trouvée.</p>`;
    }

    // Ajout d'une div conteneur pour les boutons
    const actionsDiv = document.createElement('div');
    actionsDiv.className =
      'mt-4 py-4 !flex flex-wrap gap-3 items-center';

    // Bouton "Partager"
    const shareBtn = document.createElement('button');
    shareBtn.innerHTML = `📤 <span class="ml-2 text-lg">Partager</span>`;
    shareBtn.className =
      'bg-green-900 text-sm text-white text-center flex items-center justify-center px-4 py-4 w-40 mx-auto rounded-md hover:bg-green-800 transition ';

    // Texte à partager
    const region = regionSelect.value;
    const departement = departementSelect.value;
    const arrondissement = selectedCentreName;
    const localisation = centre.localisation;

    const shareMessage = `Mon centre d'enregistrement électoral :

    - Région : ${region}
    - Département : ${departement}
    - Arrondissement : ${arrondissement}
    - Localisation : ${localisation} \n`;

    // Événement bouton partager
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Mon centre d’enregistrement',
            text: shareMessage,
            url: 'https://centres.anaitech.net',
          });
        } catch (err) {
          console.error('Erreur partage :', err);
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareMessage);
          alert(
            '📋 Informations du centre copiées dans le presse-papiers !'
          );
        } catch (err) {
          alert('Erreur lors de la copie.');
        }
      }
    });

    // Ajout des boutons à la div puis à la page
    actionsDiv.appendChild(shareBtn);
    resultContainer.appendChild(actionsDiv);

    shareBtn.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
});
