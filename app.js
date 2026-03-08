import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, increment, deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Firebase Configuration ---
// --- Firebase Configuration ---
// --- Firebase Configuration ---
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

// --- VIEW NAVIGATION ---
window.showView = (view) => {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const target = document.getElementById(`${view}-view`);
    if(target) {
        target.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    lucide.createIcons();
};

// --- READ MORE TOGGLE ---
window.toggleReadMore = (btn, id) => {
    const body = document.getElementById(`body-${id}`);
    const isExpanded = body.classList.toggle('expanded');
    
    btn.innerHTML = isExpanded 
        ? `Show less <i data-lucide="chevron-up" size="14"></i>` 
        : `Read full assignment <i data-lucide="chevron-down" size="14"></i>`;
    
    lucide.createIcons();
};

// --- DYNAMIC INPUTS (Names/Images/Links) ---
window.addDynamicInput = (containerId, className, iconName) => {
    const container = document.getElementById(containerId);
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';
    wrapper.style.marginTop = '12px';
    
    wrapper.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <input type="url" class="${className}" placeholder="...">
    `;
    
    container.appendChild(wrapper);
    lucide.createIcons();
};

// --- SUBMIT LOGIC (Multiple Names Fix) ---
document.getElementById('submitBtn').onclick = async () => {
    const btn = document.getElementById('submitBtn');
    
    // 1. Collect Data
    const nameInputs = Array.from(document.querySelectorAll('.student-name-input'))
                            .map(i => i.value.trim()).filter(v => v);
    const postTitle = document.getElementById('postTitle').value.trim();
    const postContent = document.getElementById('postContent').value.trim();
    
    const photoUrls = Array.from(document.querySelectorAll('.photo-input'))
                            .map(input => input.value.trim()).filter(val => val);
                            
    const referenceLinks = Array.from(document.querySelectorAll('.ref-input'))
                                .map(input => input.value.trim()).filter(val => val);

    // 2. Validation
    if (nameInputs.length === 0 || !postTitle || !postContent) {
        alert("Please provide at least one Student Name, a Project Title, and Description.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "Publishing...";

    try {
        await addDoc(collection(db, "assignments"), {
            student: nameInputs.join(", "), // Combines partners into one string
            title: postTitle,
            body: postContent,
            images: photoUrls,
            references: referenceLinks,
            likes: 0,
            timestamp: new Date()
        });

        alert("Assignment shared successfully!");
        window.prepareNewPost(); 
        window.showView('home');
        
    } catch (error) {
        console.error("Firebase Error:", error);
        alert("Failed to submit. Check your Firestore Rules.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Publish to Gallery";
    }
};

window.prepareNewPost = () => {
    // Reset standard fields
    document.querySelectorAll('input, textarea').forEach(i => i.value = "");
    
    // Reset dynamic containers to single initial input
    document.getElementById('names-container').innerHTML = `
        <div class="input-wrapper"><i data-lucide="user"></i><input type="text" class="student-name-input" placeholder="Name"></div>`;
    document.getElementById('images-container').innerHTML = `
        <label class="inner-label">Image URLs</label>
        <div class="input-wrapper"><i data-lucide="image"></i><input type="url" class="photo-input" placeholder="https://image-url.com"></div>`;
    document.getElementById('references-container').innerHTML = `
        <label class="inner-label">Source Links</label>
        <div class="input-wrapper"><i data-lucide="link"></i><input type="url" class="ref-input" placeholder="https://source-link.com"></div>`;
    
    window.showView('submit');
};

// --- INTERACTIONS & ADMIN ---
window.likePost = async (id) => {
    try {
        await updateDoc(doc(db, "assignments", id), { likes: increment(1) });
    } catch (e) { console.error("Like failed", e); }
};

window.deletePost = async (id) => {
    if(confirm("Permanently delete this Assignment from the Blog?")) {
        try {
            await deleteDoc(doc(db, "assignments", id));
            alert("Assignment removed.");
        } catch (e) {
            alert("Delete failed. Check your Firebase Rules.");
        }
    }
};

window.verifyAdmin = () => {
    const pass = document.getElementById('adminPass').value;
    if(pass === "teacher123") {
        isAdmin = true;
        window.closeAdminModal();
        alert("🛡️ Teacher Access Unlocked");
        renderFeed(); // Re-render to show delete buttons immediately
    } else {
        alert("Access Denied");
    }
};

window.openAdminModal = () => document.getElementById('admin-modal').style.display = 'flex';
window.closeAdminModal = () => document.getElementById('admin-modal').style.display = 'none';

// --- MAIN RENDERER ---
const renderFeed = () => {
    const q = query(collection(db, "assignments"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snap) => {
        const container = document.getElementById('posts-container');
        container.innerHTML = "";

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            const isLong = data.body.length > 200;

            const gallery = data.images?.length 
                ? `<div class="post-img-gallery">${data.images.map(img => `<img src="${img}" loading="lazy">`).join('')}</div>`
                : `<div style="height:100px; background:linear-gradient(135deg, #6366f1 0%, #a855f7 100%); display:flex; align-items:center; justify-content:center; opacity:0.15;"><i data-lucide="book-open" color="white" size="32"></i></div>`;

            container.innerHTML += `
                <div class="post-card">
                    ${gallery}
                    <div class="post-content">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                            <span class="post-student-tag">
                                <i data-lucide="${data.student.includes(',') ? 'users' : 'user'}" size="12"></i> ${data.student}
                            </span>
                            <span style="font-size:10px; color:var(--text-soft); font-weight:700;">
                                ${data.timestamp?.toDate().toLocaleDateString() || 'Recently'}
                            </span>
                        </div>
                        
                        <h3 class="post-title">${data.title}</h3>
                        
                        <div id="body-${id}" class="post-body">
                            ${data.body}
                        </div>

                        ${isLong ? `
                            <button class="read-more-btn" onclick="window.toggleReadMore(this, '${id}')">
                                Read full assignment <i data-lucide="chevron-down" size="14"></i>
                            </button>
                        ` : '<div style="margin-bottom:1.5rem;"></div>'}
                        
                        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:1.5rem;">
                            ${data.references?.map(url => `
                                <a href="${url}" target="_blank" class="ref-pill" style="text-decoration:none;">
                                    <i data-lucide="external-link" size="12"></i> Source
                                </a>`).join('')}
                        </div>

                        <div class="post-footer" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:1rem;">
                            <button class="like-btn" onclick="window.likePost('${id}')" style="background:none; border:none; color:#f43f5e; cursor:pointer; display:flex; align-items:center; gap:6px; font-weight:700;">
                                <i data-lucide="heart" size="18"></i> <span>${data.likes || 0}</span>
                            </button>
                            ${isAdmin ? `
                                <button onclick="window.deletePost('${id}')" style="color:#ef4444; background:none; border:none; cursor:pointer; display:flex; align-items:center; gap:4px; font-weight:700;">
                                    <i data-lucide="trash-2" size="16"></i> Delete
                                </button>` : ""}
                        </div>
                    </div>
                </div>`;
        });
        lucide.createIcons();
    });
};

// Initialize Gallery
renderFeed();
