// --- DOMContentLoaded to ensure all elements are ready ---
document.addEventListener('DOMContentLoaded', function() {
  // --- Theme Toggle ---
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  // --- Konami Code Easter Egg ---
  const konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiCodePosition = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiCodePosition]) {
      konamiCodePosition++;
      if (konamiCodePosition === konamiCode.length) {
        document.getElementById('secret-message').style.display = 'block';
        setTimeout(() => document.getElementById('secret-message').style.display = 'none', 5000);
        konamiCodePosition = 0;
      }
    } else {
      konamiCodePosition = 0;
    }
  });

  // --- Smooth Scroll for Navigation ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (targetElement) {
          targetElement.scrollIntoView({behavior: 'smooth'});
        }
      } else if (href === '#') {
        e.preventDefault();
      }
    });
  });

  // --- Modal Accessibility (LLM Modal) ---
  const modalOverlay = document.getElementById('llm-interpretation-modal');
  const closeModalBtn = document.getElementById('llm-modal-close');
  function openModal(albumTitle = "") {
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeModalBtn.focus(), 100);
    // Set album title for modal context
    if (albumTitle) {
      document.getElementById('modal-album-title').textContent = albumTitle;
    }
  }
  function closeModal() {
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.getElementById('interpretation-query').value = '';
    document.getElementById('interpretation-output-container').classList.add('hidden');
    document.getElementById('interpretation-output-text').textContent = '';
    document.getElementById('interpretation-loading-indicator').classList.add('hidden');
  }
  closeModalBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (modalOverlay.classList.contains('active') && e.key === "Escape") closeModal();
  });
  // Focus trap for modal
  modalOverlay.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    const focusable = modalOverlay.querySelectorAll('button, [tabindex]:not([tabindex="-1"]), textarea');
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {last.focus(); e.preventDefault();}
    } else {
      if (document.activeElement === last) {first.focus(); e.preventDefault();}
    }
  });

  // --- Three.js 3D Glitch Object ---
  let scene, camera, renderer, object, material;
  let mouseX = 0, mouseY = 0, targetRotationX = 0, targetRotationY = 0;
  let rotationSpeedX = 0.005, rotationSpeedY = 0.007;
  const canvas = document.getElementById('three-canvas');
  function resizeThreeCanvas() {
    if (!renderer || !camera || !canvas) return;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
    resizeThreeCanvas();
    renderer.setPixelRatio(window.devicePixelRatio);

    const geometry = new THREE.BoxGeometry(2,2,2);
    const positionAttribute = geometry.getAttribute('position');
    const positions = positionAttribute.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 0] += (Math.random() - 0.5) * 0.5;
      positions[i + 1] += (Math.random() - 0.5) * 0.5;
      positions[i + 2] += (Math.random() - 0.5) * 0.5;
    }
    positionAttribute.needsUpdate = true;
    material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color1: { value: new THREE.Color(0xff00ff) },
        color2: { value: new THREE.Color(0x00ffff) },
        distortionFactor: { value: 0.1 }
      },
      vertexShader: `
        uniform float time;
        uniform float distortionFactor;
        varying vec3 vNormal;
        void main() {
          vNormal = normal;
          vec3 displacedPosition = position + normal * sin(position.x * 5.0 + time * 2.0) * distortionFactor;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vNormal;
        void main() {
          float intensity = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
          vec3 mixedColor = mix(color1, color2, abs(sin(time * 0.5 + intensity * 2.0)));
          gl_FragColor = vec4(mixedColor, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
    object = new THREE.Mesh(geometry, material);
    scene.add(object);
    camera.position.z = 5;
    scene.add(new THREE.AmbientLight(0x404040));
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(5,5,5);
    scene.add(pointLight);

    document.addEventListener('mousemove', (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    window.addEventListener('resize', resizeThreeCanvas);

    function animateThree() {
      requestAnimationFrame(animateThree);
      if (object) {
        object.rotation.x += rotationSpeedX;
        object.rotation.y += rotationSpeedY;
        targetRotationY = mouseX * 0.5;
        targetRotationX = mouseY * 0.5;
        object.rotation.y += (targetRotationY - object.rotation.y) * 0.05;
        object.rotation.x += (targetRotationX - object.rotation.x) * 0.05;
        material.uniforms.time.value += 0.01;
      }
      renderer.render(scene, camera);
    }
    animateThree();
  }
  initThree();

  // --- Web Audio API for Music Visualization with Tone.js ---
  let toneAnalyser;
  let toneSynth = null;
  let tonePlayer = null;
  let isPlaying = false;
  let animationFrameId;

  const visualizerCanvas = document.getElementById('visualizer-canvas');
  const visualizerCtx = visualizerCanvas.getContext('2d');
  const currentTrackNameSpan = document.getElementById('current-track-name');
  const playerStatusSpan = document.getElementById('player-status');
  const pauseButton = document.getElementById('pause-button');
  const resumeButton = document.getElementById('resume-button');
  const stopButton = document.getElementById('stop-button');

  function resizeVisualizerCanvas() {
    visualizerCanvas.width = visualizerCanvas.clientWidth;
    visualizerCanvas.height = visualizerCanvas.clientHeight;
  }
  window.addEventListener('resize', resizeVisualizerCanvas);
  resizeVisualizerCanvas();

  async function setupToneAudio() {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    if (!toneAnalyser) {
      toneAnalyser = new Tone.Analyser('waveform', 256);
      toneAnalyser.smoothing = 0.8;
      toneAnalyser.toDestination();
    }
    if (!toneSynth) {
      toneSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.2, release: 1 }
      });
    }
  }

  async function startVisualization(trackName, audioUrl) {
    await setupToneAudio();
    if (isPlaying) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      if (toneSynth) {
        toneSynth.disconnect();
        toneSynth.releaseAll();
      }
      if (tonePlayer) {
        tonePlayer.stop();
        tonePlayer.dispose();
        tonePlayer = null;
      }
      cancelAnimationFrame(animationFrameId);
    }
    currentTrackNameSpan.textContent = trackName;
    playerStatusSpan.textContent = '(Loading...)';
    pauseButton.classList.remove('hidden');
    stopButton.classList.remove('hidden');
    resumeButton.classList.add('hidden');
    isPlaying = true;
    drawVisualizer();

    if (audioUrl) {
      tonePlayer = new Tone.Player({
        url: audioUrl,
        autostart: true,
        loop: true,
        onload: () => {
          playerStatusSpan.textContent = '(Playing)';
        },
        onerror: (e) => {
          playerStatusSpan.textContent = '(Error loading, playing synthetic)';
          if (tonePlayer) {
            tonePlayer.dispose();
            tonePlayer = null;
          }
          startSyntheticPlayback();
        }
      }).connect(toneAnalyser);
    } else {
      startSyntheticPlayback();
    }
    function startSyntheticPlayback() {
      toneSynth.connect(toneAnalyser);
      let noteIndex = 0;
      const notes = ["C3", "G3", "C4", "Eb4", "G4", "A4"];
      Tone.Transport.scheduleRepeat((time) => {
        const note = notes[noteIndex % notes.length];
        toneSynth.triggerAttackRelease(note, "8n", time, Math.random() * 0.5 + 0.5);
        noteIndex++;
      }, "8n");
      Tone.Transport.start();
      playerStatusSpan.textContent = '(Playing Synthetic)';
    }
  }

  function drawVisualizer() {
    if (!isPlaying) return;
    animationFrameId = requestAnimationFrame(drawVisualizer);
    const dataArray = toneAnalyser.getValue();
    const bufferLength = dataArray.length;
    visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    visualizerCtx.lineWidth = 2;
    visualizerCtx.strokeStyle = 'var(--accent-color-1)';
    visualizerCtx.beginPath();
    const sliceWidth = visualizerCanvas.width * 1.0 / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i];
      const y = (v + 1) / 2 * visualizerCanvas.height;
      if (i === 0) {
        visualizerCtx.moveTo(x, y);
      } else {
        visualizerCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    visualizerCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
    visualizerCtx.stroke();
    // 3D object react to audio
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      sumSquares += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    if (object && material) {
      const scaleFactor = 1 + rms * 0.5;
      object.scale.set(scaleFactor, scaleFactor, scaleFactor);
      material.uniforms.distortionFactor.value = 0.1 + rms * 0.5;
    }
  }

  document.querySelectorAll('.play-track-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const albumTitle = e.currentTarget.dataset.albumTitle;
      const audioUrl = e.currentTarget.dataset.audioUrl;
      await startVisualization(albumTitle, audioUrl);
    });
  });

  pauseButton.addEventListener('click', () => {
    if (Tone.Transport.state === 'started') Tone.Transport.pause();
    if (tonePlayer && tonePlayer.state === 'started') tonePlayer.pause();
    isPlaying = false;
    playerStatusSpan.textContent = '(Paused)';
    pauseButton.classList.add('hidden');
    resumeButton.classList.remove('hidden');
    cancelAnimationFrame(animationFrameId);
  });
  resumeButton.addEventListener('click', () => {
    if (Tone.Transport.state === 'paused') Tone.Transport.start();
    if (tonePlayer && tonePlayer.state === 'paused') tonePlayer.start();
    isPlaying = true;
    playerStatusSpan.textContent = '(Playing)';
    pauseButton.classList.remove('hidden');
    resumeButton.classList.add('hidden');
    drawVisualizer();
  });
  stopButton.addEventListener('click', () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (toneSynth) toneSynth.releaseAll();
    if (tonePlayer) {
      tonePlayer.stop();
      tonePlayer.dispose();
      tonePlayer = null;
    }
    isPlaying = false;
    playerStatusSpan.textContent = '(Stopped)';
    pauseButton.classList.add('hidden');
    resumeButton.classList.add('hidden');
    stopButton.classList.add('hidden');
    cancelAnimationFrame(animationFrameId);
    visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    if (object) {
      object.scale.set(1, 1, 1);
      material.uniforms.distortionFactor.value = 0.1;
    }
  });

  // --- Gemini API Integration for Fun Facts (Simulated) ---
  const generateFactButton = document.getElementById('generate-aphex-fact');
  const generatedFactContainer = document.getElementById('generated-fact-container');
  const generatedFactText = document.getElementById('generated-fact-text');
  const factLoadingIndicator = document.getElementById('fact-loading-indicator');
  generateFactButton.addEventListener('click', async () => {
    generatedFactContainer.classList.add('hidden');
    generatedFactText.textContent = '';
    factLoadingIndicator.classList.remove('hidden');
    // Simulate async call
    setTimeout(() => {
      // Replace with actual API call as needed
      const facts = [
        "A sine wave once whispered the melody for 'Avril 14th' to a sleeping hard drive.",
        "All breakbeats secretly dream of being 7/8 time signatures.",
        "In Cornwall, the rain sometimes falls in polyrhythms.",
        "Every Aphex Twin track contains at least one hidden dimension.",
        "Richard D. James can fold a waveform in four-dimensional space."
      ];
      generatedFactText.textContent = facts[Math.floor(Math.random() * facts.length)];
      factLoadingIndicator.classList.add('hidden');
      generatedFactContainer.classList.remove('hidden');
    }, 1200);
  });

  // --- LLM Modal: Album Interpretation (Simulated) ---
  document.querySelectorAll('.interpret-album-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const albumTitle = e.currentTarget.dataset.albumTitle || e.currentTarget.parentElement.querySelector('[data-album-title]')?.dataset.albumTitle || '';
      openModal(albumTitle);
    });
  });
  document.getElementById('generate-interpretation-btn').addEventListener('click', () => {
    const outputContainer = document.getElementById('interpretation-output-container');
    const outputText = document.getElementById('interpretation-output-text');
    const loading = document.getElementById('interpretation-loading-indicator');
    outputContainer.classList.add('hidden');
    outputText.textContent = '';
    loading.classList.remove('hidden');
    setTimeout(() => {
      const thoughts = [
        "Echoes of circuitry, the pulse of nostalgia. This album feels like code dreaming of being human.",
        "Abstraction upon abstraction—a landscape of glitches, where rhythm is memory and melody is myth.",
        "A fractal descent into organized chaos, each note a hypercube folding sound and silence together.",
        "The album evokes a strange comfort, like a lullaby played on a malfunctioning robot's heart.",
        "Melodic entropy, careful disorder—music for a world that exists between sleep and computation."
      ];
      outputText.textContent = thoughts[Math.floor(Math.random() * thoughts.length)];
      loading.classList.add('hidden');
      outputContainer.classList.remove('hidden');
    }, 1500);
  });

  // --- Synaptic Shift: Visual Mood (Simulated) ---
  document.getElementById('generate-visual-btn').addEventListener('click', () => {
    const input = document.getElementById('visual-query-input').value.trim();
    const outputContainer = document.getElementById('visual-output-container');
    const moodText = document.getElementById('visual-mood-text');
    const loading = document.getElementById('visual-loading-indicator');
    outputContainer.classList.add('hidden');
    moodText.textContent = '';
    loading.classList.remove('hidden');
    setTimeout(() => {
      if (input.length > 0) {
        moodText.textContent = `Visualized: "${input}" as shifting neon geometry, oscillating to a secret rhythm.`;
      } else {
        moodText.textContent = "Please enter a concept or phrase to synthesize.";
      }
      loading.classList.add('hidden');
      outputContainer.classList.remove('hidden');
      // Animate 3D object for fun (randomize rotation speed/distortion)
      rotationSpeedX = 0.01 + Math.random() * 0.01;
      rotationSpeedY = 0.01 + Math.random() * 0.01;
      if (material && material.uniforms && material.uniforms.distortionFactor)
        material.uniforms.distortionFactor.value = 0.2 + Math.random() * 0.5;
    }, 1000);
  });

});