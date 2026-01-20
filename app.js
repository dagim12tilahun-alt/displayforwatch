const SUPABASE_URL = 'https://jafefebdfpttwtkmudok.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZI3nHu58SdsYiZr_KncLUg_oK0-eHOJ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const scrollContainer = document.getElementById('mainScroll');
const topbar = document.getElementById('topbar');
const vh = window.innerHeight;

// --- 1. UI VISIBILITY ---
scrollContainer.addEventListener('scroll', () => {
    const scrollPos = scrollContainer.scrollTop;
    if (scrollPos > 20) topbar.classList.add('topbar-hidden');
    else topbar.classList.remove('topbar-hidden');

    const colorUI = document.getElementById('coloring-layer-ui');
    const messageUI = document.getElementById('messaging-layer-ui');

    if (scrollPos < vh * 0.5) { 
        colorUI.style.display = 'none'; messageUI.style.display = 'none';
    } else if (scrollPos < vh * 1.5) { 
        colorUI.style.display = 'flex'; messageUI.style.display = 'none';
    } else if (scrollPos < vh * 2.5) { 
        colorUI.style.display = 'none'; messageUI.style.display = 'flex';
    }
    // Loop back to start
    if (scrollPos >= (vh * 3)) scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
});

// --- 2. DATA PROCESSING ---
supabaseClient
    .channel('mining-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'remote_messages' }, payload => {
        const { content, password } = payload.new;
        const id = password.toUpperCase();
        
        const colorSequence = content.toLowerCase().match(/[a-e]/g);
        if (colorSequence) handleColorLogic(colorSequence.join(''), `dot-${id}`);

        const msgItems = content.match(/(\d*[a-zA-Z])/g);
        if (msgItems) handleMessageLogic(msgItems, `col-${id}`);
    })
    .subscribe();

// --- 3. LED GLOW LOGIC ---
async function handleColorLogic(pattern, dotId) {
    const dot = document.getElementById(dotId);
    const sequence = pattern.toUpperCase().split('');
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const colorClasses = { 
        'A': 'active-red', 'B': 'active-blue', 'C': 'active-green', 
        'D': 'active-yellow', 'E': 'active-purple' 
    };

    for (let i = 0; i < 5; i++) {
        for (let char of sequence) {
            dot.className = `dot ${colorClasses[char]}`;
            await wait(4000);
            dot.className = 'dot';
            await wait(500); 
        }
        dot.className = 'dot active-white'; await wait(500);
        dot.className = 'dot'; await wait(500);
    }
    dot.className = 'dot';
}

// --- 4. SMART SCROLL LOGIC WITH INACTIVITY TIMER ---
let scrollIntervals = { 'col-A': null, 'col-B': null };
let inactivityTimers = { 'col-A': null, 'col-B': null };

function handleMessageLogic(items, colId) {
    const column = document.getElementById(colId);
    
    // Clear existing states
    clearInterval(scrollIntervals[colId]);
    clearTimeout(inactivityTimers[colId]);
    column.innerHTML = ""; 
    column.scrollTop = 0;

    items.forEach(item => {
        const box = document.createElement('div');
        box.className = 'msg-box';
        box.innerText = item;
        column.appendChild(box);
    });

    let currentIndex = 0;
    const itemHeight = 46; // Matches font size + padding + gap
    
    const startAutoScroll = () => {
        clearInterval(scrollIntervals[colId]);
        scrollIntervals[colId] = setInterval(() => {
            currentIndex += 5;
            if (currentIndex >= items.length) currentIndex = 0;
            column.scrollTo({ top: currentIndex * itemHeight, behavior: 'smooth' });
        }, 10000);
    };

    const resetInactivityTimer = () => {
        // Stop movement if user touches/scrolls
        clearInterval(scrollIntervals[colId]);
        clearTimeout(inactivityTimers[colId]);
        
        // Restart auto-scroll only after 10 seconds of no interaction
        inactivityTimers[colId] = setTimeout(() => {
            startAutoScroll();
        }, 10000);
    };

    // Attach interaction listener
    column.addEventListener('scroll', resetInactivityTimer);

    // Initial Start if list is long
    if (items.length > 10) {
        startAutoScroll();
    }
}
