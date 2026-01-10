const SUPABASE_URL = 'https://jafefebdfpttwtkmudok.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZI3nHu58SdsYiZr_KncLUg_oK0-eHOJ';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const colorMap = { 'A': 'red', 'B': 'blue', 'C': 'green', 'D': 'yellow', 'E': 'purple' };
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
    if (scrollPos >= (vh * 3)) scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
});

// --- 2. DATA PROCESSING ---
supabaseClient
    .channel('mining-live')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'remote_messages' }, payload => {
        const { content, password } = payload.new;
        const id = password.toUpperCase();
        
        // Extract COLORS (a-e)
        const colorSequence = content.toLowerCase().match(/[a-e]/g);
        if (colorSequence) handleColorLogic(colorSequence.join(''), `dot-${id}`);

        // Extract MESSAGE: (\d*[a-zA-Z]) matches "12A" or just "A"
        const msgItems = content.match(/(\d*[a-zA-Z])/g);
        if (msgItems) handleMessageLogic(msgItems, `col-${id}`);
    })
    .subscribe();

async function handleColorLogic(pattern, dotId) {
    const dot = document.getElementById(dotId);
    const sequence = pattern.toUpperCase().split('');
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < 5; i++) {
        for (let char of sequence) {
            dot.style.background = colorMap[char];
            await wait(4000);
            dot.style.background = 'black'; await wait(500); 
        }
        dot.style.background = 'black'; await wait(500);
        dot.style.background = 'white'; await wait(500);
        dot.style.background = 'black'; await wait(500);
    }
    dot.style.background = '#222';
}

// --- 3. MINIMALIST AUTO-SCROLL ---
let scrollIntervals = { 'col-A': null, 'col-B': null };

function handleMessageLogic(items, colId) {
    const column = document.getElementById(colId);
    clearInterval(scrollIntervals[colId]);
    column.style.transform = `translateY(0px)`;
    column.innerHTML = ""; 

    items.forEach(item => {
        const box = document.createElement('div');
        box.className = 'msg-box';
        box.innerText = item;
        column.appendChild(box);
    });

    let currentIndex = 0;
    const itemFullHeight = 22; // min-height (20) + gap (2)
    
    if (items.length > 5) {
        scrollIntervals[colId] = setInterval(() => {
            currentIndex += 5;
            if (currentIndex >= items.length) currentIndex = 0;
            column.style.transform = `translateY(-${currentIndex * itemFullHeight}px)`;
        }, 10000);
    }
}