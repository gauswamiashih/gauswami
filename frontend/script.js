// Particles background effect
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];

function initParticles() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 1.2,
      speedY: (Math.random() - 0.5) * 1.2,
    });
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx.beginPath();
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 10;
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
    if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
  });
}

function animate() {
  drawParticles();
  updateParticles();
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  initParticles();
});

initParticles();
animate();


// Mood detection (mic) logic
const startBtn = document.getElementById('startRecording');
const moodResult = document.getElementById('moodResult');

if (startBtn) {
  let mediaRecorder;
  let audioChunks = [];

  startBtn.addEventListener('click', async () => {
    if (startBtn.textContent === 'Start Recording') {
      moodResult.textContent = '';
      audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = e => {
        audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        moodResult.textContent = 'Detecting mood...';
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.wav');
          const response = await fetch('/api/mood_detect', {
            method: 'POST',
            body: formData,
          });
          const data = await response.json();
          if (response.ok) {
            moodResult.textContent = `Mood detected: ${data.mood}`;
          } else {
            moodResult.textContent = `Error: ${data.error || 'Unknown error'}`;
          }
        } catch (err) {
          moodResult.textContent = `Error: ${err.message}`;
        }
      };

      mediaRecorder.start();
      startBtn.textContent = 'Stop Recording';
    } else {
      mediaRecorder.stop();
      startBtn.textContent = 'Start Recording';
    }
  });
}


// Weather fetch (using OpenWeatherMap API)
const fetchWeatherBtn = document.getElementById('fetchWeather');
const weatherDetails = document.getElementById('weatherDetails');

const OPENWEATHER_API_KEY = '04fd8ea67099019f482451eebf6e5794'; // Replace with your API key

if (fetchWeatherBtn) {
  fetchWeatherBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      weatherDetails.textContent = 'Geolocation not supported by your browser.';
      return;
    }
    weatherDetails.textContent = 'Fetching weather...';

    navigator.geolocation.getCurrentPosition(async position => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
        );
        const data = await res.json();
        if (res.ok) {
          weatherDetails.innerHTML = `
            <p><strong>${data.name}</strong></p>
            <p>Temperature: ${data.main.temp} °C</p>
            <p>Weather: ${data.weather[0].description}</p>
          `;
        } else {
          weatherDetails.textContent = data.message || 'Failed to fetch weather';
        }
      } catch (err) {
        weatherDetails.textContent = `Error: ${err.message}`;
      }
    }, () => {
      weatherDetails.textContent = 'Permission denied for location.';
    });
  });
}


// Login & Signup form handling (for login.html and signup.html)

async function handleFormSubmit(formId, apiEndpoint, messageId) {
  const form = document.getElementById(formId);
  const messageEl = document.getElementById(messageId);

  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    messageEl.textContent = '';
    messageEl.style.color = '';

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => (data[key] = value));

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok) {
        messageEl.style.color = 'lime';
        messageEl.textContent = json.message || 'Success!';
        if (apiEndpoint.includes('login') && res.ok) {
          // Redirect or reload after login
          setTimeout(() => window.location.href = 'index.html', 1500);
        }
      } else {
        messageEl.style.color = 'red';
        messageEl.textContent = json.error || 'Failed';
      }
    } catch (error) {
      messageEl.style.color = 'red';
      messageEl.textContent = error.message || 'Error occurred';
    }
  });
}

// Initialize login & signup form handlers
handleFormSubmit('loginForm', '/api/login', 'loginMessage');
handleFormSubmit('signupForm', '/api/signup', 'signupMessage');


// Admin panel user management (admin.html)
async function fetchUsers() {
  const res = await fetch('/api/users');
  const users = await res.json();
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.username}</td>
      <td><button class="deleteUserBtn" data-username="${u.username}">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.deleteUserBtn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm(`Delete user "${btn.dataset.username}"?`)) return;
      try {
        await fetch('/api/users/delete', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ username: btn.dataset.username }),
        });
        fetchUsers();
      } catch (err) {
        alert('Failed to delete user');
      }
    };
  });
}

if (document.getElementById('usersTable')) {
  fetchUsers();

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.location.href = '/api/users/export';
    });
  }
}
