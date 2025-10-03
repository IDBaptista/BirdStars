class BirdsStars {
    constructor() {
        this.apiUrl = 'https://xeno-canto.org/api/2/recordings';
        this.searchBtn = document.getElementById('searchBtn');
        this.loading = document.getElementById('loading');
        this.birdsGrid = document.getElementById('birdsGrid');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.currentlyPlaying = null;
        this.recordings = [];
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.searchBtn.addEventListener('click', () => this.searchBirds());
        this.audioPlayer.addEventListener('ended', () => this.stopAudio());
        this.audioPlayer.addEventListener('error', () => this.handleAudioError());
        
        // Carregar pássaros iniciais após um pequeno delay
        setTimeout(() => {
            this.searchBirds();
        }, 1000);
    }

    async searchBirds() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Buscar gravações de diferentes espécies brasileiras
            const queries = [
                'cnt:brazil grp:birds q:A',
                'cnt:brazil type:song q:A',
                'cnt:brazil type:call q:A',
                'gen:turdus cnt:brazil',
                'gen:tangara cnt:brazil',
                'gen:thraupis cnt:brazil',
                'gen:pitangus cnt:brazil',
                'gen:tyrannus cnt:brazil',
                'gen:furnarius cnt:brazil',
                'gen:coereba cnt:brazil'
            ];
            
            const randomQuery = queries[Math.floor(Math.random() * queries.length)];
            const response = await fetch(`${this.apiUrl}?query=${encodeURIComponent(randomQuery)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.recordings && data.recordings.length > 0) {
                // Selecionar 6 gravações aleatórias
                const selectedRecordings = this.selectRandomRecordings(data.recordings, 6);
                this.recordings = selectedRecordings;
                this.updateBirdsGrid();
            } else {
                this.showError('Nenhuma gravação encontrada.');
            }
            
        } catch (error) {
            console.error('Erro ao buscar gravações:', error);
            this.showError('Erro ao carregar gravações. Tente novamente.');
        }
        
        this.hideLoading();
        this.isLoading = false;
    }

    selectRandomRecordings(recordings, count) {
        const shuffled = recordings.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    updateBirdsGrid() {
        // Limpar grid atual
        this.birdsGrid.innerHTML = '';
        
        this.recordings.forEach((recording, index) => {
            const card = this.createBirdCard(recording, index);
            this.birdsGrid.appendChild(card);
        });
    }

    createBirdCard(recording, index) {
        const card = document.createElement('div');
        card.className = 'bird-card loaded fade-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        const speciesName = recording.en || `${recording.gen} ${recording.sp}`;
        const location = this.formatLocation(recording.loc, recording.cnt);
        
        card.innerHTML = `
            <div class="card-content">
                <h3 class="species-name">${speciesName}</h3>
                <p class="location">${location}</p>
                <div class="play-button" title="Reproduzir gravação">
                    <span class="play-icon">▶️</span>
                </div>
            </div>
        `;
        
        // Adicionar evento de clique para reproduzir áudio
        const playButton = card.querySelector('.play-button');
        playButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleAudio(recording, card);
        });
        
        // Adicionar evento de clique no card para reproduzir áudio também
        card.addEventListener('click', () => {
            this.toggleAudio(recording, card);
        });
        
        return card;
    }

    formatLocation(location, country) {
        if (!location && !country) return 'Localização não informada';
        if (!location) return country;
        if (!country) return location;
        
        // Limitar o tamanho da localização para caber no card
        const maxLength = 50;
        const fullLocation = `${location}, ${country}`;
        
        if (fullLocation.length > maxLength) {
            return location.length > maxLength - 3 ? 
                   location.substring(0, maxLength - 3) + '...' : 
                   location;
        }
        
        return fullLocation;
    }

    async toggleAudio(recording, card) {
        // Se está tocando a mesma gravação, pausar
        if (this.currentlyPlaying === recording.id) {
            this.stopAudio();
            return;
        }
        
        // Parar qualquer áudio atual
        this.stopAudio();
        
        try {
            // Marcar como carregando
            card.classList.add('loading');
            const playIcon = card.querySelector('.play-icon');
            playIcon.textContent = '⏳';
            
            // Carregar e reproduzir o áudio
            this.audioPlayer.src = recording.file;
            this.audioPlayer.load();
            
            await this.audioPlayer.play();
            
            // Marcar como tocando
            this.currentlyPlaying = recording.id;
            card.classList.remove('loading');
            card.classList.add('playing');
            playIcon.textContent = '⏸️';
            
            // Adicionar evento para quando o áudio terminar
            this.audioPlayer.onended = () => {
                this.stopAudio();
            };
            
        } catch (error) {
            console.error('Erro ao reproduzir áudio:', error);
            card.classList.remove('loading');
            card.classList.add('error');
            const playIcon = card.querySelector('.play-icon');
            playIcon.textContent = '❌';
            
            setTimeout(() => {
                card.classList.remove('error');
                playIcon.textContent = '▶️';
            }, 2000);
        }
    }

    stopAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }
        
        // Remover estado de reprodução de todos os cards
        const playingCards = document.querySelectorAll('.bird-card.playing');
        playingCards.forEach(card => {
            card.classList.remove('playing');
            const playIcon = card.querySelector('.play-icon');
            if (playIcon) {
                playIcon.textContent = '▶️';
            }
        });
        
        this.currentlyPlaying = null;
    }

    handleAudioError() {
        console.error('Erro no player de áudio');
        this.stopAudio();
        
        // Marcar o card atual como erro
        const playingCard = document.querySelector('.bird-card.playing, .bird-card.loading');
        if (playingCard) {
            playingCard.classList.remove('playing', 'loading');
            playingCard.classList.add('error');
            const playIcon = playingCard.querySelector('.play-icon');
            if (playIcon) {
                playIcon.textContent = '❌';
                setTimeout(() => {
                    playingCard.classList.remove('error');
                    playIcon.textContent = '▶️';
                }, 2000);
            }
        }
    }

    showLoading() {
        this.loading.style.display = 'block';
        this.searchBtn.disabled = true;
        this.searchBtn.style.opacity = '0.6';
        this.searchBtn.style.cursor = 'not-allowed';
        this.searchBtn.textContent = 'Buscando...';
    }

    hideLoading() {
        this.loading.style.display = 'none';
        this.searchBtn.disabled = false;
        this.searchBtn.style.opacity = '1';
        this.searchBtn.style.cursor = 'pointer';
        this.searchBtn.textContent = 'Descubra as espécies de aves!';
    }

    showError(message) {
        // Criar um card de erro temporário
        const errorCard = document.createElement('div');
        errorCard.className = 'bird-card error-card fade-in';
        errorCard.innerHTML = `
            <div class="card-content">
                <h3 class="species-name">Erro</h3>
                <p class="location">${message}</p>
                <div class="play-button" style="background: #f44336;">
                    <span class="play-icon" style="color: white;">❌</span>
                </div>
            </div>
        `;
        
        this.birdsGrid.innerHTML = '';
        this.birdsGrid.appendChild(errorCard);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (errorCard.parentNode) {
                errorCard.parentNode.removeChild(errorCard);
            }
        }, 3000);
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const app = new BirdsStars();
    
    // Adicionar alguns efeitos extras
    addExtraEffects();
});

function addExtraEffects() {
    // Efeito de clique nos pássaros voando
    const birds = document.querySelectorAll('.bird');
    birds.forEach(bird => {
        bird.addEventListener('click', () => {
            bird.style.animation = 'none';
            bird.style.transform = 'scale(1.5) rotate(360deg)';
            bird.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                bird.style.animation = '';
                bird.style.transform = '';
                bird.style.transition = '';
            }, 500);
        });
    });
    
    // Efeito de paralaxe suave no scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const birds = document.querySelectorAll('.bird');
        
        birds.forEach((bird, index) => {
            const speed = 0.2 + (index * 0.05);
            const translateY = scrolled * speed;
            bird.style.transform = `translateY(${translateY}px)`;
        });
    });
    
    // Adicionar efeito de hover nos cards placeholder
    const placeholderCards = document.querySelectorAll('.placeholder-card');
    placeholderCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('playing')) {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (!card.classList.contains('playing')) {
                card.style.transform = '';
            }
        });
    });
    
    // Adicionar controle de volume com scroll do mouse sobre o player
    document.addEventListener('wheel', (e) => {
        if (e.target.closest('.bird-card.playing')) {
            e.preventDefault();
            const audioPlayer = document.getElementById('audioPlayer');
            if (audioPlayer && !audioPlayer.paused) {
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                audioPlayer.volume = Math.max(0, Math.min(1, audioPlayer.volume + delta));
            }
        }
    });
    
    // Adicionar controle de teclado para pausar/reproduzir
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            const playingCard = document.querySelector('.bird-card.playing');
            if (playingCard) {
                e.preventDefault();
                playingCard.click();
            }
        }
    });
}
