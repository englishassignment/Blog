import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, increment, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC3m60CaVD7XYezKxLQIr5FlX6U47OTMdM",
    authDomain: "blooddonorfinder-680f5.firebaseapp.com",
    projectId: "blooddonorfinder-680f5",
    storageBucket: "blooddonorfinder-680f5.firebasestorage.app",
    messagingSenderId: "330871496543",
    appId: "1:330871496543:web:e92a86a9146daa3ce660ea"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let isAdmin = false;

// --- VIEW CONTROLLER ---
window.showView = (view) => {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(`${view}-view`).style.display = 'block';
    lucide.createIcons();
};
///////////
window.openAdminModal = () => {
    document.getElementById('admin-modal').style.display = 'flex';
    document.getElementById('adminPass').focus();
};

window.closeAdminModal = () => {
    document.getElementById('admin-modal').style.display = 'none';
    document.getElementById('adminPass').value = '';
};

window.verifyAdmin = () => {
    const passInput = document.getElementById('adminPass');
    // Change "teacher123" to your preferred password
    if (passInput.value === "teacher123") {
        isAdmin = true;
        window.closeAdminModal();
        alert("Teacher Mode Active! You can now edit and delete posts.");
        
        // Refresh the feed to show the hidden admin buttons
        if (typeof renderFeed === "function") renderFeed(); 
    } else {
        alert("Invalid Password. Please try again.");
        passInput.value = '';
    }
};

// Optional: Allow pressing "Enter" to submit
document.getElementById('adminPass')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') window.verifyAdmin();
});


// --- DYNAMIC FORM LOGIC ---
window.addInput = (containerId, className, placeholder) => {
    const container = document.getElementById(containerId);
    const input = document.createElement('input');
    input.className = `${className} input-pro`;
    input.placeholder = placeholder;
    container.appendChild(input);
};

window.addContentBlock = () => {
    const div = document.createElement('div');
    div.className = 'content-block-pro';
    div.innerHTML = `
        <input type="text" class="sub-title-in input-pro" placeholder="Section Header (e.g. Analysis)" style="font-weight:700">
        <textarea class="paragraph-in input-pro" rows="4" placeholder="Detail your work here..."></textarea>
    `;
    document.getElementById('content-blocks').appendChild(div);
};

// --- SUBMIT WORK BUTTON FIX ---
document.getElementById('submitBtn').onclick = async () => {
    const btn = document.getElementById('submitBtn');
    
    // Gather Data
    const mainAuthor = document.getElementById('postAuthor').value.trim();
    const partners = Array.from(document.querySelectorAll('.partner-input')).map(i => i.value.trim()).filter(v => v);
    const authors = [mainAuthor, ...partners].join(", ");

    const title = document.getElementById('postTitle').value.trim();
    const question = document.getElementById('postQuestion').value.trim();
    
    // Collect all blocks into a combined text body
    const blocks = Array.from(document.querySelectorAll('.content-block-pro')).map(b => {
        const h = b.querySelector('.sub-title-in').value;
        const p = b.querySelector('.paragraph-in').value;
        return `### ${h}\n${p}`;
    }).join("\n\n");

    const fullBody = `**Question:** ${question}\n\n${blocks}`;
    const photos = Array.from(document.querySelectorAll('.image-input')).map(i => i.value.trim()).filter(v => v);
    const links = Array.from(document.querySelectorAll('.ref-input')).map(i => i.value.trim()).filter(v => v);

    if (!mainAuthor || !title || !question) {
        alert("Please fill in the Author, Title, and Question fields!");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Publishing...";

    try {
        await addDoc(collection(db, "assignments"), {
            student: authors,
            title: title,
            body: fullBody,
            images: photos,
            references: links,
            likes: 0,
            timestamp: new Date()
        });
        alert("Success! Assignment Published.");
        window.showView('home');
    } catch (e) {
        console.error(e);
        alert("Firebase Error! Check your database permissions.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Publish to Blog";
    }
};

window.prepareNewPost = () => {
    document.querySelectorAll('input, textarea').forEach(i => i.value = "");
    document.getElementById('partner-container').innerHTML = "";
    document.getElementById('content-blocks').innerHTML = "";
    document.getElementById('image-container').innerHTML = "";
    document.getElementById('ref-container').innerHTML = "";
    window.addContentBlock();
    window.showView('submit');
};

// --- FEED INTERACTION ---
window.toggleReadMore = (btn, id) => {
    const body = document.getElementById(`body-${id}`);
    const isExpanded = body.classList.toggle('expanded');
    btn.innerHTML = isExpanded ? "Show less" : "Read full assignment";
};

window.likePost = (id) => updateDoc(doc(db, "assignments", id), { likes: increment(1) });
window.deletePost = (id) => confirm("Delete permanently?") && deleteDoc(doc(db, "assignments", id));

window.verifyAdmin = () => {
    if(document.getElementById('adminPass').value === "teacher123") {
        isAdmin = true;
        window.closeAdminModal();
        alert("Teacher Mode Active");
        renderFeed();
    } else alert("Invalid Password");
};
window.openAdminModal = () => document.getElementById('admin-modal').style.display = 'flex';
window.closeAdminModal = () => document.getElementById('admin-modal').style.display = 'none';

const renderFeed = () => {
    const q = query(collection(db, "assignments"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        const container = document.getElementById('posts-container');
        container.innerHTML = "";
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            const gallery = data.images?.length 
                ? `<div class="post-img-gallery">${data.images.map(img => `<img src="${img}">`).join('')}</div>`
                : `<div style="height:120px; background:var(--brand-light); display:flex; align-items:center; justify-content:center;"><i data-lucide="book" color="var(--brand)"></i></div>`;

            container.innerHTML += `
                <div class="post-card">
                    ${gallery}
                    <div class="post-content">
                        <span class="post-student-tag"><i data-lucide="user" size="10"></i> ${data.student}</span>
                        <h3 style="margin-bottom:10px">${data.title}</h3>
                        <div id="body-${id}" class="post-body">${data.body}</div>
                        <button class="add-btn-sm" onclick="window.toggleReadMore(this, '${id}')" style="margin:10px 0">Read more</button>
                        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eee; padding-top:15px;">
                            <button onclick="window.likePost('${id}')" style="background:none; border:none; color:#f43f5e; font-weight:700; cursor:pointer">❤️ ${data.likes || 0}</button>
                            ${isAdmin ? `<button onclick="window.deletePost('${id}')" style="color:red; border:none; background:none; cursor:pointer">Delete</button>` : ""}
                        </div>
                    </div>
                </div>`;
        });
        lucide.createIcons();
    });
};

renderFeed();
