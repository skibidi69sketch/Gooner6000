const randomImage = document.getElementById('random-image');
const newImageButton = document.getElementById('new-image-button');
const applyTagsButton = document.getElementById('apply-tags-button');
const tagInput = document.getElementById('tag-input');
const imageStatus = document.getElementById('image-status');
const tagDisplay = document.getElementById('current-tag-display');

let currentTags = '';
let lastRequestSuccessful = false;

function formatTags(input) {
    if (!input || input.trim() === '') return '';
    
    return input
        .split(',')
        .map(tag => tag.trim().toLowerCase().replace(/\s+/g, '_'))
        .filter(tag => tag.length > 0)
        .join('+');
}

async function fetchImage() {
    try {
        imageStatus.textContent = "Loading...";
        imageStatus.style.display = "block";
        randomImage.style.display = "none";
        
        const formattedTags = formatTags(currentTags);
        const url = buildApiUrl(formattedTags);
        
        console.log(`Fetching from: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const xmlText = await response.text();
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        if (xmlDoc.querySelector("parsererror")) {
            console.error("XML parsing error", xmlDoc.querySelector("parsererror"));
            throw new Error("Failed to parse XML response");
        }
        
        const posts = xmlDoc.querySelectorAll("post");
        console.log(`Found ${posts.length} posts in response`);
        
        if (posts && posts.length > 0) {
            const randomIndex = Math.floor(Math.random() * posts.length);
            const post = posts[randomIndex];
            
            const fileUrl = post.getAttribute("file_url");
            console.log(`Selected image URL: ${fileUrl}`);
            
            if (!fileUrl) {
                throw new Error("Post doesn't have a valid file URL");
            }
            
            displayImage(fileUrl);
            lastRequestSuccessful = true;
            
            updateTagDisplay(true);
        } else {
            console.log("No posts found in the response");
            handleNoResults();
        }
    } catch (error) {
        console.error('Error fetching image:', error);
        handleError(error.message);
    }
}

function buildApiUrl(tags) {
    const maxPage = tags ? 3 : 20;
    const randomPage = Math.floor(Math.random() * maxPage);
    
    return `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&limit=100&pid=${randomPage}&tags=${encodeURIComponent(tags)}`;
}

function displayImage(url) {
    randomImage.src = url;
    randomImage.alt = "Random Image";
    
    randomImage.onload = () => {
        imageStatus.style.display = "none";
        randomImage.style.display = "block";
    };
    
    randomImage.onerror = () => {
        imageStatus.textContent = "Error loading image. Try again.";
        imageStatus.style.display = "block";
        randomImage.style.display = "none";
    };
}

function handleNoResults() {
    lastRequestSuccessful = false;
    
    if (currentTags) {
        imageStatus.textContent = `No results found for "${currentTags}". Showing random image instead...`;
        
        const savedTags = currentTags;
        
        currentTags = '';
        fetchRandomImage();
        
        currentTags = savedTags;
        updateTagDisplay(false);
    } else {
        imageStatus.textContent = "No images found. Please try again.";
        imageStatus.style.display = "block";
        randomImage.style.display = "none";
    }
}

function handleError(message) {
    lastRequestSuccessful = false;
    imageStatus.textContent = `Error: ${message}. Try again later.`;
    imageStatus.style.display = "block";
    randomImage.style.display = "none";
}

function updateTagDisplay(successful) {
    if (!currentTags) {
        tagDisplay.textContent = 'No tags applied';
        tagDisplay.classList.remove('tag-error');
    } else if (successful) {
        tagDisplay.textContent = `Current Tags: ${currentTags}`;
        tagDisplay.classList.remove('tag-error');
    } else {
        tagDisplay.textContent = `Tags "${currentTags}" yielded no results (showing random)`;
        tagDisplay.classList.add('tag-error');
    }
}

async function fetchRandomImage(retries = 2) {
    try {
        await fetchImage();
    } catch (error) {
        if (retries > 0) {
            console.log(`Retrying... ${retries} attempts left`);
            await fetchRandomImage(retries - 1);
        } else {
            handleError("Failed after multiple attempts");
        }
    }
}

newImageButton.addEventListener('click', () => fetchRandomImage());

applyTagsButton.addEventListener('click', () => {
    currentTags = tagInput.value;
    fetchRandomImage();
});

tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        currentTags = tagInput.value;
        fetchRandomImage();
    }
});

document.querySelectorAll('.tag-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        const tag = pill.dataset.tag;
        tagInput.value = tag;
        currentTags = tag;
        fetchRandomImage();
    });
});

document.getElementById('clear-tags-button').addEventListener('click', () => {
    tagInput.value = '';
    currentTags = '';
    updateTagDisplay(true);
    fetchRandomImage();
});

window.onload = () => {
    fetchRandomImage();
};
