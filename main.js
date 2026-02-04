 type="module"
        import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
        import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, limit } 
        from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

        // --- PASTE FIREBASE CONFIG HERE ---// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_pmqvu0EC_NTm8iUBWSrvf8l6o3baS8A",
  authDomain: "whisperwall-6277d.firebaseapp.com",
  projectId: "whisperwall-6277d",
  storageBucket: "whisperwall-6277d.firebasestorage.app",
  messagingSenderId: "113276525138",
  appId: "1:113276525138:web:3f5922372049c5c7111d8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
        
  

        // ----------------------------------

        const ADMIN_PIN = "1234";

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        document.getElementById('year').textContent = new Date().getFullYear();

        let mySecretId = localStorage.getItem("secretUserId");
        if (!mySecretId) {
            mySecretId = "user_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
            localStorage.setItem("secretUserId", mySecretId);
        }

        // --- STICKERS ---
        const stickers = ["https://cdn-icons-png.flaticon.com/128/742/742751.png", "https://cdn-icons-png.flaticon.com/128/742/742752.png", "https://cdn-icons-png.flaticon.com/128/742/742921.png", "https://cdn-icons-png.flaticon.com/128/742/742760.png", "https://cdn-icons-png.flaticon.com/128/742/742823.png", "https://cdn-icons-png.flaticon.com/128/742/742953.png", "https://cdn-icons-png.flaticon.com/128/2274/2274543.png", "https://cdn-icons-png.flaticon.com/128/1998/1998610.png"];
        let selectedStickerUrl = null;

        const drawer = document.getElementById('stickerDrawer');
        stickers.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'sticker-option';
            img.onclick = () => selectSticker(url, img);
            drawer.appendChild(img);
        });

        window.toggleDrawer = () => {
            const d = document.getElementById('stickerDrawer');
            d.style.display = d.style.display === 'grid' ? 'none' : 'grid';
        };

        window.selectSticker = (url, el) => {
            selectedStickerUrl = url;
            document.querySelectorAll('.sticker-option').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
            document.getElementById('previewContainer').style.display = 'flex';
            document.getElementById('previewImg').src = url;
            document.getElementById('stickerDrawer').style.display = 'none';
        };

        window.clearSticker = () => {
            selectedStickerUrl = null;
            document.getElementById('previewContainer').style.display = 'none';
        };

        // --- REACTION LOGIC (SINGLE SELECTION) ---
        window.handleReaction = async (docId, selectedType, isAlreadySelected) => {
            const docRef = doc(db, "confessions", docId);
            document.getElementById(`popup-${docId}`).classList.remove('visible');

            if (isAlreadySelected) {
                await updateDoc(docRef, { [`reactions.${selectedType}`]: arrayRemove(mySecretId) });
                return;
            }

            const updates = {};
            updates[`reactions.love`] = arrayRemove(mySecretId);
            updates[`reactions.laugh`] = arrayRemove(mySecretId);
            updates[`reactions.sad`] = arrayRemove(mySecretId);
            updates[`reactions.shock`] = arrayRemove(mySecretId);
            updates[`reactions.${selectedType}`] = arrayUnion(mySecretId);

            await updateDoc(docRef, updates);
        };

        // --- LONG PRESS HANDLER ---
        let pressTimer;
        window.startPress = (id) => {
            pressTimer = setTimeout(() => { showReactionMenu(id); }, 600);
        };
        window.cancelPress = () => { clearTimeout(pressTimer); };
        window.showReactionMenu = (id) => {
            document.querySelectorAll('.reaction-popup').forEach(el => el.classList.remove('visible'));
            const popup = document.getElementById(`popup-${id}`);
            if(popup) popup.classList.add('visible');
            if (navigator.vibrate) navigator.vibrate(50);
        };
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.card')) {
                document.querySelectorAll('.reaction-popup').forEach(el => el.classList.remove('visible'));
            }
        });

        // --- POSTING ---
        document.getElementById('postBtn').addEventListener('click', async () => {
            const text = document.getElementById('confessionText').value.trim();
            if(!text && !selectedStickerUrl) return alert("Type a secret first!");

            // 1. INSTANT CLEAR
            document.getElementById('confessionText').value = "";
            window.clearSticker();

            // 2. Send to Database
            await addDoc(collection(db, "confessions"), {
                content: text,
                author: "Anonymous",
                creatorId: mySecretId,
                sticker: selectedStickerUrl,
                timestamp: serverTimestamp(),
                reactions: { love: [], laugh: [], sad: [], shock: [] }
            });
        });

        // --- FEED ---
        const q = query(collection(db, "confessions"), orderBy("timestamp", "desc"), limit(50));
        onSnapshot(q, (snapshot) => {
            const feed = document.getElementById('feed');
            feed.innerHTML = "";
            
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const docId = docSnap.id;
                
                const loveList = data.reactions?.love || [];
                const laughList = data.reactions?.laugh || [];
                const sadList = data.reactions?.sad || [];
                const shockList = data.reactions?.shock || [];

                const isLove = loveList.includes(mySecretId);
                const isLaugh = laughList.includes(mySecretId);
                const isSad = sadList.includes(mySecretId);
                const isShock = shockList.includes(mySecretId);

                // --- STATIC TIME (e.g. 10:45 AM) ---
                let displayTime = "Sending...";
                if(data.timestamp) {
                    const date = new Date(data.timestamp.seconds * 1000);
                    displayTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                }

                let stickerHtml = data.sticker ? `<img src="${data.sticker}" class="posted-sticker">` : "";

                let iconsHtml = "";
                if(loveList.length > 0) iconsHtml += `<span class="${isLove ? 'my-reaction' : ''}">❤️${loveList.length}</span>`;
                if(laughList.length > 0) iconsHtml += `<span class="${isLaugh ? 'my-reaction' : ''}">😂${laughList.length}</span>`;
                if(sadList.length > 0) iconsHtml += `<span class="${isSad ? 'my-reaction' : ''}">😢${sadList.length}</span>`;
                if(shockList.length > 0) iconsHtml += `<span class="${isShock ? 'my-reaction' : ''}">😮${shockList.length}</span>`;

                const isMine = data.creatorId === mySecretId;
                const mineClass = isMine ? 'mine' : '';
                const youLabel = isMine ? '<span class="you-tag">(You)</span>' : '';

                const card = document.createElement('div');
                card.className = `card ${mineClass}`;
                
                card.onmousedown = () => startPress(docId);
                card.ontouchstart = () => startPress(docId);
                card.onmouseup = cancelPress;
                card.onmouseleave = cancelPress;
                card.ontouchend = cancelPress;
                card.oncontextmenu = (e) => { e.preventDefault(); showReactionMenu(docId); };

                card.innerHTML = `
                    <div class="reaction-popup" id="popup-${docId}">
                        <div class="emoji-btn ${isLove ? 'active-choice' : ''}" onclick='handleReaction("${docId}", "love", ${isLove})'>❤️</div>
                        <div class="emoji-btn ${isLaugh ? 'active-choice' : ''}" onclick='handleReaction("${docId}", "laugh", ${isLaugh})'>😂</div>
                        <div class="emoji-btn ${isSad ? 'active-choice' : ''}" onclick='handleReaction("${docId}", "sad", ${isSad})'>😢</div>
                        <div class="emoji-btn ${isShock ? 'active-choice' : ''}" onclick='handleReaction("${docId}", "shock", ${isShock})'>😮</div>
                    </div>

                    <div class="meta">
                        Anonymous ${youLabel} • ${displayTime}
                    </div>
                    <div class="content" style="white-space: pre-wrap;">${escapeHtml(data.content)}</div>
                    ${stickerHtml}
                    
                    <div class="reaction-display">${iconsHtml}</div>
                `;
                feed.appendChild(card);
            });
        });

        window.adminClear = async () => {
            if(prompt("PIN?") === ADMIN_PIN) {
                const q = query(collection(db, "confessions"));
                const snap = await getDocs(q);
                snap.forEach(d => deleteDoc(d.ref));
                alert("Cleaned!");
            }
        };

        function escapeHtml(text) { return text ? text.replace(/</g, "&lt;").replace(/>/g, "&gt;") : ""; }