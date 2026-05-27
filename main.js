let selectedStar = 0;
  let uploadedFile = null;
  let currentBATCode = '';

  // QUANTITY
  function increaseQty(){
    const input = document.getElementById('f-quantite');
    input.value = Math.min(9999, parseInt(input.value) + 1);
  }
  function decreaseQty(){
    const input = document.getElementById('f-quantite');
    input.value = Math.max(1, parseInt(input.value) - 1);
  }


    // CATÉGORIE — présélection depuis pricing
  function selectCategorie(nom, prix) {
    // Mettre à jour le bandeau
    document.getElementById('order-category-name').textContent = nom;
    document.getElementById('order-category-price').textContent = prix + ' FCFA';
    // Mettre à jour le select
    const sel = document.getElementById('f-categorie');
    for (let i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value.startsWith(nom)) {
        sel.selectedIndex = i;
        break;
      }
    }
    // Couleur bandeau selon catégorie
    const banner = document.getElementById('order-category-banner');
    if (nom.includes('Premium')) {
      banner.style.borderColor = 'rgba(216,90,48,0.5)';
      banner.style.background = 'rgba(177, 90, 60, 0.23)';
      document.getElementById('order-category-name').style.color = '#D85A30';
      document.getElementById('order-category-price').style.color = '#D85A30';
    } else if (nom.includes('Classique')) {
      banner.style.borderColor = 'rgba(255,255,255,0.08)';
      banner.style.background = 'rgba(255,255,255,0.05)';
      document.getElementById('order-category-name').style.color = 'rgba(255, 255, 255, 0.53)';
      document.getElementById('order-category-price').style.color = 'rgba(255, 255, 255, 0.53)';
    } else if (nom.includes('Pull')) {
      banner.style.borderColor = 'rgba(61,184,135,0.4)';
      banner.style.background = 'rgba(61,184,135,0.08)';
      document.getElementById('order-category-name').style.color = '#3DB887';
      document.getElementById('order-category-price').style.color = '#3DB887';
    } else {
      banner.style.borderColor = 'rgba(216,90,48,0.2)';
      banner.style.background = 'rgba(216,90,48,0.06)';
    }
  }
  
  // CATÉGORIE — changement via select
  function onCategorieChange(val) {
    if (!val) {
      document.getElementById('order-category-name').textContent = '— Choisir ci-dessous';
      document.getElementById('order-category-price').textContent = '';
      return;
    }
    const [nom, prix] = val.split('|');
    const prixFormat = parseInt(prix).toLocaleString('fr-FR');
    selectCategorie(nom, prixFormat);
  }
  

  function increaseQty(){
    const input = document.getElementById('f-quantite');
    input.value = Math.min(9999, parseInt(input.value) + 1);
  }
  function decreaseQty(){
    const input = document.getElementById('f-quantite');
    input.value = Math.max(1, parseInt(input.value) - 1);
  }

  // FILE UPLOAD
  function handleFileUpload(input){
    if(input.files.length > 0){
      const file = input.files[0];
      uploadedFile = file;
      document.getElementById('file-name').textContent = '✓ ' + file.name;
    }
  }

  // PHONE VALIDATION
  document.addEventListener('DOMContentLoaded', function(){
    const telInput = document.getElementById('f-tel');
    telInput.addEventListener('input', function(){
      this.value = this.value.replace(/\D/g, '').slice(0, 10);
    });
    
    // Load BAT from URL if bat code present
    const params = new URLSearchParams(window.location.search);
    if(params.get('bat')){
      document.getElementById('bat-code-input').value = params.get('bat');
      searchBAT();
    }
    
    // Load reviews
    loadReviews();
  });

  // SUBMIT ORDER
  async function submitOrder(){
    const nom = document.getElementById('f-nom').value.trim();
    const tel = document.getElementById('f-tel').value.trim();
    const type = document.getElementById('f-type').value;
    const taille = document.getElementById('f-taille').value;
    const couleur = document.getElementById('f-couleur').value;
    const quantite = document.getElementById('f-quantite').value;
    const categorie = document.getElementById('f-categorie').value;
    
    // Validation
    if(!nom || tel.length !== 10 || !uploadedFile){
      showError();
      return;
    }
    
    // Add prefix to phone
    const phoneWithPrefix = '225' + tel;
    
    showLoading();
    
    // Upload visuel to Firebase (simulated)
    const visuelUrl = await uploadFile(uploadedFile);
    
    if(!visuelUrl){
      showError();
      return;
    }
    
    // Create order
    const orderId = await fbAdd('commandes', {
      nom,
      tel: phoneWithPrefix,
      type,
      taille,
      couleur,
      quantite: parseInt(quantite, 10),
      visuel_url: visuelUrl,
      categorie: categorie.split('|')[0] || '—',
      statut: 'recu',
      bat_statut: 'a_creer',
      date: new Date().toISOString()
    });
    
    if(orderId){
      showSuccess();
      // Reset form
      document.getElementById('f-nom').value = '';
      document.getElementById('f-tel').value = '';
      document.getElementById('f-quantite').value = '1';
      document.getElementById('f-visuel').value = '';
      document.getElementById('file-name').textContent = '';
    //   document.getElementById('f-categorie').value = '';s
      uploadedFile = null;
      
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 2000);
    } else {
      showError();
    }
  }

  // FILE UPLOAD TO FIREBASE
  async function uploadFile(file){
    // Simulated upload - replace with actual Firebase storage
    return URL.createObjectURL(file);
  }

  // BAT SEARCH
  async function searchBAT(){
    const code = document.getElementById('bat-code-input').value.trim().toUpperCase();
    if(!code){
      document.getElementById('bat-info').style.display = 'none';
      return;
    }
    
    const bat = await fbGet('bats', code);
    if(!bat){
      showErrorMsg('BAT non trouve. Verifiez votre code.');
      return;
    }
    
    currentBATCode = code;
    document.getElementById('bat-code-display').textContent = code;
    document.getElementById('bat-client').textContent = bat.client || '—';
    document.getElementById('bat-product').textContent = bat.produit || '—';
    document.getElementById('bat-qty').textContent = bat.quantite || '—';
    document.getElementById('bat-date').textContent = formatDate(bat.date_creation);
    
    // Maquette
    if(bat.maquette_url){
      document.getElementById('bat-maquette-container').innerHTML = `<img src="${bat.maquette_url}" alt="Maquette">`;
    }
    
    // Status
    const statusEl = document.getElementById('bat-status');
    const actionBtns = document.getElementById('bat-action-btns');
    const statusMsg = document.getElementById('bat-status-message');
    
    if(bat.statut === 'valide'){
      statusEl.className = 'bat-status-done';
      statusEl.textContent = '✓ Valide - Production en cours';
      actionBtns.style.display = 'none';
      statusMsg.innerHTML = '<div class="bat-status-done">✓ Votre BAT a ete valide. La production a commence !</div>';
    } else if(bat.statut === 'modification'){
      statusEl.className = 'bat-status-mod';
      statusEl.textContent = '✎ Modifications demandees';
      actionBtns.style.display = 'none';
      statusMsg.innerHTML = `<div class="bat-status-mod">✎ Modifications demandees :<br>"${bat.commentaire_client}"<br><br>Contactez-nous par WhatsApp pour les corrections.</div>`;
    } else {
      statusEl.className = 'bat-status-wait';
      statusEl.textContent = 'En attente de validation';
      actionBtns.style.display = 'flex';
      statusMsg.innerHTML = '';
    }
    
    document.getElementById('bat-info').style.display = 'block';
  }

  // VALIDATE BAT
  async function validateBAT(){
    await fbUpdate('bats', currentBATCode, {
      statut: 'valide',
      date_validation: new Date().toISOString()
    });
    document.getElementById('bat-status').className = 'bat-status-done';
    document.getElementById('bat-status').textContent = '✓ Valide';
    document.getElementById('bat-action-btns').style.display = 'none';
    document.getElementById('bat-status-message').innerHTML = '<div class="bat-status-done">✓ BAT valide ! La production commence maintenant.</div>';
  }

  // REQUEST MODIFICATION
  function requestModification(){
    document.getElementById('bat-modify-block').style.display = 'block';
  }

  // SUBMIT MODIFICATION
  async function submitModification(){
    const comment = document.getElementById('bat-comment').value.trim();
    if(!comment){
      alert('Decrivez les modifications demandees');
      return;
    }
    
    await fbUpdate('bats', currentBATCode, {
      statut: 'modification',
      commentaire_client: comment
    });
    
    document.getElementById('bat-modify-block').style.display = 'none';
    document.getElementById('bat-status').className = 'bat-status-mod';
    document.getElementById('bat-status').textContent = '✎ Modification demandee';
    document.getElementById('bat-status-message').innerHTML = '<div class="bat-status-mod">✎ Demande de modification envoye. On vous contacte sous 24h.</div>';
  }

  // STARS
  function setStars(n){
    selectedStar = n;
    document.querySelectorAll('.star-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i < n);
    });
  }

  // SUBMIT AVIS
  async function submitAvis(){
    const nom = document.getElementById('a-nom').value.trim();
    const commentaire = document.getElementById('a-comment').value.trim();
    
    if(!nom || selectedStar === 0 || !commentaire){
      document.getElementById('avis-error').style.display = 'block';
      document.getElementById('avis-error').textContent = '⚠️ Remplissez tous les champs et selectionnez une note.';
      return;
    }
    
    document.getElementById('avis-btn').disabled = true;
    document.getElementById('avis-btn').innerHTML = '<span class="spinner"></span>Envoi...';
    
    try {
      await fbAdd('avis', {
        nom,
        note: selectedStar.toString(),
        commentaire,
        statut: 'en_attente',
        date: new Date().toISOString()
      });
      
      document.getElementById('avis-success').style.display = 'block';
      document.getElementById('avis-success').textContent = '✓ Avis envoye ! Il sera publie apres validation.';
      document.getElementById('avis-error').style.display = 'none';
      
      // Reset form
      document.getElementById('a-nom').value = '';
      document.getElementById('a-comment').value = '';
      selectedStar = 0;
      document.querySelectorAll('.star-btn').forEach(btn => btn.classList.remove('active'));
      
      setTimeout(() => {
        document.getElementById('avis-success').style.display = 'none';
        loadReviews();
      }, 2000);
    } catch(e) {
      document.getElementById('avis-error').style.display = 'block';
      document.getElementById('avis-error').textContent = '❌ Erreur lors de l\'envoi.';
    } finally {
      document.getElementById('avis-btn').disabled = false;
      document.getElementById('avis-btn').innerHTML = 'Publier mon avis';
    }
  }

  // LOAD REVIEWS
  async function loadReviews(){
    try {
      const avis = await fbGetAll('avis');
      const published = avis.filter(a => a.statut === 'publie');
      const grid = document.getElementById('reviews-list');
      
      if(published.length === 0){
        grid.innerHTML = '<div style="text-align:center;color:var(--gray);padding:24px;grid-column:1/-1;">Pas d\'avis pour le moment</div>';
        return;
      }
      
      grid.innerHTML = published.map(a => {
        const note = parseInt(a.note) || 5;
        const stars = '★'.repeat(note) + '☆'.repeat(5 - note);
        return `
          <div class="review-card">
            <div class="review-top">
              <div class="avatar">${(a.nom||'A').charAt(0).toUpperCase()}</div>
              <div>
                <div class="review-name">${a.nom || 'Client'}</div>
                <div class="stars">${stars}</div>
              </div>
            </div>
            <div class="review-text">"${a.commentaire}"</div>
          </div>
        `;
      }).join('');
    } catch(e) {
      console.error('Erreur loadReviews:', e);
    }
  }

  function showLoading(){
    document.getElementById('loading-msg').style.display = 'block';
    document.getElementById('success-msg').style.display = 'none';
    document.getElementById('error-msg').style.display = 'none';
    document.getElementById('submit-btn').disabled = true;
  }

  function showSuccess(){
    document.getElementById('loading-msg').style.display = 'none';
    document.getElementById('success-msg').style.display = 'block';
    document.getElementById('error-msg').style.display = 'none';
    document.getElementById('submit-btn').disabled = false;
  }

  function showError(){
    document.getElementById('loading-msg').style.display = 'none';
    document.getElementById('success-msg').style.display = 'none';
    document.getElementById('error-msg').style.display = 'block';
    document.getElementById('submit-btn').disabled = false;
  }

  function showErrorMsg(msg){
    alert(msg);
  }

  function formatDate(dateStr){
    if(!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function toggleMenu(){
    // Mobile menu toggle
  }